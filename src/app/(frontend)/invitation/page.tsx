// app/accept-invitation/page.tsx
/*'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('invalid')
      setMessage('Invalid invitation link - no token provided')
      return
    }

    // Simulate token validation (in real app, validate against database)
    const validateToken = async () => {
      try {
        // Add a small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 1500))

        // In a real app, you would:
        // 1. Validate the token against your database
        // 2. Check if it's expired
        // 3. Update the invitation status
        // 4. Create/activate the user account

        // For demo purposes, we'll just show success
        setStatus('success')
        setMessage('Invitation accepted successfully! You can now access the platform.')

      } catch (error) {
        setStatus('error')
        setMessage('Failed to process invitation. Please try again or contact support.')
      }
    }

    validateToken()
  }, [searchParams])

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
      case 'invalid':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        )
      case 'success':
        return (
          <div className="rounded-full bg-green-100 p-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
      case 'invalid':
        return (
          <div className="rounded-full bg-red-100 p-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center">
              {getStatusIcon()}
            </div>

            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {status === 'loading' && 'Processing Invitation...'}
              {status === 'success' && 'Welcome!'}
              {status === 'error' && 'Something went wrong'}
              {status === 'invalid' && 'Invalid Invitation'}
            </h2>

            <p className={`mt-4 text-center text-sm ${getStatusColor()}`}>
              {message}
            </p>

            {status === 'success' && (
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}

            {(status === 'error' || status === 'invalid') && (
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Homepage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
*/