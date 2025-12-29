'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Listing {
    mlsId: number
    listPrice: number
    listDate: string
    property: {
        type: string
        subType: string
        bedrooms: number
        bathsFull: number
        bathsHalf: number
        area: number
        lotSize: number
        yearBuilt: number
        stories: number
        garageSpaces: number
        pool: string
        heating: string
        cooling: string
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
    remarks: string
    mls: { status: string; daysOnMarket: number }
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    sources?: string[]
    confidence?: string
}

export default function PropertyPage() {
    const params = useParams()
    const id = params.id as string

    const [listing, setListing] = useState<Listing | null>(null)
    const [loading, setLoading] = useState(true)
    const [activePhoto, setActivePhoto] = useState(0)

    // Chat state
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchListing()
    }, [id])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchListing = async () => {
        try {
            const response = await fetch(`/api/listings/${id}`)
            const data = await response.json()
            setListing(data)
        } catch (error) {
            console.error('Failed to fetch listing:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendMessage = async (question: string) => {
        if (!question.trim() || !listing) return

        const userMessage: Message = { role: 'user', content: question }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setChatLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    propertyContext: {
                        address: listing.address.full,
                        lat: listing.geo.lat,
                        lng: listing.geo.lng,
                        zipCode: listing.address.postalCode,
                        city: listing.address.city,
                        state: listing.address.state,
                        price: listing.listPrice,
                        bedrooms: listing.property.bedrooms,
                        bathrooms: listing.property.bathsFull + listing.property.bathsHalf * 0.5,
                        sqft: listing.property.area,
                        yearBuilt: listing.property.yearBuilt,
                    },
                }),
            })

            const data = await response.json()

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.answer || data.error || 'Sorry, I could not process that question.',
                sources: data.sources,
                confidence: data.confidence,
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
            }])
        } finally {
            setChatLoading(false)
        }
    }

    const quickQuestions = [
        'Is this a good investment?',
        'Is this property overpriced?',
        'How are the schools nearby?',
        'Any red flags I should know about?',
        'What would my monthly cost be?',
        'Is this neighborhood safe?',
    ]

    const formatPrice = (price: number) => `$${price.toLocaleString()}`

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="h-96 bg-gray-200 animate-pulse" />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
                    <div className="h-6 bg-gray-200 rounded w-96 animate-pulse" />
                </div>
            </div>
        )
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Property not found</h1>
                    <Link href="/search" className="text-blue-600 hover:underline">
                        ← Back to search
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-xl font-bold text-blue-600">
                            🏠 HomeInsight AI
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/search" className="text-gray-600 hover:text-gray-900">
                                ← Back to search
                            </Link>
                            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                                ❤️ Save
                            </button>
                            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                                📤 Share
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Photo Gallery */}
            <div className="bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-4 gap-1 h-96">
                        {/* Main Photo */}
                        <div className="col-span-2 row-span-2 relative">
                            {listing.photos && listing.photos.length > 0 ? (
                                <Image
                                    src={listing.photos[activePhoto]}
                                    alt={listing.address.full}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-6xl">
                                    🏠
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {listing.photos?.slice(1, 5).map((photo, index) => (
                            <div
                                key={index}
                                className="relative cursor-pointer hover:opacity-90"
                                onClick={() => setActivePhoto(index + 1)}
                            >
                                <Image src={photo} alt="" fill className="object-cover" />
                                {index === 3 && listing.photos.length > 5 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                                        +{listing.photos.length - 5} more
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{formatPrice(listing.listPrice)}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${listing.mls.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {listing.mls.status}
                                </span>
                            </div>

                            <p className="text-lg text-gray-600 mb-2">{listing.address.full}</p>

                            <div className="flex items-center gap-4 text-gray-600">
                                <span>{listing.property.bedrooms} beds</span>
                                <span>•</span>
                                <span>{listing.property.bathsFull + listing.property.bathsHalf * 0.5} baths</span>
                                <span>•</span>
                                <span>{listing.property.area?.toLocaleString()} sqft</span>
                                <span>•</span>
                                <span>Built {listing.property.yearBuilt}</span>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                                <div className="text-xl font-bold text-gray-900">
                                    ${listing.property.area ? (listing.listPrice / listing.property.area).toFixed(0) : 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">Price/sqft</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                                <div className="text-xl font-bold text-gray-900">
                                    {listing.mls.daysOnMarket}
                                </div>
                                <div className="text-sm text-gray-500">Days on market</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                                <div className="text-xl font-bold text-gray-900">
                                    {listing.property.lotSize ? `${(listing.property.lotSize / 43560).toFixed(2)} ac` : 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">Lot size</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                                <div className="text-xl font-bold text-gray-900">
                                    {listing.property.garageSpaces || 0}
                                </div>
                                <div className="text-sm text-gray-500">Garage spaces</div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">About this home</h2>
                            <p className="text-gray-600 leading-relaxed">
                                {listing.remarks || 'No description available.'}
                            </p>
                        </div>

                        {/* Property Details */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Property Details</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Property Type</span>
                                        <span className="font-medium">{listing.property.type}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Year Built</span>
                                        <span className="font-medium">{listing.property.yearBuilt}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Stories</span>
                                        <span className="font-medium">{listing.property.stories || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Heating</span>
                                        <span className="font-medium">{listing.property.heating || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Cooling</span>
                                        <span className="font-medium">{listing.property.cooling || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Pool</span>
                                        <span className="font-medium">{listing.property.pool || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Garage</span>
                                        <span className="font-medium">{listing.property.garageSpaces} car</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">MLS #</span>
                                        <span className="font-medium">{listing.mlsId}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - AI Chat */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm sticky top-20 overflow-hidden">
                            {/* Chat Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                                        🤖
                                    </div>
                                    <div>
                                        <div className="font-semibold">AI Property Assistant</div>
                                        <div className="text-sm text-blue-100">Ask anything about this property</div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Questions */}
                            {messages.length === 0 && (
                                <div className="p-4 border-b">
                                    <div className="text-sm text-gray-500 mb-2">Quick questions:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {quickQuestions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(q)}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="h-80 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-400 py-8">
                                        <div className="text-4xl mb-2">💬</div>
                                        <div>Ask me anything about this property!</div>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-lg p-3 ${msg.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                                                {msg.sources && msg.sources.length > 0 && (
                                                    <div className="text-xs mt-2 opacity-70">
                                                        Sources: {msg.sources.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}

                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-lg p-3">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                                        placeholder="Ask about this property..."
                                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={chatLoading}
                                    />
                                    <button
                                        onClick={() => sendMessage(input)}
                                        disabled={chatLoading || !input.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
