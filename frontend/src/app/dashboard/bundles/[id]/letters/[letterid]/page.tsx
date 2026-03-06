'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { apiClient, API_BASE_URL } from '@/lib/api'

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
}

interface Page {
  id: string
  page_number: number
  rotation: number
  crop_box?: any
  s3_key_original?: string
  s3_key_processed?: string
  s3_key_thumbnail?: string
  transcription?: string
}

export default function EditLetterPage() {
  const params = useParams()
  const bundleId = params.id as string
  const letterId = params.letterid as string
  const { token } = useAuth()

  const [letter, setLetter] = useState<Letter | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isOCRProcessing, setIsOCRProcessing] = useState(false)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editedTranscription, setEditedTranscription] = useState('')
  const [pageImageUrls, setPageImageUrls] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [formData, setFormData] = useState({
    date_written: '',
    author: '',
    recipient: '',
    location: '',
    notes: '',
  })

  useEffect(() => {
    if (token) {
      loadLetter()
    }
  }, [token])

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const loadLetter = async () => {
    try {
      const data = await apiClient.getLetter(letterId)
      setLetter(data)
      setPages(data.pages || [])
      setFormData({
        date_written: data.date_written || '',
        author: data.author || '',
        recipient: data.recipient || '',
        location: data.location || '',
        notes: data.notes || '',
      })
      await fetchAllPageImageUrls(data.pages || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load letter')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllPageImageUrls = async (pageList: Page[]) => {
    if (!token || pageList.length === 0) return

    try {
      const urls: Record<string, string> = {}
      for (const page of pageList) {
        try {
          const response = await fetch(`${API_BASE_URL}/pages/${page.id}/image/thumbnail`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          if (response.ok) {
            const data = await response.json()
            urls[page.id] = data.url
          }
        } catch (error) {
          console.warn(`Failed to get thumbnail URL for page ${page.id}:`, error)
        }
      }
      setPageImageUrls(urls)
    } catch (err) {
      console.error('Failed to fetch page image URLs:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const startOCRPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    setIsOCRProcessing(true)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/letters/${letter?.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const updatedLetter = await response.json()
          if (updatedLetter.pages) {
            const hasNewTranscription = updatedLetter.pages.some(
              (p: Page) => p.transcription && !pages.find(orig => orig.id === p.id)?.transcription
            )
            if (hasNewTranscription) {
              setPages(updatedLetter.pages)
              setIsOCRProcessing(false)
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to check OCR status:', err)
      }
    }, 2000)
  }

  const handleProcessWithOCR = async () => {
    if (!token || !letter) return

    try {
      setIsOCRProcessing(true)
      const response = await fetch(`${API_BASE_URL}/letters/${letter.id}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to process letter with OCR')
      }

      startOCRPolling()
    } catch (err: any) {
      setError(err.message || 'Failed to process letter with OCR')
      setIsOCRProcessing(false)
    }
  }

  const handleEditPageTranscription = async (page: Page) => {
    setEditingPageId(page.id)
    setEditedTranscription(page.transcription || '')
  }

  const handleSavePageTranscription = async (pageId: string) => {
    if (!token) return

    setIsSaving(true)
    setSaveMessage('')

    try {
      await apiClient.updatePage(token, pageId, { transcription: editedTranscription })
      
      setPages(pages.map(p => 
        p.id === pageId ? { ...p, transcription: editedTranscription } : p
      ))
      setEditingPageId(null)
      setEditedTranscription('')
      setSaveMessage('Transcription saved!')
      setTimeout(() => setSaveMessage(''), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to save transcription')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingPageId(null)
    setEditedTranscription('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !token) return

    try {
      setIsUploading(true)
      setUploadError('')

      const formDataToSend = new FormData()
      for (let i = 0; i < files.length; i++) {
        formDataToSend.append('files', files[i])
      }

      const response = await fetch(`${API_BASE_URL}/letters/${letterId}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        throw new Error('Failed to upload pages')
      }

      const uploadedPages = await response.json()
      const newPages = [...pages, ...uploadedPages]
      setPages(newPages)
      await fetchAllPageImageUrls(uploadedPages)
      alert('Pages uploaded successfully!')

      e.target.value = ''
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload pages')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !letter) return

    try {
      const response = await fetch(`${API_BASE_URL}/letters/${letter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update letter')
      }

      const updated = await response.json()
      setLetter(updated)
      alert('Letter updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update letter')
    }
  }

  const handleMovePage = async (pageId: string, direction: 'up' | 'down') => {
    const currentIndex = pages.findIndex(p => p.id === pageId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= pages.length) return

    const newPages = [...pages]
    const [movedPage] = newPages.splice(currentIndex, 1)
    newPages.splice(newIndex, 0, movedPage)

    const reorderedPages = newPages.map((p, idx) => ({ ...p, page_number: idx + 1 }))
    setPages(reorderedPages)

    try {
      const pageIds = reorderedPages.map(p => p.id)
      await apiClient.reorderPages(token!, letterId, pageIds)
    } catch (err) {
      console.error('Failed to save page order:', err)
      setPages(pages)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!letter) {
    return <div className="text-center py-8 text-red-600">Letter not found</div>
  }

  return (
    <div>
      <Link
        href={`/dashboard/bundles/${bundleId}`}
        className="text-primary-600 hover:text-primary-700 mb-4 inline-block"
      >
        ← Back to Collection
      </Link>

      <h1 className="text-3xl font-bold mb-8">Edit Letter</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {saveMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
          {saveMessage}
        </div>
      )}

      <div className="grid gap-8">
        <div>
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-xl font-bold mb-6">Letter Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date_written" className="block text-sm font-medium text-gray-700 mb-1">
                    Date Written
                  </label>
                  <input
                    id="date_written"
                    name="date_written"
                    type="date"
                    value={formData.date_written}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                    From
                  </label>
                  <input
                    id="author"
                    name="author"
                    type="text"
                    value={formData.author}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                    To
                  </label>
                  <input
                    id="recipient"
                    name="recipient"
                    type="text"
                    value={formData.recipient}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium"
              >
                Save Changes
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Letter Pages</h2>
              {isOCRProcessing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Processing...
                </div>
              )}
            </div>

            {pages.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">No pages uploaded yet</p>
                <button
                  onClick={handleProcessWithOCR}
                  disabled={isOCRProcessing}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {isOCRProcessing ? 'Processing...' : 'Transcribe Letter'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Use the arrow buttons to reorder pages. Click &quot;Edit&quot; to modify transcription.
                </p>
                
                <div className="space-y-4">
                  {pages.map((page, index) => (
                    <div
                      key={page.id}
                      className="border-2 rounded-lg p-4 transition-all border-gray-200 hover:border-gray-300"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleMovePage(page.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMovePage(page.id, 'down')}
                            disabled={index === pages.length - 1}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-64 h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            {pageImageUrls[page.id] ? (
                              <img
                                src={pageImageUrls[page.id]}
                                alt={`Page ${page.page_number}`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">No image</span>
                            )}
                          </div>
                          <p className="text-center text-sm font-medium mt-2 text-gray-600">
                            Page {page.page_number}
                          </p>
                        </div>

                        <div className="flex-1 min-w-0">
                          {editingPageId === page.id ? (
                            <div>
                              <textarea
                                value={editedTranscription}
                                onChange={(e) => setEditedTranscription(e.target.value)}
                                rows={12}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                                placeholder="Enter transcription..."
                              />
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleSavePageTranscription(page.id)}
                                  disabled={isSaving}
                                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-medium text-sm"
                                >
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="bg-gray-50 p-3 rounded-lg min-h-[160px] max-h-[200px] overflow-y-auto">
                                {page.transcription ? (
                                  <p className="text-gray-800 whitespace-pre-wrap text-sm">
                                    {page.transcription}
                                  </p>
                                ) : (
                                  <p className="text-gray-400 text-sm italic">
                                    No transcription yet. Click &quot;Transcribe Letter&quot; to generate or &quot;Edit&quot; to add manually.
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleEditPageTranscription(page)}
                                className="text-primary-600 hover:text-primary-700 font-medium text-sm mt-2"
                              >
                                Edit Transcription
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={handleProcessWithOCR}
                    disabled={isOCRProcessing}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                  >
                    {isOCRProcessing ? 'Processing...' : 'Transcribe All Pages'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-bold mb-6">Upload Pages</h2>

            {uploadError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                {uploadError}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  📄 Drop letter page images here or click to select
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="file-input"
                />
                <label 
                  htmlFor="file-input"
                  className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-medium cursor-pointer"
                  style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.6 : 1 }}
                >
                  {isUploading ? 'Uploading...' : 'Choose Files'}
                </label>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Supported formats: JPG, PNG, GIF. Max 10MB per image. Images will be automatically cropped and enhanced.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
