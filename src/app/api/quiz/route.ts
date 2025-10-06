import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"

const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3),
  explanation: z.string(),
  subject: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
})

const QuizCollectionSchema = z.object({
  questions: z.array(QuizQuestionSchema).min(1),
  totalQuestions: z.number().min(1),
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentIds, difficulties, questionCount } = await request.json()

    if (!documentIds || documentIds.length === 0) {
      return NextResponse.json({ error: "At least one document is required" }, { status: 400 })
    }

    if (!difficulties || difficulties.length === 0) {
      return NextResponse.json({ error: "At least one difficulty level is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

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

    const documents = await payload.find({
      collection: "documents",
      where: {
        id: { in: documentIds },
        user: { equals: userProfile.id },
      },
    })

    if (!documents.docs.length) {
      return NextResponse.json({ error: "No documents found or access denied" }, { status: 404 })
    }

    const allQuestions: any[] = []
    const questionsPerDoc = Math.ceil(questionCount / documents.docs.length)

    for (const document of documents.docs) {
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]

      const documentContent = `Document Title: ${document.title || document.file_name || "Untitled"}
File Type: ${document.file_type || "Unknown"}
Difficulty Level: ${difficulty}

This document contains educational material that needs to be converted into quiz questions.`

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini-2024-07-18",
          messages: [
            {
              role: "system",
              content: `You are an expert quiz creator. Generate educational multiple-choice questions based on provided content.

INSTRUCTIONS:
1. Create exactly ${questionsPerDoc} multiple-choice questions
2. Each question must have exactly 4 options
3. Difficulty level: ${difficulty}
4. Include detailed explanations for correct answers
5. Questions should test understanding, not just memorization
6. Ensure content is academically accurate

Follow the provided JSON schema exactly.`,
            },
            {
              role: "user",
              content: `Document Information:\n${documentContent}\n\nGenerate ${questionsPerDoc} quiz questions at ${difficulty} difficulty level.`,
            },
          ],
          response_format: zodResponseFormat(QuizCollectionSchema, "quiz"),
          temperature: 0.3,
        })

        const aiResponseContent = completion.choices[0]?.message.content

        if (!aiResponseContent) {
          console.error(`No AI response for document ${document.id}`)
          continue
        }

        let aiResponse
        try {
          aiResponse = JSON.parse(aiResponseContent)
        } catch (parseError) {
          console.error(`Failed to parse AI response for document ${document.id}`)
          continue
        }

        const parsed = QuizCollectionSchema.safeParse(aiResponse)
        if (!parsed.success) {
          console.error(`Validation failed for document ${document.id}:`, parsed.error.issues)
          continue
        }

        const questions = parsed.data.questions.map((q: any, index: number) => ({
          ...q,
          id: `${document.id}-${index}-${Date.now()}`,
        }))

        allQuestions.push(...questions)
      } catch (error) {
        console.error(`Failed to generate questions for document ${document.id}:`, error)
      }
    }

    if (allQuestions.length === 0) {
      return NextResponse.json({ error: "Failed to generate any questions" }, { status: 500 })
    }

    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount)

    const quiz = await payload.create({
      collection: "quizzes",
      data: {
        user: userProfile.id,
        document: documentIds[0],
        title: `Quiz from ${documents.docs.length} document${documents.docs.length > 1 ? "s" : ""}`,
        description: `Generated quiz with ${shuffledQuestions.length} questions`,
        questions: shuffledQuestions,
        settings: {
          shuffleQuestions: true,
          showExplanations: true,
        },
      },
    })

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questions: shuffledQuestions,
        settings: quiz.settings,
      },
    })
  } catch (error) {
    console.error("Quiz generation error:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
