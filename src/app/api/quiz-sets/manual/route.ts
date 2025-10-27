import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

export const runtime = "nodejs"

interface ManualQuizQuestion {
  question: string
  type: "multiple_choice" | "open_ended"
  alternatives?: { text: string; isCorrect: boolean }[]
  correctAnswer: string
  difficulty?: string
  subject?: string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { quizName, category, studyGoal, questions, documentIds, timeLimit, difficulty } = await request.json()

    console.log("📝 Creating manual quiz set:", {
      quizName,
      category,
      questionsCount: questions?.length,
      documentIds,
      timeLimit,
      difficulty,
    })

    // Validation
    if (!quizName || !quizName.trim()) {
      return NextResponse.json({ success: false, error: "Quiz name is required" }, { status: 400 })
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ success: false, error: "At least one question is required" }, { status: 400 })
    }

    // Validate each question
    for (const q of questions) {
      if (!q.question || !q.question.trim()) {
        return NextResponse.json({ success: false, error: "All questions must have question text" }, { status: 400 })
      }
      if (!q.correctAnswer || !q.correctAnswer.trim()) {
        return NextResponse.json({ success: false, error: "All questions must have a correct answer" }, { status: 400 })
      }
      if (q.type === "multiple_choice" && (!q.alternatives || q.alternatives.length < 2)) {
        return NextResponse.json(
          { success: false, error: "Multiple choice questions must have at least 2 alternatives" },
          { status: 400 },
        )
      }
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

    // Determine which document to associate (use first uploaded doc if available)
    let primaryDocumentId = null
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      try {
        const doc = await payload.findByID({
          collection: "documents",
          id: documentIds[0],
        })

        const docUserId = typeof doc.user === "object" ? doc.user.id : doc.user
        if (docUserId === userId) {
          primaryDocumentId = documentIds[0]
          console.log(`✅ Using document ${primaryDocumentId} as primary reference`)
        }
      } catch (error) {
        console.warn("⚠️ Could not verify document, creating without document reference")
      }
    }

    // If no documents uploaded, create a placeholder document
    if (!primaryDocumentId) {
      console.log("📄 Creating placeholder document for manual quiz...")

      const placeholderDoc = await payload.create({
        collection: "documents",
        data: {
          title: `${quizName} - Manual Quiz`,
          file_name: "manual_creation",
          file_type: "manual",
          status: "ready",
          user: userId,
          notes: `Manually created quiz: ${quizName}`,
        },
      })

      primaryDocumentId = placeholderDoc.id
      console.log(`✅ Created placeholder document: ${primaryDocumentId}`)
    }

    // Transform questions to match the quiz format expected by the system
    const transformedQuestions = questions.map((q: ManualQuizQuestion, index: number) => {
      if (q.type === "multiple_choice") {
        // For multiple choice, find the correct answer index
        const correctIndex = q.alternatives?.findIndex((alt) => alt.isCorrect) ?? 0

        return {
          id: `manual-q-${Date.now()}-${index}`,
          question: q.question.trim(),
          options: q.alternatives?.map((alt) => alt.text) || [],
          correctAnswer: correctIndex,
          explanation: `Correct answer: ${q.correctAnswer}`,
          subject: category || q.subject || "General",
          difficulty: (q.difficulty || difficulty || "medium") as "easy" | "medium" | "hard",
          type: "multiple_choice",
        }
      } else {
        // For open-ended questions
        return {
          id: `manual-q-${Date.now()}-${index}`,
          question: q.question.trim(),
          options: [],
          correctAnswer: 0, // Not used for open-ended
          explanation: q.correctAnswer.trim(),
          subject: category || q.subject || "General",
          difficulty: (q.difficulty || difficulty || "medium") as "easy" | "medium" | "hard",
          type: "open_ended",
          openEndedAnswer: q.correctAnswer.trim(),
        }
      }
    })

    // Create the quiz set
    console.log("📚 Creating quiz set...")

    const quizSetData: any = {
      name: quizName.trim(),
      status: "active",
      user: userId,
      questions: transformedQuestions,
      questionCount: transformedQuestions.length,
      isAIGenerated: false,
      difficulty: difficulty || "medium",
    }

    if (category && category.trim()) {
      quizSetData.subject = category.trim()
    }

    if (studyGoal && studyGoal.trim()) {
      quizSetData.description = `Study Goal: ${studyGoal.trim()}`
    }

    if (timeLimit) {
      quizSetData.timeLimit = timeLimit
    }

    const newQuizSet = await payload.create({
      collection: "quiz_sets",
      data: quizSetData,
    })

    console.log(`✅ Successfully created quiz set: ${newQuizSet.id}`)
    console.log(`📊 Total questions: ${transformedQuestions.length}`)

    return NextResponse.json({
      success: true,
      quizSet: {
        id: newQuizSet.id,
        name: newQuizSet.name,
        questionCount: newQuizSet.questionCount,
        questions: transformedQuestions,
      },
      message: `Successfully created "${quizName}" with ${transformedQuestions.length} question(s)`,
    })
  } catch (error) {
    console.error("❌ Error creating manual quiz set:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to create quiz set"

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
