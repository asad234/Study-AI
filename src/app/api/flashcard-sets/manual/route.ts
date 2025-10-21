// app/api/flashcard-sets/manual/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

export const runtime = "nodejs"

interface ManualFlashcard {
  question: string
  answer: string
  difficulty?: string
  subject?: string
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

    const { 
      projectName, 
      category, 
      studyGoal, 
      flashcards,
      documentIds 
    } = await request.json()

    console.log("📝 Creating manual flashcard set:", {
      projectName,
      category,
      flashcardsCount: flashcards?.length,
      documentIds
    })

    // Validation
    if (!projectName || !projectName.trim()) {
      return NextResponse.json(
        { success: false, error: "Deck name is required" },
        { status: 400 }
      )
    }

    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one flashcard is required" },
        { status: 400 }
      )
    }

    // Validate each flashcard
    for (const card of flashcards) {
      if (!card.question || !card.question.trim()) {
        return NextResponse.json(
          { success: false, error: "All flashcards must have a question" },
          { status: 400 }
        )
      }
      if (!card.answer || !card.answer.trim()) {
        return NextResponse.json(
          { success: false, error: "All flashcards must have an answer" },
          { status: 400 }
        )
      }
    }

    const payload = await getPayload({ config })

    // Get user profile
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

    // Determine which document to associate (use first uploaded doc if available)
    let primaryDocumentId = null
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      // Verify the first document exists and belongs to user
      try {
        const doc = await payload.findByID({
          collection: "documents",
          id: documentIds[0],
        })

        const docUserId = typeof doc.user === 'object' ? doc.user.id : doc.user
        if (docUserId === userId) {
          primaryDocumentId = documentIds[0]
          console.log(`✅ Using document ${primaryDocumentId} as primary reference`)
        }
      } catch (error) {
        console.warn("⚠️ Could not verify document, creating without document reference")
      }
    }

    // If no documents uploaded, create a placeholder document
    if (!primaryDocumentId) {
      console.log("📄 Creating placeholder document for manual flashcards...")
      
      const placeholderDoc = await payload.create({
        collection: "documents",
        data: {
          title: `${projectName} - Manual Flashcards`,
          file_name: "manual_creation",
          file_type: "manual",
          status: "ready",
          user: userId,
          notes: `Manually created flashcard deck: ${projectName}`,
        },
      })

      primaryDocumentId = placeholderDoc.id
      console.log(`✅ Created placeholder document: ${primaryDocumentId}`)
    }

    // Create flashcards in database
    console.log(`💾 Creating ${flashcards.length} flashcard(s)...`)
    const createdFlashcardIds: (string | number)[] = []

    for (const card of flashcards) {
      try {
        const flashcardData = {
          question: card.question.trim(),
          answer: card.answer.trim(),
          difficulty: card.difficulty || "medium",
          subject: category || card.subject || "General",
          user: userId,
          document: primaryDocumentId,
          mastered: false,
          review_count: 0,
          tags: card.tags || [],
        }

        const created = await payload.create({
          collection: "flashcards",
          data: flashcardData,
        })

        createdFlashcardIds.push(created.id)
        console.log(`✅ Created flashcard: ${created.id}`)
      } catch (error) {
        console.error("❌ Error creating flashcard:", error)
        // Continue with other flashcards even if one fails
      }
    }

    if (createdFlashcardIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to create any flashcards" },
        { status: 500 }
      )
    }

    // Create the flashcard set
    console.log("📚 Creating flashcard set...")
    
    const flashcardSetData: any = {
      name: projectName.trim(),
      status: "active",
      user: userId,
      flashcards: createdFlashcardIds,
      cardCount: createdFlashcardIds.length,
    }

    if (category && category.trim()) {
      flashcardSetData.subject = category.trim()
    }

    if (studyGoal && studyGoal.trim()) {
      flashcardSetData.description = `Study Goal: ${studyGoal.trim()}`
    }

    const newSet = await payload.create({
      collection: "flashcard-sets",
      data: flashcardSetData,
    })

    // Update each flashcard to reference this set
    console.log("🔗 Linking flashcards to set...")
    const updatePromises = createdFlashcardIds.map(async (flashcardId: string | number) => {
      try {
        await payload.update({
          collection: "flashcards",
          id: flashcardId,
          data: {
            flashcardSet: newSet.id,
          },
        })
        return { success: true }
      } catch (error) {
        console.error(`Failed to link flashcard ${flashcardId}:`, error)
        return { success: false }
      }
    })

    await Promise.allSettled(updatePromises)

    console.log(`✅ Successfully created flashcard set: ${newSet.id}`)
    console.log(`📊 Total flashcards: ${createdFlashcardIds.length}/${flashcards.length}`)

    return NextResponse.json({
      success: true,
      flashcardSet: {
        id: newSet.id,
        name: newSet.name,
        cardCount: newSet.cardCount,
      },
      flashcards: createdFlashcardIds,
      message: `Successfully created "${projectName}" with ${createdFlashcardIds.length} flashcard(s)`,
    })

  } catch (error) {
    console.error("❌ Error creating manual flashcard set:", error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to create flashcard set"
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}