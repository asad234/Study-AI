export default function SuccessPage() {
  return (
    <div className="container mx-auto py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
      <p className="text-gray-600 mb-8">
        Thank you for subscribing to Pro plan.
      </p>
      <a href="/dashboard" className="btn btn-primary">
        Go to Dashboard
      </a>
    </div>
  )
}