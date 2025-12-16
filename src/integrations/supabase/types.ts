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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      detected_changes: {
        Row: {
          category: Database["public"]["Enums"]["change_category"]
          details: Json | null
          detected_at: string
          id: string
          is_read: boolean
          message: string
          page_type: Database["public"]["Enums"]["portal_page_type"]
          title: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["change_category"]
          details?: Json | null
          detected_at?: string
          id?: string
          is_read?: boolean
          message: string
          page_type: Database["public"]["Enums"]["portal_page_type"]
          title: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["change_category"]
          details?: Json | null
          detected_at?: string
          id?: string
          is_read?: boolean
          message?: string
          page_type?: Database["public"]["Enums"]["portal_page_type"]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      page_snapshots: {
        Row: {
          captured_at: string
          content_hash: string
          id: string
          page_type: Database["public"]["Enums"]["portal_page_type"]
          parsed_data: Json | null
          raw_content: string | null
          user_id: string
        }
        Insert: {
          captured_at?: string
          content_hash: string
          id?: string
          page_type: Database["public"]["Enums"]["portal_page_type"]
          parsed_data?: Json | null
          raw_content?: string | null
          user_id: string
        }
        Update: {
          captured_at?: string
          content_hash?: string
          id?: string
          page_type?: Database["public"]["Enums"]["portal_page_type"]
          parsed_data?: Json | null
          raw_content?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          auto_sync_enabled: boolean
          failed_syncs: number
          id: string
          is_syncing: boolean
          last_sync_completed: string | null
          last_sync_error: string | null
          last_sync_started: string | null
          next_scheduled_sync: string | null
          notification_email: string | null
          successful_syncs: number
          total_syncs: number
          user_id: string
        }
        Insert: {
          auto_sync_enabled?: boolean
          failed_syncs?: number
          id?: string
          is_syncing?: boolean
          last_sync_completed?: string | null
          last_sync_error?: string | null
          last_sync_started?: string | null
          next_scheduled_sync?: string | null
          notification_email?: string | null
          successful_syncs?: number
          total_syncs?: number
          user_id: string
        }
        Update: {
          auto_sync_enabled?: boolean
          failed_syncs?: number
          id?: string
          is_syncing?: boolean
          last_sync_completed?: string | null
          last_sync_error?: string | null
          last_sync_started?: string | null
          next_scheduled_sync?: string | null
          notification_email?: string | null
          successful_syncs?: number
          total_syncs?: number
          user_id?: string
        }
        Relationships: []
      }
      user_credentials: {
        Row: {
          created_at: string
          encrypted_password: string
          id: string
          is_active: boolean
          last_login_attempt: string | null
          last_successful_login: string | null
          portal_url: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          encrypted_password: string
          id?: string
          is_active?: boolean
          last_login_attempt?: string | null
          last_successful_login?: string | null
          portal_url?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          encrypted_password?: string
          id?: string
          is_active?: boolean
          last_login_attempt?: string | null
          last_successful_login?: string | null
          portal_url?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      change_category:
        | "grade_posted"
        | "grade_updated"
        | "assignment_added"
        | "assignment_updated"
        | "assignment_due_changed"
        | "announcement_added"
        | "attendance_recorded"
        | "attendance_updated"
        | "billing_item_added"
        | "billing_payment_received"
        | "calendar_event_added"
        | "calendar_event_removed"
        | "calendar_event_updated"
      portal_page_type:
        | "grades"
        | "assignments"
        | "announcements"
        | "attendance"
        | "billing"
        | "calendar"
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
      change_category: [
        "grade_posted",
        "grade_updated",
        "assignment_added",
        "assignment_updated",
        "assignment_due_changed",
        "announcement_added",
        "attendance_recorded",
        "attendance_updated",
        "billing_item_added",
        "billing_payment_received",
        "calendar_event_added",
        "calendar_event_removed",
        "calendar_event_updated",
      ],
      portal_page_type: [
        "grades",
        "assignments",
        "announcements",
        "attendance",
        "billing",
        "calendar",
      ],
    },
  },
} as const
