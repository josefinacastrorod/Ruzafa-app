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
