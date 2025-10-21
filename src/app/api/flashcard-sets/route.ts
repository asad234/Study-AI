import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

// GET /api/flashcard-sets - Fetch all flashcard sets for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
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

    // Fetch flashcard sets for this user
    const flashcardSets = await payload.find({
      collection: "flashcard-sets",
      where: {
        user: { equals: userId },
      },
      sort: "-createdAt",
      limit: 100,
    })

    // Calculate mastery percentage for each set
    const formattedSets = await Promise.all(
      flashcardSets.docs.map(async (set: any) => {
        let masteryPercentage = 0
        
        // Get all flashcards that belong to this set
        try {
          const flashcardsInSet = await payload.find({
            collection: "flashcards",
            where: {
              flashcardSet: { equals: set.id }
            },
            limit: 1000,
          })

          const totalCards = flashcardsInSet.docs.length
          
          if (totalCards > 0) {
            // Count how many are mastered
            const masteredCards = flashcardsInSet.docs.filter(
              (card: any) => card.mastered === true
            ).length
            
            // Calculate percentage
            masteryPercentage = Math.round((masteredCards / totalCards) * 100)
          }
        } catch (error) {
          console.error(`Error calculating mastery for set ${set.id}:`, error)
        }

        return {
          id: set.id,
          name: set.name,
          cardCount: set.cardCount || 0,
          status: set.status || "active",
          createdAt: set.createdAt,
          description: set.description,
          subject: set.subject,
          masteryPercentage,
          lastStudied: set.lastStudied,
        }
      })
    )

    return NextResponse.json({
      success: true,
      flashcardSets: formattedSets,
    })
  } catch (error) {
    console.error("Error fetching flashcard sets:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch flashcard sets" },
      { status: 500 }
    )
  }
}

// POST /api/flashcard-sets - Create a new flashcard set
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, subject, status, projectId, flashcardIds } = body

    console.log("📝 Creating flashcard set:", {
      name,
      projectId,
      projectIdType: typeof projectId,
      flashcardIdsCount: flashcardIds?.length
    })

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      )
    }

    if (!flashcardIds || flashcardIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one flashcard is required" },
        { status: 400 }
      )
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

    // Validate and verify project ID if provided
    let validatedProjectId: string | null = null
    
    if (projectId && typeof projectId === 'string' && projectId.trim() !== '') {
      const cleanProjectId = projectId.trim()
      
      try {
        // CRITICAL: Verify the project actually exists in the database
        const projectExists = await payload.findByID({
          collection: "projects",
          id: cleanProjectId,
        })
        
        if (projectExists) {
          // Additional check: verify user owns this project
          const projectUserId = typeof projectExists.user === 'object' 
            ? projectExists.user.id 
            : projectExists.user
          
          if (projectUserId === userId) {
            validatedProjectId = cleanProjectId
            console.log("✅ Valid project ID verified:", validatedProjectId)
          } else {
            console.warn("⚠️ User doesn't own project, skipping project association")
          }
        } else {
          console.warn("⚠️ Project ID provided but project not found:", cleanProjectId)
        }
      } catch (error) {
        console.warn("⚠️ Error validating project ID, creating set without project:", error)
      }
    } else {
      console.log("ℹ️ No project ID provided or invalid format - creating unlinked flashcard set")
    }

    // Build flashcard set data - only include fields with valid values
    const flashcardSetData: any = {
      name,
      status: status || "active",
      user: userId,
      flashcards: flashcardIds,
      cardCount: flashcardIds.length,
    }

    // Add optional fields only if they exist
    if (description && description.trim()) {
      flashcardSetData.description = description.trim()
    }

    if (subject && subject.trim()) {
      flashcardSetData.subject = subject.trim()
    }

    // CRITICAL: Only add project if we validated it exists
    // Do NOT add the key at all if there's no valid project
    if (validatedProjectId) {
      flashcardSetData.project = validatedProjectId
      console.log("✅ Including project in flashcard set")
    } else {
      console.log("ℹ️ Creating flashcard set without project association")
    }

    console.log("📦 Final flashcard set data:", {
      ...flashcardSetData,
      flashcards: `[${flashcardSetData.flashcards.length} IDs]`, // Don't log all IDs
    })

    // Create the flashcard set
    const newSet = await payload.create({
      collection: "flashcard-sets",
      data: flashcardSetData,
    })

    console.log("✅ Successfully created flashcard set:", newSet.id)

    // Update each flashcard to reference this set
    const updatePromises = flashcardIds.map(async (flashcardId: string) => {
      try {
        await payload.update({
          collection: "flashcards",
          id: flashcardId,
          data: {
            flashcardSet: newSet.id,
          },
        })
        return { id: flashcardId, success: true }
      } catch (error) {
        console.error(`❌ Failed to update flashcard ${flashcardId}:`, error)
        return { id: flashcardId, success: false, error }
      }
    })

    const results = await Promise.allSettled(updatePromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    
    console.log(`✅ Successfully linked ${successCount}/${flashcardIds.length} flashcards to set ${newSet.id}`)

    return NextResponse.json({
      success: true,
      flashcardSet: {
        id: newSet.id,
        name: newSet.name,
        cardCount: newSet.cardCount,
        hasProject: !!validatedProjectId,
      },
      message: `Successfully saved ${flashcardIds.length} flashcard(s) to "${name}"`,
    })
  } catch (error) {
    console.error("❌ Error creating flashcard set:", error)
    
    // Provide detailed error information
    let errorMessage = "Failed to create flashcard set"
    let errorDetails = ""
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for specific validation errors
      if (error.message.includes("Project")) {
        errorDetails = "Project validation failed. The flashcard set will be created without a project association. " +
          "This is normal when flashcards come from multiple projects or when the project ID is invalid."
      } else if (error.message.includes("validation")) {
        errorDetails = "A field validation error occurred. Check that all required fields are valid."
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails || "Check server logs for more information"
      },
      { status: 500 }
    )
  }
}