import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import configPromise from "@payload-config"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

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
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    // First check if document exists and user owns it
    const existingDocument = await payload.findByID({
      collection: "documents",
      id: id,
    })

    const docUserId =
      typeof existingDocument.user === "object" && existingDocument.user !== null
        ? existingDocument.user.id
        : existingDocument.user

    if (docUserId !== userProfile.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete document
    await payload.delete({
      collection: "documents",
      id: id,
    })

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
