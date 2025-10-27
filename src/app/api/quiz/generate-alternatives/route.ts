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

// Helper function to shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
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

    const { question, documentIds } = await request.json()

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
      systemPrompt = `You are an expert educational assistant creating multiple-choice quiz alternatives.

LANGUAGE: Respond in ${languageName}.

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY 4 alternatives (one correct, three incorrect)
2. The FIRST alternative MUST be the correct answer
3. Use PLAIN TEXT ONLY - absolutely NO formatting symbols
4. NO bold (**text**), NO italics (*text*), NO bullet points, NO numbered lists
5. Keep alternatives SHORT and CONCISE (1-2 sentences maximum each)
6. Make incorrect alternatives plausible but clearly wrong
7. Base alternatives ONLY on the provided reference materials

Guidelines:
- Answer in ${languageName}
- First alternative = correct answer
- Alternatives 2-4 = plausible but incorrect
- Use plain text, no formatting
- Keep alternatives brief and clear
- Base on reference materials only`

      userPrompt = `REFERENCE MATERIALS:
${documentContext}

QUESTION:
${question}

Generate EXACTLY 4 alternatives in ${languageName}. Format as:
1. [Correct answer]
2. [Incorrect alternative]
3. [Incorrect alternative]
4. [Incorrect alternative]

Use plain text only, no formatting.`
    } else {
      systemPrompt = `You are an expert educational assistant creating multiple-choice quiz alternatives.

LANGUAGE: Respond in ${languageName}.

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY 4 alternatives (one correct, three incorrect)
2. The FIRST alternative MUST be the correct answer
3. Use PLAIN TEXT ONLY - absolutely NO formatting symbols
4. NO bold (**text**), NO italics (*text*), NO bullet points, NO numbered lists
5. Keep alternatives SHORT and CONCISE (1-2 sentences maximum each)
6. Make incorrect alternatives plausible but clearly wrong

IMPORTANT: The student has NOT uploaded reference materials, so provide general alternatives.

Start with this note:
${
  languageName === "Swedish"
    ? "OBS: Generella alternativ (inga dokument uppladdade)."
    : "Note: General alternatives (no documents uploaded)."
}

Then provide your 4 alternatives.

Guidelines:
- Answer in ${languageName}
- First alternative = correct answer
- Alternatives 2-4 = plausible but incorrect
- Use plain text, no formatting
- Keep alternatives brief and clear`

      userPrompt = `QUESTION:
${question}

Generate EXACTLY 4 alternatives in ${languageName}. Format as:
1. [Correct answer]
2. [Incorrect alternative]
3. [Incorrect alternative]
4. [Incorrect alternative]

Use plain text only, no formatting.`
    }

    console.log(`🤖 Generating alternatives with OpenAI...`)

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
      temperature: 0.4,
      max_tokens: 300,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error("No alternatives generated from AI")
    }

    // Parse the alternatives from the response
    const lines = response.split("\n").filter((line) => line.trim())
    const alternatives: string[] = []

    for (const line of lines) {
      if (line.toLowerCase().includes("note:") || line.toLowerCase().includes("obs:")) {
        continue
      }

      const match = line.match(/^\d+\.\s*(.+)$/)
      if (match) {
        const cleanedAlt = cleanMarkdownFormatting(match[1].trim())
        if (cleanedAlt) {
          alternatives.push(cleanedAlt)
        }
      }
    }

    if (alternatives.length < 4) {
      throw new Error(`Only generated ${alternatives.length} alternatives, need 4`)
    }

    const finalAlternatives = alternatives.slice(0, 4)

    const shuffledAlternatives = shuffleArray(finalAlternatives)
    const correctAnswerIndex = shuffledAlternatives.indexOf(finalAlternatives[0])

    console.log(`✅ Generated ${shuffledAlternatives.length} alternatives successfully`)
    console.log(`🎲 Correct answer is now at index: ${correctAnswerIndex}`)

    return NextResponse.json({
      success: true,
      alternatives: shuffledAlternatives,
      correctAnswerIndex: correctAnswerIndex, // Now returns the shuffled position
      hasDocuments,
      language: languageName,
      documentsProcessed,
      isGeneralAnswer: !hasDocuments,
      warningMessage: !hasDocuments
        ? languageName === "Swedish"
          ? "Detta är ett generellt svar. Ladda upp dokument för mer specifika svar."
          : "This is a general answer. Upload documents for more specific answers."
        : undefined,
    })
  } catch (error) {
    console.error("❌ Error generating alternatives:", error)

    let errorMessage = "Failed to generate alternatives"
    if (error instanceof OpenAI.APIError) {
      errorMessage = "AI service temporarily unavailable. Please try again."
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
