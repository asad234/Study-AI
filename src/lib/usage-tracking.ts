// lib/usage-tracking.ts
import { getPayload } from "payload"
import config from "@payload-config"
import { hasReachedLimit, shouldResetUsage, PlanType, UsageStatKey } from "./plan-limits"

/**
 * Check if user can perform an action based on their plan limits
 */
export async function canPerformAction(
  userId: string,
  action: "uploadDocument" | "generateFlashcard" | "takeQuiz"
): Promise<{ allowed: boolean; reason?: string }> {
  const payload = await getPayload({ config })

  try {
    const user = await payload.findByID({
      collection: "users",
      id: userId,
    })

    if (!user) {
      return { allowed: false, reason: "User not found" }
    }

    // Pro users have unlimited access
    if (user.plan === "pro") {
      return { allowed: true }
    }

    // Check if usage should be reset
    const lastResetDate = user.usageStats?.lastResetDate
    if (shouldResetUsage(lastResetDate)) {
      await resetUserUsage(userId)
      return { allowed: true }
    }

    // Map action to usage stat
    const statMap: Record<string, UsageStatKey> = {
      uploadDocument: "documentsUploaded",
      generateFlashcard: "flashcardsGenerated",
      takeQuiz: "quizzesTaken",
    }

    const stat = statMap[action]
    const currentUsage = user.usageStats?.[stat] || 0

    // Check if limit reached
    if (hasReachedLimit(user.plan as PlanType, stat, currentUsage)) {
      return {
        allowed: false,
        reason: `You've reached your ${user.plan} plan limit. Upgrade to Pro for unlimited access.`,
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error("Error checking action permission:", error)
    return { allowed: false, reason: "Error checking permissions" }
  }
}

/**
 * Increment usage counter for a specific action
 */
export async function incrementUsage(
  userId: string,
  action: "uploadDocument" | "generateFlashcard" | "takeQuiz"
): Promise<void> {
  const payload = await getPayload({ config })

  try {
    const user = await payload.findByID({
      collection: "users",
      id: userId,
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Pro users don't need usage tracking
    if (user.plan === "pro") {
      return
    }

    // Check if usage should be reset first
    const lastResetDate = user.usageStats?.lastResetDate
    if (shouldResetUsage(lastResetDate)) {
      await resetUserUsage(userId)
      return
    }

    const statMap = {
      uploadDocument: "documentsUploaded",
      generateFlashcard: "flashcardsGenerated",
      takeQuiz: "quizzesTaken",
    } as const

    const stat = statMap[action]
    const currentUsage = user.usageStats?.[stat] || 0

    await payload.update({
      collection: "users",
      id: userId,
      data: {
        usageStats: {
          ...user.usageStats,
          [stat]: currentUsage + 1,
        },
      },
    })
  } catch (error) {
    console.error("Error incrementing usage:", error)
    throw error
  }
}

/**
 * Reset user's usage stats (called monthly)
 */
export async function resetUserUsage(userId: string): Promise<void> {
  const payload = await getPayload({ config })

  try {
    await payload.update({
      collection: "users",
      id: userId,
      data: {
        usageStats: {
          documentsUploaded: 0,
          flashcardsGenerated: 0,
          quizzesTaken: 0,
          lastResetDate: new Date().toISOString(),
        },
      },
    })

    console.log(`✅ Usage stats reset for user: ${userId}`)
  } catch (error) {
    console.error("Error resetting usage:", error)
    throw error
  }
}

/**
 * Get user's current usage stats with limits
 */
export async function getUserUsageStats(userId: string) {
  const payload = await getPayload({ config })

  try {
    const user = await payload.findByID({
      collection: "users",
      id: userId,
    })

    if (!user) {
      throw new Error("User not found")
    }

    const plan = user.plan as PlanType
    const usageStats = user.usageStats || {
      documentsUploaded: 0,
      flashcardsGenerated: 0,
      quizzesTaken: 0,
    }

    return {
      plan,
      usage: usageStats,
      isPro: plan === "pro",
    }
  } catch (error) {
    console.error("Error getting usage stats:", error)
    throw error
  }
}

/**
 * Middleware example: Check action before allowing it
 * Use this in your API routes before performing actions
 */
export async function withUsageCheck(
  userId: string,
  action: "uploadDocument" | "generateFlashcard" | "takeQuiz",
  callback: () => Promise<any>
) {
  // Check if action is allowed
  const { allowed, reason } = await canPerformAction(userId, action)

  if (!allowed) {
    throw new Error(reason || "Action not allowed")
  }

  // Perform the action
  const result = await callback()

  // Increment usage counter
  await incrementUsage(userId, action)

  return result
}