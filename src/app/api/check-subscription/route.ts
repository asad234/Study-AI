// app/api/check-subscription/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getPayload } from "payload"
import config from "@payload-config"
import { authOptions } from "@/lib/authoption"

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Starting subscription check...")
    
    // Get NextAuth session with auth options
    const session = await getServerSession(authOptions)
    
    console.log("🔐 Session exists:", !!session)
    console.log("📧 Session email:", session?.user?.email)
    
    if (!session || !session.user?.email) {
      console.log("❌ No session or email found")
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payload = await getPayload({ config })

    // Find user by email from NextAuth session
    const users = await payload.find({
      collection: "users",
      where: {
        email: {
          equals: session.user.email,
        },
      },
    })

    if (users.docs.length === 0) {
      console.log("❌ User not found in database for email:", session.user.email)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const user = users.docs[0]
    console.log("✅ User found:", user.email, "(ID:", user.id, ")")

    // Check subscription status
    const isPro = user.plan === "pro"
    const hasActiveSubscription = Boolean(
      user.subscriptionId && 
      user.stripeCustomerId &&
      user.subscriptionStatus === "active"
    )
    const canUpgrade = !isPro || !hasActiveSubscription

    // Determine redirect destination
    const redirectTo = hasActiveSubscription && isPro 
      ? "/dashboard/billing" 
      : "/dashboard/payment"

    console.log("📊 Subscription status:", {
      plan: user.plan,
      isPro,
      hasActiveSubscription,
      hasSubscriptionId: !!user.subscriptionId,
      hasStripeCustomerId: !!user.stripeCustomerId,
      subscriptionStatus: user.subscriptionStatus,
      redirectTo
    })

    return NextResponse.json({
      success: true,
      hasActiveSubscription,
      isPro,
      canUpgrade,
      redirectTo,
      subscriptionDetails: {
        plan: user.plan || "free_trial",
        status: user.subscriptionStatus || "none",
        stripeCustomerId: user.stripeCustomerId,
        subscriptionId: user.subscriptionId,
        billingPeriod: user.billingPeriod,
        currentPeriodEnd: user.currentPeriodEnd 
          ? new Date(user.currentPeriodEnd) 
          : undefined,
      }
    })

  } catch (error: any) {
    console.error("❌ Error checking subscription:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check subscription status" },
      { status: 500 }
    )
  }
}