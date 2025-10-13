// lib/subscription-check.ts
import { getPayload } from "payload"
import config from "@payload-config"

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  isPro: boolean
  canUpgrade: boolean
  redirectTo: "/dashboard/billing" | "/dashboard/payment"
  subscriptionDetails?: {
    plan: string
    status: string
    stripeCustomerId?: string
    subscriptionId?: string
    billingPeriod?: string
    currentPeriodEnd?: Date
  }
}

/**
 * Check user's subscription status and determine where to redirect
 */
export async function checkSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  try {
    const payload = await getPayload({ config })
    
    const user = await payload.findByID({
      collection: "users",
      id: userId,
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Check if user has Pro plan
    const isPro = user.plan === "pro"
    
    // Check if user has active subscription
    const hasActiveSubscription = Boolean(
      user.subscriptionId && 
      user.stripeCustomerId &&
      user.subscriptionStatus === "active"
    )

    // Determine if user can upgrade (not pro or no active subscription)
    const canUpgrade = !isPro || !hasActiveSubscription

    // Determine redirect destination
    const redirectTo = hasActiveSubscription && isPro 
      ? "/dashboard/billing" 
      : "/dashboard/payment"

    return {
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
    }
  } catch (error) {
    console.error("Error checking subscription status:", error)
    throw error
  }
}

/**
 * Validate if user should access payment page
 */
export function shouldAccessPaymentPage(status: SubscriptionStatus): boolean {
  return status.canUpgrade
}

/**
 * Validate if user should access billing page
 */
export function shouldAccessBillingPage(status: SubscriptionStatus): boolean {
  return status.hasActiveSubscription && status.isPro
}