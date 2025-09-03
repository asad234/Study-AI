import type { CollectionConfig } from 'payload';
import { afterExamChange, afterExamDelete } from './hooks/revalidate';

export const Exams: CollectionConfig = {
  slug: 'exams',
  admin: {
    defaultColumns: ['title', 'subject', 'total_marks', 'duration'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'profiles',
      required: true,
      admin: { description: 'Owner of the exam' },
    },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'subject', type: 'text' },
    { name: 'duration', type: 'number' },
    { name: 'total_marks', type: 'number' },
    {
      name: 'visibility',
      type: 'select',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Private', value: 'private' },
      ],
      defaultValue: 'private',
    },
    { name: 'created_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'updated_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
  ],
  hooks: {
    afterChange: [afterExamChange],
    afterDelete: [afterExamDelete],
  },
};
