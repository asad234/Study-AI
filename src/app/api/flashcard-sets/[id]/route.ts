// File: app/api/flashcard-sets/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params first (Next.js 15 requirement)
    const { id } = await params
    
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const payload = await getPayload({ config })

    // Get user profile
    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!profiles.docs.length) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    const userId = profiles.docs[0].id

    // Fetch the flashcard set
    const flashcardSet = await payload.findByID({
      collection: "flashcard-sets",
      id: id,
    })

    if (!flashcardSet) {
      return NextResponse.json(
        { success: false, error: "Flashcard set not found" },
        { status: 404 }
      )
    }

    // Check if user owns this flashcard set
    const setUserId = typeof flashcardSet.user === 'object' 
      ? flashcardSet.user.id 
      : flashcardSet.user

    if (setUserId !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      flashcardSet: {
        id: flashcardSet.id,
        name: flashcardSet.name,
        cardCount: flashcardSet.cardCount || 0,
        status: flashcardSet.status || "active",
        subject: flashcardSet.subject,
        description: flashcardSet.description,
        createdAt: flashcardSet.createdAt,
      },
    })
  } catch (error) {
    console.error("Error fetching flashcard set:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch flashcard set" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params first (Next.js 15 requirement)
    const { id } = await params
    
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { mastered, review_count, last_reviewed } = body

    const payload = await getPayload({ config })

    // Update the flashcard
    const updatedFlashcard = await payload.update({
      collection: "flashcards",
      id: id,
      data: {
        mastered,
        review_count,
        last_reviewed,
      },
    })

    return NextResponse.json({
      success: true,
      flashcard: updatedFlashcard,
    })
  } catch (error) {
    console.error("Error updating flashcard:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update flashcard" },
      { status: 500 }
    )
  }
}

// DELETE /api/flashcard-sets/[id] - Delete a flashcard set
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params first (Next.js 15 requirement)
    const { id } = await params
    
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const payload = await getPayload({ config })

    // Get user profile
    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!profiles.docs.length) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    const userId = profiles.docs[0].id

    // Fetch the flashcard set to verify ownership
    const flashcardSet = await payload.findByID({
      collection: "flashcard-sets",
      id: id,
    })

    if (!flashcardSet) {
      return NextResponse.json(
        { success: false, error: "Flashcard set not found" },
        { status: 404 }
      )
    }

    // Check if user owns this flashcard set
    const setUserId = typeof flashcardSet.user === 'object' 
      ? flashcardSet.user.id 
      : flashcardSet.user

    if (setUserId !== userId) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to delete this flashcard set" },
        { status: 403 }
      )
    }

    console.log(`🗑️ Deleting flashcard set: ${flashcardSet.name} (ID: ${id})`)

    // Optional: Unlink flashcards from this set before deletion
    // This prevents orphaned references
    try {
      const flashcardsToUnlink = await payload.find({
        collection: "flashcards",
        where: {
          flashcardSet: { equals: id }
        },
        limit: 1000,
      })

      if (flashcardsToUnlink.docs.length > 0) {
        console.log(`📎 Unlinking ${flashcardsToUnlink.docs.length} flashcard(s) from set...`)
        
        const unlinkPromises = flashcardsToUnlink.docs.map(async (card: any) => {
          try {
            await payload.update({
              collection: "flashcards",
              id: card.id,
              data: {
                flashcardSet: null,
              },
            })
            return { success: true }
          } catch (error) {
            console.error(`Failed to unlink flashcard ${card.id}:`, error)
            return { success: false }
          }
        })

        await Promise.allSettled(unlinkPromises)
        console.log(`✅ Flashcards unlinked from set`)
      }
    } catch (error) {
      console.warn("⚠️ Error unlinking flashcards, proceeding with deletion:", error)
      // Continue with deletion even if unlinking fails
    }

    // Delete the flashcard set
    await payload.delete({
      collection: "flashcard-sets",
      id: id,
    })

    console.log(`✅ Successfully deleted flashcard set: ${id}`)

    return NextResponse.json({
      success: true,
      message: `Flashcard set "${flashcardSet.name}" has been deleted`,
    })
  } catch (error) {
    console.error("❌ Error deleting flashcard set:", error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to delete flashcard set"
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}