import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import configPromise from "@payload-config"

// Increase timeout if on Pro plan, otherwise keep at 10
export const maxDuration = 30 // Change to 10 if on Hobby plan

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })

    // Get user's profile
    const profiles = await payload.find({
      collection: "profiles",
      where: {
        email: {
          equals: session.user.email,
        },
      },
    })

    if (profiles.docs.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    if (!userProfile?.id) {
      return NextResponse.json({ error: "Invalid user profile" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size too large" }, { status: 400 })
    }

    console.log("Upload - File details:", { name: file.name, type: file.type, size: file.size })

    // ✅ REMOVED RETRY LOGIC - Let it fail fast
    console.log("Upload - Creating media record...")
    const mediaResult = await payload.create({
      collection: "media",
      data: {
        alt: title || file.name,
        description: `Uploaded by ${session.user.name || session.user.email}`,
      },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    })

    if (!mediaResult?.id) {
      console.error("Upload - Media creation failed")
      return NextResponse.json({ error: "Failed to upload file to media" }, { status: 500 })
    }

    console.log("Upload - Media created successfully:", { id: mediaResult.id })

    // ✅ REMOVED RETRY LOGIC - Let it fail fast
    console.log("Upload - Creating document record...")
    const documentResult = await payload.create({
      collection: "documents",
      data: {
        user: userProfile.id,
        title: title || file.name.split(".")[0],
        file_name: file.name,
        file_path: mediaResult.url || "",
        file_type: file.type,
        file_size: file.size,
        status: "pending",
        processing_progress: 0,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: session.user.email,
        },
        media_file: mediaResult.id,
      },
    })

    if (!documentResult?.id) {
      console.error("Upload - Document creation failed")
      return NextResponse.json({ error: "Failed to create document record" }, { status: 500 })
    }

    console.log("Upload - Document created successfully:", { id: documentResult.id })

    // ✅ FIRE AND FORGET - No awaiting, no timeout waiting
    triggerTextExtraction(documentResult.id)

    // ✅ Return immediately
    return NextResponse.json({
      success: true,
      document: documentResult,
      media: mediaResult,
      message: "Document uploaded successfully. Text extraction in progress...",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// ✅ SIMPLIFIED - True fire-and-forget
function triggerTextExtraction(documentId: string | number) {
  // Don't use async/await - just fire the request
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const extractUrl = `${baseUrl}/api/documents/${documentId}/extract`

  console.log("Triggering extraction at:", extractUrl)

  // Fire and forget - don't await, don't catch
  fetch(extractUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": process.env.INTERNAL_API_KEY || "default-key-change-in-production",
    },
  })
    .then((response) => {
      if (response.ok) {
        console.log("✅ Text extraction triggered successfully")
      } else {
        console.error("❌ Text extraction trigger failed:", response.status)
      }
    })
    .catch((error) => {
      console.error("❌ Text extraction trigger error:", error)
    })
}