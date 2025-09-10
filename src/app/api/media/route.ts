import { type NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })

    // Get user profile
    const profiles = await payload.find({
      collection: "profiles",
      where: {
        email: {
          equals: session.user.email,
        },
      },
    })

    if (!profiles.docs.length) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    // Find the media file and verify ownership through associated document
    const documents = await payload.find({
      collection: "documents",
      where: {
        media_file: {
          equals: id,
        },
        user: {
          equals: userProfile.id,
        },
      },
    })

    if (!documents.docs.length) {
      return NextResponse.json({ error: "Media file not found or access denied" }, { status: 404 })
    }

    const document = documents.docs[0]

    // Delete the associated document first
    await payload.delete({
      collection: "documents",
      id: document.id,
    })

    // Delete the media file
    await payload.delete({
      collection: "media",
      id: id,
    })

    return NextResponse.json({
      message: "Media file and associated document deleted successfully",
      deletedDocumentId: document.id,
      deletedMediaId: id,
    })
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json({ error: "Failed to delete media file" }, { status: 500 })
  }
}
