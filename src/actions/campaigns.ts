'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from './admin-auth'
import { CampaignFormat } from '@/types/database'

export type CreateCampaignState = {
  success: boolean
  error?: string
  slug?: string
  campaign?: any
}

export async function createCampaign(formData: FormData): Promise<CreateCampaignState> {
  const isAdmin = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: 'Acesso não autorizado. Faça login novamente.' }
  }

  const title = (formData.get('title') as string)?.trim()
  let slug = (formData.get('slug') as string)?.trim()
  const format = ((formData.get('format') as string) || '1:1') as CampaignFormat
  const frameFile = formData.get('frame') as File | null

  if (!title) {
    return { success: false, error: 'O título da campanha é obrigatório.' }
  }

  if (!slug) {
    return { success: false, error: 'O slug (link da URL) é obrigatório.' }
  }

  // Format and sanitize slug
  slug = slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!slug) {
    return { success: false, error: 'Slug inválido após formatação.' }
  }

  const validFormats: CampaignFormat[] = ['1:1', '4:5', '3:4', 'circle']
  const selectedFormat: CampaignFormat = validFormats.includes(format) ? format : '1:1'

  if (!frameFile || frameFile.size === 0) {
    return { success: false, error: 'Selecione uma imagem de moldura PNG.' }
  }

  if (frameFile.size > 5 * 1024 * 1024) {
    return { success: false, error: 'O arquivo da moldura não pode exceder 5MB.' }
  }

  if (!['image/png', 'image/webp'].includes(frameFile.type)) {
    return { success: false, error: 'O formato do arquivo deve ser PNG com transparência (ou WebP).' }
  }

  try {
    const supabase = await createClient()

    // Check if slug already exists
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingCampaign) {
      return { success: false, error: `Já existe uma campanha com o slug "${slug}". Escolha outro link.` }
    }

    // Convert file to buffer for storage upload
    const arrayBuffer = await frameFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileExt = frameFile.name.split('.').pop() || 'png'
    const fileName = `${slug}-${Date.now()}.${fileExt}`

    // Upload to bucket `frames`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('frames')
      .upload(fileName, buffer, {
        contentType: frameFile.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return {
        success: false,
        error: `Erro ao fazer upload da moldura: ${uploadError.message}. Certifique-se de que o bucket 'frames' foi criado no Supabase.`,
      }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('frames')
      .getPublicUrl(uploadData.path)

    const frameUrl = publicUrlData.publicUrl

    // Attempt insert with full V2 schema fields
    let newCampaign: any = null
    const { data: fullData, error: insertError } = await supabase
      .from('campaigns')
      .insert({
        title,
        slug,
        frame_url: frameUrl,
        format: selectedFormat,
        views_count: 0,
        downloads_count: 0,
      } as any)
      .select()
      .single()

    if (insertError) {
      console.warn('First insert attempt failed, trying fallback schema without optional metrics columns:', insertError.message)

      // Fallback 1: Try insert without metrics columns if they are not in schema
      const { data: fallbackData1, error: fallbackError1 } = await supabase
        .from('campaigns')
        .insert({
          title,
          slug,
          frame_url: frameUrl,
          format: selectedFormat,
        } as any)
        .select()
        .single()

      if (!fallbackError1 && fallbackData1) {
        newCampaign = fallbackData1
      } else {
        // Fallback 2: Basic V1 schema (title, slug, frame_url)
        const { data: fallbackData2, error: fallbackError2 } = await supabase
          .from('campaigns')
          .insert({
            title,
            slug,
            frame_url: frameUrl,
          } as any)
          .select()
          .single()

        if (fallbackError2) {
          console.error('Database insert error:', fallbackError2)
          await supabase.storage.from('frames').remove([uploadData.path])
          return {
            success: false,
            error: `Erro ao salvar campanha no banco: ${insertError.message}. Dica: Execute o script 'supabase/schema.sql' no SQL Editor do Supabase para atualizar as colunas.`,
          }
        }
        newCampaign = fallbackData2
      }
    } else {
      newCampaign = fullData
    }

    revalidatePath('/admin')
    revalidatePath('/')
    revalidatePath(`/c/${slug}`)

    return {
      success: true,
      slug,
      campaign: newCampaign,
    }
  } catch (err: any) {
    console.error('Unexpected error in createCampaign:', err)
    return { success: false, error: err?.message || 'Erro inesperado ao criar campanha.' }
  }
}

export async function getCampaigns() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error in getCampaigns:', err)
    return []
  }
}

export async function deleteCampaign(id: string, frameUrl?: string) {
  const isAdmin = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: 'Acesso não autorizado.' }
  }

  try {
    const supabase = await createClient()

    // If frameUrl is provided, extract file name and remove from storage
    if (frameUrl) {
      try {
        const parts = frameUrl.split('/frames/')
        if (parts.length > 1) {
          const filePath = decodeURIComponent(parts[1])
          await supabase.storage.from('frames').remove([filePath])
        }
      } catch (storageErr) {
        console.warn('Could not remove file from storage:', storageErr)
      }
    }

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: `Erro ao excluir campanha: ${error.message}` }
    }

    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao excluir campanha.' }
  }
}

export async function incrementCampaignView(campaignId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('increment_views', {
      campaign_id: campaignId,
    })

    if (error) {
      console.warn('Could not increment campaign views via RPC, falling back to direct update:', error.message)
      // Fallback if RPC is not installed or has permissions issues
      const { data: current } = await supabase
        .from('campaigns')
        .select('views_count')
        .eq('id', campaignId)
        .single()

      if (current) {
        await supabase
          .from('campaigns')
          .update({ views_count: (current.views_count || 0) + 1 })
          .eq('id', campaignId)
      }
    }

    return true
  } catch (err) {
    console.error('Error incrementing views:', err)
    return false
  }
}

export async function incrementCampaignDownload(campaignId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('increment_downloads', {
      campaign_id: campaignId,
    })

    if (error) {
      console.warn('Could not increment campaign downloads via RPC, falling back to direct update:', error.message)
      const { data: current } = await supabase
        .from('campaigns')
        .select('downloads_count')
        .eq('id', campaignId)
        .single()

      if (current) {
        await supabase
          .from('campaigns')
          .update({ downloads_count: (current.downloads_count || 0) + 1 })
          .eq('id', campaignId)
      }
    }

    return true
  } catch (err) {
    console.error('Error incrementing downloads:', err)
    return false
  }
}
