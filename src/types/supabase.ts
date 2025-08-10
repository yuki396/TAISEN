export type Database = {
  public: {
    Tables: {
      fight_cards: {
        Row: {
          created_at: string | null
          created_by: string
          fighter1_id: number
          fighter1_votes: number | null
          fighter2_id: number
          fighter2_votes: number | null
          id: number
          organization_id: number | null
          popularity_votes: number | null
          updated_at: string | null
          weight_class_id: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          fighter1_id: number
          fighter1_votes?: number | null
          fighter2_id: number
          fighter2_votes?: number | null
          id?: number
          organization_id?: number | null
          popularity_votes?: number | null
          updated_at?: string | null
          weight_class_id?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          fighter1_id?: number
          fighter1_votes?: number | null
          fighter2_id?: number
          fighter2_votes?: number | null
          id?: number
          organization_id?: number | null
          popularity_votes?: number | null
          updated_at?: string | null
          weight_class_id?: number | null
        }
      }
      fighters: {
        Row: {
          created_at: string | null
          id: number
          name: string
          gender: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          gender: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          gender?: string
        }
      }
      organizations: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
      }
      votes: {
        Row: {
          created_at: string | null
          fight_card_id: number
          id: number
          user_id: string
          vote_for: number | null
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          fight_card_id: number
          id?: number
          user_id: string
          vote_for?: number | null
          vote_type: string
        }
        Update: {
          created_at?: string | null
          fight_card_id?: number
          id?: number
          user_id?: string
          vote_for?: number | null
          vote_type?: string
        }
      }
      weight_classes: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
      }
    }

  }
}