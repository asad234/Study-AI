import type { CollectionConfig } from 'payload';
import { afterExamQuestionChange, afterExamQuestionDelete } from './hooks/revalidate';

export const ExamQuestions: CollectionConfig = {
  slug: 'exam_questions',
  admin: {
    defaultColumns: ['exam', 'question', 'marks'],
    useAsTitle: 'question',
  },
  fields: [
    {
      name: 'exam',
      type: 'relationship',
      relationTo: 'exams',
      required: true,
      admin: { description: 'The exam this question belongs to' },
    },
    { name: 'question', type: 'text', required: true },
    {
      name: 'options',
      type: 'json',
      admin: { description: 'List of answer options in JSON format' },
    },
    { name: 'correct_answer', type: 'text', required: true },
    { name: 'marks', type: 'number', required: true, defaultValue: 1 },
    { name: 'created_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'updated_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
  ],
  hooks: {
    afterChange: [afterExamQuestionChange],
    afterDelete: [afterExamQuestionDelete],
  },
};
