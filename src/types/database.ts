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
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          date: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          date?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      costs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          date: string;
          category: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          date: string;
          category?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          date?: string;
          category?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      collar_products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          selling_price: number;
          cost_type: "manual" | "calculated";
          manual_cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          selling_price: number;
          cost_type: "manual" | "calculated";
          manual_cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          selling_price?: number;
          cost_type?: "manual" | "calculated";
          manual_cost?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      collar_product_components: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          unit_cost: number;
          quantity_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          unit_cost: number;
          quantity_used: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          unit_cost?: number;
          quantity_used?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collar_product_components_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "collar_products";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          date: string;
          category: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          date: string;
          category?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          date?: string;
          category?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          date: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          date?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      financial_settings: {
        Row: {
          id: string;
          user_id: string;
          fixed_amount_to_keep: number;
          withdrawal_percentage: number;
          savings_percentage: number;
          start_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fixed_amount_to_keep: number;
          withdrawal_percentage: number;
          savings_percentage: number;
          start_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fixed_amount_to_keep?: number;
          withdrawal_percentage?: number;
          savings_percentage?: number;
          start_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
