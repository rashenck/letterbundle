'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { apiClient } from '@/lib/api'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'

interface Bundle {
  id: string
  slug: string
  title: string
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const { token } = useAuth()
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBundles()
  }, [token])

  const loadBundles = async () => {
    if (!token) return

    try {
      setIsLoading(true)
      const data = await apiClient.listBundles(token)
      setBundles(data.bundles || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load bundles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (bundleId: string) => {
    if (!token || !window.confirm('Are you sure you want to delete this bundle?')) {
      return
    }

    try {
      await apiClient.deleteBundle(token, bundleId)
      setBundles(bundles.filter((b) => b.id !== bundleId))
    } catch (err) {
      setError('Failed to delete bundle')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Collections</h1>
          <p className="text-gray-600 mt-1">Manage your letter collections and share them with the world</p>
        </div>
        <Link href="/dashboard/bundles/new">
          <Button>
            📝 Create Collection
          </Button>
        </Link>
      </div>

      {error && (
        <Card variant="outlined" className="mb-6 border-red-200 bg-red-50">
          <CardContent>
            <p className="text-red-700">❌ {error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : bundles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📚</div>
            <CardTitle>You haven't created any collections yet</CardTitle>
            <CardDescription className="mb-6">
              Start preserving your family's letter heritage by creating your first collection
            </CardDescription>
            <Link href="/dashboard/bundles/new">
              <Button>
                ✨ Create Your First Collection
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <Card key={bundle.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">
                      <Link
                        href={`/dashboard/bundles/${bundle.id}`}
                        className="hover:text-primary-700 transition-colors"
                      >
                        {bundle.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {bundle.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="text-2xl ml-4">
                    {bundle.is_public ? '🌍' : '🔒'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🔗</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {bundle.slug}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📅</span>
                    <span>Updated {new Date(bundle.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2 w-full">
                  <Link href={`/dashboard/bundles/${bundle.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      📖 View
                    </Button>
                  </Link>
                  <Button variant="danger" onClick={() => handleDelete(bundle.id)} className="flex-1">
                    🗑️ Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
