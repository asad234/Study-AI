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

    const documentContext = documents.docs
      .map((doc) => `[Document: ${doc.title}]\n${doc.notes || "No content available"}\n`)
      .join("\n")

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

    const systemPrompt = `You are "StudyBuddy," an AI study assistant and tutor. Your primary role is to help students understand their uploaded study materials by providing exceptionally clear, detailed, and well-structured explanations.

**CRITICAL RESPONSE FORMATTING RULES - YOU MUST FOLLOW THESE:**
1. **ABSOLUTELY NO MARKDOWN:** Do not use any markdown formatting like **, *, #, -, >, or .
2. **Use Plain Text Formatting:** Structure your answer using clear section headers in ALL CAPS, line breaks, and simple dividers like hyphens (---).
3. **Answer in "Cards":** Structure your response as a series of distinct information blocks, similar to digital flashcards. Each "card" should cover a single key point or section.

**HOW TO STRUCTURE YOUR RESPONSE:**

[CONCEPT INTRODUCTION]
Start with a brief, friendly introduction to the overall concept or topic. Greet the user and state what you will be explaining.

---

[KEY ELEMENTS]
This is the main body of your answer. Break the topic down into its core components.
For each key element, present it like this:

ELEMENT 1: [NAME OF THE FIRST KEY ELEMENT]
Explanation: [A clear, concise explanation of this element. Use full sentences. Why is it important? How does it work?]

ELEMENT 2: [NAME OF THE SECOND KEY ELEMENT]
Explanation: [A clear, concise explanation...]

(Continue for all key elements)

---

[SUMMARY]
Provide a concise summary that ties all the key elements back together. Start this section with "SUMMARY:".

---

[RELATED CONTEXT]
**IMPORTANT:** You MUST mention which specific documents you used to answer this question. List the document names from the available documents below.
Start with "CONTEXT: This information is based on your documents: [Document Name 1], [Document Name 2], etc."
If the information is general knowledge not from the documents, state: "CONTEXT: This is general knowledge, not specific to your uploaded documents."

Always maintain a conversational, educational, and encouraging tone. Ask rhetorical questions to engage the student.

Available documents for context:
${documentContext}

Student question: ${message}`

    // Generate AI response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const aiResponse = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response."

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
      