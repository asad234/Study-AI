import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface SubscriptionPageWrapperProps {
  children: React.ReactNode
  requiredStatus: "payment" | "billing"
}

export default function SubscriptionPageWrapper({ 
  children, 
  requiredStatus 
}: SubscriptionPageWrapperProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const response = await fetch("/api/check-subscription")
      const data = await response.json()

      if (!response.ok) {
        router.push("/login")
        return
      }

      // Check if user should be on this page
      const shouldBeHere = 
        (requiredStatus === "billing" && data.hasActiveSubscription && data.isPro) ||
        (requiredStatus === "payment" && data.canUpgrade)

      if (!shouldBeHere) {
        // Redirect to appropriate page
        router.push(data.redirectTo)
        return
      }

      setAuthorized(true)
    } catch (error) {
      console.error("Access check error:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-gray-600 dark:text-gray-300">
            Checking subscription status...
          </p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null // Will redirect
  }

  return <>{children}</>
}