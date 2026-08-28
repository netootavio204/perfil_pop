export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CampaignFormat = '1:1' | '4:5' | '3:4' | 'circle'
export type AdminRole = 'admin' | 'editor'
export type UserPlan = 'free' | 'unlimited'
export type LeadContactType = 'whatsapp' | 'email'

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
          user_id?: string | null
          user_email?: string | null
          user_name?: string | null
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
          user_id?: string | null
          user_email?: string | null
          user_name?: string | null
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
          user_id?: string | null
          user_email?: string | null
          user_name?: string | null
          views_count?: number
          downloads_count?: number
          created_at?: string
        }
        Relationships: []
      }
      campaign_leads: {
        Row: {
          id: string
          campaign_id: string
          contact_type: LeadContactType
          contact_value: string
          user_name?: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          contact_type: LeadContactType
          contact_value: string
          user_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          contact_type?: LeadContactType
          contact_value?: string
          user_name?: string | null
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
          can_access_master_admin: boolean
          plan: UserPlan
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
          can_access_master_admin?: boolean
          plan?: UserPlan
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
          can_access_master_admin?: boolean
          plan?: UserPlan
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
      record_lead_and_download: {
        Args: {
          p_campaign_id: string
          p_contact_type: string
          p_contact_value: string
          p_user_name?: string
        }
        Returns: string
      }
    }
    Enums: {
      campaign_format: CampaignFormat
      admin_role: AdminRole
      user_plan: UserPlan
      lead_contact_type: LeadContactType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update']

export type CampaignLead = Database['public']['Tables']['campaign_leads']['Row']
export type CampaignLeadInsert = Database['public']['Tables']['campaign_leads']['Insert']

export type AdminUser = Database['public']['Tables']['admin_users']['Row']
export type AdminUserInsert = Database['public']['Tables']['admin_users']['Insert']
export type AdminUserUpdate = Database['public']['Tables']['admin_users']['Update']

// Safe public/admin representation without exposing password hashes
export type SafeAdminUser = Omit<AdminUser, 'password_hash' | 'password_salt'>
