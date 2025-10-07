import type { CollectionConfig } from "payload"

export const ExamAttempts: CollectionConfig = {
  slug: "exam_attempts",
  timestamps: true, // Change this to true
  admin: {
    defaultColumns: ["exam", "user", "score", "completed_at"],
    useAsTitle: "exam",
  },
  fields: [
    {
      name: "exam",
      type: "relationship",
      relationTo: "exams",
      required: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "profiles",
      required: true,
    },
    { name: "answers", type: "json", required: true },
    { name: "score", type: "number", required: true },
    { name: "started_at", type: "date", required: true },
    { name: "completed_at", type: "date", required: true },
    // Remove created_at and updated_at fields since timestamps:true handles them
  ],
}