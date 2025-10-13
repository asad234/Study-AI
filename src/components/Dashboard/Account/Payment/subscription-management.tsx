"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Crown, 
  Star, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  FileText,
  Brain,
  MessageSquare,
  FolderOpen,
  GraduationCap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionManagementProps {
  user: any // Replace with proper User type
}

export default function SubscriptionManagement({ user }: SubscriptionManagementProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Please log in to view subscription details</p>
      </div>
    )
  }

  const isPro = user.plan === "pro"
  const isActive = user.subscriptionStatus === "active"

  // Calculate usage percentages for free tier
  const getUsagePercentage = (current: number, limit: number) => {
    if (isPro) return 0
    return Math.min(100, (current / limit) * 100)
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("Failed to create portal session")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = () => {
    window.location.href = "/dashboard/payment"
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quick Summary for Pro Users */}
      {isPro && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{user.usageStats?.documentsUploaded || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Documents</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{user.usageStats?.flashcardsGenerated || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Flashcards</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{user.usageStats?.quizzesTaken || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Quizzes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <div className="text-2xl font-bold">{user.usageStats?.examSimulationsTaken || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Exams</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-teal-500" />
                <div className="text-2xl font-bold">{user.usageStats?.projectsCreated || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Projects</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Plan Card */}
      <Card className={isPro ? "border-primary" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${isPro ? "bg-primary" : "bg-gray-100 dark:bg-gray-800"}`}>
                {isPro ? (
                  <Crown className={`w-6 h-6 ${isPro ? "text-white" : "text-gray-600"}`} />
                ) : (
                  <Star className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {isPro ? "Pro Plan" : "Free Trial"}
                </CardTitle>
                <CardDescription>
                  {isPro
                    ? `Billed ${user.billingPeriod === "yearly" ? "annually" : "monthly"}`
                    : "Limited features"}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isActive ? "default" : "secondary"} className="h-fit">
              {isActive ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Inactive
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPro && user.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>
                Next billing date: {new Date(user.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex gap-3">
            {isPro ? (
              <Button
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {loading ? "Loading..." : "Manage Subscription"}
              </Button>
            ) : (
              <Button onClick={handleUpgrade} className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics - Show for BOTH free and pro users */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>
            {isPro 
              ? "Track your activity and progress" 
              : "Track your usage against your plan limits"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Documents Uploaded</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                {user.usageStats?.documentsUploaded || 0} {!isPro && "/ 5"}
              </span>
            </div>
            {!isPro && (
              <Progress 
                value={getUsagePercentage(user.usageStats?.documentsUploaded || 0, 5)} 
                className="h-2"
              />
            )}
          </div>

          {/* Flashcards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Flashcards Generated</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                {user.usageStats?.flashcardsGenerated || 0} {!isPro && "/ 50"}
              </span>
            </div>
            {!isPro && (
              <Progress 
                value={getUsagePercentage(user.usageStats?.flashcardsGenerated || 0, 50)} 
                className="h-2"
              />
            )}
          </div>

          {/* Quizzes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" />
                <span className="font-medium">Quizzes Taken</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                {user.usageStats?.quizzesTaken || 0} {!isPro && "/ 10"}
              </span>
            </div>
            {!isPro && (
              <Progress 
                value={getUsagePercentage(user.usageStats?.quizzesTaken || 0, 10)} 
                className="h-2"
              />
            )}
          </div>

          {/* Exam Simulations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-500" />
                <span className="font-medium">Exam Simulations Taken</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                {user.usageStats?.examSimulationsTaken || 0} {!isPro && "/ 5"}
              </span>
            </div>
            {!isPro && (
              <Progress 
                value={getUsagePercentage(user.usageStats?.examSimulationsTaken || 0, 5)} 
                className="h-2"
              />
            )}
          </div>

          {/* Projects Created */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-teal-500" />
                <span className="font-medium">Projects Created</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                {user.usageStats?.projectsCreated || 0} {!isPro && "/ 3"}
              </span>
            </div>
            {!isPro && (
              <Progress 
                value={getUsagePercentage(user.usageStats?.projectsCreated || 0, 3)} 
                className="h-2"
              />
            )}
          </div>
          {!isPro && (
            <div className="pt-4 border-t">
              <Button onClick={handleUpgrade} className="w-full" variant="outline">
                Upgrade for Unlimited Access
              </Button>
            </div>
          )}

          {isPro && (
            <div className="pt-4 border-t">
              <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                🎉 You have unlimited access to all features
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pro Features */}
      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle>Your Pro Features</CardTitle>
            <CardDescription>
              Everything included in your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Unlimited Documents</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Upload as many documents as you need
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Unlimited Flashcards</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Generate unlimited study materials
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Priority Processing</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Faster AI processing for your content
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">24/7 Premium Support</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Get help whenever you need it
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Advanced Analytics</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Track your learning progress
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Exam Simulation</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Practice with realistic exam conditions
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History - For Pro users */}
      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle>Billing & Invoices</CardTitle>
            <CardDescription>
              View and download your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleManageSubscription} 
              variant="outline"
              disabled={loading}
            >
              View Billing History
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}