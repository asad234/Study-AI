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

// Helper function to clean markdown formatting
function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/^#{1,6}\s+(.+?)$/gm, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^[*\-+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*_]{3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// Helper function to detect language
async function detectLanguage(text: string): Promise<"sv" | "en"> {
  try {
    const sample = text.slice(0, 500)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a language detector. Respond with ONLY 'sv' for Swedish or 'en' for English/other languages.",
        },
        {
          role: "user",
          content: `Detect the language: ${sample}`,
        },
      ],
      temperature: 0,
      max_tokens: 10,
    })

    const detectedLang = response.choices[0]?.message.content?.trim().toLowerCase()
    return detectedLang === "sv" ? "sv" : "en"
  } catch (error) {
    console.error("Language detection error:", error)
    return "en"
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

    const isErrorMessage =
      notesValue.includes("[Unsupported file type:") ||
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

      await new Promise((resolve) => setTimeout(resolve, 3000))

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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { question, documentIds, category, studyGoal } = await request.json()

    console.log("📥 Generate open-ended answer request:", {
      question: question?.substring(0, 50) + "...",
      documentCount: documentIds?.length,
      category,
      studyGoal,
    })

    if (!question || !question.trim()) {
      return NextResponse.json({ success: false, error: "Question is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: "OpenAI API key not configured" }, { status: 500 })
    }

    const payload = await getPayload({ config })

    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!profiles.docs.length) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    const userId = profiles.docs[0].id

    let documentContext = ""
    let hasDocuments = false
    let documentsProcessed = 0

    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      const documents = await payload.find({
        collection: "documents",
        where: {
          id: { in: documentIds },
          user: { equals: userId },
        },
      })

      for (const doc of documents.docs) {
        const extractedText = doc.notes || ""
        if (extractedText && extractedText.length > 50) {
          documentContext += (documentContext ? "\n\n---\n\n" : "") + extractedText
          documentsProcessed++
        }
      }

      hasDocuments = documentsProcessed > 0
    }

    const textForLanguageDetection = documentContext || question
    const language = await detectLanguage(textForLanguageDetection)
    const languageName = language === "sv" ? "Swedish" : "English"

    console.log(`🌍 Detected language: ${languageName}`)
    console.log(`📄 Has documents: ${hasDocuments}`)

    let systemPrompt = ""
    let userPrompt = ""

    if (hasDocuments) {
      systemPrompt = `You are an expert educational assistant creating perfect answers for open-ended quiz questions.

LANGUAGE: Respond in ${languageName}.

CRITICAL INSTRUCTIONS:
1. Write SHORT, COMPLETE, and PERFECT answers (2-4 sentences maximum)
2. Answer the question DIRECTLY and comprehensively
3. Use PLAIN TEXT ONLY - absolutely NO formatting symbols
4. NO bold (**text**), NO italics (*text*), NO bullet points, NO numbered lists
5. NO special characters like //, --, ==, etc.
6. Write naturally as if speaking to a student

ANSWER STRATEGY:
- First, try to answer based on the provided reference materials
- If the reference materials don't contain sufficient information to answer the question, provide a general answer based on your knowledge
- If using general knowledge (not from reference materials), start your answer with:
  ${language === "sv" ? "OBS: Generellt svar (information ej funnen i uppladdade dokument)." : "Note: General answer (information not found in uploaded documents)."}

Guidelines:
- Answer in ${languageName}
- Keep answers SHORT but COMPLETE (2-4 sentences)
- Answer directly without preamble
- Prefer reference materials, but use general knowledge if needed
- Use plain text, no formatting
- Be clear, precise, and comprehensive
- This is the PERFECT answer students should aim for`

      userPrompt = `REFERENCE MATERIALS:
${documentContext}

QUESTION:
${question}

Provide a SHORT, COMPLETE, PERFECT answer (2-4 sentences). If the reference materials contain the answer, use them. If not, provide a general answer and start with the note. Use plain text only, no formatting. Answer in ${languageName}.`
    } else {
      systemPrompt = `You are an expert educational assistant creating perfect answers for open-ended quiz questions.

LANGUAGE: Respond in ${languageName}.

CRITICAL INSTRUCTIONS:
1. Write SHORT, COMPLETE, and PERFECT answers (2-4 sentences maximum)
2. Answer the question DIRECTLY and comprehensively
3. Use PLAIN TEXT ONLY - absolutely NO formatting symbols
4. NO bold (**text**), NO italics (*text*), NO bullet points, NO numbered lists
5. Write naturally as if speaking to a student

IMPORTANT: The student has NOT uploaded reference materials, so provide a general but perfect answer.

Start with this note:
${
  languageName === "Swedish"
    ? "OBS: Generellt svar (inga dokument uppladdade)."
    : "Note: General answer (no documents uploaded)."
}

Then provide your SHORT, PERFECT answer.

Guidelines:
- Answer in ${languageName}
- Keep answers SHORT but COMPLETE (2-4 sentences after the note)
- Answer directly without preamble
- Use plain text, no formatting
- Be clear, precise, and comprehensive
- This is the PERFECT answer students should aim for`

      userPrompt = `QUESTION:
${question}

Provide a SHORT, COMPLETE, PERFECT answer (2-4 sentences after the note). Use plain text only, no formatting. Answer in ${languageName}.`
    }

    console.log(`🤖 Generating open-ended answer with OpenAI...`)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 250,
    })

    const answer = completion.choices[0]?.message?.content

    if (!answer) {
      throw new Error("No answer generated from AI")
    }

    const cleanedAnswer = cleanMarkdownFormatting(answer)

    const isGeneralFromDocuments =
      hasDocuments && (cleanedAnswer.includes("OBS: Generellt svar") || cleanedAnswer.includes("Note: General answer"))

    console.log(`✅ Answer generated successfully (${cleanedAnswer.length} characters)`)
    console.log(
      `📊 Answer type: ${isGeneralFromDocuments ? "General (not in documents)" : hasDocuments ? "From documents" : "General (no documents)"}`,
    )

    return NextResponse.json({
      success: true,
      answer: cleanedAnswer.trim(),
      hasDocuments,
      language: languageName,
      documentsProcessed,
      isGeneralAnswer: !hasDocuments || isGeneralFromDocuments,
      warningMessage: !hasDocuments
        ? languageName === "Swedish"
          ? "Detta är ett generellt svar. Ladda upp dokument för mer specifika svar."
          : "This is a general answer. Upload documents for more specific answers."
        : isGeneralFromDocuments
          ? languageName === "Swedish"
            ? "Information hittades inte i dina uppladdade dokument. Detta är ett generellt svar."
            : "Information not found in your uploaded documents. This is a general answer."
          : undefined,
    })
  } catch (error) {
    console.error("❌ Error generating open-ended answer:", error)

    let errorMessage = "Failed to generate answer"
    if (error instanceof OpenAI.APIError) {
      errorMessage = "AI service temporarily unavailable. Please try again."
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
