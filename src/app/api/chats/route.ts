import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const { message, conversationId } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
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

    // Get user's documents for context
    const documents = await payload.find({
      collection: "documents",
      where: { user: { equals: userProfile.id } },
      limit: 10,
    })

    // Create document context for AI
    const documentContext = documents.docs
      .filter((doc) => doc.status === "ready")
      .map((doc) => `Document: ${doc.title}\nContent: ${doc.notes || "No content available"}`)
      .join("\n\n")

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

    // Generate AI response
    const systemPrompt = `You are an AI study assistant helping students understand their uploaded materials. 

Available documents:
${documentContext}

Instructions:
- Answer questions based on the provided documents when possible
- If information isn't in the documents, provide general educational help
- Be encouraging and supportive
- Suggest follow-up questions when appropriate
- Keep responses concise but informative
- Reference specific documents when relevant`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: `Student question: ${message}`,
    })

    // Save AI response
    const aiMessage = await payload.create({
      collection: "chat_messages",
      data: {
        conversation: conversation.id,
        user: userProfile.id,
        role: "assistant",
        content: text,
        metadata: {
          relatedFiles: documents.docs
            .filter((doc) => doc.status === "ready")
            .map((doc) => doc.title)
            .slice(0, 3),
        },
        created_at: new Date().toISOString(),
      },
    })

    // Generate suggested follow-up questions
    const suggestedQuestions = [
      "Can you explain this concept in simpler terms?",
      "What are some practice problems for this topic?",
      "How does this relate to other concepts?",
      "Can you provide a summary of the key points?",
    ]

    const response = {
      message: {
        id: aiMessage.id,
        content: text,
        role: "assistant" as const,
        timestamp: new Date(),
        relatedFiles: documents.docs
          .filter((doc) => doc.status === "ready")
          .map((doc) => doc.title)
          .slice(0, 3),
      },
      conversationId: conversation.id,
      suggestedQuestions,
    }

    return NextResponse.json({ success: true, ...response })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

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

    if (conversationId) {
      // Get specific conversation messages
      const messages = await payload.find({
        collection: "chat_messages",
        where: {
          conversation: { equals: conversationId },
          user: { equals: userProfile.id },
        },
        sort: "created_at",
        limit: 100,
      })

      return NextResponse.json({
        success: true,
        messages: messages.docs.map((msg) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.created_at),
          relatedFiles: msg.metadata?.relatedFiles || [],
        })),
      })
    } else {
      // Get user's conversations
      const conversations = await payload.find({
        collection: "chat_conversations",
        where: { user: { equals: userProfile.id } },
        sort: "-updated_at",
        limit: 20,
      })

      return NextResponse.json({
        success: true,
        conversations: conversations.docs,
      })
    }
  } catch (error) {
    console.error("Chat GET API error:", error)
    return NextResponse.json({ error: "Failed to fetch chat data" }, { status: 500 })
  }
}
