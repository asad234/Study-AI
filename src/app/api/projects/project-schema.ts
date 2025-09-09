import { z } from "zod"

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  category: z
    .enum(["mathematics", "science", "history", "literature", "computer_science", "languages", "business", "other"])
    .optional(),
  study_goal: z.enum(["exam_preparation", "course_completion", "general_knowledge", "skill_development"]).optional(),
  target_date: z.string().optional(),
  estimated_hours: z.number().optional(),
  document_ids: z
    .array(z.union([z.string(), z.number()]))
    .transform((ids) => ids.map((id) => String(id)))
    .optional(),
})

export const UpdateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").optional(),
  description: z.string().optional(),
  category: z
    .enum(["mathematics", "science", "history", "literature", "computer_science", "languages", "business", "other"])
    .optional(),
  study_goal: z.enum(["exam_preparation", "course_completion", "general_knowledge", "skill_development"]).optional(),
  status: z.enum(["active", "in_progress", "completed", "on_hold"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  target_date: z.string().optional(),
  estimated_hours: z.number().optional(),
  document_ids: z
    .array(z.union([z.string(), z.number()]))
    .transform((ids) => ids.map((id) => String(id)))
    .optional(),
})

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
