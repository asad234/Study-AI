import type { CollectionConfig } from "payload"
import { afterQuizAttemptChange, afterQuizAttemptDelete } from "./hooks/revalidate"

export const QuizAttempts: CollectionConfig = {
  slug: "quiz-attempts",
  admin: {
    defaultColumns: ["quiz", "user", "score", "createdAt"],
    useAsTitle: "id",
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) {
        return {
          user: {
            equals: user.id,
          },
        }
      }
      return false
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (user) {
        return {
          user: {
            equals: user.id,
          },
        }
      }
      return false
    },
    delete: ({ req: { user } }) => {
      if (user) {
        return {
          user: {
            equals: user.id,
          },
        }
      }
      return false
    },
  },
  fields: [
    {
      name: "quiz",
      type: "relationship",
      relationTo: "quizzes",
      required: true,
      admin: { description: "Quiz reference" },
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "profiles",
      required: true,
      admin: { description: "User taking the quiz" },
    },
    {
      name: "answers",
      type: "json",
      required: true,
    },
    {
      name: "score",
      type: "number",
    },
    {
      name: "total_questions",
      type: "number",
    },
    {
      name: "time_taken",
      type: "number",
      admin: { description: "Time in seconds" },
    },
    {
      name: "completed_at",
      type: "date",
    },
  ],
  hooks: {
    afterChange: [afterQuizAttemptChange],
    afterDelete: [afterQuizAttemptDelete],
  },
}
