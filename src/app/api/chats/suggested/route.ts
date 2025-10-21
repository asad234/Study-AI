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

    // Get document IDs from query parameters
    const { searchParams } = new URL(request.url)
    const documentIds = searchParams.getAll('documentIds')

    console.log("📋 Generating suggestions for documents:", documentIds)

    // If no documents selected, return empty or generic message
    if (documentIds.length === 0) {
      return NextResponse.json({
        success: true,
        questions: [],
        message: "Select documents to get personalized questions"
      })
    }

    // Fetch documents directly
    const documents = await payload.find({
      collection: "documents",
      where: {
        id: { in: documentIds },
        user: { equals: userProfile.id },
        status: { equals: "ready" },
      },
      limit: 10,
    })

    console.log("✅ Ready documents:", documents.docs.length)

    if (!documents.docs.length) {
      return NextResponse.json({
        success: true,
        questions: [
          {
            question: "Your documents are being processed. Check back soon for personalized questions!",
            category: "concept" as const,
            difficulty: "beginner" as const,
          },
        ],
      })
    }

    // Create context from documents
    const documentContext = documents.docs
      .map((doc) => {
        const content = doc.notes || "No content available"
        const preview = content.length > 500 ? content.substring(0, 500) + "..." : content
        return `${doc.title}: ${preview}`
      })
      .join("\n\n")

    const documentTitles = documents.docs.map(d => d.title || d.file_name).join(", ")

    console.log("🤖 Generating questions for documents:", documentTitles)

    // Generate suggested questions using OpenAI
    const { object: suggestedQuestions } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: `You are an AI study assistant. Generate exactly 3-4 diverse, engaging study questions based on the user's selected documents: ${documentTitles}
      
      Create questions that:
      - Are immediately actionable and specific to the documents provided
      - Help students when they're stuck thinking of what to ask
      - Cover different learning approaches (understanding, application, analysis)
      - Are varied in style and difficulty
      - Encourage deeper engagement with the material
      - Reference specific concepts or topics from the documents when possible
      
      Question categories (use ONLY these):
      - concept: Conceptual understanding ("What is..." or "How does..." or "Explain...")
      - practice: Practical application ("How would you use..." or "Give an example of..." or "Apply...")
      - analysis: Analysis and synthesis ("Compare..." or "What are the implications of..." or "Analyze...")
      - summary: Summarization ("Summarize..." or "What are the key points of..." or "Overview of...")
      
      Difficulties: beginner, intermediate, advanced
      
      IMPORTANT: Only use the exact category names: concept, practice, summary, analysis. Do not use any other category names.
      
      Make each question unique, engaging, and specific to the content provided to help users who are struggling to think of what to ask.`,
      prompt: `Based on these study materials from the selected documents [${documentTitles}], generate exactly 3-4 diverse, helpful questions that would assist a student who is unsure what to ask about:

${documentContext}

Focus on creating questions that:
1. Are specific to the content provided
2. Immediately spark curiosity and provide clear learning value
3. Cover different aspects of the material
4. Range in difficulty from beginner to advanced`,
      schema: SuggestedQuestionsSchema,
    })

    console.log("✅ Generated", suggestedQuestions.questions.length, "questions")

    // Shuffle and limit questions
    const shuffledQuestions = suggestedQuestions.questions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(4, suggestedQuestions.questions.length))

    return NextResponse.json({
      success: true,
      questions: shuffledQuestions,
      documentTitles,
    })
  } catch (error) {
    console.error("❌ Suggestions API error:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}