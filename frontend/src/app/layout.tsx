import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Letterbundle - Share Handwritten Letter Collections',
  description: 'A platform for sharing and preserving collections of handwritten letters',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
