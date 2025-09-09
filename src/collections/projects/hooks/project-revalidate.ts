import { revalidatePath } from "next/cache"
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload"

export const afterProjectChange: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  try {
    // Revalidate projects page
    revalidatePath("/dashboard/projects")
    revalidatePath("/dashboard")

    console.log(`Project ${operation}: ${doc.name}`)
  } catch (error) {
    console.error("Error revalidating after project change:", error)
  }
}

export const afterProjectDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  try {
    // Revalidate projects page
    revalidatePath("/dashboard/projects")
    revalidatePath("/dashboard")

    console.log(`Project deleted: ${doc.name}`)
  } catch (error) {
    console.error("Error revalidating after project delete:", error)
  }
}
