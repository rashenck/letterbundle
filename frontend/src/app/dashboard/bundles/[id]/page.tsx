'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

interface Letter {
  id: string
  date_written?: string
  author?: string
  recipient?: string
  order_index: number
}

export default function EditBundlePage() {
  const router = useRouter()
  const params = useParams()
  const bundleId = params.id as string
  const { token } = useAuth()

  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [letters, setLetters] = useState<Letter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
  })

  useEffect(() => {
    if (token) {
      loadBundle()
      loadLetters()
    }
  }, [token])

  const loadBundle = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/bundles/${bundleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load bundle')
      }

      const data = await response.json()
      setBundle(data)
      setFormData({
        title: data.title,
        description: data.description || '',
        is_public: data.is_public,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load bundle')
    } finally {
      setIsLoading(false)
    }
  }

  const loadLetters = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/bundles/${bundleId}/letters`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLetters(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      // Silently fail for letters
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !bundle) return

    try {
      const response = await fetch(`http://localhost:8000/api/bundles/${bundleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update bundle')
      }

      const updated = await response.json()
      setBundle(updated)
      alert('Collection updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update bundle')
    }
  }

  const handleDeleteLetter = async (letterId: string) => {
    if (!token || !window.confirm('Delete this letter?')) return

    try {
      const response = await fetch(`http://localhost:8000/api/letters/${letterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setLetters(letters.filter((l) => l.id !== letterId))
      }
    } catch (err) {
      setError('Failed to delete letter')
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!bundle) {
    return <div className="text-center py-8 text-red-600">Bundle not found</div>
  }

  return (
    <div>
      <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
        ← Back to Collections
      </Link>

      <h1 className="text-3xl font-bold mb-8">{bundle.title}</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {/* Edit Bundle Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-bold mb-6">Collection Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="is_public"
                  name="is_public"
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-3 block text-sm font-medium text-gray-700">
                  Make this collection public
                </label>
              </div>

              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>

        {/* Collection Info */}
        <div className="bg-white rounded-lg shadow p-8 h-fit">
          <h3 className="font-bold mb-4">Collection Info</h3>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-600">Slug</dt>
              <dd className="text-gray-900 font-mono">{bundle.slug}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Status</dt>
              <dd className="text-gray-900">{bundle.is_public ? '🌍 Public' : '🔒 Private'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Letters</dt>
              <dd className="text-gray-900">{letters.length}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Created</dt>
              <dd className="text-gray-900">{new Date(bundle.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>

          <div className="mt-6 pt-6 border-t">
            <Link
              href={`/dashboard/bundles/${bundleId}/letters/new`}
              className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
            >
              Add Letter
            </Link>
          </div>
        </div>
      </div>

      {/* Letters List */}
      <div className="mt-8 bg-white rounded-lg shadow p-8">
        <h2 className="text-xl font-bold mb-6">Letters ({letters.length})</h2>

        {letters.length === 0 ? (
          <p className="text-gray-500">No letters yet. Add your first letter to get started!</p>
        ) : (
          <div className="space-y-4">
            {letters.map((letter) => (
              <div key={letter.id} className="flex justify-between items-center p-4 border rounded hover:bg-gray-50">
                <div>
                  <p className="font-medium">
                    {letter.date_written && `${letter.date_written} - `}
                    {letter.author} to {letter.recipient}
                  </p>
                  <p className="text-sm text-gray-500">Letter #{letter.order_index}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/bundles/${bundleId}/letters/${letter.id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteLetter(letter.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
