export default function CancelPage() {
  return (
    <div className="container mx-auto py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Canceled</h1>
      <p className="text-gray-600 mb-8">
        Your payment was canceled. No charges were made.
      </p>
      <a href="/payment" className="btn btn-primary">
        Try Again
      </a>
    </div>
  )
}