import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HomeInsight AI - Smart Real Estate Search',
  description: 'Find your perfect home with AI-powered property insights. Analyze schools, crime, flood zones, investment potential and more with 33 data sources.',
  keywords: 'real estate, home search, property insights, AI, schools, crime, investment, Zillow alternative',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  )
}
