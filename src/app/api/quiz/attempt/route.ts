import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import { QuizAttemptSchema } from "../quize-schema"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const attemptData = await request.json()

    const validatedData = QuizAttemptSchema.parse(attemptData)

    const payload = await getPayload({ config })

    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!profiles.docs.length) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    const quiz = await payload.findByID({
      collection: "quizzes",
      id: validatedData.quizId,
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const questions = quiz.questions as any[]
    let correctAnswers = 0

    validatedData.answers.forEach((answer) => {
      const question = questions.find((q) => q.id === answer.questionId)
      if (question && question.correctAnswer === answer.selectedAnswer) {
        correctAnswers++
      }
    })

    const score = Math.round((correctAnswers / questions.length) * 100)

    const attempt = await payload.create({
      collection: "quiz-attempts",
      data: {
        quiz: validatedData.quizId,
        user: userProfile.id,
        answers: validatedData.answers,
        score,
        total_questions: questions.length,
        time_taken: validatedData.totalTime,
        completed_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        score,
        correctAnswers,
        totalQuestions: questions.length,
        timeSpent: validatedData.totalTime,
      },
    })
  } catch (error) {
    console.error("Quiz attempt error:", error)
    return NextResponse.json({ error: "Failed to save quiz attempt" }, { status: 500 })
  }
}
