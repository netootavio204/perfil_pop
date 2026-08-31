import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CampaignPublicView } from '@/components/campaign/CampaignPublicView'
import { incrementCampaignView } from '@/actions/campaigns'

interface CampaignPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CampaignPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const supabase = await createClient()
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('title, frame_url')
      .eq('slug', slug)
      .maybeSingle()

    if (!campaign) {
      return {
        title: 'Campanha não encontrada | PerfilPop',
      }
    }

    const primaryFrame = campaign.frame_url ? campaign.frame_url.split('|||')[0] : ''

    return {
      title: `${campaign.title} | PerfilPop`,
      description: `Participe da campanha "${campaign.title}" e personalize sua foto de perfil agora mesmo no PerfilPop.`,
      openGraph: {
        title: campaign.title,
        description: `Adicione o avatar oficial da campanha "${campaign.title}" à sua foto.`,
        images: [
          {
            url: primaryFrame,
            width: 1080,
            height: 1080,
            alt: campaign.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: campaign.title,
        description: `Adicione o avatar oficial da campanha "${campaign.title}" à sua foto.`,
        images: [primaryFrame],
      },
    }
  } catch {
    return {
      title: 'PerfilPop - Plataforma de Avatares e Molduras para Campanhas',
    }
  }
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !campaign) {
    notFound()
  }

  // Increment view counter on the server
  try {
    await incrementCampaignView(campaign.id)
  } catch (err) {
    console.warn('Server view increment notice:', err)
  }

  return <CampaignPublicView campaign={campaign} />
}
