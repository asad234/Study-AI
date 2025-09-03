import type { CollectionConfig } from 'payload';
import { afterExamAttemptChange, afterExamAttemptDelete } from './hooks/revalidate';

export const ExamAttempts: CollectionConfig = {
  slug: 'exam_attempts',
  admin: {
    defaultColumns: ['exam', 'user', 'score', 'completed_at'],
  },
  fields: [
    {
      name: 'exam',
      type: 'relationship',
      relationTo: 'exams',
      required: true,
      admin: { description: 'Exam being attempted' },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'profiles',
      required: true,
      admin: { description: 'User attempting the exam' },
    },
    { name: 'answers', type: 'json', admin: { description: 'User answers in JSON format' } },
    { name: 'score', type: 'number', defaultValue: 0 },
    { name: 'started_at', type: 'date', defaultValue: () => new Date().toISOString() },
    { name: 'completed_at', type: 'date' },
    { name: 'created_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
  ],
  hooks: {
    afterChange: [afterExamAttemptChange],
    afterDelete: [afterExamAttemptDelete],
  },
};
