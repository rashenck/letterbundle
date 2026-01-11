import React from 'react'
import Link from 'next/link'

export const EmptyState = ({ 
  title, 
  description, 
  actionText,
  actionHref 
}: {
  title: string
  description?: string
  actionText: string
  actionHref: string
}) => {
  return (
    <div className="text-center py-12">
      {/* Icon */}
      <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13v2a2 2 0 01-2H4a2 2 0 00-2L7 7a2 2 0 01-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 9 17h6" />
        </svg>
      </div>
      
      {/* Content */}
      <div className="max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-600 mb-6">
            {description}
          </p>
        )}
        <Link
          href={actionHref}
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          <span className="mr-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 3a1 1 0 011 11a1 1 0 013 9a4 9a4 9a4 9H5a2 2 0 00 0v4a4 4a4 4zm-1 0a1 0 0-2h8a2 2 0 002 0v-2a1 1 1 0 002 4.83l4-4.17-4.17z" />
            </svg>
          </span>
          {actionText}
        </Link>
      </div>
    </div>
  )
}