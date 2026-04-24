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
      ab_test_events: {
        Row: {
          created_at: string
          event_type: string
          experiment: string
          id: string
          session_id: string
          user_agent: string | null
          variant: string
        }
        Insert: {
          created_at?: string
          event_type: string
          experiment: string
          id?: string
          session_id: string
          user_agent?: string | null
          variant: string
        }
        Update: {
          created_at?: string
          event_type?: string
          experiment?: string
          id?: string
          session_id?: string
          user_agent?: string | null
          variant?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          after_value: Json | null
          before_value: Json | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          admin_user_id: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          founding_base_count: number
          founding_discount_pct: number
          founding_program_active: boolean
          founding_total_seats: number
          id: number
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          founding_base_count?: number
          founding_discount_pct?: number
          founding_program_active?: boolean
          founding_total_seats?: number
          id?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          founding_base_count?: number
          founding_discount_pct?: number
          founding_program_active?: boolean
          founding_total_seats?: number
          id?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          message: string
          name: string
          phone: string | null
          status: string
          subject: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          message: string
          name: string
          phone?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          amount: number
          balance_after_plan: number
          balance_after_topup: number
          created_at: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          refund_ledger_id: string | null
          refunded_at: string | null
          source: Database["public"]["Enums"]["credit_source"] | null
          txn_type: Database["public"]["Enums"]["credit_txn_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after_plan: number
          balance_after_topup: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          refund_ledger_id?: string | null
          refunded_at?: string | null
          source?: Database["public"]["Enums"]["credit_source"] | null
          txn_type: Database["public"]["Enums"]["credit_txn_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after_plan?: number
          balance_after_topup?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          refund_ledger_id?: string | null
          refunded_at?: string | null
          source?: Database["public"]["Enums"]["credit_source"] | null
          txn_type?: Database["public"]["Enums"]["credit_txn_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_refund_ledger_id_fkey"
            columns: ["refund_ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_text_usage: {
        Row: {
          day: string
          image_count: number
          text_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          day: string
          image_count?: number
          text_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          day?: string
          image_count?: number
          text_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_rate_limits: {
        Row: {
          count: number
          hour_bucket: string
          ip: string
          updated_at: string
        }
        Insert: {
          count?: number
          hour_bucket: string
          ip: string
          updated_at?: string
        }
        Update: {
          count?: number
          hour_bucket?: string
          ip?: string
          updated_at?: string
        }
        Relationships: []
      }
      dlq_alert_state: {
        Row: {
          id: number
          last_alert_at: string | null
          last_alert_count: number | null
          updated_at: string
        }
        Insert: {
          id?: number
          last_alert_at?: string | null
          last_alert_count?: number | null
          updated_at?: string
        }
        Update: {
          id?: number
          last_alert_at?: string | null
          last_alert_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      domain_scan_log: {
        Row: {
          details: Json
          error_message: string | null
          id: string
          scan_type: string
          scanned_at: string
          status: string
          total_matches: number
        }
        Insert: {
          details?: Json
          error_message?: string | null
          id?: string
          scan_type: string
          scanned_at?: string
          status: string
          total_matches?: number
        }
        Update: {
          details?: Json
          error_message?: string | null
          id?: string
          scan_type?: string
          scanned_at?: string
          status?: string
          total_matches?: number
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      generations: {
        Row: {
          completion_tokens: number | null
          created_at: string
          estimated_cost_usd: number | null
          id: string
          is_favorite: boolean
          metadata: Json | null
          model_used: string | null
          prompt: string
          prompt_tokens: number | null
          result: string | null
          template: string | null
          total_tokens: number | null
          type: Database["public"]["Enums"]["generation_type"]
          user_id: string
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          is_favorite?: boolean
          metadata?: Json | null
          model_used?: string | null
          prompt: string
          prompt_tokens?: number | null
          result?: string | null
          template?: string | null
          total_tokens?: number | null
          type: Database["public"]["Enums"]["generation_type"]
          user_id: string
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          is_favorite?: boolean
          metadata?: Json | null
          model_used?: string | null
          prompt?: string
          prompt_tokens?: number | null
          result?: string | null
          template?: string | null
          total_tokens?: number | null
          type?: Database["public"]["Enums"]["generation_type"]
          user_id?: string
        }
        Relationships: []
      }
      internal_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bank_account_holder: string | null
          bank_iban: string | null
          bank_name: string | null
          id: number
          updated_at: string
        }
        Insert: {
          bank_account_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          bank_account_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      plan_credits: {
        Row: {
          daily_image_cap: number
          daily_text_cap: number
          monthly_credits: number
          plan: Database["public"]["Enums"]["user_plan"]
          updated_at: string
        }
        Insert: {
          daily_image_cap?: number
          daily_text_cap?: number
          monthly_credits: number
          plan: Database["public"]["Enums"]["user_plan"]
          updated_at?: string
        }
        Update: {
          daily_image_cap?: number
          daily_text_cap?: number
          monthly_credits?: number
          plan?: Database["public"]["Enums"]["user_plan"]
          updated_at?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          kind: string
          monthly_limit: number
          plan: Database["public"]["Enums"]["user_plan"]
          updated_at: string
        }
        Insert: {
          kind: string
          monthly_limit: number
          plan: Database["public"]["Enums"]["user_plan"]
          updated_at?: string
        }
        Update: {
          kind?: string
          monthly_limit?: number
          plan?: Database["public"]["Enums"]["user_plan"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          audience: string | null
          banned_phrases: string[]
          brand_color: string | null
          brand_personality: string | null
          compliance_notes: string | null
          created_at: string
          cta_style: string | null
          email: string | null
          exchange_policy: string | null
          faq_notes: string | null
          full_name: string | null
          high_margin_products: string[]
          id: string
          onboarded: boolean
          plan: Database["public"]["Enums"]["user_plan"]
          product_type: string | null
          seasonal_priorities: string[]
          shipping_policy: string | null
          store_name: string | null
          tone: string | null
          unique_selling_point: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          audience?: string | null
          banned_phrases?: string[]
          brand_color?: string | null
          brand_personality?: string | null
          compliance_notes?: string | null
          created_at?: string
          cta_style?: string | null
          email?: string | null
          exchange_policy?: string | null
          faq_notes?: string | null
          full_name?: string | null
          high_margin_products?: string[]
          id: string
          onboarded?: boolean
          plan?: Database["public"]["Enums"]["user_plan"]
          product_type?: string | null
          seasonal_priorities?: string[]
          shipping_policy?: string | null
          store_name?: string | null
          tone?: string | null
          unique_selling_point?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          audience?: string | null
          banned_phrases?: string[]
          brand_color?: string | null
          brand_personality?: string | null
          compliance_notes?: string | null
          created_at?: string
          cta_style?: string | null
          email?: string | null
          exchange_policy?: string | null
          faq_notes?: string | null
          full_name?: string | null
          high_margin_products?: string[]
          id?: string
          onboarded?: boolean
          plan?: Database["public"]["Enums"]["user_plan"]
          product_type?: string | null
          seasonal_priorities?: string[]
          shipping_policy?: string | null
          store_name?: string | null
          tone?: string | null
          unique_selling_point?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      stale_subs_alert_state: {
        Row: {
          id: number
          last_alert_at: string | null
          last_alert_count: number | null
          updated_at: string
        }
        Insert: {
          id?: number
          last_alert_at?: string | null
          last_alert_count?: number | null
          updated_at?: string
        }
        Update: {
          id?: number
          last_alert_at?: string | null
          last_alert_count?: number | null
          updated_at?: string
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
          receipt_path: string | null
          receipt_uploaded_at: string | null
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
          receipt_path?: string | null
          receipt_uploaded_at?: string | null
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
          receipt_path?: string | null
          receipt_uploaded_at?: string | null
          status?: Database["public"]["Enums"]["subscription_request_status"]
          store_name?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      topup_packages: {
        Row: {
          created_at: string
          credits: number
          display_name: string
          display_order: number
          id: string
          is_active: boolean
          price_sar: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          display_name: string
          display_order?: number
          id: string
          is_active?: boolean
          price_sar: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          display_name?: string
          display_order?: number
          id?: string
          is_active?: boolean
          price_sar?: number
          updated_at?: string
        }
        Relationships: []
      }
      topup_purchases: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          admin_notes: string | null
          created_at: string
          credits: number
          id: string
          idempotency_key: string
          ledger_id: string | null
          metadata: Json | null
          package_id: string
          payment_method: string | null
          price_sar: number
          receipt_path: string | null
          receipt_uploaded_at: string | null
          status: Database["public"]["Enums"]["topup_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          admin_notes?: string | null
          created_at?: string
          credits: number
          id?: string
          idempotency_key: string
          ledger_id?: string | null
          metadata?: Json | null
          package_id: string
          payment_method?: string | null
          price_sar: number
          receipt_path?: string | null
          receipt_uploaded_at?: string | null
          status?: Database["public"]["Enums"]["topup_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          admin_notes?: string | null
          created_at?: string
          credits?: number
          id?: string
          idempotency_key?: string
          ledger_id?: string | null
          metadata?: Json | null
          package_id?: string
          payment_method?: string | null
          price_sar?: number
          receipt_path?: string | null
          receipt_uploaded_at?: string | null
          status?: Database["public"]["Enums"]["topup_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topup_purchases_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topup_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "topup_packages"
            referencedColumns: ["id"]
          },
        ]
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
      user_credits: {
        Row: {
          cycle_ends_at: string | null
          cycle_started_at: string
          plan_credits: number
          topup_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cycle_ends_at?: string | null
          cycle_started_at?: string
          plan_credits?: number
          topup_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cycle_ends_at?: string | null
          cycle_started_at?: string
          plan_credits?: number
          topup_credits?: number
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
      video_jobs: {
        Row: {
          aspect_ratio: string
          completed_at: string | null
          created_at: string
          credits_charged: number
          duration_seconds: number
          error_message: string | null
          estimated_cost_usd: number | null
          id: string
          ledger_id: string | null
          metadata: Json | null
          prompt: string
          provider: string
          provider_job_id: string | null
          quality: Database["public"]["Enums"]["video_quality"]
          refund_ledger_id: string | null
          result_url: string | null
          starting_frame_url: string | null
          status: Database["public"]["Enums"]["video_job_status"]
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aspect_ratio?: string
          completed_at?: string | null
          created_at?: string
          credits_charged: number
          duration_seconds?: number
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          ledger_id?: string | null
          metadata?: Json | null
          prompt: string
          provider?: string
          provider_job_id?: string | null
          quality: Database["public"]["Enums"]["video_quality"]
          refund_ledger_id?: string | null
          result_url?: string | null
          starting_frame_url?: string | null
          status?: Database["public"]["Enums"]["video_job_status"]
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          completed_at?: string | null
          created_at?: string
          credits_charged?: number
          duration_seconds?: number
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          ledger_id?: string | null
          metadata?: Json | null
          prompt?: string
          provider?: string
          provider_job_id?: string | null
          quality?: Database["public"]["Enums"]["video_quality"]
          refund_ledger_id?: string | null
          result_url?: string | null
          starting_frame_url?: string | null
          status?: Database["public"]["Enums"]["video_job_status"]
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_jobs_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_jobs_refund_ledger_id_fkey"
            columns: ["refund_ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _ensure_user_credits: { Args: { _uid: string }; Returns: undefined }
      activate_topup_purchase: {
        Args: { _purchase_id: string }
        Returns: {
          cycle_ends_at: string | null
          cycle_started_at: string
          plan_credits: number
          topup_credits: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_credits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bump_usage: {
        Args: { _kind: string; _month: string }
        Returns: {
          id: string
          image_count: number
          month: string
          text_count: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "usage_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_email_dlq_health: { Args: never; Returns: Json }
      consume_credits: {
        Args: {
          _amount: number
          _metadata?: Json
          _reference_id?: string
          _reference_type?: string
          _txn_type: Database["public"]["Enums"]["credit_txn_type"]
        }
        Returns: {
          ledger_id: string
          remaining_plan: number
          remaining_topup: number
          remaining_total: number
        }[]
      }
      consume_demo_token: {
        Args: { _ip: string; _limit: number }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      consume_text_quota: {
        Args: never
        Returns: {
          allowed: boolean
          daily_cap: number
          used: number
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_founding_status: {
        Args: never
        Returns: {
          current_subscribers: number
          discount_pct: number
          program_active: boolean
          seats_left: number
          seats_total: number
        }[]
      }
      get_public_app_settings: {
        Args: never
        Returns: {
          founding_base_count: number
          founding_discount_pct: number
          founding_program_active: boolean
          founding_total_seats: number
        }[]
      }
      get_stale_subscription_requests: {
        Args: never
        Returns: {
          billing_cycle: string
          created_at: string
          email: string
          hours_old: number
          id: string
          plan: Database["public"]["Enums"]["user_plan"]
          status: Database["public"]["Enums"]["subscription_request_status"]
          store_name: string
          whatsapp: string
        }[]
      }
      get_user_credits_summary: {
        Args: never
        Returns: {
          cycle_ends_at: string
          daily_text_cap: number
          daily_text_used: number
          plan: Database["public"]["Enums"]["user_plan"]
          plan_credits: number
          topup_credits: number
          total_credits: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reconcile_usage_logs: {
        Args: { _month?: string }
        Returns: {
          image_diff: number
          month: string
          new_image_count: number
          new_text_count: number
          old_image_count: number
          old_text_count: number
          text_diff: number
          user_id: string
        }[]
      }
      record_generation: {
        Args: {
          _completion_tokens?: number
          _estimated_cost_usd?: number
          _metadata?: Json
          _model_used?: string
          _prompt: string
          _prompt_tokens?: number
          _result: string
          _template?: string
          _total_tokens?: number
          _type: Database["public"]["Enums"]["generation_type"]
        }
        Returns: {
          completion_tokens: number | null
          created_at: string
          estimated_cost_usd: number | null
          id: string
          is_favorite: boolean
          metadata: Json | null
          model_used: string | null
          prompt: string
          prompt_tokens: number | null
          result: string | null
          template: string | null
          total_tokens: number | null
          type: Database["public"]["Enums"]["generation_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "generations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refund_credits: {
        Args: { _ledger_id: string; _reason?: string }
        Returns: string
      }
      reset_monthly_credits: {
        Args: {
          _plan: Database["public"]["Enums"]["user_plan"]
          _user_id: string
        }
        Returns: {
          cycle_ends_at: string | null
          cycle_started_at: string
          plan_credits: number
          topup_credits: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_credits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      credit_source: "plan" | "topup"
      credit_txn_type:
        | "plan_grant"
        | "topup_purchase"
        | "consume_image"
        | "consume_video"
        | "refund"
        | "admin_adjust"
        | "expire"
      generation_type: "text" | "image" | "image_enhance"
      subscription_request_status:
        | "pending"
        | "contacted"
        | "activated"
        | "rejected"
        | "expired"
      topup_status: "pending" | "paid" | "activated" | "rejected" | "refunded"
      user_plan: "free" | "pro" | "business" | "starter" | "growth"
      video_job_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
      video_quality: "fast" | "quality"
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
      credit_source: ["plan", "topup"],
      credit_txn_type: [
        "plan_grant",
        "topup_purchase",
        "consume_image",
        "consume_video",
        "refund",
        "admin_adjust",
        "expire",
      ],
      generation_type: ["text", "image", "image_enhance"],
      subscription_request_status: [
        "pending",
        "contacted",
        "activated",
        "rejected",
        "expired",
      ],
      topup_status: ["pending", "paid", "activated", "rejected", "refunded"],
      user_plan: ["free", "pro", "business", "starter", "growth"],
      video_job_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      video_quality: ["fast", "quality"],
    },
  },
} as const
