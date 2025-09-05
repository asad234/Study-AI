import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayloadHMR } from "@payloadcms/next/utilities"
import configPromise from "@payload-config"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { FlashcardsCollectionSchema } from "./sechema"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config: configPromise })

    // Find user's profile
    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (profiles.docs.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    // Get user's flashcards
    const flashcards = await payload.find({
      collection: "flashcards",
      where: { user: { equals: userProfile.id } },
      sort: "-createdAt",
    })

    return NextResponse.json({
      success: true,
      flashcards: flashcards.docs,
    })
  } catch (error) {
    console.error("Error fetching flashcards:", error)
    return NextResponse.json({ error: "Failed to fetch flashcards" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const requestId = Date.now()
  console.time(`flashcard-generation-${requestId}`)

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId, subject } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const payload = await getPayloadHMR({ config: configPromise })

    // Find user's profile
    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (profiles.docs.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    // Get and validate document
    const document = await payload.findByID({
      collection: "documents",
      id: documentId,
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (document.user?.id !== userProfile.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const documentContent = `Document Title: ${document.title || document.file_name || "Untitled"}
File Type: ${document.file_type || "Unknown"}
Subject Area: ${subject || "General"}
File Size: ${document.file_size ? `${Math.round(document.file_size / 1024)} KB` : "Unknown"}

This document contains educational material that needs to be analyzed and converted into effective study flashcards.`

    console.time(`openai-completion-${requestId}`)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator specializing in flashcard generation.

INSTRUCTIONS:
1. Analyze the provided document information and create 5-8 high-quality flashcards
2. Focus on key concepts, definitions, formulas, processes, and important facts
3. Vary difficulty levels appropriately (Easy: 30%, Medium: 50%, Hard: 20%)
4. Make questions clear, specific, and testable
5. Provide comprehensive but concise answers
6. Include brief explanations when helpful
7. Add relevant tags for categorization
8. Identify the source context from the document

QUALITY STANDARDS:
- Questions should test understanding, not just memorization
- Answers should be complete but not overwhelming
- Use appropriate card types (Definition, Concept, Formula, Process, Example, Comparison)
- Ensure content is academically accurate and pedagogically sound

Follow the provided JSON schema exactly.`,
        },
        {
          role: "user",
          content: `Document Information:\n${documentContent}\n\nGenerate flashcards based on this document content.`,
        },
      ],
      response_format: zodResponseFormat(FlashcardsCollectionSchema, "flashcards"),
      temperature: 0.3,
    })
    console.timeEnd(`openai-completion-${requestId}`)

    const aiResponseContent = completion.choices[0]?.message.content

    if (!aiResponseContent) {
      throw new Error(
        "The flashcard generator did not return any data. This might happen if the document content was unreadable or not suitable for flashcard creation.",
      )
    }

    // Parse and validate AI response
    let aiResponse
    try {
      aiResponse = JSON.parse(aiResponseContent)
    } catch (parseError) {
      throw new Error("Failed to parse AI response as JSON")
    }

    const parsed = FlashcardsCollectionSchema.safeParse(aiResponse)
    if (!parsed.success) {
      console.error("Validation errors:", parsed.error.issues)
      return NextResponse.json(
        {
          error: "Generated flashcards did not meet quality standards",
          solution: "Try uploading a document with clearer educational content",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            problem: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const createdFlashcards = []
    for (const flashcard of parsed.data.flashcards) {
      try {
        const flashcardData = {
          question: String(flashcard.question),
          answer: String(flashcard.answer),
          difficulty: String(flashcard.difficulty).toLowerCase(),
          subject: String(flashcard.subject),
          user: userProfile.id,
          document: document.id,
          mastered: false,
          review_count: 0,
        }

        const created = await payload.create({
          collection: "flashcards",
          data: flashcardData,
        })

        createdFlashcards.push(created)
      } catch (createError) {
        console.error("Error creating flashcard:", createError)
        throw createError
      }
    }

    console.timeEnd(`flashcard-generation-${requestId}`)
    return NextResponse.json({
      success: true,
      flashcards: createdFlashcards,
      metadata: {
        totalGenerated: parsed.data.totalCards,
        subjects: parsed.data.subjects,
        difficultyDistribution: parsed.data.difficultyDistribution,
      },
      message: `Successfully generated ${createdFlashcards.length} AI-powered flashcards`,
    })
  } catch (error) {
    console.error("Flashcard generation error:", error)

    let status = 500
    let errorMessage = "Failed to generate flashcards"
    let solution = "Please try again later or contact support if the problem persists"
    let details = null

    if (error instanceof OpenAI.APIError) {
      status = error.status || 502
      errorMessage = "AI flashcard generation service is currently unavailable"
      solution = "Please try again in a few minutes. If the problem continues, check our status page."
      details = {
        code: error.code || "openai_api_error",
        message: error.message,
      }
    } else if (error instanceof Error) {
      details = {
        message: error.message,
      }
    }

    console.timeEnd(`flashcard-generation-${requestId}`)
    return NextResponse.json(
      {
        error: errorMessage,
        solution,
        ...(details && { details }),
      },
      { status },
    )
  }
}
