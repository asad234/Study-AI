import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

// GET /api/quiz-sets - Fetch all quiz sets for the current user
export async function GET(request: Request) {
  try {
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

    // Fetch quiz sets for this user
    const quizSets = await payload.find({
      collection: "quiz_sets",
      where: {
        user: { equals: userId },
      },
      sort: "-createdAt",
      limit: 100,
    })

    const formattedSets = quizSets.docs.map((set: any) => ({
      id: set.id,
      name: set.name,
      questionCount: set.questionCount || 0,
      status: set.status || "active",
      createdAt: set.createdAt,
      difficulty: set.difficulty,
      timeLimit: set.timeLimit,
      lastScore: set.lastScore,
      isAIGenerated: set.isAIGenerated || false,
      subject: set.subject,
      description: set.description,
    }))

    return NextResponse.json({
      success: true,
      quizSets: formattedSets,
    })
  } catch (error) {
    console.error("Error fetching quiz sets:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch quiz sets" },
      { status: 500 }
    )
  }
}

// POST /api/quiz-sets - Save a quiz with results
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      questions, 
      questionCount,
      difficulty,
      timeLimit,
      lastScore,
      isAIGenerated,
      subject,
      description,
      quizResults 
    } = body

    console.log("📝 Saving quiz set:", {
      name,
      questionCount,
      isAIGenerated,
      lastScore
    })

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Quiz name is required" },
        { status: 400 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one question is required" },
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

    // Build quiz set data
    const quizSetData: any = {
      name,
      questionCount: questionCount || questions.length,
      status: "completed",
      user: userId,
      questions: questions, // Store questions as JSON
      lastScore: lastScore || 0,
      isAIGenerated: isAIGenerated || false,
      difficulty: difficulty || "medium",
    }

    // Add optional fields
    if (timeLimit) {
      quizSetData.timeLimit = timeLimit
    }

    if (subject && subject.trim()) {
      quizSetData.subject = subject.trim()
    }

    if (description && description.trim()) {
      quizSetData.description = description.trim()
    }

    // Store quiz results if provided
    if (quizResults && Array.isArray(quizResults)) {
      quizSetData.quizResults = quizResults
    }

    console.log("📦 Final quiz set data:", {
      ...quizSetData,
      questions: `[${quizSetData.questions.length} questions]`,
    })

    // Create the quiz set
    const newSet = await payload.create({
      collection: "quiz_sets",
      data: quizSetData,
    })

    console.log("✅ Successfully created quiz set:", newSet.id)

    return NextResponse.json({
      success: true,
      quizSet: {
        id: newSet.id,
        name: newSet.name,
        questionCount: newSet.questionCount,
        lastScore: newSet.lastScore,
        isAIGenerated: newSet.isAIGenerated,
      },
      message: `Successfully saved quiz "${name}" with ${questionCount} question(s)`,
    })
  } catch (error) {
    console.error("❌ Error saving quiz set:", error)
    
    let errorMessage = "Failed to save quiz set"
    
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}