'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { EmptyState } from '@/components/ui'

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  created_at: string
}

interface Bundle {
  id: string
  slug: string
  title: string
  description?: string
  user_id: string
  user?: User
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function BrowsePage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBundles()
  }, [])

  const loadBundles = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch('http://localhost:8000/api/bundles/public')
      
      if (!response.ok) {
        throw new Error('Failed to load bundles')
      }
      
      const data = await response.json()
      setBundles(data.bundles || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load bundles')
    } finally {
      setIsLoading(false)
    }
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
              <Link href="/login" className="text-gray-700 hover:text-primary-600">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Public Collections</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

          {isLoading ? (
            <SkeletonLoader />
          ) : bundles.length === 0 ? (
            <EmptyState
              title="No Public Collections"
              description="Be the first to share your letter collection with the community!"
              actionText="Create a Collection"
              actionHref="/dashboard/bundles/new"
            />
          ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                <Link
                  href={`/${bundle.slug}`}
                  className="block p-6 hover:bg-gray-50 transition"
                >
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{bundle.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{bundle.description || 'No description'}</p>
                </Link>
                <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      {bundle.user ? (
                        <Link href={`/users/${bundle.user.username}`} className="text-primary-600 hover:text-primary-700 font-medium">
                          {bundle.user.first_name} {bundle.user.last_name}
                        </Link>
                      ) : (
                        <span className="text-gray-600">Unknown author</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(bundle.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
