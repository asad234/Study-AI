import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayloadHMR } from "@payloadcms/next/utilities"
import configPromise from "@payload-config"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await getPayloadHMR({ config: configPromise })

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

    // Upload file to media collection
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

    // Create document record
    const documentResult = await payload.create({
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
