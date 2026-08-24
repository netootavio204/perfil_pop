export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CampaignFormat = '1:1' | '4:5' | '3:4' | 'circle'

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          title: string
          slug: string
          frame_url: string
          format: CampaignFormat
          views_count: number
          downloads_count: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          frame_url: string
          format?: CampaignFormat
          views_count?: number
          downloads_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          frame_url?: string
          format?: CampaignFormat
          views_count?: number
          downloads_count?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_views: {
        Args: { campaign_id: string }
        Returns: void
      }
      increment_downloads: {
        Args: { campaign_id: string }
        Returns: void
      }
    }
    Enums: {
      campaign_format: CampaignFormat
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update']

