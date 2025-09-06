import { z } from "zod"

export const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string(),
  subject: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
})

export const QuizGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(QuizQuestionSchema),
  settings: z
    .object({
      timeLimit: z.number().optional(),
      shuffleQuestions: z.boolean().optional(),
      showExplanations: z.boolean().optional(),
    })
    .optional(),
})

export const QuizAttemptSchema = z.object({
  quizId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswer: z.number(),
      timeSpent: z.number(),
    }),
  ),
  totalTime: z.number(),
})

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>
export type QuizGeneration = z.infer<typeof QuizGenerationSchema>
export type QuizAttempt = z.infer<typeof QuizAttemptSchema>
