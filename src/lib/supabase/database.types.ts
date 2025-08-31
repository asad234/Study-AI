export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "student" | "admin" | "instructor"
          subscription_plan: "free" | "pro" | "premium"
          subscription_status: "active" | "inactive" | "cancelled" | "past_due"
          subscription_id: string | null
          customer_id: string | null
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "student" | "admin" | "instructor"
          subscription_plan?: "free" | "pro" | "premium"
          subscription_status?: "active" | "inactive" | "cancelled" | "past_due"
          subscription_id?: string | null
          customer_id?: string | null
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "student" | "admin" | "instructor"
          subscription_plan?: "free" | "pro" | "premium"
          subscription_status?: "active" | "inactive" | "cancelled" | "past_due"
          subscription_id?: string | null
          customer_id?: string | null
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          status: "uploading" | "processing" | "completed" | "error"
          processing_progress: number
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          status?: "uploading" | "processing" | "completed" | "error"
          processing_progress?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          status?: "uploading" | "processing" | "completed" | "error"
          processing_progress?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      flashcards: {
        Row: {
          id: string
          document_id: string
          user_id: string
          question: string
          answer: string
          difficulty: "easy" | "medium" | "hard"
          subject: string | null
          tags: string[] | null
          mastered: boolean
          review_count: number
          last_reviewed: string | null
          next_review: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          question: string
          answer: string
          difficulty?: "easy" | "medium" | "hard"
          subject?: string | null
          tags?: string[] | null
          mastered?: boolean
          review_count?: number
          last_reviewed?: string | null
          next_review?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          question?: string
          answer?: string
          difficulty?: "easy" | "medium" | "hard"
          subject?: string | null
          tags?: string[] | null
          mastered?: boolean
          review_count?: number
          last_reviewed?: string | null
          next_review?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          user_id: string
          document_id: string | null
          title: string
          description: string | null
          questions: Json
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id?: string | null
          title: string
          description?: string | null
          questions: Json
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string | null
          title?: string
          description?: string | null
          questions?: Json
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          user_id: string
          answers: Json
          score: number
          total_questions: number
          time_taken: number
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id: string
          answers: Json
          score: number
          total_questions: number
          time_taken: number
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string
          answers?: Json
          score?: number
          total_questions?: number
          time_taken?: number
          completed_at?: string
          created_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          type: "flashcards" | "quiz" | "chat" | "exam"
          duration: number
          items_studied: number
          score: number | null
          metadata: Json | null
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "flashcards" | "quiz" | "chat" | "exam"
          duration: number
          items_studied: number
          score?: number | null
          metadata?: Json | null
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "flashcards" | "quiz" | "chat" | "exam"
          duration?: number
          items_studied?: number
          score?: number | null
          metadata?: Json | null
          completed_at?: string
          created_at?: string
        }
      }
      chat_conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: "user" | "assistant"
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          role: "user" | "assistant"
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: "user" | "assistant"
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      admin_analytics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          dimensions: Json | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          dimensions?: Json | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          dimensions?: Json | null
          recorded_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
