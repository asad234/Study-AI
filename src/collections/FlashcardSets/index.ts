import type { CollectionConfig } from "payload"

export const FlashcardSets: CollectionConfig = {
  slug: "flashcard-sets",
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    defaultColumns: ["name", "status", "cardCount", "createdAt"],
    useAsTitle: "name",
    description: "Collections of flashcards grouped together",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: { description: "Name of the flashcard set (e.g., 'Spanish Vocabulary')" },
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "profiles",
      required: true,
      admin: { description: "Owner of the flashcard set" },
    },
    {
      name: "project",
      type: "relationship",
      relationTo: "projects",
      admin: { description: "Associated project (optional)" },
    },
    {
      name: "flashcards",
      type: "relationship",
      relationTo: "flashcards",
      hasMany: true,
      admin: { description: "Flashcards included in this set" },
    },
    {
      name: "cardCount",
      type: "number",
      defaultValue: 0,
      admin: { 
        description: "Total number of cards (auto-calculated)",
        readOnly: true,
      },
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Active", value: "active" },
        { label: "Completed", value: "completed" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "active",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      admin: { description: "Optional description of what this set covers" },
    },
    {
      name: "subject",
      type: "text",
      admin: { description: "Subject category (e.g., 'Math', 'Spanish', 'History')" },
    },
    {
      name: "tags",
      type: "array",
      fields: [{ name: "tag", type: "text" }],
      admin: { description: "Tags for organization and filtering" },
    },
    {
      name: "lastStudied",
      type: "date",
      admin: { description: "Last time this set was studied" },
    },
    {
      name: "studyCount",
      type: "number",
      defaultValue: 0,
      admin: { description: "Number of times this set has been studied" },
    },
    {
      name: "masteryPercentage",
      type: "number",
      defaultValue: 0,
      admin: { 
        description: "Percentage of cards mastered (0-100)",
        condition: (data) => data.cardCount > 0,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-update cardCount when flashcards array changes
        if (data.flashcards && Array.isArray(data.flashcards)) {
          data.cardCount = data.flashcards.length
          
          // Calculate mastery percentage if we have flashcards
          if (data.flashcards.length > 0 && operation === 'update') {
            try {
              // Fetch flashcard details to calculate mastery
              const flashcardDocs = await req.payload.find({
                collection: 'flashcards',
                where: {
                  id: {
                    in: data.flashcards,
                  },
                },
                limit: 1000,
              })
              
              const masteredCount = flashcardDocs.docs.filter(
                (card: any) => card.mastered === true
              ).length
              
              data.masteryPercentage = Math.round(
                (masteredCount / flashcardDocs.docs.length) * 100
              )
            } catch (error) {
              console.error('Error calculating mastery percentage:', error)
            }
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
}