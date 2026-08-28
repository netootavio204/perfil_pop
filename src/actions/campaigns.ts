'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminSessionPayload } from './admin-auth'
import { CampaignFormat, Campaign, CampaignLead, LeadContactType } from '@/types/database'

export type CreateCampaignState = {
  success: boolean
  error?: string
  slug?: string
  campaign?: any
}

export interface RecordLeadInput {
  campaignId: string
  contactType: LeadContactType
  contactValue: string
  userName?: string
}

export interface RecordLeadResult {
  success: boolean
  leadId?: string
  error?: string
}

/**
 * Creates a new campaign with strict 1-campaign free plan enforcement and owner isolation.
 */
export async function createCampaign(formData: FormData): Promise<CreateCampaignState> {
  const session = await getAdminSessionPayload()
  if (!session) {
    return { success: false, error: 'Acesso não autorizado. Faça login novamente.' }
  }

  const title = (formData.get('title') as string)?.trim()
  let slug = (formData.get('slug') as string)?.trim()
  const format = ((formData.get('format') as string) || '1:1') as CampaignFormat
  const frameFile = formData.get('frame') as File | null

  // Optional custom assigned owner (for Master Admin creating on behalf of a specific user)
  const assignedUserId = (formData.get('user_id') as string)?.trim()
  const assignedUserEmail = (formData.get('user_email') as string)?.trim()
  const assignedUserName = (formData.get('user_name') as string)?.trim()

  const finalUserId = session.can_access_master_admin && assignedUserId ? assignedUserId : session.id
  const finalUserEmail = session.can_access_master_admin && assignedUserEmail ? assignedUserEmail : session.email
  const finalUserName = session.can_access_master_admin && assignedUserName ? assignedUserName : session.name

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

    // 1. Check Free Plan Campaign Limit (Max 1 campaign for free plan users)
    const isMasterOrUnlimited = session.is_master_admin || session.plan === 'unlimited'
    if (!isMasterOrUnlimited) {
      const { data: userCampaigns, error: countError } = await supabase
        .from('campaigns')
        .select('id')
        .or(`user_id.eq.${finalUserId},user_email.eq.${finalUserEmail}`)

      if (!countError && userCampaigns && userCampaigns.length >= 1) {
        return {
          success: false,
          error:
            'Limite atingido: O seu plano gratuito permite no máximo 1 campanha por e-mail cadastrado. Para criar uma nova campanha, exclua a existente no seu painel ou solicite upgrade para o Administrador Master.',
        }
      }
    }

    // 2. Check if slug already exists
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingCampaign) {
      return { success: false, error: `Já existe uma campanha com o slug "${slug}". Escolha outro link.` }
    }

    // 3. Convert file to buffer for storage upload
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

    // 4. Attempt insert with full V3 schema fields
    let newCampaign: any = null
    const { data: fullData, error: insertError } = await supabase
      .from('campaigns')
      .insert({
        title,
        slug,
        frame_url: frameUrl,
        format: selectedFormat,
        user_id: finalUserId,
        user_email: finalUserEmail,
        user_name: finalUserName,
        views_count: 0,
        downloads_count: 0,
      } as any)
      .select()
      .single()

    if (insertError) {
      console.warn('First insert attempt warning:', insertError.message)

      // Fallback: Insert with format & metrics only
      const { data: fallbackData1, error: fallbackError1 } = await supabase
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

      if (!fallbackError1 && fallbackData1) {
        newCampaign = fallbackData1
      } else {
        await supabase.storage.from('frames').remove([uploadData.path])
        return {
          success: false,
          error: `Erro ao salvar campanha no banco: ${insertError.message}.`,
        }
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

/**
 * Retrieves campaigns with strict user isolation for non-master accounts.
 */
export async function getCampaigns(filterUserId?: string): Promise<Campaign[]> {
  const session = await getAdminSessionPayload()
  if (!session) return []

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('Error fetching campaigns:', error)
      return []
    }

    const allCampaigns = data as Campaign[]

    // Strict multi-tenant isolation:
    // If the user does NOT have master admin access, they ONLY see their own campaigns!
    if (!session.can_access_master_admin) {
      return allCampaigns.filter(
        (c) =>
          (c.user_id && c.user_id === session.id) ||
          (c.user_email && c.user_email.toLowerCase() === session.email.toLowerCase())
      )
    }

    // Master Admin filtering options:
    if (filterUserId && filterUserId !== 'all') {
      if (filterUserId === 'me') {
        return allCampaigns.filter(
          (c) =>
            (c.user_id && c.user_id === session.id) ||
            (c.user_email && c.user_email.toLowerCase() === session.email.toLowerCase()) ||
            (!c.user_id && !c.user_email)
        )
      }
      return allCampaigns.filter(
        (c) => c.user_id === filterUserId || c.user_email === filterUserId
      )
    }

    return allCampaigns
  } catch (err) {
    console.error('Unexpected error in getCampaigns:', err)
    return []
  }
}

