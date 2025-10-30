// app/api/chats/limit/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"

// Chat limits
const FREE_CHAT_LIMIT = 5
const PRO_CHAT_LIMIT = -1 // -1 means unlimited

export async function GET(req: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user from database
    const payload = await getPayload({ config })
    const users = await payload.find({
      collection: "users",
      where: {
        email: {
          equals: session.user.email,
        },
      },
    })

    if (users.docs.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const user = users.docs[0]

    // Check if user is Pro
    const isPro = user.plan === "pro" && user.subscriptionStatus === "active"
    
    // Get chat count (default to 0 if not set)
    const chatCount = user.chatCount || 0
    
    if (isPro) {
      // Pro users have unlimited chats
      return NextResponse.json({
        success: true,
        isPro: true,
        remainingChats: -1, // -1 indicates unlimited
        chatLimit: -1,
        limitReached: false,
        chatCount: chatCount,
      })
    }

    // Free users have limited chats
    const remainingChats = Math.max(0, FREE_CHAT_LIMIT - chatCount)
    const limitReached = chatCount >= FREE_CHAT_LIMIT

    return NextResponse.json({
      success: true,
      isPro: false,
      remainingChats,
      chatLimit: FREE_CHAT_LIMIT,
      limitReached,
      chatCount,
    })

  } catch (error: any) {
    console.error("❌ Error checking chat limit:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check chat limit" },
      { status: 500 }
    )
  }
}