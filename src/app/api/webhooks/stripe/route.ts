// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getPayload } from "payload"
import config from "@payload-config"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")!

    console.log("🎣 Webhook received")

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log("✅ Webhook signature verified:", event.type)
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message)
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payload = await getPayload({ config })

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("💳 Checkout session completed:", session.id)
        await handleCheckoutSessionCompleted(session, payload)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("🔄 Subscription updated:", subscription.id)
        await handleSubscriptionUpdated(subscription, payload)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("❌ Subscription deleted:", subscription.id)
        await handleSubscriptionDeleted(subscription, payload)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("💰 Payment succeeded:", invoice.id)
        await handleInvoicePaymentSucceeded(invoice, payload)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("⚠️ Payment failed:", invoice.id)
        await handleInvoicePaymentFailed(invoice, payload)
        break
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  payload: any
) {
  console.log("🎉 Processing checkout completion...")
  console.log("📋 Session metadata:", session.metadata)
  console.log("📧 Customer email:", session.customer_email)

  try {
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string
    const planName = session.metadata?.planName || "Pro"
    const billingPeriod = session.metadata?.billingPeriod || "monthly"

    console.log("📦 Extracted data:", {
      customerId,
      subscriptionId,
      planName,
      billingPeriod
    })

    // Validate required fields
    if (!customerId) {
      console.error("❌ No customer ID in session")
      return
    }

    if (!subscriptionId) {
      console.error("❌ No subscription ID in session")
      return
    }

    // Find user by customer ID (more reliable than email)
    const users = await payload.find({
      collection: "users",
      where: {
        stripeCustomerId: {
          equals: customerId,
        },
      },
    })

    if (users.docs.length === 0) {
      console.error("❌ User not found for customer:", customerId)
      return
    }

    const user = users.docs[0]
    console.log("✅ User found:", user.email, "(ID:", user.id, ")")

    // Get subscription details from Stripe
    console.log("🔍 Fetching subscription details from Stripe...")
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    console.log("📊 Subscription retrieved:", {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end
    })

    // Determine plan - check for "pro" or "Pro" (case-insensitive)
    const isPro = planName.toLowerCase().includes("pro")
    const finalPlan = isPro ? "pro" : "free_trial"

    console.log("🎯 Plan determination:", {
      originalPlanName: planName,
      isPro,
      finalPlan
    })

    // Prepare base update data
    const updateData: any = {
      stripeCustomerId: customerId,
      subscriptionId: subscriptionId,
      plan: finalPlan,
      subscriptionStatus: subscription.status,
      billingPeriod: billingPeriod,
    }

    // Reset chat count when upgrading to Pro
    if (finalPlan === "pro") {
      updateData.chatCount = 0
      console.log("🔄 Resetting chat count for Pro user")
    }

    // Handle current_period_end if it exists
    if (subscription.current_period_end) {
      try {
        const currentPeriodEndDate = new Date(subscription.current_period_end * 1000).toISOString()
        updateData.currentPeriodEnd = currentPeriodEndDate
        console.log("📅 Converted date:", currentPeriodEndDate)
      } catch (dateError) {
        console.error("❌ Error converting date:", dateError)
        console.log("⚠️ Will update without currentPeriodEnd field")
      }
    } else {
      console.warn("⚠️ current_period_end is missing from subscription")
    }

    console.log("🔄 Updating user with data:", updateData)

    // Update user with subscription info
    await payload.update({
      collection: "users",
      id: user.id,
      data: updateData,
    })

    console.log("✅ User subscription updated successfully!")
    console.log("🎊 User", user.email, "is now on", finalPlan, "plan")
  } catch (error) {
    console.error("❌ Error handling checkout session:", error)
    throw error
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  payload: any
) {
  console.log("🔄 Processing subscription update:", subscription.id)
  console.log("📊 Full subscription object:", JSON.stringify(subscription, null, 2))

  try {
    const customerId = subscription.customer as string

    // Find user by Stripe customer ID
    const users = await payload.find({
      collection: "users",
      where: {
        stripeCustomerId: {
          equals: customerId,
        },
      },
    })

    if (users.docs.length === 0) {
      console.error("❌ User not found for customer:", customerId)
      return
    }

    const user = users.docs[0]
    console.log("✅ Found user:", user.email, "(ID:", user.id, ")")

    // Check if current_period_end exists and is valid
    if (!subscription.current_period_end) {
      console.error("❌ current_period_end is missing from subscription")
      console.log("Subscription status:", subscription.status)
      // Update only status without date
      await payload.update({
        collection: "users",
        id: user.id,
        data: {
          subscriptionStatus: subscription.status,
        },
      })
      console.log("✅ Subscription status updated (without date):", subscription.status)
      return
    }

    console.log("📅 current_period_end value:", subscription.current_period_end)
    console.log("📅 current_period_end type:", typeof subscription.current_period_end)

    // Convert timestamp to ISO string for Payload
    const currentPeriodEndDate = new Date(subscription.current_period_end * 1000).toISOString()
    console.log("📅 Converted date:", currentPeriodEndDate)

    // Update subscription status
    await payload.update({
      collection: "users",
      id: user.id,
      data: {
        subscriptionStatus: subscription.status,
        currentPeriodEnd: currentPeriodEndDate,
      },
    })

    console.log("✅ Subscription status updated:", subscription.status)
  } catch (error) {
    console.error("❌ Error handling subscription update:", error)
    throw error
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  payload: any
) {
  console.log("❌ Processing subscription deletion:", subscription.id)

  try {
    const customerId = subscription.customer as string

    // Find user by Stripe customer ID
    const users = await payload.find({
      collection: "users",
      where: {
        stripeCustomerId: {
          equals: customerId,
        },
      },
    })

    if (users.docs.length === 0) {
      console.error("❌ User not found for customer:", customerId)
      return
    }

    const user = users.docs[0]
    console.log("✅ Found user:", user.email)

    // Downgrade user to free trial and reset chat count
    await payload.update({
      collection: "users",
      id: user.id,
      data: {
        plan: "free_trial",
        subscriptionStatus: "canceled",
        subscriptionId: null,
        billingPeriod: null,
        chatCount: 0, // Reset chat count when downgrading
      },
    })

    console.log("✅ User downgraded to free trial with reset chat count:", user.email)
  } catch (error) {
    console.error("❌ Error handling subscription deletion:", error)
    throw error
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  payload: any
) {
  console.log("💰 Processing successful payment:", invoice.id)

  try {
    const customerId = invoice.customer as string

    // Find user by Stripe customer ID
    const users = await payload.find({
      collection: "users",
      where: {
        stripeCustomerId: {
          equals: customerId,
        },
      },
    })

    if (users.docs.length > 0) {
      const user = users.docs[0]
      console.log("✅ Payment successful for user:", user.email)
    }
  } catch (error) {
    console.error("❌ Error handling payment success:", error)
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  payload: any
) {
  console.log("⚠️ Processing failed payment:", invoice.id)

  try {
    const customerId = invoice.customer as string

    // Find user by Stripe customer ID
    const users = await payload.find({
      collection: "users",
      where: {
        stripeCustomerId: {
          equals: customerId,
        },
      },
    })

    if (users.docs.length > 0) {
      const user = users.docs[0]
      console.log("⚠️ Payment failed for user:", user.email)
      
      // Update status to indicate payment issue
      await payload.update({
        collection: "users",
        id: user.id,
        data: {
          subscriptionStatus: "past_due",
        },
      })
      
      console.log("✅ User status updated to past_due")
    }
  } catch (error) {
    console.error("❌ Error handling payment failure:", error)
  }
}