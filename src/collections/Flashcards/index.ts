import type { CollectionConfig } from "payload"
import { afterFlashcardChange, afterFlashcardDelete } from "./hooks/revalidate"

export const Flashcards: CollectionConfig = {
  slug: "flashcards",
  access: {
    read: () => true, // Allow reading flashcards (filtering handled in API)
    create: () => true, // Allow creating flashcards (user validation in API)
    update: () => true, // Allow updating flashcards (user validation in API)
    delete: () => true, // Allow deleting flashcards (user validation in API)
  },
  admin: {
    defaultColumns: ["question", "answer", "difficulty", "mastered", "review_count"],
    useAsTitle: "question",
  },
  fields: [
    {
      name: "document",
      type: "relationship",
      relationTo: "documents",
      required: true,
      admin: { description: "References the source document" },
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "profiles",
      required: true,
      admin: { description: "Owner of the flashcard" },
    },
    { name: "question", type: "text", required: true },
    { name: "answer", type: "text", required: true },
    {
      name: "difficulty",
      type: "select",
      options: [
        { label: "Easy", value: "easy" },
        { label: "Medium", value: "medium" },
        { label: "Hard", value: "hard" },
      ],
    },
    { name: "subject", type: "text" },
    {
      name: "tags",
      type: "array",
      fields: [{ name: "tag", type: "text" }],
      admin: { description: "List of tags for categorization" },
    },
    { name: "mastered", type: "checkbox", defaultValue: false },
    { name: "review_count", type: "number", defaultValue: 0 },
    { name: "last_reviewed", type: "date" },
    { name: "next_review", type: "date" },
  ],
  hooks: {
    afterChange: [afterFlashcardChange],
    afterDelete: [afterFlashcardDelete],
  },
  timestamps: true,
}
