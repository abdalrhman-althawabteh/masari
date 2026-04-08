export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: string;
          default_currency: string;
          exchange_rate: number;
          timezone: string;
          ai_provider: string;
          anthropic_api_key: string | null;
          openai_api_key: string | null;
          gemini_api_key: string | null;
          telegram_chat_id: string | null;
          telegram_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: string;
          default_currency?: string;
          exchange_rate?: number;
          timezone?: string;
          ai_provider?: string;
          anthropic_api_key?: string | null;
          openai_api_key?: string | null;
          gemini_api_key?: string | null;
          telegram_chat_id?: string | null;
          telegram_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: string;
          default_currency?: string;
          exchange_rate?: number;
          timezone?: string;
          ai_provider?: string;
          anthropic_api_key?: string | null;
          openai_api_key?: string | null;
          gemini_api_key?: string | null;
          telegram_chat_id?: string | null;
          telegram_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          type: string;
          is_default: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          type: string;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string | null;
          type?: string;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          currency: string;
          category_id: string;
          description: string;
          source: string | null;
          date: string;
          is_subscription: boolean;
          subscription_id: string | null;
          created_via: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          currency?: string;
          category_id: string;
          description: string;
          source?: string | null;
          date?: string;
          is_subscription?: boolean;
          subscription_id?: string | null;
          created_via?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          currency?: string;
          category_id?: string;
          description?: string;
          source?: string | null;
          date?: string;
          is_subscription?: boolean;
          subscription_id?: string | null;
          created_via?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          currency: string;
          category_id: string;
          billing_cycle: string;
          billing_day: number | null;
          next_billing_date: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          currency?: string;
          category_id: string;
          billing_cycle?: string;
          billing_day?: number | null;
          next_billing_date: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          currency?: string;
          category_id?: string;
          billing_cycle?: string;
          billing_day?: number | null;
          next_billing_date?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          currency: string;
          period: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          currency?: string;
          period?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          amount?: number;
          currency?: string;
          period?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_category_overrides: {
        Row: {
          id: string;
          user_id: string;
          keyword: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          keyword: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          keyword?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_category_overrides_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_category_overrides_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type AICategoryOverride = Database["public"]["Tables"]["ai_category_overrides"]["Row"];
