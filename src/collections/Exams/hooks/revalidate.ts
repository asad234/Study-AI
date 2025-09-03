import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';
import { revalidatePath, revalidateTag } from 'next/cache';

// Exams Hooks
export const afterExamChange: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidatePath('/exams');
    revalidateTag('exams-sitemap');
  }
  return doc;
};

export const afterExamDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidatePath('/exams');
    revalidateTag('exams-sitemap');
  }
  return doc;
};

// ExamAttempts Hooks
export const afterExamAttemptChange: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidatePath(`/exams/${doc.exam}`);
  }
  return doc;
};

export const afterExamAttemptDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidatePath(`/exams/${doc.exam}`);
  }
  return doc;
};

// ExamQuestions Hooks
export const afterExamQuestionChange: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidatePath(`/exams/${doc.exam}`);
  }
  return doc;
};

export const afterExamQuestionDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidatePath(`/exams/${doc.exam}`);
  }
  return doc;
};
