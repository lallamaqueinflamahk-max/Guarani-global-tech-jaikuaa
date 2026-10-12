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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      corpus_sentence_words: {
        Row: {
          created_at: string
          id: string
          position: number
          sentence_id: string
          token: string
          word_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          position: number
          sentence_id: string
          token: string
          word_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          sentence_id?: string
          token?: string
          word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corpus_sentence_words_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "corpus_sentences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corpus_sentence_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "corpus_words"
            referencedColumns: ["id"]
          },
        ]
      }
      corpus_sentences: {
        Row: {
          created_at: string
          es: string
          gn: string
          id: string
          level_id: string | null
          notes: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          es: string
          gn: string
          id?: string
          level_id?: string | null
          notes?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          es?: string
          gn?: string
          id?: string
          level_id?: string | null
          notes?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corpus_sentences_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "mec_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      corpus_word_levels: {
        Row: {
          created_at: string
          id: string
          level_id: string
          unit: string
          word_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_id: string
          unit?: string
          word_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: string
          unit?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corpus_word_levels_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "mec_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corpus_word_levels_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "corpus_words"
            referencedColumns: ["id"]
          },
        ]
      }
      corpus_words: {
        Row: {
          audio_slug: string
          created_at: string
          es: string
          gn: string
          has_audio: boolean
          id: string
          notes: string
          status: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          audio_slug: string
          created_at?: string
          es: string
          gn: string
          has_audio?: boolean
          id?: string
          notes?: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          audio_slug?: string
          created_at?: string
          es?: string
          gn?: string
          has_audio?: boolean
          id?: string
          notes?: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corpus_words_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mec_capacities: {
        Row: {
          axis: string
          capacity_gn: string
          code: string
          contents_es: string
          created_at: string
          level_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          axis: string
          capacity_gn: string
          code: string
          contents_es: string
          created_at?: string
          level_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          axis?: string
          capacity_gn?: string
          code?: string
          contents_es?: string
          created_at?: string
          level_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mec_capacities_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "mec_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      mec_levels: {
        Row: {
          created_at: string
          id: string
          label: string
          sort_order: number
          stage: string
          units: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          label: string
          sort_order?: number
          stage: string
          units?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          stage?: string
          units?: Json
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trivia_categories: {
        Row: {
          created_at: string
          emoji: string
          id: string
          sort_order: number
          subtitle: string
          title: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id: string
          sort_order?: number
          subtitle: string
          title: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          sort_order?: number
          subtitle?: string
          title?: string
        }
        Relationships: []
      }
      trivia_question_awards: {
        Row: {
          answered_correctly: boolean
          awarded_date: string
          created_at: string
          question_id: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          answered_correctly?: boolean
          awarded_date?: string
          created_at?: string
          question_id: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          answered_correctly?: boolean
          awarded_date?: string
          created_at?: string
          question_id?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "trivia_question_awards_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trivia_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_questions: {
        Row: {
          category_id: string
          correct_index: number
          created_at: string
          explanation: string
          id: string
          options: Json
          question: string
          sort_order: number
        }
        Insert: {
          category_id: string
          correct_index: number
          created_at?: string
          explanation?: string
          id?: string
          options: Json
          question: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          correct_index?: number
          created_at?: string
          explanation?: string
          id?: string
          options?: Json
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "trivia_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "trivia_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_sessions: {
        Row: {
          abandoned_at: string | null
          best_streak: number
          category_id: string
          completed_at: string | null
          correct_count: number
          created_at: string
          current_idx: number
          current_streak: number
          id: string
          is_practice: boolean
          question_ids: string[]
          question_started_at: string | null
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          abandoned_at?: string | null
          best_streak?: number
          category_id: string
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          current_idx?: number
          current_streak?: number
          id?: string
          is_practice?: boolean
          question_ids: string[]
          question_started_at?: string | null
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          abandoned_at?: string | null
          best_streak?: number
          category_id?: string
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          current_idx?: number
          current_streak?: number
          id?: string
          is_practice?: boolean
          question_ids?: string[]
          question_started_at?: string | null
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "trivia_sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "trivia_categories"
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
      user_stats: {
        Row: {
          badges: Json
          created_at: string
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          badges?: Json
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          badges?: Json
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json
          question_id: string | null
          session_id: string | null
          source: string
          source_ref: string | null
          sync_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json
          question_id?: string | null
          session_id?: string | null
          source: string
          source_ref?: string | null
          sync_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          question_id?: string | null
          session_id?: string | null
          source?: string
          source_ref?: string | null
          sync_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trivia_questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
