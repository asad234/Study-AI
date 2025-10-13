// hooks/use-subscription-check.ts
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface SubscriptionStatus {
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

export function useSubscriptionCheck() {
  const router = useRouter()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/check-subscription")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check subscription")
      }

      setStatus(data)
    } catch (err: any) {
      setError(err.message)
      console.error("Subscription check error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentClick = () => {
    if (!status) return

    // Redirect based on subscription status
    router.push(status.redirectTo)
  }

  return {
    status,
    loading,
    error,
    handlePaymentClick,
    checkStatus, // Allow manual refresh
  }
}