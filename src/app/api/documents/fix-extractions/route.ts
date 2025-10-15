// app/api/documents/fix-extractions/route.ts
// This endpoint will re-trigger extraction for all documents that need it

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import configPromise from "@payload-config"

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })

    // Get user profile
    const profiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (profiles.docs.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    console.log("🔍 Finding documents needing extraction...")

    // Find all user's documents
    const documents = await payload.find({
      collection: "documents",
      where: {
        user: { equals: userProfile.id },
      },
    })

    console.log(`📊 Found ${documents.docs.length} total documents`)

    // Filter documents that need extraction:
    // - Have a media file
    // - Status is "ready" but no content, OR status is "pending"
    const documentsNeedingExtraction = documents.docs.filter(doc => {
      const hasFile = !!doc.media_file
      const notesValue = doc.notes
      const notesLength = typeof notesValue === 'string' ? notesValue.length : 0
      const hasNoContent = !notesValue || notesLength < 50
      const needsExtraction = (doc.status === "ready" && hasNoContent) || doc.status === "pending"
      
      // Debug logging for ALL documents
      console.log(`🔍 Document ${doc.id} (${doc.title || doc.file_name}):`, {
        status: doc.status,
        hasFile,
        notesType: typeof notesValue,
        notesLength,
        hasNoContent,
        needsExtraction,
      })
      
      if (needsExtraction && hasFile) {
        console.log(`✅ Document ${doc.id} NEEDS extraction`)
      }
      
      return hasFile && needsExtraction
    })

    console.log(`📊 Found ${documentsNeedingExtraction.length} documents needing extraction`)

    if (documentsNeedingExtraction.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No documents need extraction",
        results: {
          total: 0,
          triggered: 0,
          failed: []
        }
      })
    }

    const results = {
      total: documentsNeedingExtraction.length,
      triggered: 0,
      failed: [] as Array<{id: string | number, title: string, error: string}>,
    }

    // Trigger extraction for each document
    for (const doc of documentsNeedingExtraction) {
      try {
        console.log(`🔄 Triggering extraction for document ${doc.id}: ${doc.title || doc.file_name}`)
        
        const extractUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/documents/${doc.id}/extract`
        
        const extractResponse = await fetch(extractUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-api-key": process.env.INTERNAL_API_KEY || "default-key-change-in-production",
          },
        })

        const extractData = await extractResponse.json()

        if (extractResponse.ok && extractData.success) {
          results.triggered++
          console.log(`✅ Successfully triggered extraction for document ${doc.id}`)
          console.log(`   Text length: ${extractData.textLength} characters`)
        } else {
          const errorMsg = extractData.error || "Unknown error"
          results.failed.push({
            id: doc.id,
            title: doc.title || doc.file_name,
            error: errorMsg
          })
          console.error(`❌ Failed to trigger extraction for document ${doc.id}:`, errorMsg)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        results.failed.push({
          id: doc.id,
          title: doc.title || doc.file_name,
          error: errorMessage
        })
        console.error(`❌ Error triggering extraction for document ${doc.id}:`, error)
      }
    }

    console.log(`\n📊 Extraction Summary:`)
    console.log(`   ✅ Successful: ${results.triggered}`)
    console.log(`   ❌ Failed: ${results.failed.length}`)
    
    if (results.failed.length > 0) {
      console.log(`\n❌ Failed documents:`)
      results.failed.forEach(doc => {
        console.log(`   - ${doc.id} (${doc.title}): ${doc.error}`)
      })
    }

    return NextResponse.json({
      success: true,
      message: `Triggered extraction for ${results.triggered} document(s)${results.failed.length > 0 ? `. ${results.failed.length} failed.` : ''}`,
      results,
    })
  } catch (error) {
    console.error("❌ Fix extractions error:", error)
    return NextResponse.json(
      { 
        error: "Failed to fix extractions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}