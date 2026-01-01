export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          business_name: string | null
          phone: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          business_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          business_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          producer_id: string
          name: string
          description: string | null
          price: number
          product_type: "curso" | "ebook" | "servico" | "download"
          image_url: string | null
          content_url: string | null
          is_active: boolean
          checkout_color: string | null
          checkout_logo_url: string | null
          features: Json | null
          checkout_settings: Json | null
          social_proof_settings: Json | null
          recurrence_period: string | null
          stock_enabled: boolean
          stock_limit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          producer_id: string
          name: string
          description?: string | null
          price: number
          product_type?: "curso" | "ebook" | "servico" | "download"
          image_url?: string | null
          content_url?: string | null
          is_active?: boolean
          checkout_color?: string | null
          checkout_logo_url?: string | null
          features?: Json | null
          checkout_settings?: Json | null
          social_proof_settings?: Json | null
          recurrence_period?: string | null
          stock_enabled?: boolean
          stock_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          producer_id?: string
          name?: string
          description?: string | null
          price?: number
          product_type?: "curso" | "ebook" | "servico" | "download"
          image_url?: string | null
          content_url?: string | null
          is_active?: boolean
          checkout_color?: string | null
          checkout_logo_url?: string | null
          features?: Json | null
          checkout_settings?: Json | null
          social_proof_settings?: Json | null
          recurrence_period?: string | null
          stock_enabled?: boolean
          stock_limit?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          product_id: string
          title: string
          price: number
          checkout_settings: Json | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title: string
          price: number
          checkout_settings?: Json | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          price?: number
          checkout_settings?: Json | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          reference: string
          product_id: string
          customer_id: string
          producer_id: string
          amount: number
          status: "pending" | "approved" | "rejected" | "refunded"
          payment_reference: string | null
          payment_data: Json | null
          access_granted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference: string
          product_id: string
          customer_id: string
          producer_id: string
          amount: number
          status?: "pending" | "approved" | "rejected" | "refunded"
          payment_reference?: string | null
          payment_data?: Json | null
          access_granted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference?: string
          product_id?: string
          customer_id?: string
          producer_id?: string
          amount?: number
          status?: "pending" | "approved" | "rejected" | "refunded"
          payment_reference?: string | null
          payment_data?: Json | null
          access_granted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      saas_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          interval: "monthly" | "yearly" | "lifetime" | "daily"
          features: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          interval?: "monthly" | "yearly" | "lifetime" | "daily"
          features?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          interval?: "monthly" | "yearly" | "lifetime" | "daily"
          features?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      saas_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: "active" | "canceled" | "past_due" | "trialing"
          current_period_start: string
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: "active" | "canceled" | "past_due" | "trialing"
          current_period_start?: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: "active" | "canceled" | "past_due" | "trialing"
          current_period_start?: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product_type: "curso" | "ebook" | "servico" | "download"
      order_status: "pending" | "approved" | "rejected" | "refunded"
    }
  }
}
