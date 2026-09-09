// Hand-written to match supabase/migrations/20260909074810_event_types_and_events.sql.
// Once `supabase login` is set up, regenerate with:
//   supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      event_types: {
        Row: {
          id: string
          user_id: string
          label: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          label: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          created_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          user_id: string
          event_type_id: string
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          event_type_id: string
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type_id?: string
          occurred_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
