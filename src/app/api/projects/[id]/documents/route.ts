import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const payload = await getPayload({ config })

    // Get user profile
    const userProfiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!userProfiles.docs.length) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const userProfile = userProfiles.docs[0]

    // Get documents for this project
    const documents = await payload.find({
      collection: "documents",
      where: {
        project: { equals: id },
        user: { equals: userProfile.id },
      },
      limit: 100,
    })

    return NextResponse.json({
      success: true,
      documents: documents.docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
      })),
    })
  } catch (error) {
    console.error("Documents API error:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
