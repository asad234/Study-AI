import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { SuggestedQuestionsSchema } from "../chat-schema"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

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

    // Get user's documents
    const documents = await payload.find({
      collection: "documents",
      where: {
        user: { equals: userProfile.id },
        status: { equals: "ready" },
      },
      limit: 10,
    })

    if (!documents.docs.length) {
      return NextResponse.json({
        success: true,
        questions: [
          {
            question: "Upload some study materials to get personalized questions!",
            category: "concept" as const,
            difficulty: "beginner" as const,
          },
        ],
      })
    }

    // Create context from documents
    const documentContext = documents.docs
      .map((doc) => `${doc.title}: ${doc.notes || "No content available"}`)
      .join("\n")

    // Generate suggested questions using OpenAI
    const { object: suggestedQuestions } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: `You are an AI study assistant. Generate exactly 3-4 diverse, engaging study questions based on the user's uploaded materials. 
      
      Create questions that:
      - Are immediately actionable and specific
      - Help students when they're stuck thinking of what to ask
      - Cover different learning approaches (understanding, application, analysis)
      - Are varied in style and difficulty
      - Encourage deeper engagement with the material
      
      Question categories (use ONLY these):
      - concept: Conceptual understanding ("What is..." or "How does...")
      - practice: Practical application ("How would you use..." or "Give an example of...")
      - analysis: Analysis and synthesis ("Compare..." or "What are the implications of...")
      - summary: Summarization ("Summarize..." or "What are the key points of...")
      
      Categories: concept, practice, summary, analysis
      Difficulties: beginner, intermediate, advanced
      
      IMPORTANT: Only use the exact category names: concept, practice, summary, analysis. Do not use any other category names.
      
      Make each question unique and engaging to help users who are struggling to think of what to ask.`,
      prompt: `Based on these study materials, generate exactly 3-4 diverse, helpful questions that would assist a student who is unsure what to ask about:

${documentContext}

Focus on creating questions that immediately spark curiosity and provide clear learning value.`,
      schema: SuggestedQuestionsSchema,
    })

    const shuffledQuestions = suggestedQuestions.questions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(4, suggestedQuestions.questions.length))

    return NextResponse.json({
      success: true,
      questions: shuffledQuestions,
    })
  } catch (error) {
    console.error("Suggestions API error:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
