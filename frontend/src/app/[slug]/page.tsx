'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  created_at: string
}

interface Page {
  id: string
  page_number: number
  transcription?: string
  s3_key_processed?: string
  s3_key_thumbnail?: string
}

interface Letter {
  id: string
  date_written?: string
  author?: string
  recipient?: string
  location?: string
  notes?: string
  transcription?: string
  status: string
  pages?: Page[]
  order_index: number
}

interface Bundle {
  id: string
  slug: string
  title: string
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
  user?: User
  user_id: string
}

export default function PublicBundlePage() {
  const params = useParams()
  const slug = params.slug as string

  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [letters, setLetters] = useState<Letter[]>([])
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBundle()
  }, [slug])

  const loadBundle = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Get bundle by slug
      const bundleResponse = await fetch(
        `http://localhost:8000/api/bundles/by-slug/${slug}`
      )

      if (!bundleResponse.ok) {
        if (bundleResponse.status === 404) {
          throw new Error('Bundle not found')
        }
        throw new Error('Failed to load bundle')
      }

      const bundleData = await bundleResponse.json()
      setBundle(bundleData)

      // Get letters in bundle
      const lettersResponse = await fetch(
        `http://localhost:8000/api/bundles/${bundleData.id}/letters`
      )

      if (lettersResponse.ok) {
        const lettersData = await lettersResponse.json()
        setLetters(lettersData)
        if (lettersData.length > 0) {
          setSelectedLetter(lettersData[0])
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bundle')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Loading collection...</p>
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

  if (!bundle) {
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/browse" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Back to Browse
          </Link>
          <h1 className="text-4xl font-bold mb-2">{bundle.title}</h1>
          {bundle.description && (
            <p className="text-xl text-gray-600 mb-4">{bundle.description}</p>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <span>
              {bundle.user ? (
                <Link href={`/users/${bundle.user.username}`} className="text-primary-600 hover:text-primary-700">
                  {bundle.user.first_name} {bundle.user.last_name}
                </Link>
              ) : (
                <span>Unknown author</span>
              )}
            </span>
            <span>•</span>
            <span>{new Date(bundle.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Letters */}
        {letters.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No letters in this collection yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Letter List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200 p-4">
                  <h2 className="font-semibold text-gray-900">
                    Letters ({letters.length})
                  </h2>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {letters.map((letter, index) => (
                    <button
                      key={letter.id}
                      onClick={() => setSelectedLetter(letter)}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                        selectedLetter?.id === letter.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        Letter #{index + 1}
                      </div>
                      {letter.author && (
                        <div className="text-xs text-gray-600 mt-1">
                          From: {letter.author}
                        </div>
                      )}
                      {letter.date_written && (
                        <div className="text-xs text-gray-600">
                          {new Date(letter.date_written).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Letter Content */}
            <div className="lg:col-span-3">
              {selectedLetter && (
                <div className="bg-white rounded-lg shadow">
                  {/* Letter Header */}
                  <div className="border-b border-gray-200 p-6">
                    <h3 className="text-2xl font-bold mb-4">{selectedLetter.author || 'Unknown Author'}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {selectedLetter.date_written && (
                        <div>
                          <span className="font-semibold text-gray-900">Date Written:</span>
                          {' '}
                          {new Date(selectedLetter.date_written).toLocaleDateString()}
                        </div>
                      )}
                      {selectedLetter.recipient && (
                        <div>
                          <span className="font-semibold text-gray-900">To:</span> {selectedLetter.recipient}
                        </div>
                      )}
                      {selectedLetter.location && (
                        <div>
                          <span className="font-semibold text-gray-900">Location:</span> {selectedLetter.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Letter Content */}
                  <div className="p-6">
                    {selectedLetter.transcription ? (
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900">Transcription</h4>
                        <div className="bg-gray-50 p-4 rounded-lg mb-6 max-h-96 overflow-y-auto">
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {selectedLetter.transcription}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                        <p className="text-yellow-800">
                          This letter is being processed for transcription. Please check back soon.
                        </p>
                      </div>
                    )}

                    {selectedLetter.notes && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-lg font-semibold mb-2 text-gray-900">Notes</h4>
                        <p className="text-gray-700">{selectedLetter.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
