// app/api/flashcards/generate-answer/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = "nodejs"
export const maxDuration = 60

// Helper function to clean markdown and formatting from text
function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^#{1,6}\s+(.+?)$/gm, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[\*\-\+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[\-\*_]{3,}$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Helper function to detect language
async function detectLanguage(text: string): Promise<'sv' | 'en'> {
  try {
    const sample = text.slice(0, 500)
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a language detector. Respond with ONLY 'sv' for Swedish or 'en' for English/other languages."
        },
        {
          role: "user",
          content: `Detect the language: ${sample}`
        }
      ],
      temperature: 0,
      max_tokens: 10,
    })

    const detectedLang = response.choices[0]?.message.content?.trim().toLowerCase()
    return detectedLang === 'sv' ? 'sv' : 'en'
  } catch (error) {
    console.error("Language detection error:", error)
    return 'en'
  }
}

// Helper function to ensure document has extracted text
async function ensureDocumentExtracted(documentId: string, payload: any): Promise<string> {
  try {
    console.log(`📄 Checking document ${documentId} for extracted text...`)
    
    const document = await payload.findByID({
      collection: "documents",
      id: documentId,
    })

    if (!document) {
      console.error(`❌ Document ${documentId} not found`)
      return ""
    }

    const notesValue = document.notes || ""
    const notesLength = notesValue.length

    const isErrorMessage = notesValue.includes("[Unsupported file type:") || 
                          notesValue.includes("[Image content -") ||
                          notesValue.includes("[Failed to extract") ||
                          notesValue.includes("Please upload PDF")

    if (notesValue && notesLength >= 50 && !isErrorMessage) {
      console.log(`✅ Document ${documentId} already has extracted content (${notesLength} chars)`)
      return notesValue
    }

    console.log(`🔄 Triggering extraction for document ${documentId}...`)
    
    const extractUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/documents/${documentId}/extract`
    
    const extractResponse = await fetch(extractUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.INTERNAL_API_KEY || "default-key-change-in-production",
      },
    })

    const extractData = await extractResponse.json()

    if (extractResponse.ok && extractData.success) {
      console.log(`✅ Successfully triggered extraction for document ${documentId}`)
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const updatedDocument = await payload.findByID({
        collection: "documents",
        id: documentId,
      })

      const extractedText = updatedDocument.notes || ""
      console.log(`📝 Extracted text length: ${extractedText.length} characters`)
      
      return extractedText
    } else {
      console.error(`❌ Failed to extract document ${documentId}:`, extractData.error)
      return ""
    }
  } catch (error) {
    console.error(`❌ Error ensuring document extraction for ${documentId}:`, error)
    return ""
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { question, documentIds, category, studyGoal } = await request.json()

    console.log("📥 Generate answer request:", {
      question: question?.substring(0, 50) + "...",
      documentCount: documentIds?.length,
      category,
      studyGoal
    })

    if (!question || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "Question is required" },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    const payload = await getPayload({ config })

    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!profiles.docs.length) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    const userId = profiles.docs[0].id

    let documentContext = ""
    let hasDocuments = false
    let extractedDocCount = 0
    
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      console.log(`📚 Processing ${documentIds.length} document(s)...`)
      
      for (const docId of documentIds) {
        try {
          const doc = await payload.findByID({
            collection: "documents",
            id: docId,
          })

          if (!doc) {
            console.warn(`⚠️ Document ${docId} not found`)
            continue
          }

          const docUserId = typeof doc.user === 'object' ? doc.user.id : doc.user
          if (docUserId !== userId) {
            console.warn(`⚠️ User doesn't own document ${docId}`)
            continue
          }

          const extractedText = await ensureDocumentExtracted(docId, payload)
          
          if (extractedText && extractedText.length > 50) {
            documentContext += (documentContext ? "\n\n---\n\n" : "") + extractedText
            extractedDocCount++
            console.log(`✅ Added content from document ${docId}`)
          } else {
            console.warn(`⚠️ Document ${docId} has insufficient content`)
          }
        } catch (error) {
          console.error(`❌ Error processing document ${docId}:`, error)
        }
      }
      
      if (extractedDocCount > 0) {
        hasDocuments = true
        console.log(`✅ Successfully extracted ${documentContext.length} characters from ${extractedDocCount} document(s)`)
      } else {
        console.warn(`⚠️ No documents could be processed for context`)
      }
    }

    const textForLanguageDetection = documentContext || question
    const language = await detectLanguage(textForLanguageDetection)
    const languageName = language === 'sv' ? 'Swedish' : 'English'

    console.log(`🌍 Detected language: ${languageName}`)
    console.log(`📄 Has documents: ${hasDocuments}`)

    let systemPrompt = ""
    let userPrompt = ""

    if (hasDocuments) {
      systemPrompt = `You are an expert educational assistant helping students create study flashcards.

LANGUAGE: Respond in ${languageName}.

CRITICAL INSTRUCTIONS:
1. Write SHORT, CONCISE answers only - 2-4 sentences maximum
2. Answer the question DIRECTLY without summaries or extra context
3. Use PLAIN TEXT ONLY - absolutely NO formatting symbols
4. NO bold (**text**), NO italics (*text*), NO bullet points, NO numbered lists
5. NO special characters like //, --, ==, etc.
6. Write naturally as if speaking to a student

Your task is to provide a brief, accurate answer based ONLY on the provided reference materials.

Guidelines:
- Answer in ${languageName}
- Keep answers SHORT (2-4 sentences)
- Answer directly without preamble
- Base answer ONLY on the reference materials
- Use plain text, no formatting
- Be clear and precise
- Skip unnecessary details

Context:
${category ? `Category: ${category}` : ''}
${studyGoal ? `Study Goal: ${studyGoal}` : ''}`

      userPrompt = `REFERENCE MATERIALS:
${documentContext}

STUDENT'S QUESTION:
${question}

Provide a SHORT, DIRECT answer (2-4 sentences) based on the reference materials. Use plain text only, no formatting. Answer in ${languageName}.`
    } else {
      systemPrompt = `You are an expert educational assistant helping students create study flashcards.

LANGUAGE: Respond in ${languageName}.

CRITICAL INSTRUCTIONS:
1. Write SHORT, CONCISE answers only - 2-4 sentences maximum
2. Answer the question DIRECTLY without summaries or extra context
3. Use PLAIN TEXT ONLY - absolutely NO formatting symbols
4. NO bold (**text**), NO italics (*text*), NO bullet points, NO numbered lists
5. NO special characters like //, --, ==, etc.
6. Write naturally as if speaking to a student

IMPORTANT: The student has NOT uploaded reference materials, so provide a brief general answer.

Start with this note:
${languageName === 'Swedish' 
  ? 'OBS: Generellt svar (inga dokument uppladdade).'
  : 'Note: General answer (no documents uploaded).'}

Then provide your SHORT answer.

Guidelines:
- Answer in ${languageName}
- Keep answers SHORT (2-4 sentences after the note)
- Answer directly without preamble
- Use plain text, no formatting
- Be clear and precise
- Skip unnecessary details

Context:
${category ? `Category: ${category}` : ''}
${studyGoal ? `Study Goal: ${studyGoal}` : ''}`

      userPrompt = `STUDENT'S QUESTION:
${question}

Provide a SHORT, DIRECT answer (2-4 sentences after the note). Use plain text only, no formatting. Answer in ${languageName}.`
    }

    console.log(`🤖 Generating answer with OpenAI...`)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    const answer = completion.choices[0]?.message?.content

    if (!answer) {
      throw new Error("No answer generated from AI")
    }

    const cleanedAnswer = cleanMarkdownFormatting(answer)

    console.log(`✅ Answer generated successfully (${cleanedAnswer.length} characters)`)

    return NextResponse.json({
      success: true,
      answer: cleanedAnswer.trim(),
      hasDocuments,
      language: languageName,
      documentsProcessed: extractedDocCount,
    })

  } catch (error) {
    console.error("❌ Error generating answer:", error)
    
    let errorMessage = "Failed to generate answer"
    if (error instanceof OpenAI.APIError) {
      errorMessage = "AI service temporarily unavailable. Please try again."
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}