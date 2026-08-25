export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CampaignFormat = '1:1' | '4:5' | '3:4' | 'circle'
export type AdminRole = 'admin' | 'editor'

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
      admin_users: {
        Row: {
          id: string
          name: string
          email: string
          password_hash: string
          password_salt: string
          role: AdminRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password_hash: string
          password_salt: string
          role?: AdminRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password_hash?: string
          password_salt?: string
          role?: AdminRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
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
      admin_role: AdminRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update']

export type AdminUser = Database['public']['Tables']['admin_users']['Row']
export type AdminUserInsert = Database['public']['Tables']['admin_users']['Insert']
export type AdminUserUpdate = Database['public']['Tables']['admin_users']['Update']

// Safe public/admin representation without exposing password hashes
export type SafeAdminUser = Omit<AdminUser, 'password_hash' | 'password_salt'>

