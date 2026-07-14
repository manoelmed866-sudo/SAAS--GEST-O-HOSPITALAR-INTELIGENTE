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
      administrative_audit_events: {
        Row: {
          actor_profile_id: string
          created_at: string
          event_type: string
          hospital_id: string
          id: string
          new_status: string
          organization_id: string
          previous_status: string
          target_hospital_membership_id: string
        }
        Insert: {
          actor_profile_id: string
          created_at?: string
          event_type: string
          hospital_id: string
          id?: string
          new_status: string
          organization_id: string
          previous_status: string
          target_hospital_membership_id: string
        }
        Update: {
          actor_profile_id?: string
          created_at?: string
          event_type?: string
          hospital_id?: string
          id?: string
          new_status?: string
          organization_id?: string
          previous_status?: string
          target_hospital_membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "administrative_audit_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_audit_events_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administrative_audit_events_target_hospital_membership_id_fkey"
            columns: ["target_hospital_membership_id"]
            isOneToOne: false
            referencedRelation: "hospital_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_membership_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          hospital_membership_id: string
          id: string
          revoked_at: string | null
          role_id: number
          role_scope: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          hospital_membership_id: string
          id?: string
          revoked_at?: string | null
          role_id: number
          role_scope?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          hospital_membership_id?: string
          id?: string
          revoked_at?: string | null
          role_id?: number
          role_scope?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_membership_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_membership_roles_hospital_membership_id_fkey"
            columns: ["hospital_membership_id"]
            isOneToOne: false
            referencedRelation: "hospital_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_membership_roles_role_scope_fk"
            columns: ["role_id", "role_scope"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "scope"]
          },
        ]
      }
      hospital_memberships: {
        Row: {
          created_at: string
          created_by: string | null
          hospital_id: string
          id: string
          management_ref: string
          organization_id: string
          organization_membership_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hospital_id: string
          id?: string
          management_ref?: string
          organization_id: string
          organization_membership_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hospital_id?: string
          id?: string
          management_ref?: string
          organization_id?: string
          organization_membership_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_memberships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_memberships_hospital_organization_fk"
            columns: ["hospital_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "hospital_memberships_org_membership_organization_fk"
            columns: ["organization_membership_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      hospitals: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospitals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_membership_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          organization_membership_id: string
          revoked_at: string | null
          role_id: number
          role_scope: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          organization_membership_id: string
          revoked_at?: string | null
          role_id: number
          role_scope?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          organization_membership_id?: string
          revoked_at?: string | null
          role_id?: number
          role_scope?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_membership_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_membership_roles_organization_membership_id_fkey"
            columns: ["organization_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_membership_roles_role_scope_fk"
            columns: ["role_id", "role_scope"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "scope"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          legal_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          legal_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          legal_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: number
          scope: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: never
          scope: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: never
          scope?: string
        }
        Relationships: []
      }
      platform_role_assignments: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          revoked_at: string | null
          role_id: number
          role_scope: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role_id: number
          role_scope?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role_id?: number
          role_scope?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_role_assignments_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_role_assignments_role_scope_fk"
            columns: ["role_id", "role_scope"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "scope"]
          },
          {
            foreignKeyName: "platform_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: number
          role_id: number
          scope: string
        }
        Insert: {
          created_at?: string
          permission_id: number
          role_id: number
          scope: string
        }
        Update: {
          created_at?: string
          permission_id?: number
          role_id?: number
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_scope_fk"
            columns: ["permission_id", "scope"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id", "scope"]
          },
          {
            foreignKeyName: "role_permissions_role_scope_fk"
            columns: ["role_id", "scope"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "scope"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_name: string
          id: number
          is_system: boolean
          scope: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: never
          is_system?: boolean
          scope: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: never
          is_system?: boolean
          scope?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      change_hospital_membership_status: {
        Args: {
          requested_status: string
          target_hospital_id: string
          target_management_ref: string
        }
        Returns: string
      }
      get_effective_hospital_capabilities: {
        Args: { target_hospital_id: string }
        Returns: {
          can_manage_memberships: boolean
          can_read_audit: boolean
          can_read_hospital: boolean
          can_read_memberships: boolean
          can_switch_context: boolean
        }[]
      }
      get_hospital_team: {
        Args: { target_hospital_id: string }
        Returns: {
          can_reactivate: boolean
          can_suspend: boolean
          display_name: string
          management_ref: string
          membership_status: string
          role_labels: string[]
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
