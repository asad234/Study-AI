import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import configPromise from "@payload-config"

// Add these constants at the top
const MAX_FILE_SIZE = process.env.NODE_ENV === 'production' ? 4 * 1024 * 1024 : 50 * 1024 * 1024 // 4MB for production, 50MB for dev
const TIMEOUT_DURATION = 8000 // 8 seconds, leave 2 seconds buffer for Vercel's 10s limit

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API called")
    
    // Add timeout protection for Vercel
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_DURATION)
    })

    const mainOperation = async () => {
      const session = await getServerSession(authOptions)

      if (!session?.user?.email) {
        console.log("[v0] No session or email found")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      console.log("[v0] Session found for:", session.user.email)

      let payload
      try {
        payload = await getPayload({ config: configPromise })
        console.log("[v0] Payload initialized successfully")
      } catch (payloadError) {
        console.error("[v0] Payload initialization failed:", payloadError)
        return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
      }

      // Get user's profile
      console.log("[v0] Looking for profile with email:", session.user.email)
      const profiles = await payload.find({
        collection: "profiles",
        where: {
          email: {
            equals: session.user.email,
          },
        },
      })

      if (profiles.docs.length === 0) {
        console.log("[v0] No profile found for email:", session.user.email)
        return NextResponse.json({ error: "Profile not found" }, { status: 404 })
      }

      const userProfile = profiles.docs[0]
      console.log("[v0] Profile found:", userProfile.id)

      let formData, file, title
      try {
        formData = await request.formData()
        file = formData.get("file") as File
        title = formData.get("title") as string
        console.log("[v0] Form data parsed, file:", file?.name, "title:", title)
      } catch (formError) {
        console.error("[v0] Form data parsing failed:", formError)
        return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
      }

      if (!file) {
        console.log("[v0] No file provided in form data")
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

      // Updated file size validation for Vercel limits
      if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
        return NextResponse.json({ 
          error: `File size too large. Maximum allowed: ${maxSizeMB}MB` 
        }, { status: 400 })
      }

      console.log("[v0] File validation passed, creating media record")

      let mediaResult
      try {
        // Convert file to buffer more efficiently
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        mediaResult = await payload.create({
          collection: "media",
          data: {
            alt: title || file.name,
            description: `Uploaded by ${session.user.name || session.user.email}`,
          },
          file: {
            data: buffer,
            mimetype: file.type,
            name: file.name,
            size: file.size,
          },
        })
        console.log("[v0] Media created successfully:", mediaResult.id)
      } catch (mediaError) {
        console.error("[v0] Media creation failed:", mediaError)
        return NextResponse.json({ error: "File upload failed" }, { status: 500 })
      }

      let documentResult
      try {
        documentResult = await payload.create({
          collection: "documents",
          data: {
            user: userProfile.id,
            title: title || file.name.split(".")[0],
            file_name: file.name,
            file_path: mediaResult.url || "",
            file_type: file.type,
            file_size: file.size,
            status: "ready",
            processing_progress: 100,
            metadata: {
              originalName: file.name,
              uploadedAt: new Date().toISOString(),
              uploadedBy: session.user.email,
            },
            media_file: mediaResult.id,
          },
        })
        console.log("[v0] Document created successfully:", documentResult.id)
      } catch (docError) {
        console.error("[v0] Document creation failed:", docError)
        return NextResponse.json({ error: "Document creation failed" }, { status: 500 })
      }

      console.log("[v0] Upload completed successfully")
      return NextResponse.json({
        success: true,
        document: documentResult,
        media: mediaResult,
      })
    }

    // Race between main operation and timeout
    return await Promise.race([mainOperation(), timeoutPromise]) as NextResponse

  } catch (error) {
    console.error("[v0] Upload error:", error)
    
    // More specific error handling for Vercel
    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        return NextResponse.json(
          { error: "Request timeout - file too large or processing took too long" },
          { status: 408 }
        )
      }
      if (error.message.includes('PayloadError') || error.message.includes('body limit')) {
        return NextResponse.json(
          { error: "File too large for upload" },
          { status: 413 }
        )
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Add these export configurations for App Router
export const maxDuration = 9 // 9 seconds max for Vercel Hobby
export const dynamic = 'force-dynamic'