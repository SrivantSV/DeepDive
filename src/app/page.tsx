'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'buy' | 'rent'>('buy')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`)
    }
  }

  const quickSearches = ['Danville, CA', 'San Ramon, CA', 'Pleasanton, CA', 'Dublin, CA']

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI Intelligence',
      description: 'Ask any question and get instant, data-backed answers about any property.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      title: '1500+ Data Sources',
      description: 'We aggregate flood zones, crime stats, schools, permits, and market data.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title: 'Investment ROI',
      description: 'Instant cap rate, cash-on-cash return, and rental yield calculations.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      title: 'Risk Detection',
      description: 'Automatically flag wildfires, floods, earthquakes, crime, and market risks.',
      color: 'from-orange-500 to-red-500',
    },
  ]

  const stats = [
    { value: '1500+', label: 'Data Sources' },
    { value: '50ms', label: 'Avg Response' },
    { value: '99%', label: 'Accuracy' },
    { value: '24/7', label: 'Available' },
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">HomeInsight AI</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/search" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Browse
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                How it Works
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button className="btn-secondary !py-2 !px-4 text-sm">Sign In</button>
              <button className="btn-primary !py-2 !px-4 text-sm">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-50" />

        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-700">Real-time AI Analysis</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-6">
              Real estate search,
              <br />
              <span className="text-gradient">reimagined by AI.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop opening 20 tabs. Get instant, comprehensive due diligence on any property
              with AI-powered analysis from 33+ data sources.
            </p>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto">
              {/* Buy/Rent Toggle */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setSearchType('buy')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${searchType === 'buy'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setSearchType('rent')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${searchType === 'rent'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Rent
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <form onSubmit={handleSearch} className="relative">
                <div className={`flex items-center bg-white rounded-2xl shadow-xl transition-all duration-300 ${isSearchFocused ? 'ring-4 ring-blue-500/20 shadow-2xl' : ''
                  }`}>
                  <div className="flex-1 flex items-center px-6">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Address, neighborhood, city, or ZIP..."
                      className="flex-1 px-4 py-5 text-lg text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                  <div className="pr-3 flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center gap-2"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        if (searchQuery.trim()) {
                          router.push(`/deep-dive?q=${encodeURIComponent(searchQuery)}`)
                        }
                      }}
                      className="px-6 py-4 bg-white text-blue-600 font-bold rounded-xl border-2 border-blue-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2"
                      title="Analyze any address with AI"
                    >
                      <span className="hidden sm:inline">Deep Dive</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </form>

              {/* Quick Search */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="text-sm text-gray-500">Try:</span>
                {quickSearches.map((city) => (
                  <button
                    key={city}
                    onClick={() => router.push(`/search?q=${encodeURIComponent(city)}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-gray-200">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why choose HomeInsight?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide the deep due diligence typically reserved for institutional investors,
              available to everyone in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-white rounded-2xl border border-gray-100 card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 mesh-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600">
              Three simple steps to comprehensive property intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search',
                description: 'Enter any address, neighborhood, or ZIP code to find properties.',
                icon: '🔍',
              },
              {
                step: '02',
                title: 'Explore',
                description: 'View detailed property information, photos, and AI-generated insights.',
                icon: '🏠',
              },
              {
                step: '03',
                title: 'Ask',
                description: 'Chat with our AI to get instant answers about any aspect of the property.',
                icon: '💬',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 card-hover h-full">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <div className="text-sm font-bold text-blue-600 mb-2">STEP {item.step}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-gray-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Questions */}
      <section className="py-24 gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ask anything
            </h2>
            <p className="text-lg text-blue-100">
              Our AI can answer questions like:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              'Is this property overpriced?',
              'Is this a good investment?',
              'How are the schools nearby?',
              'Any red flags I should know?',
              'What would my monthly cost be?',
              'Is this neighborhood safe?',
              'How is the commute to SF?',
              'What do neighbors say?',
              'Is there flood risk here?',
            ].map((question, index) => (
              <div
                key={index}
                className="glass-dark rounded-xl px-5 py-4 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <span className="text-blue-200 mr-2">→</span>
                "{question}"
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to find your perfect home?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start your AI-powered property search today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="btn-primary text-lg">
              Start Searching
            </Link>
            <button className="btn-secondary text-lg">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <span className="text-white font-bold">HomeInsight AI</span>
              </div>
              <p className="text-sm">
                AI-powered real estate intelligence for everyone.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/search" className="hover:text-white transition-colors">Search</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            © {new Date().getFullYear()} HomeInsight AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
