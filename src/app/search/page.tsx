'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Listing {
    mlsId: number
    listPrice: number
    listDate: string
    property: {
        type: string
        bedrooms: number
        bathsFull: number
        bathsHalf: number
        area: number
        yearBuilt: number
    }
    address: {
        streetNumber: string
        streetName: string
        city: string
        state: string
        postalCode: string
        full: string
    }
    geo: { lat: number; lng: number }
    photos: string[]
    mls: { status: string; daysOnMarket: number }
}

interface Filters {
    minPrice: string
    maxPrice: string
    minBeds: string
    minBaths: string
}

function SearchContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'buy'

    const [listings, setListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState('newest')
    const [filters, setFilters] = useState<Filters>({
        minPrice: '',
        maxPrice: '',
        minBeds: '',
        minBaths: '',
    })

    useEffect(() => {
        fetchListings()
    }, [query, type, sortBy])

    const fetchListings = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (query) params.append('q', query)
            params.append('type', type === 'rent' ? 'rental' : 'residential')
            params.append('status', 'Active')
            params.append('limit', '24')

            if (filters.minPrice) params.append('minprice', filters.minPrice)
            if (filters.maxPrice) params.append('maxprice', filters.maxPrice)
            if (filters.minBeds) params.append('minbeds', filters.minBeds)
            if (filters.minBaths) params.append('minbaths', filters.minBaths)

            const response = await fetch(`/api/listings?${params.toString()}`)
            const data = await response.json()

            let sorted = [...(data.listings || data || [])]
            switch (sortBy) {
                case 'price_low':
                    sorted.sort((a, b) => a.listPrice - b.listPrice)
                    break
                case 'price_high':
                    sorted.sort((a, b) => b.listPrice - a.listPrice)
                    break
                case 'newest':
                    sorted.sort((a, b) => new Date(b.listDate).getTime() - new Date(a.listDate).getTime())
                    break
                case 'beds':
                    sorted.sort((a, b) => b.property.bedrooms - a.property.bedrooms)
                    break
            }

            setListings(sorted)
        } catch (error) {
            console.error('Failed to fetch listings:', error)
            setListings([])
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        fetchListings()
    }

    const formatPrice = (price: number) => {
        if (price >= 1000000) {
            return `$${(price / 1000000).toFixed(2)}M`
        }
        return `$${(price / 1000).toFixed(0)}K`
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-xl font-bold text-blue-600">
                            🏠 HomeInsight AI
                        </Link>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-xl relative">
                            <input
                                type="text"
                                defaultValue={query}
                                placeholder="Search by address, city, or ZIP"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.push(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}&type=${type}`)
                                    }
                                }}
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                        </div>

                        {/* Buy/Rent Toggle */}
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => router.push(`/search?q=${query}&type=buy`)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type === 'buy' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                                    }`}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => router.push(`/search?q=${query}&type=rent`)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type === 'rent' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                                    }`}
                            >
                                Rent
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="bg-white border-b py-3">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Quick Filters */}
                            <select
                                value={filters.minBeds}
                                onChange={(e) => setFilters({ ...filters, minBeds: e.target.value })}
                                className="px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="">Beds</option>
                                <option value="1">1+ beds</option>
                                <option value="2">2+ beds</option>
                                <option value="3">3+ beds</option>
                                <option value="4">4+ beds</option>
                                <option value="5">5+ beds</option>
                            </select>

                            <select
                                value={filters.maxPrice}
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                className="px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="">Max Price</option>
                                <option value="500000">$500K</option>
                                <option value="750000">$750K</option>
                                <option value="1000000">$1M</option>
                                <option value="1500000">$1.5M</option>
                                <option value="2000000">$2M</option>
                                <option value="3000000">$3M+</option>
                            </select>

                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                            >
                                Apply
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="newest">Newest</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="beds">Most Bedrooms</option>
                            </select>

                            {/* View Toggle */}
                            <div className="flex border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {query ? `Homes for ${type === 'rent' ? 'Rent' : 'Sale'} in ${query}` : 'All Listings'}
                    </h1>
                    <span className="text-gray-600">{listings.length} homes found</span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                                <div className="h-48 bg-gray-200" />
                                <div className="p-4">
                                    <div className="h-6 bg-gray-200 rounded w-24 mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🏠</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h2>
                        <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                        <Link href="/" className="text-blue-600 hover:underline">
                            ← Back to home
                        </Link>
                    </div>
                ) : (
                    <div className={`grid gap-6 ${viewMode === 'grid'
                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                            : 'grid-cols-1'
                        }`}>
                        {listings.map((listing) => (
                            <Link
                                key={listing.mlsId}
                                href={`/property/${listing.mlsId}`}
                                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group ${viewMode === 'list' ? 'flex' : ''
                                    }`}
                            >
                                {/* Image */}
                                <div className={`relative ${viewMode === 'list' ? 'w-72 flex-shrink-0' : 'h-48'}`}>
                                    {listing.photos && listing.photos.length > 0 ? (
                                        <Image
                                            src={listing.photos[0]}
                                            alt={listing.address.full}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-4xl">
                                            🏠
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${listing.mls.status === 'Active'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-yellow-500 text-white'
                                            }`}>
                                            {listing.mls.status}
                                        </span>
                                    </div>

                                    {/* New Badge */}
                                    {listing.mls.daysOnMarket <= 7 && (
                                        <div className="absolute top-3 right-3">
                                            <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-semibold">
                                                New
                                            </span>
                                        </div>
                                    )}

                                    {/* AI Badge */}
                                    <div className="absolute bottom-3 right-3">
                                        <span className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-semibold">
                                            🤖 AI Insights
                                        </span>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-4 flex-1">
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-xl font-bold text-gray-900">
                                            {formatPrice(listing.listPrice)}
                                        </span>
                                        {type === 'rent' && <span className="text-gray-500">/mo</span>}
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                                        <span>{listing.property.bedrooms} bd</span>
                                        <span>|</span>
                                        <span>{listing.property.bathsFull + (listing.property.bathsHalf * 0.5)} ba</span>
                                        <span>|</span>
                                        <span>{listing.property.area?.toLocaleString()} sqft</span>
                                    </div>

                                    <p className="text-gray-500 text-sm truncate">
                                        {listing.address.full}
                                    </p>

                                    {viewMode === 'list' && (
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-gray-500">
                                            <span>Built {listing.property.yearBuilt}</span>
                                            <span>{listing.property.type}</span>
                                            <span>{listing.mls.daysOnMarket} days on market</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <SearchContent />
        </Suspense>
    )
}
