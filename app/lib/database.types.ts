export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      agent_categories: {
        Row: {
          agent_id: string;
          category_id: string;
          created_at: string;
          id: string;
        };
        Insert: {
          agent_id: string;
          category_id: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          agent_id?: string;
          category_id?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: Array<
          | {
              foreignKeyName: "agent_categories_agent_id_fkey";
              columns: ["agent_id"];
              isOneToOne: false;
              referencedRelation: "users";
              referencedColumns: ["id"];
            }
          | {
              foreignKeyName: "agent_categories_category_id_fkey";
              columns: ["category_id"];
              isOneToOne: false;
              referencedRelation: "categories";
              referencedColumns: ["id"];
            }
        >;
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subcategories: {
        Row: {
          category_id: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: Array<
          | {
              foreignKeyName: "subcategories_category_id_fkey";
              columns: ["category_id"];
              isOneToOne: false;
              referencedRelation: "categories";
              referencedColumns: ["id"];
            }
        >;
      };
      tickets: {
        Row: {
          assigned_to_id: string | null;
          created_at: string;
          created_by_id: string | null;
          description: string;
          id: string;
          status: Database["public"]["Enums"]["ticket_status"];
          subcategory_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_to_id?: string | null;
          created_at?: string;
          created_by_id?: string | null;
          description: string;
          id?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          subcategory_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_to_id?: string | null;
          created_at?: string;
          created_by_id?: string | null;
          description?: string;
          id?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          subcategory_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: Array<
          | {
              foreignKeyName: "tickets_assigned_to_id_fkey";
              columns: ["assigned_to_id"];
              isOneToOne: false;
              referencedRelation: "users";
              referencedColumns: ["id"];
            }
          | {
              foreignKeyName: "tickets_created_by_id_fkey";
              columns: ["created_by_id"];
              isOneToOne: false;
              referencedRelation: "users";
              referencedColumns: ["id"];
            }
          | {
              foreignKeyName: "tickets_subcategory_id_fkey";
              columns: ["subcategory_id"];
              isOneToOne: false;
              referencedRelation: "subcategories";
              referencedColumns: ["id"];
            }
        >;
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          force_password_change: boolean;
          id: string;
          name: string;
          password: string;
          role: Database["public"]["Enums"]["role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          force_password_change?: boolean;
          id?: string;
          name: string;
          password: string;
          role?: Database["public"]["Enums"]["role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          force_password_change?: boolean;
          id?: string;
          name?: string;
          password?: string;
          role?: Database["public"]["Enums"]["role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [key: string]: never;
    };
    Functions: {
      [key: string]: never;
    };
    Enums: {
      role: "USER" | "AGENT" | "ADMIN";
      ticket_status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    };
    CompositeTypes: {
      [key: string]: never;
    };
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      role: ["USER", "AGENT", "ADMIN"] as const,
      ticket_status: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const,
    },
  },
} as const;


