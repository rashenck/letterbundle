import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
        <Link href="/" className="block text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Letterbundle</h1>
        </Link>

        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-center mb-8">Terms of Service & Privacy Policy</h1>

          <p className="text-gray-600 mb-8 text-center">
            Last updated: January 10, 2026
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Terms of Service</h2>

            <h3 className="text-xl font-semibold mb-3">Acceptance of Terms</h3>
            <p className="mb-4">
              By accessing and using Letterbundle ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h3 className="text-xl font-semibold mb-3">Use License</h3>
            <p className="mb-4">
              Permission is granted to temporarily access the materials (information or software) on Letterbundle for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
              <li>attempt to decompile or reverse engineer any software contained on Letterbundle</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Content Upload Guidelines</h3>
            <p className="mb-4">
              <strong>Important:</strong> You are solely responsible for the content you upload to Letterbundle. You must ensure that:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You have full legal right, title, and permission to upload and share the letters and images</li>
              <li>The content does not violate any applicable laws, including but not limited to United States copyright, trademark, privacy, or other laws</li>
              <li>The content does not contain illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive content</li>
              <li>The content does not infringe on the rights of any third party</li>
              <li>You are at least 18 years old or have parental consent to upload content</li>
            </ul>
            <p className="mb-4">
              By uploading content to Letterbundle, you represent and warrant that you own or have the necessary permissions to use and share the content, and that such use does not violate any laws or third-party rights.
            </p>

            <h3 className="text-xl font-semibold mb-3">Service Termination</h3>
            <p className="mb-4">
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h3 className="text-xl font-semibold mb-3">Disclaimer</h3>
            <p className="mb-4">
              The materials on Letterbundle are provided on an 'as is' basis. Letterbundle makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Privacy Policy</h2>

            <h3 className="text-xl font-semibold mb-3">Information We Collect</h3>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, upload content, or contact us for support. This may include:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Name, email address, and username</li>
              <li>Content you upload (letters, images, metadata)</li>
              <li>Communications with us</li>
              <li>Usage data and analytics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">How We Use Your Information</h3>
            <p className="mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and store your uploaded content</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Data Storage and Security</h3>
            <p className="mb-4">
              Your uploaded letters and images are stored securely in the cloud. We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>

            <h3 className="text-xl font-semibold mb-3">Content Ownership and Rights</h3>
            <p className="mb-4">
              You retain ownership of the content you upload to Letterbundle. By uploading content, you grant us a limited license to store, display, and process your content for the purpose of providing our services. We do not claim ownership of your personal letters or images.
            </p>

            <h3 className="text-xl font-semibold mb-3">Public Content</h3>
            <p className="mb-4">
              If you choose to make your letter collections public, they may be visible to other users and search engines. You are responsible for any personal information you choose to share publicly. We recommend not sharing sensitive personal information in public collections.
            </p>

            <h3 className="text-xl font-semibold mb-3">Data Deletion</h3>
            <p className="mb-4">
              You can delete your account and associated content at any time. When you delete your account, we will remove your personal information and content from our systems, though some anonymized data may be retained for analytical purposes.
            </p>

            <h3 className="text-xl font-semibold mb-3">Children's Privacy</h3>
            <p className="mb-4">
              Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>

            <h3 className="text-xl font-semibold mb-3">Changes to This Policy</h3>
            <p className="mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us through the contact form on our website (coming soon).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are and will remain the exclusive property of Letterbundle and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. Limitation of Liability</h2>
            <p className="mb-4">
              In no event shall Letterbundle, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be interpreted and governed by the laws of the United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600">
              Questions about these terms? <Link href="/" className="text-primary-600 hover:underline">Return to Letterbundle</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}