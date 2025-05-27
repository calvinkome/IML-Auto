export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'admin';
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'user' | 'admin';
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'user' | 'admin';
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          name: string;
          category: string;
          price: number;
          image: string | null;
          description: string | null;
          features: Json | null;
          specifications: Json | null;
          market_segment: string | null;
          advantages: string[] | null;
          disadvantages: string[] | null;
          common_uses: string[] | null;
          rating: number | null;
          reviews: number | null;
          available: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          vin: string | null;
          current_status_id: string | null;
          // New rental-specific fields
          daily_rate: number | null;
          rental_status:
            | 'available'
            | 'rented'
            | 'maintenance'
            | 'retired'
            | null;
          make: string | null;
          model: string | null;
          year: number | null;
          color: string | null;
          license_plate: string | null;
          location: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          price: number;
          image?: string | null;
          description?: string | null;
          features?: Json | null;
          specifications?: Json | null;
          market_segment?: string | null;
          advantages?: string[] | null;
          disadvantages?: string[] | null;
          common_uses?: string[] | null;
          rating?: number | null;
          reviews?: number | null;
          available?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          vin?: string | null;
          current_status_id?: string | null;
          daily_rate?: number | null;
          rental_status?:
            | 'available'
            | 'rented'
            | 'maintenance'
            | 'retired'
            | null;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          color?: string | null;
          license_plate?: string | null;
          location?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          price?: number;
          image?: string | null;
          description?: string | null;
          features?: Json | null;
          specifications?: Json | null;
          market_segment?: string | null;
          advantages?: string[] | null;
          disadvantages?: string[] | null;
          common_uses?: string[] | null;
          rating?: number | null;
          reviews?: number | null;
          available?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          vin?: string | null;
          current_status_id?: string | null;
          daily_rate?: number | null;
          rental_status?:
            | 'available'
            | 'rented'
            | 'maintenance'
            | 'retired'
            | null;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          color?: string | null;
          license_plate?: string | null;
          location?: string | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          start_date: string;
          end_date: string;
          pickup_location: string | null;
          dropoff_location: string | null;
          total_amount: number;
          booking_status:
            | 'pending'
            | 'confirmed'
            | 'active'
            | 'completed'
            | 'cancelled';
          special_requests: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          start_date: string;
          end_date: string;
          pickup_location?: string | null;
          dropoff_location?: string | null;
          total_amount: number;
          booking_status?:
            | 'pending'
            | 'confirmed'
            | 'active'
            | 'completed'
            | 'cancelled';
          special_requests?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vehicle_id?: string;
          start_date?: string;
          end_date?: string;
          pickup_location?: string | null;
          dropoff_location?: string | null;
          total_amount?: number;
          booking_status?:
            | 'pending'
            | 'confirmed'
            | 'active'
            | 'completed'
            | 'cancelled';
          special_requests?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          refresh_token: string | null;
          user_agent: string | null;
          ip_address: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          refresh_token?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          refresh_token?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
          expires_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      auth_attempts: {
        Row: {
          id: string;
          email: string;
          ip_address: string | null;
          success: boolean;
          attempt_count: number;
          last_attempt: string;
          blocked_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          ip_address?: string | null;
          success?: boolean;
          attempt_count?: number;
          last_attempt?: string;
          blocked_until?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          ip_address?: string | null;
          success?: boolean;
          attempt_count?: number;
          last_attempt?: string;
          blocked_until?: string | null;
          created_at?: string;
        };
      };
      error_logs: {
        Row: {
          id: string;
          error_message: string;
          error_detail: string | null;
          error_context: string | null;
          registration_context: Json | null;
          stack_trace: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          error_message: string;
          error_detail?: string | null;
          error_context?: string | null;
          registration_context?: Json | null;
          stack_trace?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          error_message?: string;
          error_detail?: string | null;
          error_context?: string | null;
          registration_context?: Json | null;
          stack_trace?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'user' | 'admin';
      vehicle_status: 'available' | 'rented' | 'maintenance' | 'retired';
      booking_status:
        | 'pending'
        | 'confirmed'
        | 'active'
        | 'completed'
        | 'cancelled';
    };
  };
}
