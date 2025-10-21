// app/api/flashcards/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

export const runtime = "nodejs"

// GET single flashcard by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Fetch the flashcard
    const flashcard = await payload.findByID({
      collection: "flashcards",
      id: id,
    })

    if (!flashcard) {
      return NextResponse.json(
        { success: false, error: "Flashcard not found" },
        { status: 404 }
      )
    }

    // Check if user owns this flashcard
    const cardUserId = typeof flashcard.user === 'object' 
      ? flashcard.user.id 
      : flashcard.user

    if (cardUserId !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      flashcard: {
        id: flashcard.id,
        question: flashcard.question,
        answer: flashcard.answer,
        difficulty: flashcard.difficulty,
        subject: flashcard.subject,
        mastered: flashcard.mastered,
        review_count: flashcard.review_count,
        last_reviewed: flashcard.last_reviewed,
      },
    })
  } catch (error) {
    console.error("Error fetching flashcard:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch flashcard" },
      { status: 500 }
    )
  }
}

// PATCH to update flashcard status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Verify ownership before updating
    const flashcard = await payload.findByID({
      collection: "flashcards",
      id: id,
    })

    if (!flashcard) {
      return NextResponse.json(
        { success: false, error: "Flashcard not found" },
        { status: 404 }
      )
    }

    const cardUserId = typeof flashcard.user === 'object' 
      ? flashcard.user.id 
      : flashcard.user

    if (cardUserId !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

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