import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'
import type { Flashcard } from '@/payload-types'

// ✅ After a flashcard is created or updated
export const afterFlashcardChange: CollectionAfterChangeHook<Flashcard> = ({ doc, previousDoc, req: { payload, context } }) => {
  // Example: log changes
  payload.logger.info(`Flashcard ${doc.id} updated by user ${doc.user}`)

  // Revalidate cache or tags if needed
  if (!context.disableRevalidate) {
    revalidateTag('flashcards-cache')
  }

  // You can also handle old data if needed
  if (previousDoc && previousDoc.mastered !== doc.mastered) {
    payload.logger.info(`Flashcard ${doc.id} mastered status changed: ${previousDoc.mastered} -> ${doc.mastered}`)
  }

  return doc
}

// ✅ After a flashcard is deleted
export const afterFlashcardDelete: CollectionAfterDeleteHook<Flashcard> = ({ doc, req: { payload, context } }) => {
  payload.logger.info(`Flashcard ${doc.id} deleted by user ${doc.user}`)

  if (!context.disableRevalidate) {
    revalidateTag('flashcards-cache')
  }

  return doc
}
