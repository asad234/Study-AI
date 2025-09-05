import { z } from "zod"

// --- Enum Constants ---
const difficultyLevels = ["Easy", "Medium", "Hard"] as const
const cardTypes = ["Definition", "Concept", "Formula", "Process", "Example", "Comparison"] as const
const subjects = [
  "Mathematics",
  "Science",
  "History",
  "Literature",
  "Language",
  "Business",
  "Technology",
  "Medicine",
  "Law",
  "General",
] as const

// --- Individual Flashcard Schema ---
export const FlashcardSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  difficulty: z.enum(difficultyLevels),
  subject: z.enum(subjects),
  cardType: z.enum(cardTypes),
  explanation: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  sourceContext: z.string().nullable().optional(), // Context from the document where this was derived
})

// --- Flashcards Collection Schema ---
export const FlashcardsCollectionSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(1, "At least one flashcard is required"),
  documentTitle: z.string().nullable().optional(),
  totalCards: z.number().min(1),
  subjects: z.array(z.enum(subjects)),
  difficultyDistribution: z.object({
    easy: z.number().min(0),
    medium: z.number().min(0),
    hard: z.number().min(0),
  }),
})

export type Flashcard = z.infer<typeof FlashcardSchema>
export type FlashcardsCollection = z.infer<typeof FlashcardsCollectionSchema>
