import { NextResponse } from 'next/server'

// Simple SVG favicon with purple background and white pencil emoji
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" fill="#6b46c1" rx="4"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">📝</text>
</svg>`

export async function GET() {
  return new NextResponse(faviconSvg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}