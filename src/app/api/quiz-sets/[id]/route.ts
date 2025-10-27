// app/api/quiz-sets/[id]/route.ts

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

// GET /api/quiz-sets/[id] - Fetch a specific quiz set
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Await params before accessing properties (Next.js 15)
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Quiz set ID is required" },
        { status: 400 }
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

    // Fetch the quiz set
    const quizSet = await payload.findByID({
      collection: "quiz_sets",
      id,
    })

    // Verify user owns this quiz set
    const quizSetUserId = typeof quizSet.user === 'object' 
      ? quizSet.user.id 
      : quizSet.user

    if (quizSetUserId !== userId) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to access this quiz set" },
        { status: 403 }
      )
    }

    // Format the response
    const formattedQuizSet = {
      id: quizSet.id,
      name: quizSet.name,
      questions: quizSet.questions,
      questionCount: quizSet.questionCount || 0,
      difficulty: quizSet.difficulty,
      timeLimit: quizSet.timeLimit,
      isAIGenerated: quizSet.isAIGenerated || false,
      subject: quizSet.subject,
      description: quizSet.description,
      lastScore: quizSet.lastScore,
      status: quizSet.status,
      createdAt: quizSet.createdAt,
    }

    return NextResponse.json({
      success: true,
      quizSet: formattedQuizSet,
    })
  } catch (error) {
    console.error("❌ Error fetching quiz set:", error)
    
    // Check if it's a "not found" error
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: "Quiz set not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch quiz set" },
      { status: 500 }
    )
  }
}

// DELETE /api/quiz-sets/[id] - Delete a specific quiz set
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Await params before accessing properties (Next.js 15)
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Quiz set ID is required" },
        { status: 400 }
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

    // Verify the quiz set exists and belongs to the user
    const quizSet = await payload.findByID({
      collection: "quiz_sets",
      id,
    })

    const quizSetUserId = typeof quizSet.user === 'object' 
      ? quizSet.user.id 
      : quizSet.user

    if (quizSetUserId !== userId) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to delete this quiz set" },
        { status: 403 }
      )
    }

    // Delete the quiz set
    await payload.delete({
      collection: "quiz_sets",
      id, 
    })

    console.log("✅ Successfully deleted quiz set:", id)

    return NextResponse.json({
      success: true,
      message: "Quiz set deleted successfully",
    })
  } catch (error) {
    console.error("❌ Error deleting quiz set:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete quiz set" },
      { status: 500 }
    )
  }
}