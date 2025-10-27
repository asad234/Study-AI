import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

export const runtime = "nodejs"

// GET - Fetch all quiz sets for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Get user profile
    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!profiles.docs.length) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    const userId = profiles.docs[0].id

    // Fetch all quiz sets for this user
    const quizSets = await payload.find({
      collection: "quiz_sets",
      where: { user: { equals: userId } },
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
    console.error("❌ Error fetching quiz sets:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch quiz sets" },
      { status: 500 },
    )
  }
}

// POST - Save/update a quiz set with score after completion
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

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
      quizResults,
    } = await request.json()

    console.log("💾 Saving quiz set with score:", {
      name,
      questionCount,
      lastScore,
      isAIGenerated,
    })

    const payload = await getPayload({ config })

    // Get user profile
    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!profiles.docs.length) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    const userId = profiles.docs[0].id

    // Check if a quiz set with this name already exists for this user
    const existingQuizSets = await payload.find({
      collection: "quiz_sets",
      where: {
        and: [{ user: { equals: userId } }, { name: { equals: name.trim() } }],
      },
      limit: 1,
    })

    let quizSet

    if (existingQuizSets.docs.length > 0) {
      // Update existing quiz set with new score
      const existingQuizSet = existingQuizSets.docs[0]

      console.log(`📝 Updating existing quiz set: ${existingQuizSet.id}`)

      quizSet = await payload.update({
        collection: "quiz_sets",
        id: existingQuizSet.id,
        data: {
          lastScore: lastScore,
          status: "completed",
          // Optionally update other fields if needed
          ...(quizResults && { quizResults }),
        },
      })

      console.log(`✅ Updated quiz set ${quizSet.id} with score: ${lastScore}`)
    } else {
      // Create new quiz set
      console.log("📚 Creating new quiz set...")

      const quizSetData: any = {
        name: name.trim(),
        status: "completed",
        user: userId,
        questions: questions,
        questionCount: questionCount || questions.length,
        isAIGenerated: isAIGenerated || false,
        difficulty: difficulty || "medium",
        lastScore: lastScore,
      }

      if (subject && subject.trim()) {
        quizSetData.subject = subject.trim()
      }

      if (description && description.trim()) {
        quizSetData.description = description.trim()
      }

      if (timeLimit) {
        quizSetData.timeLimit = timeLimit
      }

      if (quizResults) {
        quizSetData.quizResults = quizResults
      }

      quizSet = await payload.create({
        collection: "quiz_sets",
        data: quizSetData,
      })

      console.log(`✅ Created new quiz set: ${quizSet.id}`)
    }

    return NextResponse.json({
      success: true,
      quizSet: {
        id: quizSet.id,
        name: quizSet.name,
        questionCount: quizSet.questionCount,
        lastScore: quizSet.lastScore,
        isAIGenerated: quizSet.isAIGenerated,
      },
      message: `Successfully saved "${name}" with score: ${lastScore}`,
    })
  } catch (error) {
    console.error("❌ Error saving quiz set:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to save quiz set"

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
