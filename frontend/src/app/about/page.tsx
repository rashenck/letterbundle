'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link className="flex items-center group" href="/">
                <span className="text-3xl mr-2 group-hover:animate-bounce">📝</span>
                <h1 className="text-2xl font-bold text-primary-600 group-hover:text-primary-700 transition-colors">LetterBundle</h1>
              </Link>
            </div>
            <div className="flex gap-6">
              <Link className="text-gray-700 hover:text-primary-600 font-medium transition-colors hover:underline" href="/browse">Browse</Link>
              <Link className="text-gray-700 hover:text-primary-600 font-medium transition-colors hover:underline" href="/login">Login</Link>
              <Link className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 hover:shadow-lg transition-all transform hover:scale-105" href="/register">Sign Up Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary-50 to-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">About LetterBundle</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Preserving handwritten memories for generations to come
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              In an age of digital communication, handwritten letters remain one of the most personal and meaningful ways to connect with others. LetterBundle exists to preserve these precious artifacts of human connection, making them accessible and shareable for future generations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-xl border border-blue-100">
              <div className="text-4xl mb-4">💌</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Preserve History</h3>
              <p className="text-gray-700 leading-relaxed">
                Every handwritten letter tells a story. From love letters during wartime to children's drawings sent to grandparents, these documents capture the essence of human emotion and experience.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border border-green-100">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Make Them Searchable</h3>
              <p className="text-gray-700 leading-relaxed">
                Using advanced AI technology, we automatically transcribe handwritten text, making letters searchable and accessible even when handwriting becomes difficult to read.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl border border-purple-100">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Share with Family</h3>
              <p className="text-gray-700 leading-relaxed">
                Create beautiful digital collections that can be shared privately with family members or publicly to inspire and connect with others who cherish written correspondence.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-xl border border-orange-100">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Last Forever</h3>
              <p className="text-gray-700 leading-relaxed">
                Unlike physical letters that can fade or be lost, digital collections are safely stored in the cloud, protected from damage and accessible forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">The Story Behind LetterBundle</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                LetterBundle was born from a simple observation: in our digital world, the art of handwritten correspondence is becoming rare, yet the letters that do exist hold immense sentimental value. We realized that many people have boxes of precious letters tucked away in attics or closets – letters from grandparents, wartime correspondence, childhood notes – that deserve to be preserved and shared.
              </p>
              <p className="mb-4">
                What started as a passion project to digitize our own family's letters grew into a mission to help others preserve their written heritage. We believe that these personal documents are not just pieces of paper, but windows into the human experience that should be accessible for generations to come.
              </p>
              <p>
                Today, LetterBundle combines cutting-edge AI technology with beautiful design to make preserving letters as meaningful as the letters themselves. We're proud to be part of the growing movement to preserve our collective written history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Preserve Your Letters?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of families preserving their written heritage
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Free ✨
            </Link>
            <Link
              href="/browse"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary-600 transition-all transform hover:scale-105"
            >
              Browse Collections 📚
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="mb-8">
            <h4 className="text-2xl font-bold mb-2">LetterBundle</h4>
            <p className="text-gray-300 max-w-md mx-auto">Preserving memories one letter at a time. Join our community of family historians.</p>
          </div>
          <div className="flex justify-center gap-8 mb-8">
            <Link className="hover:text-primary-300 transition-colors" href="/terms">Terms & Privacy</Link>
            <span className="text-gray-500 cursor-not-allowed">Contact (Coming Soon)</span>
            <span className="text-primary-300">About</span>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-gray-400">© 2026 LetterBundle. Made with ❤️ for family stories.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}