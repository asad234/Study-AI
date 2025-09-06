import type { CollectionConfig } from "payload"
import { afterQuizChange, afterQuizDelete } from "./hooks/revalidate"

export const Quizzes: CollectionConfig = {
  slug: "quizzes",
  admin: {
    defaultColumns: ["title", "user", "document", "createdAt"],
    useAsTitle: "title",
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
      name: "user",
      type: "relationship",
      relationTo: "profiles",
      required: true,
      admin: { description: "Owner of the quiz" },
    },
    {
      name: "document",
      type: "relationship",
      relationTo: "documents",
      required: true,
      admin: { description: "Source document for quiz" },
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "questions",
      type: "json",
      required: true,
    },
    {
      name: "settings",
      type: "json",
    },
  ],
  hooks: {
    afterChange: [afterQuizChange],
    afterDelete: [afterQuizDelete],
  },
}
