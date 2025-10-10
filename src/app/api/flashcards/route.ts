import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"

const difficultyLevels = ["Easy", "Medium", "Hard"] as const
const cardTypes = ["Definition", "Concept", "Formula", "Process", "Example", "Comparison"] as const
const subjects = [
  "Mathematics",
  "Science",
  "History",
  "Literature",
  "Language",
  "Business",
  "Technology",
  "Medicine",
  "Law",
  "General",
] as const

const FlashcardSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  difficulty: z.enum(difficultyLevels),
  subject: z.enum(subjects),
  cardType: z.enum(cardTypes),
  explanation: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  sourceContext: z.string().nullable().optional(),
})

const FlashcardsCollectionSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(1, "At least one flashcard is required"),
  documentTitle: z.string().nullable().optional(),
  totalCards: z.number().min(1),
  subjects: z.array(z.enum(subjects)),
  difficultyDistribution: z.object({
    easy: z.number().min(0),
    medium: z.number().min(0),
    hard: z.number().min(0),
  }),
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = "nodejs"
export const maxDuration = 60

// Helper function to detect document language
async function detectLanguage(text: string): Promise<'sv' | 'en'> {
  try {
    // Take a sample of the text (first 1000 characters should be enough)
    const sample = text.slice(0, 1000)
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini model for cost efficiency
      messages: [
        {
          role: "system",
          content: "You are a language detector. Analyze the text and respond with ONLY 'sv' for Swedish or 'en' for English or other languages. If the language is not Swedish, always respond with 'en'."
        },
        {
          role: "user",
          content: `Detect the language of this text:\n\n${sample}`
        }
      ],
      temperature: 0,
      max_tokens: 10,
    })

    const detectedLang = response.choices[0]?.message.content?.trim().toLowerCase()
    
    // Return 'sv' only if Swedish is detected, otherwise default to 'en'
    return detectedLang === 'sv' ? 'sv' : 'en'
  } catch (error) {
    console.error("Language detection error:", error)
    // Default to English if detection fails
    return 'en'
  }
}

