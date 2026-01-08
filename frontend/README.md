# Letterbundle Frontend

Next.js + TypeScript + Tailwind CSS frontend for the Letterbundle application.

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
# or
yarn install
```

### Development

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (public)/       # Public routes
│   ├── dashboard/      # Protected dashboard routes
│   ├── login/
│   ├── register/
│   └── layout.tsx      # Root layout
├── components/         # Reusable components
├── lib/               # Utilities
│   ├── api.ts         # API client
│   └── auth.tsx       # Auth context/hooks
└── styles/
```

## Key Features

- **Authentication**: Email/password with JWT tokens
- **Protected Routes**: Middleware for dashboard access
- **API Integration**: Typed API client for backend
- **Responsive Design**: Mobile-first with Tailwind CSS
- **TypeScript**: Full type safety

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API base URL (default: http://localhost:8000/api)

## Building for Production

```bash
npm run build
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).
