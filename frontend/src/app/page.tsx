import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">Letterbundle</h1>
              </Link>
            </div>
            <div className="flex gap-4">
              <Link href="/browse" className="text-gray-700 hover:text-primary-600">
                Browse
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-primary-600">
                Login
              </Link>
              <Link 
                href="/register" 
                className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Preserve & Share Handwritten Letters
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Transform your cherished letter collections into searchable digital archives. 
            Keep them safe, share them with family, and make them discoverable.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/register"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Get Started Free
            </Link>
            <Link 
              href="/browse"
              className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
            >
              Browse Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Letterbundle?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Automatic OCR',
                description: 'Handwritten text is automatically transcribed using AI, making letters searchable.'
              },
              {
                title: 'Beautiful Collections',
                description: 'Organize letters into themed bundles and share them with friends and family.'
              },
              {
                title: 'Preserved Forever',
                description: 'Your letters are backed up securely in the cloud, protected for generations.'
              }
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-8 rounded-lg shadow">
                <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="mb-4">Letterbundle © 2026. Preserving memories one letter at a time.</p>
          <div className="flex justify-center gap-6">
            <Link href="/terms" className="hover:text-primary-300">Terms</Link>
            <Link href="/privacy" className="hover:text-primary-300">Privacy</Link>
            <Link href="/contact" className="hover:text-primary-300">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
