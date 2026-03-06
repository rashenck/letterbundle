'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useEffect } from 'react'
import { Spinner } from '@/components/ui'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoggedIn, logout, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
       <nav className="bg-white border-b border-gray-200 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center h-16">
             <Link href="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
               📝 LetterBundle
             </Link>

             <div className="flex items-center gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                   {user?.first_name?.[0]}{user?.last_name?.[0]}
                 </div>
                 <span className="text-gray-700 font-medium">
                   {user?.first_name} {user?.last_name}
                 </span>
               </div>
               <button
                 onClick={handleLogout}
                 className="text-gray-600 hover:text-gray-900 font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors"
               >
                 Logout
               </button>
             </div>
           </div>
         </div>
       </nav>

      {/* Sidebar + Content */}
      <div className="max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Collapsible Sidebar */}
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-16 hover:w-64 transition-all duration-300 z-40">
          <div className="h-full bg-white shadow-lg border-r border-gray-200 p-4 overflow-hidden">
            <h2 className="font-semibold text-gray-900 mb-4 whitespace-nowrap">Navigation</h2>
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
              >
                <span className="text-lg">📚</span>
                <span className="whitespace-nowrap">My Collections</span>
              </Link>
              <Link
                href="/dashboard/bundles/new"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
              >
                <span className="text-lg">➕</span>
                <span className="whitespace-nowrap">Create Collection</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
              >
                <span className="text-lg">⚙️</span>
                <span className="whitespace-nowrap">Settings</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="pl-16">
          {children}
        </div>
      </div>
    </div>
  )
}
