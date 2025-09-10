import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import configPromise from "@payload-config"

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

    console.log("[v0] Upload - Found profiles:", profiles.docs.length)
    if (profiles.docs.length > 0) {
      console.log("[v0] Upload - User profile:", { id: profiles.docs[0].id, email: profiles.docs[0].email })
    }

    if (profiles.docs.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    if (!userProfile?.id) {
      console.error("[v0] Upload - User profile missing ID:", userProfile)
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

    console.log("[v0] Upload - File details:", { name: file.name, type: file.type, size: file.size })

    // Upload file to media collection
    console.log("[v0] Upload - Creating media record...")
    let mediaResult
    try {
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          mediaResult = await payload.create({
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
          break // Success, exit retry loop
        } catch (retryError: any) {
          retryCount++
          console.error(`[v0] Upload - Media creation attempt ${retryCount} failed:`, retryError)

          // Check if it's a database connection error
          if (retryError?.code === "XX000" || retryError?.message?.includes("db_termination")) {
            if (retryCount < maxRetries) {
              console.log(`[v0] Upload - Retrying media creation (${retryCount}/${maxRetries})...`)
              await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
              continue
            }
          }
          throw retryError // Re-throw if not a connection error or max retries reached
        }
      }

      if (!mediaResult) {
        throw new Error("Media creation returned null/undefined result")
      }

      if (typeof mediaResult !== "object") {
        throw new Error(`Media creation returned invalid type: ${typeof mediaResult}`)
      }

      if (!("id" in mediaResult) || !mediaResult.id) {
        throw new Error(`Media creation returned object without valid id: ${JSON.stringify(mediaResult)}`)
      }

      console.log("[v0] Upload - Media created successfully:", {
        id: mediaResult.id,
        url: "url" in mediaResult ? mediaResult.url : "undefined",
      })
    } catch (mediaError) {
      console.error("[v0] Upload - Media creation error:", mediaError)
      return NextResponse.json(
        {
          error: "Failed to upload file to media",
          details: mediaError instanceof Error ? mediaError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    if (!mediaResult || typeof mediaResult !== "object" || !("id" in mediaResult) || !mediaResult.id) {
      console.error("[v0] Upload - Media creation failed, invalid result:", mediaResult)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Create document record
    console.log("[v0] Upload - Creating document record...")
    let documentResult
    try {
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          documentResult = await payload.create({
            collection: "documents",
            data: {
              user: userProfile.id,
              title: title || file.name.split(".")[0],
              file_name: file.name,
              file_path: ("url" in mediaResult ? mediaResult.url : "") || "",
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
          break // Success, exit retry loop
        } catch (retryError: any) {
          retryCount++
          console.error(`[v0] Upload - Document creation attempt ${retryCount} failed:`, retryError)

          // Check if it's a database connection error
          if (retryError?.code === "XX000" || retryError?.message?.includes("db_termination")) {
            if (retryCount < maxRetries) {
              console.log(`[v0] Upload - Retrying document creation (${retryCount}/${maxRetries})...`)
              await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
              continue
            }
          }
          throw retryError // Re-throw if not a connection error or max retries reached
        }
      }

      if (!documentResult) {
        throw new Error("Document creation returned null/undefined result")
      }

      if (typeof documentResult !== "object") {
        throw new Error(`Document creation returned invalid type: ${typeof documentResult}`)
      }

      if (!("id" in documentResult) || !documentResult.id) {
        throw new Error(`Document creation returned object without valid id: ${JSON.stringify(documentResult)}`)
      }

      console.log("[v0] Upload - Document created successfully:", {
        id: documentResult.id,
        title: "title" in documentResult ? documentResult.title : "undefined",
      })
    } catch (documentError) {
      console.error("[v0] Upload - Document creation error:", documentError)
      return NextResponse.json(
        {
          error: "Failed to create document record",
          details: documentError instanceof Error ? documentError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    if (!documentResult || typeof documentResult !== "object" || !("id" in documentResult) || !documentResult.id) {
      console.error("[v0] Upload - Document creation failed, invalid result:", documentResult)
      return NextResponse.json({ error: "Failed to create document record" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: documentResult,
      media: mediaResult,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
