// lib/auth.ts
import { cookies } from "next/headers"
import { getPayload } from "payload"
import config from "@payload-config"

/**
 * Get the currently authenticated user from server-side
 * Use this in API routes or server components
 */
export async function getCurrentUser() {
  try {
    const payload = await getPayload({ config })
    const cookieStore = cookies()
    
    // Get the payload-token cookie
    const token = (await cookieStore).get("payload-token")?.value
    
    console.log("🍪 Cookie check:", token ? "Token found" : "No token")
    
    if (!token) {
      return null
    }

    // Parse the JWT token manually to extract user ID
    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log("⚠️ Invalid token format")
      return null
    }

    // Decode the payload part (base64)
    const payloadPart = parts[1]
    const decoded = JSON.parse(
      Buffer.from(payloadPart, 'base64').toString('utf8')
    )

    console.log("🔓 Token decoded, user ID:", decoded.id || decoded.sub)

    // Extract user ID from the token
    const userId = decoded.id || decoded.sub
    
    if (!userId) {
      console.log("⚠️ No user ID in token")
      return null
    }

    // Fetch the user from database
    const user = await payload.findByID({
      collection: "users",
      id: userId,
    })

    console.log("✅ User fetched:", user?.email)

    return user
  } catch (error) {
    console.error("❌ Error getting current user:", error)
    return null
  }
}

/**
 * Get the currently authenticated user ID only
 * Lighter weight than getCurrentUser()
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = cookies()
    const token = (await cookieStore).get("payload-token")?.value
    
    if (!token) {
      return null
    }

    // Parse JWT to get user ID
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payloadPart = parts[1]
    const decoded = JSON.parse(
      Buffer.from(payloadPart, 'base64').toString('utf8')
    )

    return decoded.id || decoded.sub || null
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}

/**
 * Require authentication - throw error if not authenticated
 * Use in API routes where auth is mandatory
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("Unauthorized")
  }
  
  return user
}