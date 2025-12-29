'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Database,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  MapPin,
  Home
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'buy' | 'rent'>('buy')
  const [isFocused, setIsFocused] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`)
    }
  }

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-indigo-500" />,
      title: 'AI Intelligence',
      description: 'Ask deep questions about any property and get instant, grounded answers.',
    },
    {
      icon: <Database className="w-6 h-6 text-blue-500" />,
      title: '33+ Data Sources',
      description: 'We aggregate flood zones, crime stats, permit history, and school ratings.',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      title: 'Investment ROI',
      description: 'Calculates Cap Rate, Cash-on-Cash, and rental yield automatically.',
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-rose-500" />,
      title: 'Risk Detection',
      description: 'Proactively flags wildfires, noise pollution, and negative market trends.',
    },
  ]

  const quickCities = ['Danville, CA', 'San Ramon, CA', 'Pleasanton, CA', 'Dublin, CA']

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900">

      {/* Navbar Overlay */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Home size={18} strokeWidth={3} />
            </div>
            HomeInsight AI
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="/search" className="hover:text-blue-600 transition-colors">Browse</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">How it Works</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Pricing</Link>
          </div>
          <button className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-8 animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
            <Sparkles size={12} />
            <span>New: Real-time Streaming AI Chat</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 animate-fade-in opacity-0" style={{ animationDelay: '0.2s' }}>
            Real estate search, <br />
            <span className="text-gradient">reimagined by AI.</span>
          </h1>

          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in opacity-0" style={{ animationDelay: '0.3s' }}>
            Stop opening 20 tabs. Get an instant, comprehensive deep-dive validation on any property in seconds.
          </p>

          {/* Search Container */}
          <div className="relative max-w-2xl mx-auto animate-fade-in opacity-0" style={{ animationDelay: '0.4s' }}>

            {/* Search Type Toggles */}
            <div className="absolute -top-12 left-0 flex gap-4">
              <button
                onClick={() => setSearchType('buy')}
                className={`text-sm font-medium pb-1 transition-colors border-b-2 ${searchType === 'buy' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                Buy
              </button>
              <button
                onClick={() => setSearchType('rent')}
                className={`text-sm font-medium pb-1 transition-colors border-b-2 ${searchType === 'rent' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                Rent
              </button>
            </div>

            <form onSubmit={handleSearch} className={`relative group transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
              <div className={`
                absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-20 blur transition duration-500
                ${isFocused ? 'opacity-40' : 'opacity-20'}
              `} />

              <div className="relative bg-white rounded-2xl shadow-xl flex items-center p-2">
                <MapPin className="ml-4 text-slate-400 w-6 h-6" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Address, neighborhood, city, or ZIP..."
                  className="flex-1 w-full p-4 bg-transparent outline-none text-lg text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2 font-medium pr-5"
                >
                  <Search size={20} />
                  Search
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 justify-center text-sm text-slate-500">
              <span>Try:</span>
              {quickCities.map((city) => (
                <Link
                  key={city}
                  href={`/search?q=${encodeURIComponent(city)}`}
                  className="hover:text-blue-600 hover:underline transition-colors"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Why trust HomeInsight?</h2>
            <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
              We go beyond basic listing data to provide the deep due diligence typically reserved for institutional investors.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 text-slate-100 font-bold text-xl">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white">
              <Home size={14} strokeWidth={3} />
            </div>
            HomeInsight AI
          </div>
          <p className="text-sm mb-8">© 2025 HomeInsight AI. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
