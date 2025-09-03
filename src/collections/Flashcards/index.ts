import type { CollectionConfig } from 'payload';
import { afterFlashcardChange, afterFlashcardDelete } from './hooks/revalidate';

export const Flashcards: CollectionConfig = {
  slug: 'flashcards',
  admin: {
    defaultColumns: ['question', 'answer', 'difficulty', 'mastered', 'review_count'],
    useAsTitle: 'question',
  },
  fields: [
    {
      name: 'document',
      type: 'relationship',
      relationTo: 'documents', // must match Documents.slug
      required: true,
      admin: { description: 'References the source document' },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'profiles', // must match Profiles.slug
      required: true,
      admin: { description: 'Owner of the flashcard' },
    },
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'text', required: true },
    {
      name: 'difficulty',
      type: 'select',
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Medium', value: 'medium' },
        { label: 'Hard', value: 'hard' },
      ],
    },
    { name: 'subject', type: 'text' },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
      admin: { description: 'List of tags for categorization' },
    },
    { name: 'mastered', type: 'checkbox', defaultValue: false },
    { name: 'review_count', type: 'number', defaultValue: 0 },
    { name: 'last_reviewed', type: 'date' },
    { name: 'next_review', type: 'date' },
    { name: 'created_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'updated_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
  ],
  hooks: {
    afterChange: [afterFlashcardChange],
    afterDelete: [afterFlashcardDelete],
  },
};
