'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

export default function CreateLetterPage() {
  const router = useRouter()
  const params = useParams()
  const bundleId = params.id as string
  const { token } = useAuth()

  const [formData, setFormData] = useState({
    date_written: '',
    author: '',
    recipient: '',
    location: '',
    notes: '',
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Not authenticated')
      return
    }

    try {
      setIsLoading(true)

      // Step 1: Create the letter
      const createResponse = await fetch(`http://localhost:8000/api/bundles/${bundleId}/letters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!createResponse.ok) {
        const data = await createResponse.json()
        throw new Error(data.detail || 'Failed to create letter')
      }

      const createdLetter = await createResponse.json()

      // Step 2: Upload files if any were selected
      if (selectedFiles.length > 0) {
        const formDataToSend = new FormData()
        selectedFiles.forEach((file) => {
          formDataToSend.append('files', file)
        })

        const uploadResponse = await fetch(`http://localhost:8000/api/letters/${createdLetter.id}/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataToSend,
        })

        if (!uploadResponse.ok) {
          console.warn('Letter created but file upload failed')
          // Don't throw error - letter was created successfully
        }
      }

      // Step 3: Redirect to edit page
      router.push(`/dashboard/bundles/${bundleId}/letters/${createdLetter.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create letter')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Link href={`/dashboard/bundles/${bundleId}`} className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
        ← Back to Collection
      </Link>

      <h1 className="text-3xl font-bold mb-8">Add Letter</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
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
                disabled={isLoading}
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
                placeholder="e.g., France"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                From (Author)
              </label>
              <input
                id="author"
                name="author"
                type="text"
                value={formData.author}
                onChange={handleChange}
                placeholder="e.g., Grandpa"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                To (Recipient)
              </label>
              <input
                id="recipient"
                name="recipient"
                type="text"
                value={formData.recipient}
                onChange={handleChange}
                placeholder="e.g., Grandma"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
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
              placeholder="Any additional context about this letter..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Page Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  📄 Drop letter page images here or click to select
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-medium cursor-pointer"
                  style={{ pointerEvents: isLoading ? 'none' : 'auto', opacity: isLoading ? 0.6 : 1 }}
                >
                  Choose Files
                </label>
                {selectedFiles.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: JPG, PNG, GIF. Max 10MB per image. You can upload more pages after creation.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Next:</strong> After creating this letter, you'll be taken to the edit page where you can upload additional pages
              and we'll automatically transcribe the handwritten text using AI.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-medium"
            >
              {isLoading ? (selectedFiles.length > 0 ? 'Creating & Uploading...' : 'Creating...') : 'Create Letter'}
            </button>
            <Link
              href={`/dashboard/bundles/${bundleId}`}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
