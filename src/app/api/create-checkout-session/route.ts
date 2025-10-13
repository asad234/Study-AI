// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getPayload } from "payload"
import config from "@payload-config"
import { getCurrentUser } from "@/lib/auth"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: NextRequest) {
  try {
    const { priceId, planName, billingPeriod, userId } = await req.json()

    console.log("📥 Checkout request received:", { priceId, planName, billingPeriod, userId })
    console.log("🌍 Environment check:", {
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY
    })

    // Get Payload instance
    const payload = await getPayload({ config })

    let user
    
    // If userId is provided in request, use it (priority)
    if (userId) {
      console.log("✅ Using userId from request body:", userId)
      try {
        user = await payload.findByID({
          collection: "users",
          id: userId,
        })
        console.log("✅ User fetched successfully:", user?.email, "(ID:", user?.id, ")")
      } catch (error) {
        console.error("❌ User lookup error:", error)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    } else {
      // Fallback: try server-side auth only if no userId provided
      console.log("⚠️ No userId in request, trying server-side auth...")
      user = await getCurrentUser()
      
      if (user) {
        console.log("✅ User from server-side auth:", user.email, "(ID:", user.id, ")")
      } else {
        console.log("❌ No user from server-side auth")
      }
    }

    // If still no user, return error
    if (!user || !user.email) {
      console.error("❌ No user found - returning 401")
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    console.log("🎯 Final user for checkout:", user.email, "(ID:", user.id, ")")

    // Check if user already has a Stripe customer ID
    let customerId = user.stripeCustomerId

    if (!customerId) {
      console.log("📝 Creating new Stripe customer for:", user.email)
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      })
      
      customerId = customer.id
      console.log("✅ Stripe customer created:", customerId)

      // Update user with Stripe customer ID
      await payload.update({
        collection: "users",
        id: user.id,
        data: {
          stripeCustomerId: customerId,
        },
      })
      console.log("✅ User updated with Stripe customer ID")
    } else {
      console.log("✅ Using existing Stripe customer:", customerId)
    }

    // Create Stripe checkout session
    console.log("🛒 Creating checkout session...")
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        userId: user.id,
        planName,
        billingPeriod,
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    })

    console.log("✅ Checkout session created:", checkoutSession.id)
    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error("❌ Error creating checkout session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}