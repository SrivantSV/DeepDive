'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Brain,
  Database,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Eye,
  MessageCircle,
  MapPin,
  Sparkles
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'buy' | 'rent'>('buy')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`)
    }
  }

  const features = [
    {
      icon: <Sparkles className="w-8 h-8 text-purple-600" />,
      title: 'AI-Powered Insights',
      description: 'Ask any question about a property and get instant, detailed answers',
    },
    {
      icon: <Database className="w-8 h-8 text-blue-600" />,
      title: 'Deep Data Analysis',
      description: '33 data sources analyzed including schools, crime, flood zones, and more',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      title: 'Investment Analysis',
      description: 'Get ROI, cap rate, and cash flow projections for any property',
    },
    {
      icon: <ShieldAlert className="w-8 h-8 text-red-600" />,
      title: 'Red Flag Detection',
      description: 'Automatically identify potential issues before you make an offer',
    },
  ]

  const quickCities = ['Danville, CA', 'San Ramon, CA', 'Pleasanton, CA', 'Dublin, CA']

  const sampleQuestions = [
    'Is this a good investment?',
    'Is this property overpriced?',
    'How are the schools nearby?',
    'What is the flood risk?',
    'What would my monthly cost be?',
    'Any red flags I should know about?',
    'How is the commute to San Francisco?',
    'Is this neighborhood safe?',
    'What do neighbors say about this area?',
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          {/* Logo/Brand */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-3">
              <Search className="w-12 h-12 md:w-16 md:h-16 text-blue-300" />
              HomeInsight AI
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 max-w-2xl mx-auto">
              The smartest way to find your next home. AI-powered insights on every property.
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-3xl mx-auto">
            {/* Buy/Rent Toggle */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setSearchType('buy')}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${searchType === 'buy'
                  ? 'bg-white text-blue-900'
                  : 'bg-blue-800 text-white hover:bg-blue-700'
                  }`}
              >
                Buy
              </button>
              <button
                onClick={() => setSearchType('rent')}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${searchType === 'rent'
                  ? 'bg-white text-blue-900'
                  : 'bg-blue-800 text-white hover:bg-blue-700'
                  }`}
              >
                Rent
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch}>
              <div className="flex flex-col md:flex-row gap-2 bg-white rounded-xl p-2 shadow-2xl">
                <div className="flex-1 flex items-center">
                  <span className="pl-4 text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter an address, neighborhood, city, or ZIP code"
                    className="flex-1 px-4 py-4 text-lg text-gray-800 focus:outline-none rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {quickCities.map((city) => (
                <Link
                  key={city}
                  href={`/search?q=${encodeURIComponent(city)}`}
                  className="px-4 py-2 bg-blue-800/50 text-white rounded-full text-sm hover:bg-blue-700/50 transition-colors"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Why HomeInsight AI?
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We analyze 33 data sources to give you the most comprehensive property insights available.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>

          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Search</h3>
              <p className="text-gray-600 max-w-xs">
                Enter any address, city, or ZIP code to find properties
              </p>
            </div>

            <div className="hidden md:block text-gray-300 text-4xl">→</div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Explore</h3>
              <p className="text-gray-600 max-w-xs">
                View detailed property information and AI-generated insights
              </p>
            </div>

            <div className="hidden md:block text-gray-300 text-4xl">→</div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Ask</h3>
              <p className="text-gray-600 max-w-xs">
                Chat with our AI to get answers to any question about the property
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Questions */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Ask Anything
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Our AI can answer questions like:
          </p>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {sampleQuestions.map((question, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-full text-sm hover:bg-gray-700 transition-colors cursor-default"
              >
                &ldquo;{question}&rdquo;
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                HomeInsight AI
              </h3>
              <p className="text-sm">
                The smartest way to find your next home.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Search</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/search?type=buy" className="hover:text-white">Buy</Link></li>
                <li><Link href="/search?type=rent" className="hover:text-white">Rent</Link></li>
                <li><Link href="/search" className="hover:text-white">All Listings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Mortgage Calculator</Link></li>
                <li><Link href="#" className="hover:text-white">Investment Guide</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            © 2024 HomeInsight AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
