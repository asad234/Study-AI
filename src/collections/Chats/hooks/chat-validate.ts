import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload"
import { revalidatePath } from "next/cache"

// Conversation Hooks
export const afterConversationChange: CollectionAfterChangeHook = ({ doc, previousDoc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/chat/${doc.id}`
    revalidatePath(path)
  }
  return doc
}

export const afterConversationDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/chat/${doc?.id}`
    revalidatePath(path)
  }
  return doc
}

// Message Hooks
export const afterMessageChange: CollectionAfterChangeHook = ({ doc, previousDoc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/chat/${doc.conversation}`
    revalidatePath(path)
  }
  return doc
}

export const afterMessageDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/chat/${doc?.conversation}`
    revalidatePath(path)
  }
  return doc
}
