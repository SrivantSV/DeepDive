'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    Search,
    MapPin,
    BedDouble,
    Bath,
    Ruler,
    LayoutGrid,
    List,
    Filter,
    ChevronDown,
    Sparkles,
    ArrowRight,
    SearchX,
    ImageIcon,
    Home
} from 'lucide-react'

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
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-800 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                                <Home size={16} strokeWidth={3} />
                            </div>
                            <span className="hidden sm:inline">HomeInsight AI</span>
                        </Link>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-xl relative group">
                            <input
                                type="text"
                                defaultValue={query}
                                placeholder="Address, City, ZIP..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all shadow-inner"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.push(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}&type=${type}`)
                                    }
                                }}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                        </div>

                        {/* Buy/Rent Toggle */}
                        <div className="hidden sm:flex gap-1 bg-slate-100 rounded-lg p-1">
                            {['buy', 'rent'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => router.push(`/search?q=${query}&type=${t}`)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all capitalize ${type === t
                                        ? 'bg-white shadow-sm text-blue-600'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="bg-white border-b border-slate-200 py-3 sticky top-[65px] z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                            <div className="flex items-center gap-2 pr-4">
                                <Filter size={16} className="text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">Filters:</span>
                            </div>

                            {['minBeds', 'maxPrice'].map((key) => (
                                <select
                                    key={key}
                                    value={filters[key as keyof Filters]}
                                    onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer hover:border-slate-300 transition-colors"
                                >
                                    {key === 'minBeds' ? (
                                        <>
                                            <option value="">Any Beds</option>
                                            <option value="1">1+ Beds</option>
                                            <option value="2">2+ Beds</option>
                                            <option value="3">3+ Beds</option>
                                            <option value="4">4+ Beds</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="">Any Price</option>
                                            <option value="500000">$500k</option>
                                            <option value="1000000">$1M</option>
                                            <option value="1500000">$1.5M</option>
                                            <option value="2500000">$2.5M</option>
                                        </>
                                    )}
                                </select>
                            ))}

                            <button
                                onClick={applyFilters}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                            >
                                Update
                            </button>
                        </div>

                        <div className="flex items-center gap-3 border-l border-slate-100 pl-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 bg-transparent text-sm font-medium text-slate-600 focus:outline-none cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                            </select>

                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Results Count & Heading */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {query ? `Homes for ${type === 'rent' ? 'Rent' : 'Sale'} in ${query}` : 'All Listings'}
                        </h1>
                        <p className="text-slate-500 mt-1">Found {listings.length} properties matching your criteria</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                <div className="h-64 bg-slate-200 animate-pulse" />
                                <div className="p-5 space-y-3">
                                    <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse" />
                                    <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
                                    <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="inline-flex justify-center items-center w-20 h-20 bg-slate-50 rounded-full mb-6">
                            <SearchX className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No listings found</h2>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">We couldn't find any properties matching your current filters. Try removing some filters or searching a wider area.</p>
                        <button
                            onClick={() => { setFilters({ minPrice: '', maxPrice: '', minBeds: '', minBaths: '' }); fetchListings(); }}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className={`grid gap-8 ${viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1 max-w-4xl mx-auto'
                        }`}>
                        {listings.map((listing) => (
                            <Link
                                key={listing.mlsId}
                                href={`/property/${listing.mlsId}`}
                                className={`group relative bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}
                            >
                                {/* Image Container */}
                                <div className={`relative overflow-hidden bg-slate-100 ${viewMode === 'list' ? 'w-full sm:w-80 h-64 sm:h-auto' : 'h-64'}`}>
                                    {listing.photos && listing.photos.length > 0 ? (
                                        <Image
                                            src={listing.photos[0]}
                                            alt={listing.address.full}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />

                                    {/* Status Badge */}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm ${listing.mls.status === 'Active'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-amber-500 text-white'
                                            }`}>
                                            {listing.mls.status}
                                        </span>
                                    </div>

                                    {/* AI Badge & Price (On Image for Grid) */}
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                        <div className="glass px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-white backdrop-blur-md bg-black/30 border border-white/20">
                                            <Sparkles size={12} className="text-yellow-300" />
                                            AI Ready
                                        </div>
                                        <div className="text-white font-bold text-2xl drop-shadow-md">
                                            {formatPrice(listing.listPrice)}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Container */}
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-slate-900 font-semibold truncate pr-4 text-balance">
                                            {listing.address.full}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-4 text-slate-600 text-sm mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <BedDouble size={16} className="text-slate-400" />
                                            <span className="font-medium">{listing.property.bedrooms}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Bath size={16} className="text-slate-400" />
                                            <span className="font-medium">{listing.property.bathsFull}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Ruler size={16} className="text-slate-400" />
                                            <span className="font-medium">{listing.property.area?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-500 font-medium">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span>{listing.property.type}</span>
                                        </div>
                                        <span>{listing.mls.daysOnMarket} days ago</span>
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
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading listings...</div>}>
            <SearchContent />
        </Suspense>
    )
}
