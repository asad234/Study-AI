import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import configPromise from "@payload-config"

export async function GET(request: NextRequest) {
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

    // Get user's exams
    const exams = await payload.find({
      collection: "exams",
      where: {
        user: {
          equals: userProfile.id,
        },
      },
      sort: "-created_at",
    })

    return NextResponse.json({
      success: true,
      exams: exams.docs,
      totalExams: exams.totalDocs,
    })
  } catch (error) {
    console.error("Exams fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}