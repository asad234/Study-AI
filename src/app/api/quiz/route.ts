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
    return `VIKTIGT: Skapa ALLA frågor, svarsalternativ och förklaringar på SVENSKA.
- Frågan ska vara på svenska
- Alla svarsalternativ ska vara på svenska
- Förklaringen ska vara på svenska
- Använd korrekt svensk grammatik och stavning`
  }
  
  return `IMPORTANT: Create ALL questions, answer options, and explanations in ENGLISH.
- The question must be in English
- All answer options must be in English
- The explanation must be in English
- Use proper English grammar and spelling`
}

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
        status: { equals: "ready" },
      },
    })

    if (!documents.docs.length) {
      return NextResponse.json({ error: "No ready documents found or access denied" }, { status: 404 })
    }

    console.log(`Generating quiz from ${documents.docs.length} documents`)

    const allQuestions: any[] = []
    const questionsPerDoc = Math.ceil(questionCount / documents.docs.length)
    const processedDocuments: string[] = []
    const failedDocuments: string[] = []

    for (const document of documents.docs) {
      try {
        const docId = String(document.id)
        const docTitle = String(document.title || document.file_name || "Untitled")
        const documentContent = document.notes || ""

        if (!documentContent || documentContent.length < 50) {
          console.error(`Document ${docId} has no extracted content`)
          failedDocuments.push(docId)
          continue
        }

        console.log(`Document "${docTitle}" content length: ${documentContent.length} characters`)

        // 🆕 DETECT LANGUAGE
        const detectedLanguage = await detectLanguage(documentContent)
        console.log(`Detected language for "${docTitle}": ${detectedLanguage}`)

        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]

        // 🆕 GET LANGUAGE-SPECIFIC INSTRUCTIONS
        const languageInstructions = getLanguageInstructions(detectedLanguage)
        const languageName = detectedLanguage === 'sv' ? 'Swedish' : 'English'

        const documentContext = `Document Title: ${docTitle}
Difficulty Level: ${difficulty}
Document Language: ${languageName}

DOCUMENT CONTENT:
${documentContent}

This is the actual content extracted from the student's study material. Generate quiz questions based ONLY on this content.`

        console.log(`Generating ${questionsPerDoc} questions in ${languageName} at ${difficulty} difficulty for: ${docTitle}`)

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert quiz creator. Generate educational multiple-choice questions based ONLY on the provided document content.

${languageInstructions}

INSTRUCTIONS:
1. Create exactly ${questionsPerDoc} multiple-choice questions
2. Each question must have exactly 4 options
3. Difficulty level: ${difficulty}
4. Base ALL questions on the actual document content provided
5. Include detailed explanations for correct answers
6. Questions should test understanding of the document material
7. Ensure content is accurate to the source material

CRITICAL: 
- Only create questions about information that appears in the document content
- Do not add general knowledge questions
- ALL content (questions, options, explanations) must be in ${languageName}

Follow the provided JSON schema exactly.`,
            },
            {
              role: "user",
              content: documentContext,
            },
          ],
          response_format: zodResponseFormat(QuizCollectionSchema, "quiz"),
          temperature: 0.3,
        })

        const aiResponseContent = completion.choices[0]?.message.content

        if (!aiResponseContent) {
          console.error(`No AI response for document ${docId}`)
          failedDocuments.push(docId)
          continue
        }

        let aiResponse
        try {
          aiResponse = JSON.parse(aiResponseContent)
        } catch (parseError) {
          console.error(`Failed to parse AI response for document ${docId}`)
          failedDocuments.push(docId)
          continue
        }

        const parsed = QuizCollectionSchema.safeParse(aiResponse)
        if (!parsed.success) {
          console.error(`Validation failed for document ${docId}:`, parsed.error.issues)
          failedDocuments.push(docId)
          continue
        }

        const questions = parsed.data.questions.map((q: any, index: number) => ({
          ...q,
          id: `${docId}-${index}-${Date.now()}`,
        }))

        allQuestions.push(...questions)
        processedDocuments.push(docId)
        console.log(`Successfully generated ${questions.length} questions from document ${docId}`)
      } catch (error) {
        console.error(`Failed to generate questions for document ${String(document.id)}:`, error)
        failedDocuments.push(String(document.id))
      }
    }

    if (allQuestions.length === 0) {
      return NextResponse.json({ 
        error: "Failed to generate any questions",
        solution: "Please ensure your documents contain extracted text content. Upload PDF or Word documents and wait for text extraction to complete.",
        failedDocuments,
      }, { status: 500 })
    }

    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount)

    console.log(`Total questions generated: ${allQuestions.length}, using: ${shuffledQuestions.length}`)

    const quiz = await payload.create({
      collection: "quizzes",
      data: {
        user: userProfile.id,
        document: documentIds[0],
        title: `Quiz from ${processedDocuments.length} document${processedDocuments.length > 1 ? "s" : ""}`,
        description: `AI-generated quiz with ${shuffledQuestions.length} questions based on your study materials`,
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
      metadata: {
        totalGenerated: allQuestions.length,
        processedDocuments: processedDocuments.length,
        failedDocuments: failedDocuments.length,
      },
      message: `Successfully generated ${shuffledQuestions.length} questions from ${processedDocuments.length} document(s)`,
    })
  } catch (error) {
    console.error("Quiz generation error:", error)

    let status = 500
    let errorMessage = "Failed to generate quiz"
    let solution = "Please try again later or contact support if the problem persists"
    let details = null

    if (error instanceof OpenAI.APIError) {
      status = error.status || 502
      errorMessage = "AI quiz generation service is currently unavailable"
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