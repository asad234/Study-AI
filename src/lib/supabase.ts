import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  name: string
  file_path: string
  file_type: string
  file_size: number
  status: "uploading" | "processing" | "completed" | "error"
  created_at: string
  updated_at: string
}

export interface Flashcard {
  id: string
  document_id: string
  user_id: string
  question: string
  answer: string
  difficulty: "easy" | "medium" | "hard"
  subject: string
  mastered: boolean
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  user_id: string
  title: string
  questions: QuizQuestion[]
  score?: number
  completed_at?: string
  created_at: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
  subject: string
  difficulty: "easy" | "medium" | "hard"
}

export interface StudySession {
  id: string
  user_id: string
  type: "flashcards" | "quiz" | "chat" | "exam"
  duration: number
  score?: number
  completed_at: string
  created_at: string
}
