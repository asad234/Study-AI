// app/api/flashcard-sets/[id]/flashcards/route.ts
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

    // First verify the set exists and user owns it
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

    // Check ownership
    const setUserId = typeof flashcardSet.user === 'object' 
      ? flashcardSet.user.id 
      : flashcardSet.user

    if (setUserId !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    // Get all flashcards that belong to this set
    const flashcards = await payload.find({
      collection: "flashcards",
      where: {
        flashcardSet: { equals: id }
      },
      limit: 1000,
      sort: "createdAt",
    })

    // Format flashcards for the study component
    const formattedFlashcards = flashcards.docs.map((card: any) => ({
      id: card.id.toString(),
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty,
      subject: card.subject,
      mastered: card.mastered || false,
      review_count: card.review_count || 0,
      last_reviewed: card.last_reviewed,
    }))

    return NextResponse.json({
      success: true,
      flashcards: formattedFlashcards,
      totalCards: formattedFlashcards.length,
    })
  } catch (error) {
    console.error("Error fetching flashcards:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch flashcards" },
      { status: 500 }
    )
  }
}