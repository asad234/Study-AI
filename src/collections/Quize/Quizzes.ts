import type { CollectionConfig } from 'payload';
import { afterQuizChange, afterQuizDelete } from './hooks/revalidate';

// ✅ Quizzes Collection
export const Quizzes: CollectionConfig = {
  slug: 'quizzes',
  admin: {
    defaultColumns: ['title', 'user', 'document', 'created_at'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'profiles',
      required: true,
      admin: { description: 'Owner of the quiz' },
    },
    {
      name: 'document',
      type: 'relationship',
      relationTo: 'documents',
      required: true,
      admin: { description: 'Source document for quiz' },
    },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'questions', type: 'json', required: true },
    { name: 'settings', type: 'json' },
    { name: 'created_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'updated_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
  ],
  hooks: {
    afterChange: [afterQuizChange],
    afterDelete: [afterQuizDelete],
  },
};
