import type { CollectionConfig } from 'payload';
import { afterQuizAttemptChange, afterQuizAttemptDelete } from './hooks/revalidate';

// ✅ Quiz Attempts Collection
export const QuizAttempts: CollectionConfig = {
  slug: 'quiz-attempts',
  admin: {
    defaultColumns: ['quiz', 'user', 'score', 'completed_at'],
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'quiz',
      type: 'relationship',
      relationTo: 'quizzes',
      required: true,
      admin: { description: 'Quiz reference' },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'profiles',
      required: true,
      admin: { description: 'User taking the quiz' },
    },
    { name: 'answers', type: 'json', required: true },
    { name: 'score', type: 'number' },
    { name: 'total_questions', type: 'number' },
    { name: 'time_taken', type: 'number', admin: { description: 'Seconds or minutes' } },
    { name: 'completed_at', type: 'date' },
    { name: 'created_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
  ],
  hooks: {
    afterChange: [afterQuizAttemptChange],
    afterDelete: [afterQuizAttemptDelete],
  },
};
