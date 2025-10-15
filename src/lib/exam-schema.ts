import { z } from "zod"

export const ExamQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple-choice", "true-false", "written", "multiple-select"]),
  question: z.string(),
  options: z.array(z.string()).optional().nullable(), // For multiple-choice and multiple-select
  correctAnswer: z.union([
    z.number(), // For multiple-choice and true-false (0 or 1)
    z.array(z.number()), // For multiple-select
    z.string(), // For written answers
  ]),
  explanation: z.string(),
  category: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  marks: z.number().default(1), // Changed from points to marks
})

export const ExamSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  subject: z.string().optional(),
  duration: z.number(), // in minutes
  total_marks: z.number(), // Changed from totalPoints
  visibility: z.enum(["public", "private"]).default("private"),
  questions: z.array(ExamQuestionSchema),
  passingScore: z.number().optional().default(60), // percentage - made optional with default
  settings: z
    .object({
      shuffleQuestions: z.boolean().default(false),
      shuffleOptions: z.boolean().default(false),
      showExplanations: z.boolean().default(true),
    })
    .optional()
    .default({
      shuffleQuestions: false,
      shuffleOptions: false,
      showExplanations: true,
    }),
})

export const ExamGenerationSchema = z.object({
  documentIds: z.array(z.string()),
  projectIds: z.array(z.string()).optional(),
  questionCount: z.number().min(5).max(50).default(20),
  difficulties: z.array(z.enum(["easy", "medium", "hard"])),
  duration: z.number().default(3600), // 1 hour default
  questionTypes: z.array(z.enum(["multiple-choice", "true-false", "written", "multiple-select"])),
})

// ✅ FIXED: Allow null for unanswered questions
export const ExamAttemptAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.union([
    z.number(), 
    z.array(z.number()), 
    z.string(), 
    z.null() // ← ADDED: Allow null for unanswered questions
  ]),
  timeSpent: z.number(),
})

export const ExamAttemptSchema = z.object({
  examId: z.string(),
  answers: z.array(ExamAttemptAnswerSchema),
  totalTime: z.number(),
})

export type ExamQuestion = z.infer<typeof ExamQuestionSchema>
export type Exam = z.infer<typeof ExamSchema>
export type ExamGeneration = z.infer<typeof ExamGenerationSchema>
export type ExamAttempt = z.infer<typeof ExamAttemptSchema>
export type ExamAttemptAnswer = z.infer<typeof ExamAttemptAnswerSchema>