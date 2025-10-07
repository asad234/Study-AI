import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import { ExamAttemptSchema } from "@/lib/exam-schema"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const attemptData = await request.json()
    const validatedData = ExamAttemptSchema.parse(attemptData)

    const payload = await getPayload({ config })

    // Get user profile
    const userProfiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!userProfiles.docs.length) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const userProfile = userProfiles.docs[0]

    const exam = await payload.findByID({
      collection: "exams",
      id: Number(validatedData.examId),
    })

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    const questionsResult = await payload.find({
      collection: "exam_questions",
      where: {
        exam: { equals: exam.id },
      },
      limit: 100,
    })

    const questions = questionsResult.docs

    // Calculate score
    let correctAnswers = 0
    let totalMarks = 0
    let earnedMarks = 0

    const gradedAnswers = questions.map((question: any) => {
      const userAnswer = validatedData.answers.find((a) => a.questionId === String(question.id))
      totalMarks += question.marks

      let isCorrect = false
      let correctAnswer

      try {
        correctAnswer = JSON.parse(question.correct_answer)
      } catch {
        correctAnswer = question.correct_answer
      }

      if (userAnswer) {
        // Determine question type from options
        const hasOptions = question.options && Array.isArray(question.options)
        const isMultipleSelect = Array.isArray(correctAnswer)

        if (isMultipleSelect) {
          // Multiple-select question
          const userArr = Array.isArray(userAnswer.answer) ? userAnswer.answer : []
          isCorrect =
            correctAnswer.length === userArr.length && correctAnswer.every((val: number) => userArr.includes(val))
        } else if (!hasOptions) {
          // Written answer - mark as correct if not empty (manual grading needed)
          isCorrect = typeof userAnswer.answer === "string" && userAnswer.answer.trim().length > 0
        } else {
          // Multiple-choice or true-false
          isCorrect = userAnswer.answer === correctAnswer
        }
      }

      if (isCorrect) {
        correctAnswers++
        earnedMarks += question.marks
      }

      return {
        question: question.id,
        user_answer: userAnswer?.answer,
        is_correct: isCorrect,
        marks_earned: isCorrect ? question.marks : 0,
      }
    })

    const score = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0

   const attempt = await payload.create({
    collection: "exam_attempts",
    data: {
        exam: exam.id,
        user: userProfile.id,
        answers: gradedAnswers,
        score,
        started_at: new Date(Date.now() - validatedData.totalTime * 1000).toISOString(),
        completed_at: new Date().toISOString(),
    },
})

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        score,
        earnedMarks,
        totalMarks,
        answers: gradedAnswers,
      },
    })
  } catch (error) {
    console.error("Exam attempt error:", error)
    return NextResponse.json(
      { error: "Failed to submit exam attempt", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
