// app/dashboard/subscription/page.tsx
{/* 
import { getCurrentUser } from "@/lib/auth"
import { getPayload } from "payload"
import config from "@payload-config"
import SubscriptionRouter from "@/components/Dashboard/Account/Payment/subscriptionRouter"

export default async function SubscriptionPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to continue</p>
      </div>
    )
  }

  const payload = await getPayload({ config })
  const userData = await payload.findByID({
    collection: "users",
    id: user.id,
  })

  return <SubscriptionRouter user={userData} />
}

*/}