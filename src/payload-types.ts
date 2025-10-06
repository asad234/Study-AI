// src/payload-types.ts

// Base type from Payload
export interface TypeWithID {
  id: string
  createdAt: string
  updatedAt: string
}

// Users collection
export interface User extends TypeWithID {
  name?: string
  email: string
  password: string
  roles: ('admin' | 'user')[]
  subscription_status?: 'active' | 'inactive' | 'canceled'
}

// Media collection (images, videos, pdfs, docs, pptx)
export interface Media extends TypeWithID {
  filename: string
  mimeType: string // 'image/png', 'video/mp4', 'application/pdf', etc.
  url?: string
  alt?: string
  width?: number
  height?: number
  filesize: number
}

// Documents collection
export interface Document extends TypeWithID {
  file_type: string
  file_name: string
  file_size: any
  user: any
  media_file: any
  title: string
  content?: any
  media?: Media[]
  author?: User
}

// Categories collection
export interface Category extends TypeWithID {
  name: string
  slug: string
}

// Posts collection
export interface Post extends TypeWithID {
  title: string
  slug: string
  content?: any
  author?: User
  _status?: 'published' | 'draft'
}

// Pages collection
export interface Page extends TypeWithID {
  title: string
  slug: string
  content?: any
  _status?: 'published' | 'draft'
}

// Flashcards collection
export interface Flashcard extends TypeWithID {
  document: Document | string
  user: User | string
  question: string
  answer: string
  difficulty?: 'easy' | 'medium' | 'hard'
  subject?: string
  tags?: string[]
  mastered?: boolean
  review_count?: number
  last_reviewed?: string
  next_review?: string
}

// Quiz collection
export interface Quiz extends TypeWithID {
  user: User | string
  document: Document | string
  title: string
  description?: string
  questions: any[] // can be array of question objects
  settings?: any
  created_at: string
  updated_at: string
}

export interface QuizAttempt extends TypeWithID {
  quiz: Quiz | string
  user: User | string
  answers: any[] // JSON array of answers
  score?: number
  total_questions?: number
  time_taken?: number
  completed_at?: string
  created_at: string
}

// Exams collection
export interface Exam extends TypeWithID {
  user: User | string
  title: string
  description?: string
  subject?: string
  duration?: number
  total_marks?: number
  visibility?: string
  created_at: string
  updated_at: string
}

export interface ExamQuestion extends TypeWithID {
  exam: Exam | string
  question: string
  options: any[]
  correct_answer: string
  marks?: number
  created_at: string
  updated_at: string
}

export interface ExamAttempt extends TypeWithID {
  exam: Exam | string
  user: User | string
  answers: any[]
  score?: number
  started_at?: string
  completed_at?: string
}

// AI Chat collections
export interface ChatConversation extends TypeWithID {
  user: User | string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage extends TypeWithID {
  conversation: ChatConversation | string
  user: User | string
  role: 'user' | 'assistant'
  content: string
  metadata?: any
  created_at: string
}
