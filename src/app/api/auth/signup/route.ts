import { type NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@payload-config"

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { email, password, firstName, lastName } = await req.json()

    // Basic validation
    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: "Email, first name, and last name are required." }, { status: 400 })
    }

    // Validate password for credentials signup
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password is required and must be at least 6 characters long." },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await payload.find({
      collection: "users",
      where: {
        email: { equals: email },
      },
    })

    if (existingUser.docs.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Combine first and last name for the name field
    const fullName = `${firstName} ${lastName}`

    console.log("🔄 Creating credentials user with data:", {
      email,
      name: fullName,
      roles: "client",
      authType: "credentials",
      hasPassword: true,
    })

    // Create user with credentials auth type and password
    const newUser = await payload.create({
      collection: "users",
      data: {
        email,
        password, // Password will be hashed by Payload
        name: fullName,
        roles: "client",
        authType: "credentials", // Set auth type for email/password users
        hasPassword: true, // Mark as having password
        onboardingCompleted: false, // New users need onboarding
      },
    })

    console.log("✅ Credentials user created successfully:", newUser.id)

    // The Users collection afterChange hook will automatically create the profile

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        roles: newUser.roles,
      },
      shouldSignIn: true,
    })
  } catch (error: unknown) {
    console.error("❌ Signup error:", error)
    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
