// app/api/create-portal-session/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import Stripe from "stripe"
import { getPayload } from "payload"
import config from "@payload-config"
import { authOptions } from "@/lib/authoption"


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: NextRequest) {
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

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer ID found" },
        { status: 400 }
      )
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error("Error creating portal session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create portal session" },
      { status: 500 }
    )
  }
}