'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
        full: string
        city: string
        state: string
        postalCode: string
    }
    geo: { lat: number; lng: number }
    photos: string[]
    mls: { status: string; daysOnMarket: number }
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
    const [filters, setFilters] = useState({
        minBeds: '',
        maxPrice: '',
    })

    useEffect(() => {
        fetchListings()
    }, [query, type, sortBy])

    const fetchListings = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (query) params.append('q', query)
            params.append('status', 'Active')
            params.append('limit', '24')

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
            }

            setListings(sorted)
        } catch (error) {
            console.error('Failed to fetch listings:', error)
            setListings([])
        } finally {
            setLoading(false)
        }
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
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-6 h-16">
                        <Link href="/" className="flex items-center gap-2 shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold text-gray-900 hidden sm:block">HomeInsight AI</span>
                        </Link>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    defaultValue={query}
                                    placeholder="Search by address, city, or ZIP..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            router.push(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}&type=${type}`)
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Buy/Rent Toggle */}
                        <div className="flex p-1 bg-gray-100 rounded-xl shrink-0">
                            <button
                                onClick={() => router.push(`/search?q=${query}&type=buy`)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${type === 'buy' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => router.push(`/search?q=${query}&type=rent`)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${type === 'rent' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Rent
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filters:
                            </div>

                            <select
                                value={filters.minBeds}
                                onChange={(e) => setFilters({ ...filters, minBeds: e.target.value })}
                                className="px-3 py-1.5 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Any Beds</option>
                                <option value="1">1+ beds</option>
                                <option value="2">2+ beds</option>
                                <option value="3">3+ beds</option>
                                <option value="4">4+ beds</option>
                            </select>

                            <select
                                value={filters.maxPrice}
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                className="px-3 py-1.5 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Any Price</option>
                                <option value="500000">Under $500K</option>
                                <option value="1000000">Under $1M</option>
                                <option value="2000000">Under $2M</option>
                                <option value="5000000">Under $5M</option>
                            </select>

                            <button
                                onClick={fetchListings}
                                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Update
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-1.5 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                            </select>

                            <div className="flex bg-gray-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {query ? `Homes for ${type === 'rent' ? 'Rent' : 'Sale'} in ${query}` : 'All Listings'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Found {listings.length} properties matching your criteria
                    </p>
                </div>

                {loading ? (
                    // Loading Skeleton
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                <div className="h-48 shimmer" />
                                <div className="p-5">
                                    <div className="h-6 shimmer rounded w-1/3 mb-3" />
                                    <div className="h-4 shimmer rounded w-3/4 mb-2" />
                                    <div className="h-4 shimmer rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : listings.length === 0 ? (
                    // Empty State
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h2>
                        <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
                        <Link href="/" className="btn-primary">
                            ← Back to Home
                        </Link>
                    </div>
                ) : (
                    // Listings Grid
                    <div className={`grid gap-6 ${viewMode === 'grid'
                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                            : 'grid-cols-1'
                        }`}>
                        {listings.map((listing) => (
                            <Link
                                key={listing.mlsId}
                                href={`/property/${listing.mlsId}`}
                                className={`group bg-white rounded-2xl overflow-hidden shadow-sm card-hover border border-gray-100 ${viewMode === 'list' ? 'flex' : ''
                                    }`}
                            >
                                {/* Image */}
                                <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-72 shrink-0' : 'h-52'}`}>
                                    {listing.photos && listing.photos.length > 0 ? (
                                        <img
                                            src={listing.photos[0]}
                                            alt={listing.address.full}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`badge ${listing.mls.status === 'Active' ? 'badge-success' : 'badge-warning'
                                            }`}>
                                            {listing.mls.status}
                                        </span>
                                    </div>

                                    {/* Price Tag */}
                                    <div className="absolute bottom-3 right-3">
                                        <span className="px-3 py-1.5 bg-gray-900/80 text-white text-lg font-bold rounded-lg backdrop-blur-sm">
                                            {formatPrice(listing.listPrice)}
                                        </span>
                                    </div>

                                    {/* AI Badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2 py-1 bg-blue-600/90 text-white text-xs font-medium rounded-full backdrop-blur-sm flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                            AI Ready
                                        </span>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-5 flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                                        {listing.address.full}
                                    </h3>

                                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                            </svg>
                                            {listing.property.bedrooms}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                            </svg>
                                            {listing.property.bathsFull + (listing.property.bathsHalf * 0.5)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            </svg>
                                            {listing.property.area?.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="badge badge-info">
                                            {listing.property.type?.substring(0, 3).toUpperCase() || 'RES'}
                                        </span>
                                        <span>
                                            {listing.mls.daysOnMarket} days ago
                                        </span>
                                    </div>
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
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    )
}
