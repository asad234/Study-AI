// lib/plan-limits.ts

export const PLAN_LIMITS = {
  free_trial: {
    documentsUploaded: 5,
    flashcardsGenerated: 50,
    quizzesTaken: 10,
    features: {
      advancedAnalytics: false,
      priorityProcessing: false,
      customSchedules: false,
      examSimulation: false,
      premiumSupport: false,
    },
  },
  pro: {
    documentsUploaded: Infinity,
    flashcardsGenerated: Infinity,
    quizzesTaken: Infinity,
    features: {
      advancedAnalytics: true,
      priorityProcessing: true,
      customSchedules: true,
      examSimulation: true,
      premiumSupport: true,
    },
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS

// Usage stats stored in the database
export interface UsageStats {
  documentsUploaded: number
  flashcardsGenerated: number
  quizzesTaken: number
  lastResetDate?: string
}

// Type for the actual countable stats (excluding lastResetDate and features)
export type UsageStatKey = "documentsUploaded" | "flashcardsGenerated" | "quizzesTaken"

/**
 * Check if user has reached their plan limit for a specific feature
 */
export function hasReachedLimit(
  plan: PlanType,
  usageStat: UsageStatKey,
  currentUsage: number
): boolean {
  const limit = PLAN_LIMITS[plan][usageStat]
  return currentUsage >= limit
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  plan: PlanType,
  feature: keyof typeof PLAN_LIMITS.free_trial.features
): boolean {
  return PLAN_LIMITS[plan].features[feature]
}

/**
 * Get remaining usage for a specific stat
 */
export function getRemainingUsage(
  plan: PlanType,
  usageStat: UsageStatKey,
  currentUsage: number
): number | "unlimited" {
  const limit = PLAN_LIMITS[plan][usageStat]
  if (limit === Infinity) return "unlimited"
  return Math.max(0, limit - currentUsage)
}

/**
 * Check if usage stats should be reset (monthly reset)
 */
export function shouldResetUsage(lastResetDate?: string): boolean {
  if (!lastResetDate) return true
  
  const lastReset = new Date(lastResetDate)
  const now = new Date()
  
  // Reset if it's been more than a month
  return (
    now.getFullYear() > lastReset.getFullYear() ||
    (now.getFullYear() === lastReset.getFullYear() &&
      now.getMonth() > lastReset.getMonth())
  )
}

/**
 * Get usage percentage for a specific stat
 */
export function getUsagePercentage(
  plan: PlanType,
  usageStat: UsageStatKey,
  currentUsage: number
): number {
  const limit = PLAN_LIMITS[plan][usageStat]
  if (limit === Infinity) return 0
  return Math.min(100, (currentUsage / limit) * 100)
}