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
               📝 Letterbundle
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
           <div className="md:col-span-1">
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h2>
               <nav className="space-y-2">
                 <Link
                   href="/dashboard"
                   className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
                 >
                   📚 My Collections
                 </Link>
                 <Link
                   href="/dashboard/bundles/new"
                   className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
                 >
                   ➕ Create Collection
                 </Link>
                 <Link
                   href="/dashboard/settings"
                   className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
                 >
                   ⚙️ Settings
                 </Link>
               </nav>
             </div>
           </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
