"use client"
import PaymentPage from "@/components/Dashboard/Account/Payment/payments"
import SubscriptionPageWrapper from "@/components/Dashboard/Account/Payment/subscriptionRouter"

export default function PaymentPageRoute() {
  return (
    <SubscriptionPageWrapper requiredStatus="payment">
      <PaymentPage />
    </SubscriptionPageWrapper>
  )
}