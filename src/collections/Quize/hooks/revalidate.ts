import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

export const afterQuizChange: CollectionAfterChangeHook = ({ doc, previousDoc, req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    revalidatePath(`/quizzes/${doc.id}`)
    revalidateTag('quizzes-sitemap')
  }
  return doc
}

export const afterQuizDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidatePath(`/quizzes/${doc?.id}`)
    revalidateTag('quizzes-sitemap')
  }
  return doc
}

export const afterQuizAttemptChange: CollectionAfterChangeHook = ({ doc }) => {
  return doc
}

export const afterQuizAttemptDelete: CollectionAfterDeleteHook = ({ doc }) => {
  return doc
}
