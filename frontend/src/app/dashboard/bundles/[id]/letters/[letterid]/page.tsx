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
  const [isEditingTranscription, setIsEditingTranscription] = useState(false)
  const [editedTranscription, setEditedTranscription] = useState('')
  const [pageImageUrls, setPageImageUrls] = useState<Record<string, string>>({})
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

  // Cleanup polling on unmount
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
    } catch (err: any) {
      setError(err.message || 'Failed to load letter')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const startOCRPolling = () => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    setIsOCRProcessing(true)

    // Poll every 2 seconds to check if transcription is available
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/letters/${letter?.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const updatedLetter = await response.json()
          
          // Check if transcription is now available
          if (updatedLetter.transcription) {
            setLetter(updatedLetter)
            setIsOCRProcessing(false)
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
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

      // Start polling for OCR status
      startOCRPolling()
    } catch (err: any) {
      setError(err.message || 'Failed to process letter with OCR')
      setIsOCRProcessing(false)
    }
  }

  const fetchPageImageUrls = async () => {
    if (!token || pages.length === 0) return

    try {
      const urls: Record<string, string> = {}
      for (const page of pages) {
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

  const handleEditTranscription = async () => {
    if (!letter) return
    setEditedTranscription(letter.transcription || '')
    setIsEditingTranscription(true)
    // Fetch image URLs for reference
    await fetchPageImageUrls()
  }

  const handleSaveTranscription = async () => {
    if (!token || !letter) return

    try {
      const response = await fetch(`${API_BASE_URL}/letters/${letter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          transcription: editedTranscription,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save transcription')
      }

      const updated = await response.json()
      setLetter(updated)
      setFormData((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(updated).filter(([key]) => key in formData)
        ),
      }))
      setIsEditingTranscription(false)
      setEditedTranscription('')
      setPageImageUrls({})
      alert('Transcription saved successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to save transcription')
    }
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
      setPages([...pages, ...uploadedPages])
      alert('Pages uploaded successfully!')

      // Reset input
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

      <div className="grid gap-8 md:grid-cols-3">
        {/* Edit Form */}
        <div className="md:col-span-2">
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

          {/* OCR Transcription */}
          {pages.length > 0 && (
            <div className="bg-white rounded-lg shadow p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Transcription</h2>
                {isOCRProcessing && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    Processing...
                  </div>
                )}
              </div>

              {letter.transcription ? (
                <div>
                  {isEditingTranscription ? (
                    <div className="space-y-6">
                      {/* Page Images for Reference */}
                      {pages.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Reference Images:</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {pages.map((page) => (
                              <div key={page.id} className="text-center">
                                <div className="bg-gray-100 rounded-lg p-2 mb-2">
                                  {pageImageUrls[page.id] ? (
                                    <img
                                      src={pageImageUrls[page.id]}
                                      alt={`Page ${page.page_number}`}
                                      className="w-full h-24 object-contain rounded"
                                      onError={(e) => {
                                        // Hide broken images
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                                      <span className="text-xs text-gray-500">No image</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600">Page {page.page_number}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Editable Transcription */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Edit Transcription:</h3>
                        <textarea
                          value={editedTranscription}
                          onChange={(e) => setEditedTranscription(e.target.value)}
                          rows={12}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                          placeholder="Edit the transcribed text here..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveTranscription}
                          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium"
                        >
                          Save Transcription
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingTranscription(false)
                            setEditedTranscription('')
                            setPageImageUrls({})
                          }}
                          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto mb-4">
                        <p className="text-gray-800 whitespace-pre-wrap text-sm">
                          {letter.transcription}
                        </p>
                      </div>
                       <button
                         onClick={handleEditTranscription}
                         className="text-primary-600 hover:text-primary-700 font-medium"
                       >
                         Edit Transcription
                       </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-4">No transcription yet</p>
                  <button
                    onClick={handleProcessWithOCR}
                    disabled={isOCRProcessing}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                  >
                    {isOCRProcessing ? 'Processing...' : 'Transcribe Letter'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Page Upload */}
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

        {/* Pages List */}
        <div className="bg-white rounded-lg shadow p-8 h-fit">
          <h3 className="font-bold mb-4">Pages ({pages.length})</h3>

          {pages.length === 0 ? (
            <p className="text-gray-500 text-sm">No pages uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div key={page.id} className="border rounded p-3 hover:bg-gray-50">
                  <p className="font-medium text-sm">Page {page.page_number}</p>
                  {page.transcription && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {page.transcription.substring(0, 50)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-500">
              Status: <span className="font-medium capitalize">{letter.status}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
