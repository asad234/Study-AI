"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Check, Zap, Star, Users, FileText, Brain, MessageSquare, Upload, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlanFeature {
  name: string
  included: boolean
}

interface Plan {
  name: string
  price: number
  yearlyPrice: number
  description: string
  features: PlanFeature[]
  popular?: boolean
  icon: React.ReactNode
  stripePriceId?: {
    monthly: string
    yearly: string
  }
}

interface PaymentPageProps {
  user?: any // Add user prop - replace 'any' with proper User type if you have one
}

const plans: Plan[] = [
  {
    name: "Free Trial",
    price: 0,
    yearlyPrice: 0,
    description: "Perfect for getting started with AI-powered studying",
    icon: <Star className="w-6 h-6" />,
    features: [
      { name: "Upload up to 5 documents", included: true },
      { name: "Generate 50 flashcards/month", included: true },
      { name: "Take 10 quizzes/month", included: true },
      { name: "Basic AI chat support", included: true },
      { name: "Study progress tracking", included: true },
      { name: "Advanced analytics", included: false },
      { name: "Unlimited document uploads", included: false },
      { name: "Priority AI processing", included: false },
      { name: "Custom study schedules", included: false },
      { name: "Advanced exam simulation", included: false },
    ],
  },
  {
    name: "Pro",
    price: 6.99,
    yearlyPrice: 59.99,
    description: "Everything you need for academic excellence",
    icon: <Zap className="w-6 h-6" />,
    popular: true,
    stripePriceId: {
      monthly: "price_1SHVr44CFeSrwWdwl1AjJYub", // TODO: Replace with your actual Stripe monthly price ID
      yearly: "price_1SHVvl4CFeSrwWdwoq5TeWlp",  // TODO: Replace with your actual Stripe yearly price ID
    },
    features: [
      { name: "Unlimited document uploads", included: true },
      { name: "Generate unlimited flashcards", included: true },
      { name: "Unlimited quizzes", included: true },
      { name: "Advanced AI chat with context", included: true },
      { name: "Study progress tracking", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority AI processing", included: true },
      { name: "Custom study schedules", included: true },
      { name: "Advanced exam simulation", included: true },
      { name: "Premium 24/7 support", included: true },
    ],
  },
]

export default function PaymentPage({ user }: PaymentPageProps) {
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  // Get current plan from user data
  const currentPlan = user?.plan === "pro" ? "Pro" : "Free Trial"

  const handleSubscribe = async (planName: string, stripePriceId?: string) => {
    if (planName === "Free Trial") {
      toast({
        title: "Already on Free Trial",
        description: "You're currently using the Free Trial plan.",
      })
      return
    }

    setLoading(true)
    try {
      // Get user ID from your NextAuth session
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      
      console.log("📋 Full session data:", sessionData)
      
      // Try different possible locations for user ID
      const userId = sessionData?.id || sessionData?.user?.id || sessionData?.userId
      
      console.log("🚀 Extracted userId:", userId)

      if (!userId) {
        console.error("❌ No userId found in session:", sessionData)
        toast({
          title: "Error",
          description: "Please log in to subscribe. Session data: " + JSON.stringify(sessionData),
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: stripePriceId,
          planName: planName,
          billingPeriod: isYearly ? "yearly" : "monthly",
          userId: userId, // Pass the correct user ID
        }),
      })

      const data = await response.json()
      
      console.log("📨 Checkout response:", data)

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Failed to create checkout session")
      }
    } catch (error: any) {
      console.error("❌ Checkout error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12
    const savings = monthlyCost - yearlyPrice
    const percentage = Math.round((savings / monthlyCost) * 100)
    return { amount: savings, percentage }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Plan</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Unlock the full potential of AI-powered studying</p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm ${!isYearly ? "font-semibold" : "text-gray-500"}`}>Monthly</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={`text-sm ${isYearly ? "font-semibold" : "text-gray-500"}`}>Yearly</span>
          {isYearly && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Save up to 17%</Badge>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const savings = calculateSavings(plan.price, plan.yearlyPrice)
          const displayPrice = isYearly ? plan.yearlyPrice : plan.price
          const isCurrentPlan = plan.name === currentPlan
          const priceId = plan.stripePriceId ? (isYearly ? plan.stripePriceId.yearly : plan.stripePriceId.monthly) : undefined

          return (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? "border-primary shadow-lg scale-105" : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white px-3 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                    plan.popular
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>

                <div className="mt-4">
                  <div className="text-4xl font-bold">
                    ${displayPrice}
                    {plan.price > 0 && (
                      <span className="text-lg font-normal text-gray-500">/{isYearly ? "year" : "month"}</span>
                    )}
                  </div>
                  {isYearly && plan.price > 0 && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Save ${savings.amount} ({savings.percentage}% off)
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || loading}
                  onClick={() => handleSubscribe(plan.name, priceId)}
                >
                  {loading ? "Processing..." : isCurrentPlan ? "Current Plan" : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Feature Comparison
          </CardTitle>
          <CardDescription>Compare all features across different plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Features</th>
                  <th className="text-center py-3 px-4">Free Trial</th>
                  <th className="text-center py-3 px-4">Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Document Uploads
                  </td>
                  <td className="text-center py-3 px-4">5 docs</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Flashcards
                  </td>
                  <td className="text-center py-3 px-4">50/month</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Processing
                  </td>
                  <td className="text-center py-3 px-4">Standard</td>
                  <td className="text-center py-3 px-4">Priority</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    AI Chat
                  </td>
                  <td className="text-center py-3 px-4">Basic</td>
                  <td className="text-center py-3 px-4">Advanced</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Support
                  </td>
                  <td className="text-center py-3 px-4">Community</td>
                  <td className="text-center py-3 px-4">24/7 Premium</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Can I change my plan anytime?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Yes, you can upgrade from Free Trial to Pro at any time. Changes will be reflected immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We accept all major credit cards through Stripe's secure payment processing.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Is there a free trial?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Yes! Our Free Trial plan gives you access to core features with no credit card required.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Can I cancel my subscription?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Yes, you can cancel your Pro subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}   