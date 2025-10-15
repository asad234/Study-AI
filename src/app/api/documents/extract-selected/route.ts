// app/api/documents/extract-selected/route.ts
// Extract text from specific selected documents

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

    const { documentIds } = await request.json()

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "Document IDs are required" }, { status: 400 })
    }

    console.log(`🎯 Extracting selected documents:`, documentIds)

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

    const results = {
      total: documentIds.length,
      triggered: 0,
      alreadyExtracted: 0,
      failed: [] as Array<{id: string | number, title: string, error: string}>,
    }

    // Process each selected document
    for (const docId of documentIds) {
      try {
        console.log(`\n📄 Processing document ${docId}...`)

        // Fetch the document
        const document = await payload.findByID({
          collection: "documents",
          id: docId,
        })

        if (!document) {
          console.error(`❌ Document ${docId} not found`)
          results.failed.push({
            id: docId,
            title: 'Unknown',
            error: 'Document not found'
          })
          continue
        }

        // Verify ownership
        const documentUserId =
          typeof document.user === "object" && document.user !== null
            ? document.user.id
            : document.user

        if (documentUserId !== userProfile.id) {
          console.error(`❌ Access denied for document ${docId}`)
          results.failed.push({
            id: docId,
            title: document.title || document.file_name,
            error: 'Access denied'
          })
          continue
        }

        // Check if document has a file
        if (!document.media_file) {
          console.error(`❌ No file attached to document ${docId}`)
          results.failed.push({
            id: docId,
            title: document.title || document.file_name,
            error: 'No file attached'
          })
          continue
        }

        const notesValue = document.notes || ""
        const notesLength = notesValue.length
        console.log(`📝 Current notes length: ${notesLength} characters`)

        // Check if content is an error message or placeholder
        const isErrorMessage = notesValue.includes("[Unsupported file type:") || 
                              notesValue.includes("[Image content -") ||
                              notesValue.includes("[Failed to extract") ||
                              notesValue.includes("Please upload PDF")

        // Check if already properly extracted (has real content, not error messages)
        if (notesValue && notesLength >= 50 && !isErrorMessage) {
          console.log(`✅ Document ${docId} already has extracted content (${notesLength} chars)`)
          results.alreadyExtracted++
          continue
        }
        
        // If it's an error message, force re-extraction
        if (isErrorMessage) {
          console.log(`⚠️ Document ${docId} has error message, will re-extract`)
        }

        // Trigger extraction
        console.log(`🔄 Triggering extraction for document ${docId}...`)
        
        const extractUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/documents/${docId}/extract`
        
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
          console.log(`✅ Successfully triggered extraction for document ${docId}`)
          console.log(`   Extracted text length: ${extractData.textLength} characters`)
        } else {
          const errorMsg = extractData.error || "Unknown error"
          results.failed.push({
            id: docId,
            title: document.title || document.file_name,
            error: errorMsg
          })
          console.error(`❌ Failed to trigger extraction for document ${docId}:`, errorMsg)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        results.failed.push({
          id: docId,
          title: 'Unknown',
          error: errorMessage
        })
        console.error(`❌ Error processing document ${docId}:`, error)
      }
    }

    console.log(`\n📊 Extraction Summary:`)
    console.log(`   🎯 Total requested: ${results.total}`)
    console.log(`   ✅ Triggered: ${results.triggered}`)
    console.log(`   ✓ Already extracted: ${results.alreadyExtracted}`)
    console.log(`   ❌ Failed: ${results.failed.length}`)

    if (results.failed.length > 0) {
      console.log(`\n❌ Failed documents:`)
      results.failed.forEach(doc => {
        console.log(`   - ${doc.id} (${doc.title}): ${doc.error}`)
      })
    }

    // Build response message
    let message = ''
    if (results.triggered > 0) {
      message += `Triggered extraction for ${results.triggered} document(s). `
    }
    if (results.alreadyExtracted > 0) {
      message += `${results.alreadyExtracted} document(s) already have content. `
    }
    if (results.failed.length > 0) {
      message += `${results.failed.length} document(s) failed.`
    }

    return NextResponse.json({
      success: true,
      message: message.trim(),
      results,
    })
  } catch (error) {
    console.error("❌ Extract selected documents error:", error)
    return NextResponse.json(
      { 
        error: "Failed to extract documents",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}