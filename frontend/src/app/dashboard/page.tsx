'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

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
      const response = await fetch('http://localhost:8000/api/bundles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

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

  const handleDelete = async (bundleId: string) => {
    if (!token || !window.confirm('Are you sure you want to delete this bundle?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/bundles/${bundleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setBundles(bundles.filter((b) => b.id !== bundleId))
      }
    } catch (err) {
      setError('Failed to delete bundle')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Collections</h1>
        <Link
          href="/dashboard/bundles/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Create Collection
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading collections...</p>
        </div>
      ) : bundles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">You haven't created any collections yet.</p>
          <Link
            href="/dashboard/bundles/new"
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Create your first collection
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    href={`/dashboard/bundles/${bundle.id}`}
                    className="text-xl font-bold text-primary-600 hover:text-primary-700"
                  >
                    {bundle.title}
                  </Link>
                  <p className="text-gray-600 mt-1">{bundle.description || 'No description'}</p>
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span>Slug: <code className="bg-gray-100 px-2 py-1 rounded">{bundle.slug}</code></span>
                    <span>Status: {bundle.is_public ? '🌍 Public' : '🔒 Private'}</span>
                    <span>Updated: {new Date(bundle.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/dashboard/bundles/${bundle.id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(bundle.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
