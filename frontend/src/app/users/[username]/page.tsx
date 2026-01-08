'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  email?: string
  created_at: string
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUserProfile()
  }, [username])

  const loadUserProfile = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Get user profile
      const userResponse = await fetch(
        `http://localhost:8000/api/users/${username}`
      )

      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          throw new Error('User not found')
        }
        throw new Error('Failed to load user profile')
      }

      const userData = await userResponse.json()
      setUser(userData)
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Note: Getting user's public bundles would require a separate endpoint
  // For now, this is a basic profile view

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Letterbundle
              </Link>
              <div className="flex gap-4">
                <Link href="/browse" className="text-gray-700 hover:text-primary-600">
                  Browse
                </Link>
                <Link href="/login" className="text-gray-700 hover:text-primary-600">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/browse" className="text-primary-600 hover:text-primary-700">
              ← Back to Browse
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              Letterbundle
            </Link>
            <div className="flex gap-4">
              <Link href="/browse" className="text-gray-700 hover:text-primary-600">
                Browse
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-primary-600">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link href="/browse" className="text-primary-600 hover:text-primary-700 mb-8 inline-block">
          ← Back to Browse
        </Link>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
              <div className="text-3xl text-white font-bold">
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-gray-600 mb-2">@{user.username}</p>
              <p className="text-sm text-gray-500">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            {user.first_name}'s Public Collections
          </h2>
          <p className="text-gray-600 mb-4">
            Public bundles from this user will appear here soon.
          </p>
          <Link href="/browse" className="text-primary-600 hover:text-primary-700 font-medium">
            Browse all public collections
          </Link>
        </div>
      </div>
    </div>
  )
}
