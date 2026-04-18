export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          bank_account_holder: string | null
          bank_iban: string | null
          bank_name: string | null
          founding_program_active: boolean
          founding_total_seats: number
          id: number
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          bank_account_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          founding_program_active?: boolean
          founding_total_seats?: number
          id?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          bank_account_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          founding_program_active?: boolean
          founding_total_seats?: number
          id?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean
          metadata: Json | null
          model_used: string | null
          prompt: string
          result: string | null
          template: string | null
          type: Database["public"]["Enums"]["generation_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          metadata?: Json | null
          model_used?: string | null
          prompt: string
          result?: string | null
          template?: string | null
          type: Database["public"]["Enums"]["generation_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          metadata?: Json | null
          model_used?: string | null
          prompt?: string
          result?: string | null
          template?: string | null
          type?: Database["public"]["Enums"]["generation_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          audience: string | null
          brand_color: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarded: boolean
          plan: Database["public"]["Enums"]["user_plan"]
          product_type: string | null
          store_name: string | null
          tone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          audience?: string | null
          brand_color?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarded?: boolean
          plan?: Database["public"]["Enums"]["user_plan"]
          product_type?: string | null
          store_name?: string | null
          tone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          audience?: string | null
          brand_color?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarded?: boolean
          plan?: Database["public"]["Enums"]["user_plan"]
          product_type?: string | null
          store_name?: string | null
          tone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          activated_at: string | null
          activated_until: string | null
          admin_notes: string | null
          billing_cycle: string
          created_at: string
          email: string
          id: string
          notes: string | null
          payment_method: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          status: Database["public"]["Enums"]["subscription_request_status"]
          store_name: string | null
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          activated_at?: string | null
          activated_until?: string | null
          admin_notes?: string | null
          billing_cycle?: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          status?: Database["public"]["Enums"]["subscription_request_status"]
          store_name?: string | null
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          activated_at?: string | null
          activated_until?: string | null
          admin_notes?: string | null
          billing_cycle?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          status?: Database["public"]["Enums"]["subscription_request_status"]
          store_name?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          id: string
          image_count: number
          month: string
          text_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          image_count?: number
          month: string
          text_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          image_count?: number
          month?: string
          text_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      generation_type: "text" | "image" | "image_enhance"
      subscription_request_status:
        | "pending"
        | "contacted"
        | "activated"
        | "rejected"
        | "expired"
      user_plan: "free" | "pro" | "business"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      generation_type: ["text", "image", "image_enhance"],
      subscription_request_status: [
        "pending",
        "contacted",
        "activated",
        "rejected",
        "expired",
      ],
      user_plan: ["free", "pro", "business"],
    },
  },
} as const
