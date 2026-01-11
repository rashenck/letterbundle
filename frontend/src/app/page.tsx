import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
       {/* Navigation */}
       <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center h-16">
             <div className="flex items-center">
               <Link href="/" className="flex items-center group">
                 <span className="text-3xl mr-2 group-hover:animate-bounce">📝</span>
                 <h1 className="text-2xl font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
                   LetterBundle
                 </h1>
               </Link>
             </div>
             <div className="flex gap-6">
               <Link href="/browse" className="text-gray-700 hover:text-primary-600 font-medium transition-colors hover:underline">
                 Browse
               </Link>
               <Link href="/login" className="text-gray-700 hover:text-primary-600 font-medium transition-colors hover:underline">
                 Login
               </Link>
               <Link
                 href="/register"
                 className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 hover:shadow-lg transition-all transform hover:scale-105"
               >
                 Sign Up Free
               </Link>
             </div>
           </div>
         </div>
       </nav>

       {/* Hero Section */}
       <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-25 py-20 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-transparent"></div>
         <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
           <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight animate-pulse">
             Preserve & Share
             <span className="block text-primary-600">Handwritten Letters</span>
           </h2>
           <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
             Transform your cherished letter collections into searchable digital archives.
             Keep them safe, share them with family, and make them discoverable for generations.
           </p>
           <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
             <Link
               href="/register"
               className="bg-primary-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full sm:w-auto group"
             >
               Get Started Free
               <span className="block text-sm font-normal opacity-90 group-hover:opacity-100 transition-opacity">
                 ✨ Join the community
               </span>
             </Link>
             <Link
               href="/browse"
               className="border-2 border-primary-600 text-primary-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 hover:border-primary-700 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto group"
             >
               Browse Collections
               <span className="block text-sm font-normal opacity-90 group-hover:opacity-100 transition-opacity">
                 📚 Explore shared stories
               </span>
             </Link>
           </div>
         </div>
         {/* Decorative elements */}
         <div className="absolute top-20 left-10 text-6xl opacity-10 animate-bounce">📜</div>
         <div className="absolute bottom-20 right-10 text-6xl opacity-10 animate-bounce animation-delay-1000">✉️</div>
       </section>

       {/* Features Section */}
       <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
         <div className="max-w-6xl mx-auto px-4">
           <h3 className="text-4xl font-bold text-center mb-4 text-gray-900">Why LetterBundle?</h3>
           <p className="text-xl text-center text-gray-600 mb-16 max-w-2xl mx-auto">
             Discover the features that make preserving family letters meaningful and accessible
           </p>
           <div className="grid md:grid-cols-3 gap-8">
             {[
               {
                 title: 'Automatic OCR',
                 description: 'Handwritten text is automatically transcribed using AI, making letters searchable and accessible to everyone.',
                 icon: '🤖',
                 color: 'from-blue-500 to-cyan-500'
               },
               {
                 title: 'Beautiful Collections',
                 description: 'Organize letters into themed bundles and share them with friends and family in stunning digital galleries.',
                 icon: '📚',
                 color: 'from-green-500 to-emerald-500'
               },
               {
                 title: 'Preserved Forever',
                 description: 'Your letters are backed up securely in the cloud, protected and accessible for generations to come.',
                 icon: '🔐',
                 color: 'from-purple-500 to-pink-500'
               }
             ].map((feature) => (
               <div key={feature.title} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group">
                 <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300`}>
                   {feature.icon}
                 </div>
                 <h4 className="text-2xl font-bold mb-4 text-gray-900 text-center">{feature.title}</h4>
                 <p className="text-gray-600 leading-relaxed text-center">{feature.description}</p>
               </div>
             ))}
           </div>
         </div>
       </section>

       {/* Footer */}
       <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
         <div className="max-w-6xl mx-auto px-4 text-center">
           <div className="mb-8">
             <h4 className="text-2xl font-bold mb-2">LetterBundle</h4>
             <p className="text-gray-300 max-w-md mx-auto">
               Preserving memories one letter at a time. Join our community of family historians.
             </p>
           </div>
            <div className="flex justify-center gap-8 mb-8">
              <Link href="/terms" className="hover:text-primary-300 transition-colors">Terms & Privacy</Link>
              <span className="text-gray-500 cursor-not-allowed">Contact (Coming Soon)</span>
              <Link href="/about" className="hover:text-primary-300 transition-colors">About</Link>
            </div>
           <div className="border-t border-gray-700 pt-8">
             <p className="text-gray-400">© 2026 LetterBundle. Made with ❤️ for family stories.</p>
           </div>
         </div>
       </footer>
    </div>
  )
}