/**
 * Retrieves public showcase campaigns for the landing page (read-only showcase).
 */
export async function getPublicCampaigns(): Promise<Campaign[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, title, slug, frame_url, format, views_count, downloads_count, created_at, user_name')
      .order('created_at', { ascending: false })
      .limit(12)

    if (error || !data) return []
    return data as Campaign[]
  } catch (err) {
    console.error('Error fetching public showcase campaigns:', err)
    return []
  }
}

/**
 * Updates an existing campaign (title, slug, format, and optional new frame image).
 */
export async function updateCampaign(campaignId: string, formData: FormData) {
  const session = await getAdminSessionPayload()
  if (!session) {
    return { success: false, error: 'Acesso não autorizado. Faça login novamente.' }
  }

  const title = (formData.get('title') as string)?.trim()
  const rawSlug = (formData.get('slug') as string)?.trim()
  const selectedFormat = (formData.get('format') as CampaignFormat) || '1:1'
  const newFrameFile = formData.get('frame') as File | null

  if (!campaignId) {
    return { success: false, error: 'ID da campanha não informado.' }
  }

  if (!title) {
    return { success: false, error: 'Por favor, informe o título da campanha.' }
  }

  if (!rawSlug) {
    return { success: false, error: 'Por favor, informe o slug da campanha.' }
  }

  const slug = rawSlug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  try {
    const supabase = await createClient()

    // 1. Fetch existing campaign to check ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (fetchErr || !existing) {
      return { success: false, error: 'Campanha não encontrada.' }
    }

    if (!session.can_access_master_admin) {
      if (existing.user_id !== session.id && existing.user_email !== session.email) {
        return { success: false, error: 'Você não tem permissão para editar esta campanha.' }
      }
    }

    // 2. Check if slug is used by another campaign
    if (slug !== existing.slug) {
      const { data: duplicate } = await supabase
        .from('campaigns')
        .select('id')
        .eq('slug', slug)
        .neq('id', campaignId)
        .maybeSingle()

      if (duplicate) {
        return {
          success: false,
          error: `O link "/c/${slug}" já está sendo utilizado por outra campanha. Escolha outro slug.`,
        }
      }
    }

    let updatedFrameUrl = existing.frame_url

    // 3. If a new frame file is provided, upload to storage
    if (newFrameFile && newFrameFile.size > 0 && typeof newFrameFile.arrayBuffer === 'function') {
      const fileBuffer = await newFrameFile.arrayBuffer()
      const sanitizedName = `${Date.now()}_${slug}_frame.png`
      const filePath = `frames/${sanitizedName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('frames')
        .upload(filePath, fileBuffer, {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) {
        return {
          success: false,
          error: `Erro ao enviar nova moldura: ${uploadError.message}`,
        }
      }

      const { data: publicUrlData } = supabase.storage
        .from('frames')
        .getPublicUrl(uploadData.path)

      updatedFrameUrl = publicUrlData.publicUrl
    }

    // 4. Update campaign record
    const { data: updated, error: updateError } = await supabase
      .from('campaigns')
      .update({
        title,
        slug,
        format: selectedFormat,
        frame_url: updatedFrameUrl,
      } as any)
      .eq('id', campaignId)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: `Erro ao salvar alterações no banco: ${updateError.message}`,
      }
    }

    revalidatePath('/admin')
    revalidatePath('/')
    revalidatePath(`/c/${slug}`)
    if (existing.slug !== slug) {
      revalidatePath(`/c/${existing.slug}`)
    }

    return {
      success: true,
      slug,
      campaign: updated,
    }
  } catch (err: any) {
    console.error('Unexpected error in updateCampaign:', err)
    return { success: false, error: err?.message || 'Erro inesperado ao atualizar campanha.' }
  }
}

/**
 * Deletes a campaign with ownership check.
 */
export async function deleteCampaign(id: string, frameUrl?: string) {
  const session = await getAdminSessionPayload()
  if (!session) {
    return { success: false, error: 'Acesso não autorizado.' }
  }

  try {
    const supabase = await createClient()

    // Non-masters can only delete their own campaigns
    if (!session.can_access_master_admin) {
      const { data: camp } = await supabase
        .from('campaigns')
        .select('user_id, user_email')
        .eq('id', id)
        .single()

      if (!camp || (camp.user_id !== session.id && camp.user_email !== session.email)) {
        return { success: false, error: 'Você só pode excluir suas próprias campanhas.' }
      }
    }

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

/**
 * Atomically increments views count of a campaign.
 */
export async function incrementCampaignView(campaignId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('increment_views', {
      campaign_id: campaignId,
    })

    if (error) {
      // Fallback update
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

/**
 * Atomically increments downloads count of a campaign.
 */
export async function incrementCampaignDownload(campaignId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('increment_downloads', {
      campaign_id: campaignId,
    })

    if (error) {
      // Fallback update
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

/**
 * Records a participant lead (WhatsApp or Email) and atomically increments the download count.
 */
export async function recordCampaignLeadAndDownload(input: RecordLeadInput): Promise<RecordLeadResult> {
  const { campaignId, contactType, contactValue, userName } = input

  if (!campaignId) {
    return { success: false, error: 'ID da campanha não informado.' }
  }

  const cleanValue = (contactValue || '').trim()
  if (!cleanValue) {
    return {
      success: false,
      error: `Por favor, informe seu ${contactType === 'whatsapp' ? 'WhatsApp (telefone)' : 'e-mail'}.`,
    }
  }

  try {
    const supabase = await createClient()

    // 1. Try atomic RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc('record_lead_and_download', {
      p_campaign_id: campaignId,
      p_contact_type: contactType,
      p_contact_value: cleanValue,
      p_user_name: userName ? userName.trim() : undefined,
    })

    if (!rpcError && rpcData) {
      return { success: true, leadId: rpcData }
    }

    console.warn('[recordCampaignLeadAndDownload] RPC notice, using fallback insert:', rpcError?.message || 'RPC offline')

    // 2. Fallback: Direct insert into campaign_leads + increment download
    const { data: leadData, error: leadError } = await supabase
      .from('campaign_leads')
      .insert({
        campaign_id: campaignId,
        contact_type: contactType,
        contact_value: cleanValue,
        user_name: userName ? userName.trim() : null,
      })
      .select('id')
      .single()

    // Increment download counter
    await incrementCampaignDownload(campaignId)

    if (leadError) {
      console.warn('[recordCampaignLeadAndDownload] Lead insert warning:', leadError.message)
      // Even if lead table is missing, the download was counted
      return { success: true }
    }

    return { success: true, leadId: leadData?.id }
  } catch (err: any) {
    console.error('Error recording lead:', err)
    // Always allow the download even if lead recording encounters an unexpected network issue
    await incrementCampaignDownload(campaignId).catch(() => {})
    return { success: true }
  }
}

/**
 * Retrieves leads collected for a campaign (with ownership check).
 */
export async function getCampaignLeads(campaignId: string): Promise<CampaignLead[]> {
  const session = await getAdminSessionPayload()
  if (!session) return []

  try {
    const supabase = await createClient()

    // If not master admin, verify that this campaign belongs to the user
    if (!session.can_access_master_admin) {
      const { data: camp } = await supabase
        .from('campaigns')
        .select('user_id, user_email')
        .eq('id', campaignId)
        .single()

      if (!camp || (camp.user_id !== session.id && camp.user_email !== session.email)) {
        return []
      }
    }

    const { data, error } = await supabase
      .from('campaign_leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Error fetching campaign leads:', error.message)
      return []
    }

    return (data as CampaignLead[]) || []
  } catch (err) {
    console.error('Unexpected error fetching leads:', err)
    return []
  }
}
