// In collections/Flashcards/index.ts
// Replace your entire hooks section with this:

import type { CollectionConfig } from "payload"
import { afterFlashcardChange, afterFlashcardDelete } from "./hooks/revalidate"

export const Flashcards: CollectionConfig = {
  slug: "flashcards",
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
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
    {
      name: "flashcardSet",
      type: "relationship",
      relationTo: "flashcard-sets",
      admin: { description: "The set this flashcard belongs to (optional)" },
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
    afterChange: [
      afterFlashcardChange,
      // ✅ REMOVED: The problematic hook that was causing DB errors
      // Mastery percentage will be calculated on-demand instead
    ],
    afterDelete: [afterFlashcardDelete],
  },
  timestamps: true,
}