// Helper function to get language-specific instructions
function getLanguageInstructions(language: 'sv' | 'en'): string {
  if (language === 'sv') {
    return `VIKTIGT: Skapa ALLA flashcards på SVENSKA.
- Frågan ska vara på svenska
- Svaret ska vara på svenska
- Förklaringen ska vara på svenska
- Använd korrekt svensk grammatik och stavning
- Alla taggar och etiketter ska vara på svenska`
  }
  
  return `IMPORTANT: Create ALL flashcards in ENGLISH.
- The question must be in English
- The answer must be in English
- The explanation must be in English
- Use proper English grammar and spelling
- All tags and labels must be in English`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })

    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (profiles.docs.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

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

    const { documentIds, subject } = await request.json()

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "At least one document ID is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const payload = await getPayload({ config: configPromise })

    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (profiles.docs.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    const allGeneratedFlashcards: any[] = []
    const processedDocuments: string[] = []
    const failedDocuments: string[] = []

    console.log(`Processing ${documentIds.length} documents for flashcard generation`)

    for (const documentId of documentIds) {
      try {
        console.log(`Processing document: ${documentId}`)

        const document = await payload.findByID({
          collection: "documents",
          id: documentId,
        })

        if (!document) {
          console.error(`Document ${documentId} not found`)
          failedDocuments.push(documentId)
          continue
        }

        const documentUserId =
          typeof document.user === "object" && document.user !== null ? document.user.id : document.user
        if (documentUserId !== userProfile.id) {
          console.error(`Document ${documentId} access denied`)
          failedDocuments.push(documentId)
          continue
        }

        const documentContent = document.notes || ""

        if (!documentContent || documentContent.length < 50) {
          console.error(`Document ${documentId} has no extracted content`)
          failedDocuments.push(documentId)
          continue
        }

        console.log(`Document content length: ${documentContent.length} characters`)

        // 🆕 DETECT LANGUAGE
        const detectedLanguage = await detectLanguage(documentContent)
        console.log(`Detected language for document ${documentId}: ${detectedLanguage}`)

        // 🆕 GET LANGUAGE-SPECIFIC INSTRUCTIONS
        const languageInstructions = getLanguageInstructions(detectedLanguage)
        const languageName = detectedLanguage === 'sv' ? 'Swedish' : 'English'

        const documentContext = `Document Title: ${document.title || document.file_name || "Untitled"}
Subject Area: ${subject || "General"}
Document Language: ${languageName}

DOCUMENT CONTENT:
${documentContent}

This is the actual content extracted from the student's study material. Use this content to generate relevant flashcards.`

        console.log(`Generating flashcards in ${languageName} for document: ${document.title || document.file_name}`)

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert educational content creator specializing in flashcard generation.

${languageInstructions}

INSTRUCTIONS:
1. Analyze the provided document content carefully
2. Create 5-8 high-quality flashcards based ONLY on the content provided
3. Focus on key concepts, definitions, formulas, processes, and important facts from the document
4. Vary difficulty levels appropriately (Easy: 30%, Medium: 50%, Hard: 20%)
5. Make questions clear, specific, and testable
6. Provide comprehensive but concise answers
7. Include brief explanations when helpful
8. Add relevant tags for categorization

QUALITY STANDARDS:
- Questions should test understanding of the document content
- Answers should be based on information in the document
- Use appropriate card types (Definition, Concept, Formula, Process, Example, Comparison)
- Ensure content is accurate to the source material
- ALL content must be in ${languageName}

CRITICAL: 
- Base all flashcards ONLY on the actual document content provided
- Do not add general knowledge
- Everything (questions, answers, explanations, tags) must be in ${languageName}`,
            },
            {
              role: "user",
              content: documentContext,
            },
          ],
          response_format: zodResponseFormat(FlashcardsCollectionSchema, "flashcards"),
          temperature: 0.3,
        })

        const aiResponseContent = completion.choices[0]?.message.content

        if (!aiResponseContent) {
          console.error(`No AI response for document ${documentId}`)
          failedDocuments.push(documentId)
          continue
        }

        let aiResponse
        try {
          aiResponse = JSON.parse(aiResponseContent)
        } catch (parseError) {
          console.error(`Failed to parse AI response for document ${documentId}`)
          failedDocuments.push(documentId)
          continue
        }

        const parsed = FlashcardsCollectionSchema.safeParse(aiResponse)
        if (!parsed.success) {
          console.error(`Validation failed for document ${documentId}:`, parsed.error.issues)
          failedDocuments.push(documentId)
          continue
        }

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

            allGeneratedFlashcards.push(created)
          } catch (createError) {
            console.error(`Error creating flashcard for document ${documentId}:`, createError)
          }
        }

        processedDocuments.push(documentId)
        console.log(
          `Successfully generated ${parsed.data.flashcards.length} flashcards in ${languageName} for document ${documentId}`,
        )
      } catch (docError) {
        console.error(`Error processing document ${documentId}:`, docError)
        failedDocuments.push(documentId)
      }
    }

    console.timeEnd(`flashcard-generation-${requestId}`)

    if (allGeneratedFlashcards.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to generate flashcards from any documents",
          solution: "Please ensure your documents contain extracted text content. Upload PDF or Word documents and wait for text extraction to complete.",
          processedDocuments,
          failedDocuments,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      flashcards: allGeneratedFlashcards,
      metadata: {
        totalGenerated: allGeneratedFlashcards.length,
        processedDocuments: processedDocuments.length,
        failedDocuments: failedDocuments.length,
        documentIds: processedDocuments,
      },
      message: `Successfully generated ${allGeneratedFlashcards.length} flashcards from ${processedDocuments.length} document(s)`,
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