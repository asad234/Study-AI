import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import OpenAI from "openai"

export const runtime = "nodejs"
export const maxDuration = 60

// Chat limits
const FREE_CHAT_LIMIT = 5

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const { message, conversationId, documentIds } = await request.json()

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

    // Get user data for plan checking
    const users = await payload.find({
      collection: "users",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!users.docs.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users.docs[0]

    // Check if user is Pro
    const isPro = user.plan === "pro" && user.subscriptionStatus === "active"

    // Check chat limit for free users
    if (!isPro) {
      const chatCount = user.chatCount || 0
      
      console.log(`📊 Free user chat check - Current count: ${chatCount}/${FREE_CHAT_LIMIT}`)
      
      if (chatCount >= FREE_CHAT_LIMIT) {
        console.log(`❌ Chat limit reached for user: ${user.email}`)
        return NextResponse.json(
          {
            error: "Chat limit reached",
            message: `You've reached your limit of ${FREE_CHAT_LIMIT} free chats. Upgrade to Pro for unlimited chats!`,
            limitReached: true,
            remainingChats: 0,
            chatLimit: FREE_CHAT_LIMIT,
          },
          { status: 403 }
        )
      }
    }

    // Process documents with validation (similar to flashcard API)
    const validDocuments: Array<{
      id: string
      title: string
      content: string
    }> = []
    const failedDocuments: Array<{
      id: string
      reason: string
    }> = []

    console.log(`\n📚 Processing ${documentIds.length} document(s) for chat`)

    for (const documentId of documentIds) {
      try {
        console.log(`\n📄 Processing document: ${documentId}`)

        // Fetch document
        const document = await payload.findByID({
          collection: "documents",
          id: documentId,
        })

        if (!document) {
          console.error(`❌ Document not found: ${documentId}`)
          failedDocuments.push({ id: documentId, reason: "Document not found" })
          continue
        }

        console.log(`✓ Document found: ${document.title || document.file_name}`)

        // Check ownership
        const documentUserId =
          typeof document.user === "object" && document.user !== null
            ? document.user.id
            : document.user

        if (documentUserId !== userProfile.id) {
          console.error(`❌ Access denied for document: ${documentId}`)
          failedDocuments.push({ id: documentId, reason: "Access denied" })
          continue
        }

        // Check if document is ready
        if (document.status !== "ready") {
          console.error(`❌ Document not ready: ${documentId} (status: ${document.status})`)
          failedDocuments.push({
            id: documentId,
            reason: `Document not ready (status: ${document.status})`,
          })
          continue
        }

        // Get content with validation
        const documentContent = document.notes || ""

        if (!documentContent || documentContent.length < 50) {
          console.error(`❌ Insufficient content: ${documentId} (${documentContent.length} chars)`)
          failedDocuments.push({
            id: documentId,
            reason: `Insufficient content (${documentContent.length} characters)`,
          })
          continue
        }

        console.log(`✓ Valid content: ${documentContent.length} characters`)

        validDocuments.push({
          id: documentId,
          title: document.title || document.file_name || "Untitled",
          content: documentContent,
        })
      } catch (docError) {
        console.error(`❌ Error processing document ${documentId}:`, docError)
        failedDocuments.push({
          id: documentId,
          reason: docError instanceof Error ? docError.message : "Unknown error",
        })
      }
    }

    // Check if we have any valid documents
    if (validDocuments.length === 0) {
      return NextResponse.json(
        {
          error: "No valid documents available for chat",
          details: failedDocuments,
          solution: "Please ensure your documents have extracted text content and are marked as 'ready'",
        },
        { status: 400 }
      )
    }

    console.log(`✅ ${validDocuments.length} valid document(s) ready for chat`)
    if (failedDocuments.length > 0) {
      console.log(`⚠️ ${failedDocuments.length} document(s) failed:`, failedDocuments)
    }

    // Build document context
    const documentContext = validDocuments
      .map((doc) => `[Document: ${doc.title}]\n${doc.content}\n`)
      .join("\n---\n\n")

    const documentTitles = validDocuments.map((doc) => doc.title)

    console.log("📝 Total context length:", documentContext.length, "characters")

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await payload.findByID({
        collection: "chat_conversations",
        id: conversationId,
      })
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

    const systemPrompt = `You are StudyBuddy, an AI tutor that helps students learn from their study materials. Answer questions by intelligently analyzing the uploaded documents for relevant information.

INTELLIGENT DOCUMENT ANALYSIS:
- Look for RELATED TOPICS, not just exact keyword matches
- If asked about "data processing", also consider content about "computation", "data handling", "algorithms", etc.
- Use SEMANTIC UNDERSTANDING to find relevant sections
- Synthesize answers from similar subjects and related concepts
- Connect ideas across different parts of the documents
- Even if exact answer isn't present, use related content to construct helpful responses

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

OR if using general knowledge:
(Source: General Knowledge - this information is not from your uploaded documents)
or for Swedish:
(Källa: Allmän kunskap - denna information kommer inte från dina uppladdade dokument)

IMPORTANT RULES:
1. FIRST, intelligently search documents for RELATED topics and concepts (not just exact keywords)
2. If RELATED information is found in documents, use it to construct the answer and cite the document(s)
3. Look for similar subjects: if asked about "machine learning", also consider "AI", "neural networks", "training models", etc.
4. Synthesize information from multiple related sections if needed
5. Only use general knowledge if NO related information exists in any documents
6. When using document content (even if indirectly related), cite the specific document(s)
7. When using general knowledge, CLEARLY state this in the source citation
8. For multiple choice questions, show all options and state which is correct
9. Break down complex topics into clear elements
10. Each element should focus on ONE key point
11. Keep explanations clear and educational
12. Use simple language that students can understand

AVAILABLE DOCUMENTS:
You have access to ${validDocuments.length} document(s): ${documentTitles.join(", ")}

DOCUMENT CONTENT:
${documentContext}

STUDENT QUESTION: ${message}

REMEMBER:
- PRIORITIZE document content (including RELATED topics) over general knowledge
- Be SMART about finding relevant information - think semantically, not just keywords
- If documents discuss similar subjects, use that content even if not exact match
- Use ELEMENT 1, ELEMENT 2, ELEMENT 3 format
- Each element = one key concept with explanation
- End with SUMMARY and source
- If answer is from documents (or related content in documents), cite document names
- If answer is from general knowledge, clearly state "Source: General Knowledge - this information is not from your uploaded documents" or "Källa: Allmän kunskap - denna information kommer inte från dina uppladdade dokument"
- Be transparent about your information source
- ALWAYS try to find something relevant in the documents before using general knowledge`

    console.log("🤖 Generating AI response...")

    // Generate AI response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const aiResponse = completion.choices[0]?.message?.content || 
      "I apologize, but I couldn't generate a response."

    console.log("✅ AI response generated")
    console.log("📊 Token usage:", completion.usage)

    // Increment chat count for free users ONLY after successful response
    if (!isPro) {
      const newChatCount = (user.chatCount || 0) + 1
      await payload.update({
        collection: "users",
        id: user.id,
        data: {
          chatCount: newChatCount,
        },
      })
      console.log(`✅ Chat count incremented: ${newChatCount}/${FREE_CHAT_LIMIT}`)
    }

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
          processedDocuments: validDocuments.length,
          failedDocuments: failedDocuments.length,
        },
        created_at: new Date().toISOString(),
      },
    })

    // Calculate remaining chats for free users
    const remainingChats = isPro ? -1 : Math.max(0, FREE_CHAT_LIMIT - (user.chatCount || 0) - 1)

    const response = {
      message: {
        id: aiMessage.id,
        content: aiResponse,
        role: "assistant" as const,
        timestamp: new Date(),
        relatedFiles: documentTitles,
      },
      conversationId: conversation.id,
      metadata: {
        processedDocuments: validDocuments.length,
        failedDocuments: failedDocuments.length,
        ...(failedDocuments.length > 0 && { failedDetails: failedDocuments }),
        // Add chat limit info for free users
        ...(!isPro && {
          remainingChats,
          chatLimit: FREE_CHAT_LIMIT,
        }),
      },
    }

    return NextResponse.json({ success: true, ...response })
  } catch (error) {
    console.error("❌ Chat API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}