import { z } from "zod"

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content is required"),
  metadata: z
    .object({
      relatedFiles: z.array(z.string()).optional(),
      confidence: z.number().min(0).max(1).optional(),
      sources: z.array(z.string()).optional(),
    })
    .optional(),
})

export const ChatResponseSchema = z.object({
  message: ChatMessageSchema,
  suggestedQuestions: z.array(z.string()).optional(),
  relatedDocuments: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        relevance: z.number().min(0).max(1),
      }),
    )
    .optional(),
})

export const SuggestedQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      category: z.enum(["concept", "practice", "summary", "analysis"]),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      relatedTopics: z.array(z.string()).optional(),
    }),
  ),
})

export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type ChatResponse = z.infer<typeof ChatResponseSchema>
export type SuggestedQuestions = z.infer<typeof SuggestedQuestionsSchema>
