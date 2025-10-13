"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import SubscriptionManagement from "@/components/Dashboard/Account/Payment/subscription-management"
import SubscriptionPageWrapper from "@/components/Dashboard/Account/Payment/subscriptionRouter"
import { Loader2 } from "lucide-react"

// Define the user type
interface UserData {
  id: string
  name: string
  email: string
  plan: string
  subscriptionStatus: string | null
  billingPeriod: string | null
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
  usageStats: {
    documentsUploaded: number
    flashcardsGenerated: number
    quizzesTaken: number
    examSimulationsTaken: number
    projectsCreated: number
  }
}

export default function BillingPageRoute() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserWithProjects = async () => {
      if (!session?.user?.email) {
        setLoading(false)
        return
      }

      try {
        // Fetch subscription data
        const subscriptionResponse = await fetch(`/api/check-subscription`)
        if (!subscriptionResponse.ok) {
          throw new Error("Failed to fetch subscription data")
        }
        const subscriptionData = await subscriptionResponse.json()

        // Fetch all usage data in parallel for better performance
        const [projectsData, documentsData, flashcardsData, quizzesData, examsData, profileData] = await Promise.all([
          fetch(`/api/projects`).then(res => res.json()),
          fetch(`/api/documents`).then(res => res.json()),
          fetch(`/api/flashcards`).then(res => res.json()),
          fetch(`/api/quizzes`).then(res => res.json()),
          fetch(`/api/exam`).then(res => res.json()),
          fetch(`/api/profile`).then(res => res.json()),
        ])

        // Extract counts
        const projectCount = projectsData.success ? projectsData.projects.length : 0
        const documentCount = documentsData.success ? documentsData.documents.length : 0
        const flashcardCount = flashcardsData.success ? flashcardsData.flashcards.length : 0
        const quizCount = quizzesData.success ? quizzesData.totalQuizzes : 0
        const examCount = examsData.success ? examsData.totalExams : 0

        // Combine all data
        const userData: UserData = {
          id: session.user.id || '',
          name: session.user.name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
          email: session.user.email,
          plan: subscriptionData.subscriptionDetails?.plan || 'free_trial',
          subscriptionStatus: subscriptionData.subscriptionDetails?.status || null,
          billingPeriod: subscriptionData.subscriptionDetails?.billingPeriod || null,
          currentPeriodEnd: subscriptionData.subscriptionDetails?.currentPeriodEnd || null,
          stripeCustomerId: subscriptionData.subscriptionDetails?.stripeCustomerId || null,
          usageStats: {
            documentsUploaded: documentCount,
            flashcardsGenerated: flashcardCount,
            quizzesTaken: quizCount,
            examSimulationsTaken: examCount, // ✅ Now using actual count from database
            projectsCreated: projectCount,
          },
        }

        console.log("📊 Complete user data with all usage stats:", userData)
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchUserWithProjects()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [session, status])

  return (
    <SubscriptionPageWrapper requiredStatus="billing">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <SubscriptionManagement user={user} />
      )}
    </SubscriptionPageWrapper>
  )
}