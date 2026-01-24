'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')

      if (!token) {
        setIsVerifying(false)
        setMessage('No verification token found')
        setIsSuccess(false)
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email?token=' + encodeURIComponent(token))
        const data = await response.json()

        if (response.ok) {
          setIsSuccess(true)
          setMessage(data.message || 'Email verified successfully!')
        } else {
          setIsSuccess(false)
          setMessage(data.detail || 'Verification failed')
        }
      } catch (error) {
        setIsSuccess(false)
        setMessage('Something went wrong. Please try again.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-25 py-20">
        <div className="max-w-md w-full mx-auto text-center px-4">
          {isVerifying ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h2>
              <p className="text-gray-600">Please wait while we verify your email.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className={`flex justify-center mb-4 ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
                {isSuccess ? (
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h2 className={`text-2xl font-bold mb-4 ${isSuccess ? 'text-gray-900' : 'text-red-600'}`}>
                {isSuccess ? 'Email Verified!' : 'Verification Failed'}
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                {isSuccess ? (
                  <>
                    <Link
                      href="/login"
                      className="block w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Login to Your Account
                    </Link>
                    <Link
                      href="/"
                      className="block w-full text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Back to Home
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="block w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Create New Account
                    </Link>
                    <Link
                      href="/auth/resend-verification"
                      className="block w-full text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Resend Verification Email
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}