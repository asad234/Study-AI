import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import OpenAI from "openai"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const { message, conversationId, documentIds, projectIds } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "At least one document must be selected" }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

    const documents = await payload.find({
      collection: "documents",
      where: {
        id: { in: documentIds },
        user: { equals: userProfile.id },
        status: { equals: "ready" },
      },
      limit: 50,
    })

    if (!documents.docs.length) {
      return NextResponse.json({ error: "No valid documents found" }, { status: 404 })
    }

    // DEBUG: Log document structure to understand what fields are available
    console.log("=== DOCUMENT DEBUG INFO ===")
    documents.docs.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`, {
        id: doc.id,
        title: doc.title,
        status: doc.status,
        notesLength: doc.notes?.length || 0,
        notesPreview: doc.notes?.substring(0, 200) || "NO NOTES FIELD",
        availableFields: Object.keys(doc),
      })
    })

    // Try different possible content fields
    const documentContext = documents.docs
      .map((doc) => {
        // Try multiple possible content fields
        const content = 
          doc.notes || 
          doc.content || 
          doc.extracted_text || 
          doc.text || 
          "No content available"
        
        console.log(`Document "${doc.title}" content length:`, content.length)
        return `[Document: ${doc.title}]\n${content}\n`
      })
      .join("\n")

    // DEBUG: Log the full context being sent to OpenAI
    console.log("=== CONTEXT BEING SENT TO OPENAI ===")
    console.log("Total context length:", documentContext.length)
    console.log("Context preview (first 500 chars):", documentContext.substring(0, 500))
    console.log("Context preview (last 500 chars):", documentContext.substring(documentContext.length - 500))

    const documentTitles = documents.docs.map((doc) => doc.title)

    // Get or create conversation
    let conversation
    if (conversationId) {
      const existingConversation = await payload.findByID({
        collection: "chat_conversations",
        id: conversationId,
      })
      conversation = existingConversation
    } else {
      conversation = await payload.create({
        collection: "chat_conversations",
        data: {
          user: userProfile.id,
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })
    }

    // Save user message
    await payload.create({
      collection: "chat_messages",
      data: {
        conversation: conversation.id,
        user: userProfile.id,
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      },
    })

    const systemPrompt = `You are StudyBuddy, an AI tutor that helps students learn from their study materials. Answer questions clearly based on the uploaded documents.

RESPONSE STRUCTURE - FOLLOW EXACTLY:

Start with a brief, friendly introduction (1-2 sentences).

Then break down your answer into clear elements:

ELEMENT 1: [First key point or concept]
Explanation: [Clear explanation in 2-3 sentences]

ELEMENT 2: [Second key point or concept]
Explanation: [Clear explanation in 2-3 sentences]

ELEMENT 3: [Third key point or concept]
Explanation: [Clear explanation in 2-3 sentences]

(Add more elements as needed - use as many as required to fully answer the question)

SUMMARY:
[Provide a brief summary that ties everything together in 2-3 sentences]

End with:
(Source: [Document Name])

or for Swedish documents:
(Källa: [Document Name])

IMPORTANT RULES:
1. Always search the document first for the answer
2. For multiple choice questions, show all options and state which is correct
3. Break down complex topics into clear elements
4. Each element should focus on ONE key point
5. Keep explanations clear and educational
6. Use simple language that students can understand

DOCUMENT CONTENT:
${documentContext}

STUDENT QUESTION: ${message}

REMEMBER:
- Use ELEMENT 1, ELEMENT 2, ELEMENT 3 format
- Each element = one key concept with explanation
- End with SUMMARY and source
- Base everything on the document content`

    // DEBUG: Log the system prompt length
    console.log("=== SYSTEM PROMPT INFO ===")
    console.log("System prompt length:", systemPrompt.length)

    // Generate AI response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Best model for instruction following and tutoring
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3, // Lower = more consistent
      max_tokens: 2000, // Increased for better explanations
    })

    const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response."

    // DEBUG: Log token usage
    console.log("=== OPENAI RESPONSE INFO ===")
    console.log("Tokens used:", completion.usage)
    console.log("Response length:", aiResponse.length)

    // Save AI response
    const aiMessage = await payload.create({
      collection: "chat_messages",
      data: {
        conversation: conversation.id,
        user: userProfile.id,
        role: "assistant",
        content: aiResponse,
        metadata: {
          relatedFiles: documentTitles,
        },
        created_at: new Date().toISOString(),
      },
    })

    const response = {
      message: {
        id: aiMessage.id,
        content: aiResponse,
        role: "assistant" as const,
        timestamp: new Date(),
        relatedFiles: documentTitles,
      },
      conversationId: conversation.id,
    }

    return NextResponse.json({ success: true, ...response })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}