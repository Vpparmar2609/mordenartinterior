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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approval_type: string
          approved_by: string | null
          comments: string | null
          id: string
          project_id: string
          requested_at: string
          requested_by: string
          responded_at: string | null
          status: string
        }
        Insert: {
          approval_type: string
          approved_by?: string | null
          comments?: string | null
          id?: string
          project_id: string
          requested_at?: string
          requested_by: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          approval_type?: string
          approved_by?: string | null
          comments?: string | null
          id?: string
          project_id?: string
          requested_at?: string
          requested_by?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_feedback: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string | null
          project_id: string
          rating: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          rating?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_report_photos: {
        Row: {
          caption: string | null
          id: string
          photo_url: string
          report_id: string
          uploaded_at: string
        }
        Insert: {
          caption?: string | null
          id?: string
          photo_url: string
          report_id: string
          uploaded_at?: string
        }
        Update: {
          caption?: string | null
          id?: string
          photo_url?: string
          report_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_photos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          created_at: string
          id: string
          materials_received: string | null
          next_plan: string | null
          project_id: string
          report_date: string
          reported_by: string
          work_done: string
          workers_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          materials_received?: string | null
          next_plan?: string | null
          project_id: string
          report_date?: string
          reported_by: string
          work_done: string
          workers_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          materials_received?: string | null
          next_plan?: string | null
          project_id?: string
          report_date?: string
          reported_by?: string
          work_done?: string
          workers_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_task_files: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          file_name: string
          file_url: string
          id: string
          rejection_reason: string | null
          task_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          file_name: string
          file_url: string
          id?: string
          rejection_reason?: string | null
          task_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          file_name?: string
          file_url?: string
          id?: string
          rejection_reason?: string | null
          task_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "design_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      design_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index: number
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_task_photos: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          caption: string | null
          id: string
          photo_url: string
          rejection_reason: string | null
          task_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          id?: string
          photo_url: string
          rejection_reason?: string | null
          task_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          id?: string
          photo_url?: string
          rejection_reason?: string | null
          task_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_task_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "execution_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_tasks: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          expected_date: string | null
          id: string
          name: string
          notes: string | null
          order_index: number
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          expected_date?: string | null
          id?: string
          name: string
          notes?: string | null
          order_index: number
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          expected_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          order_index?: number
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          issue_type: string
          project_id: string
          reported_by: string
          resolution_comment: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          status: Database["public"]["Enums"]["issue_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          issue_type: string
          project_id: string
          reported_by: string
          resolution_comment?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          issue_type?: string
          project_id?: string
          reported_by?: string
          resolution_comment?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          message: string
          project_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          project_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          project_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          bhk: string
          budget_range: string
          client_email: string
          client_name: string
          client_phone: string
          client_user_id: string | null
          created_at: string
          created_by: string
          deadline: string
          design_head_id: string | null
          execution_manager_id: string | null
          flat_size: string
          id: string
          lifecycle_status: string
          location: string
          progress: number
          start_date: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          bhk: string
          budget_range: string
          client_email: string
          client_name: string
          client_phone: string
          client_user_id?: string | null
          created_at?: string
          created_by: string
          deadline: string
          design_head_id?: string | null
          execution_manager_id?: string | null
          flat_size: string
          id?: string
          lifecycle_status?: string
          location: string
          progress?: number
          start_date: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          bhk?: string
          budget_range?: string
          client_email?: string
          client_name?: string
          client_phone?: string
          client_user_id?: string | null
          created_at?: string
          created_by?: string
          deadline?: string
          design_head_id?: string | null
          execution_manager_id?: string | null
          flat_size?: string
          id?: string
          lifecycle_status?: string
          location?: string
          progress?: number
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      snag_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          feedback_id: string
          id: string
          project_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["task_status"]
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          feedback_id: string
          id?: string
          project_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          feedback_id?: string
          id?: string
          project_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
        }
        Relationships: [
          {
            foreignKeyName: "snag_items_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "client_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snag_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      assign_user_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      bootstrap_first_admin: { Args: never; Returns: boolean }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_default_design_tasks: {
        Args: { _project_id: string }
        Returns: undefined
      }
      insert_default_execution_tasks: {
        Args: { _project_id: string }
        Returns: undefined
      }
      is_on_project_team: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "design_head"
        | "designer"
        | "execution_head"
        | "execution_manager"
        | "site_supervisor"
        | "client"
        | "account_manager"
      issue_severity: "low" | "medium" | "high"
      issue_status: "open" | "in_progress" | "resolved"
      project_status:
        | "lead"
        | "design_in_progress"
        | "design_approval_pending"
        | "design_approved"
        | "execution_started"
        | "work_in_progress"
        | "finishing"
        | "handover_pending"
        | "snag_fix"
        | "completed"
      task_status: "pending" | "in_progress" | "completed" | "revision"
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
      app_role: [
        "admin",
        "design_head",
        "designer",
        "execution_head",
        "execution_manager",
        "site_supervisor",
        "client",
        "account_manager",
      ],
      issue_severity: ["low", "medium", "high"],
      issue_status: ["open", "in_progress", "resolved"],
      project_status: [
        "lead",
        "design_in_progress",
        "design_approval_pending",
        "design_approved",
        "execution_started",
        "work_in_progress",
        "finishing",
        "handover_pending",
        "snag_fix",
        "completed",
      ],
      task_status: ["pending", "in_progress", "completed", "revision"],
    },
  },
} as const
