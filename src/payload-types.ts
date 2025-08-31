// src/payload-types.ts
import { TypeWithID } from 'payload';

export interface User extends TypeWithID {
  name?: string;
  email: string;
  password: string;
  roles: ('admin' | 'user')[];
  subscription_status?: 'active' | 'inactive' | 'canceled';
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content?: string;
  file?: string;
  author: string | User;
  authors?: (string | User)[];
  populatedAuthors?: {
    id: string;
    name?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  document?: string | Document;
  author: string | User;
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  document?: string | Document;
  author: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  alt: string;
  url?: string;
  filename: string;
  mimeType: string;
  filesize: number;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

// Collection configuration types
export interface Config {
  collections: {
    users: User;
    documents: Document;
    flashcards: Flashcard;
    quizzes: Quiz;
    media: Media;
  };
}

// Remove this problematic line - it's causing the declare error
// declare global {
//   export const payload: import('payload').Payload;
// }

export default Config;