import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { QuizGenerationSchema } from "./quize-schema"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId, subject, difficulty = "medium", questionCount = 5 } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
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
        id: { equals: documentId },
        user: { equals: userProfile.id },
      },
      limit: 1,
    })

    if (!documents.docs.length) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    const document = documents.docs[0]

    const prompt = `Based on the following document content, create a quiz with ${questionCount} multiple-choice questions.

Document Title: ${document.title}
Document Content: ${document.content || "No content available"}

Requirements:
- Create exactly ${questionCount} questions
- Difficulty level: ${difficulty}
- Subject focus: ${subject || "General"}
- Each question should have 4 multiple choice options
- Include detailed explanations for correct answers
- Questions should test understanding, not just memorization

Format the response as a JSON object with this structure:
{
  "title": "Quiz title based on document",
  "description": "Brief description of the quiz",
  "questions": [
    {
      "id": "unique_id",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation",
      "subject": "${subject || "General"}",
      "difficulty": "${difficulty}"
    }
  ]
}`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system:
        "You are an expert quiz creator. Generate educational quizzes based on provided content. Always respond with valid JSON.",
    })

    let quizData
    try {
      let cleanText = text.trim()

      // Remove markdown code block formatting if present
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      quizData = JSON.parse(cleanText)
      QuizGenerationSchema.parse(quizData)
    } catch (parseError) {
      console.error("Failed to parse quiz data:", parseError)
      console.error("Raw response text:", text)
      return NextResponse.json({ error: "Failed to generate valid quiz" }, { status: 500 })
    }

    const quiz = await payload.create({
      collection: "quizzes",
      data: {
        user: userProfile.id,
        document: documentId,
        title: quizData.title,
        description: quizData.description,
        questions: quizData.questions,
        settings: quizData.settings || {},
      },
    })

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        settings: quiz.settings,
      },
    })
  } catch (error) {
    console.error("Quiz generation error:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
