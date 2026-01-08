'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'

interface Bundle {
  id: string
  slug: string
  title: string
  description?: string
  user_id: string
  created_at: string
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
      // This would be a public endpoint to get bundles
      // For now, we'll just show an empty state
      setBundles([])
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
          <div className="text-center py-12">
            <p className="text-gray-500">Loading collections...</p>
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">No public collections yet</p>
            <p className="text-gray-400">Be the first to share your letter collection!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <Link
                key={bundle.id}
                href={`/${bundle.slug}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <h3 className="text-xl font-bold mb-2">{bundle.title}</h3>
                <p className="text-gray-600 mb-4">{bundle.description || 'No description'}</p>
                <p className="text-sm text-gray-400">
                  Created {new Date(bundle.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
