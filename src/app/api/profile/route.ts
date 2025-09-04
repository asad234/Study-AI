import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

// GET /api/profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const profiles = await payload.find({
      collection: "profiles",
      where: {
        email: { equals: session.user.email },
      },
      limit: 1,
    })

    if (!profiles.docs.length) {
      const users = await payload.find({
        collection: "users",
        where: {
          email: { equals: session.user.email },
        },
        limit: 1,
      })

      if (users.docs.length > 0) {
        const user = users.docs[0]
        const nameParts = user.name?.split(" ") || ["", ""]
        const firstName = nameParts[0] || ""
        const lastName = nameParts.slice(1).join(" ") || ""

        // Create profile from user data
        try {
          const newProfile = await payload.create({
            collection: "profiles",
            data: {
              email: user.email,
              first_name: firstName,
              last_name: lastName,
              role: "user",
              bio: "",
              location: "",
            },
          })

          return NextResponse.json({
            firstName: newProfile.first_name,
            lastName: newProfile.last_name,
            email: newProfile.email,
            bio: newProfile.bio || "",
            location: newProfile.location || "",
            profileImage: newProfile.avatar_url || "",
          })
        } catch (createError) {
          console.error("Failed to create profile:", createError)
          return NextResponse.json({ message: "Profile not found and could not be created" }, { status: 404 })
        }
      }

      return NextResponse.json({ message: "Profile not found" }, { status: 404 })
    }

    const profile = profiles.docs[0]

    return NextResponse.json({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      email: profile.email,
      bio: profile.bio || "",
      location: profile.location || "",
      profileImage: profile.avatar_url || "",
    })
  } catch (error) {
    console.error("Profile GET error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, bio, location } = body

    const payload = await getPayload({ config })

    const profiles = await payload.find({
      collection: "profiles",
      where: {
        email: { equals: session.user.email },
      },
      limit: 1,
    })

    if (!profiles.docs.length) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 })
    }

    const profile = profiles.docs[0]

    const updatedProfile = await payload.update({
      collection: "profiles",
      id: profile.id,
      data: {
        first_name: firstName,
        last_name: lastName,
        bio: bio || "",
        location: location || "",
      },
    })

    try {
      const users = await payload.find({
        collection: "users",
        where: {
          email: { equals: session.user.email },
        },
        limit: 1,
      })

      if (users.docs.length > 0) {
        await payload.update({
          collection: "users",
          id: users.docs[0].id,
          data: {
            name: `${firstName} ${lastName}`.trim(),
          },
        })
      }
    } catch (userUpdateError) {
      console.error("Failed to update user name:", userUpdateError)
      // Don't fail the entire request if user update fails
    }

    return NextResponse.json({
      firstName: updatedProfile.first_name,
      lastName: updatedProfile.last_name,
      email: updatedProfile.email,
      bio: updatedProfile.bio || "",
      location: updatedProfile.location || "",
      profileImage: updatedProfile.avatar_url || "",
    })
  } catch (error) {
    console.error("Profile PUT error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
