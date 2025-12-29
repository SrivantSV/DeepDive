'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import {
    ArrowLeft,
    Share2,
    Heart,
    MapPin,
    BedDouble,
    Bath,
    Ruler,
    Calendar,
    DollarSign,
    Car,
    Thermometer,
    Wind,
    Droplet,
    Layers,
    Sparkles,
    Send,
    Bot,
    ArrowRight,
    ImageIcon,
    MessageCircle
} from 'lucide-react'

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
    isStreaming?: boolean
    sources?: string[]
    confidence?: string
    responseTime?: number
}

// Markdown rendering component
function MarkdownRenderer({ content }: { content: string }) {
    return (
        <ReactMarkdown
            components={{
                h2: ({ children }) => (
                    <h2 className="text-lg font-bold mt-4 mb-2 text-gray-900">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-md font-semibold mt-3 mb-1 text-gray-800">{children}</h3>
                ),
                h4: ({ children }) => (
                    <h4 className="text-sm font-semibold mt-2 mb-1 text-gray-700">{children}</h4>
                ),
                p: ({ children }) => (
                    <p className="my-2 text-gray-700 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                    <ul className="my-2 space-y-1">{children}</ul>
                ),
                li: ({ children }) => (
                    <li className="flex items-start gap-2 text-gray-700">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{children}</span>
                    </li>
                ),
                strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                ),
                a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {children}
                    </a>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    )
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
        if (!question.trim() || !listing || chatLoading) return

        const userMessage: Message = { role: 'user', content: question }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setChatLoading(true)

        // Add empty assistant message for streaming
        const assistantMessage: Message = {
            role: 'assistant',
            content: '',
            isStreaming: true
        }
        setMessages(prev => [...prev, assistantMessage])

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

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let fullContent = ''
            let metadata: any = {}

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6))

                            if (data.type === 'chunk') {
                                fullContent += data.content
                                // Update the streaming message
                                setMessages(prev => {
                                    const newMessages = [...prev]
                                    const lastIdx = newMessages.length - 1
                                    if (newMessages[lastIdx]?.role === 'assistant') {
                                        newMessages[lastIdx] = {
                                            ...newMessages[lastIdx],
                                            content: fullContent,
                                        }
                                    }
                                    return newMessages
                                })
                            } else if (data.type === 'metadata') {
                                metadata = { ...metadata, ...data }
                            } else if (data.type === 'done') {
                                metadata = { ...metadata, ...data }
                            }
                        } catch (e) {
                            // Skip unparseable lines
                        }
                    }
                }
            }

            // Finalize the message
            setMessages(prev => {
                const newMessages = [...prev]
                const lastIdx = newMessages.length - 1
                if (newMessages[lastIdx]?.role === 'assistant') {
                    newMessages[lastIdx] = {
                        role: 'assistant',
                        content: fullContent,
                        isStreaming: false,
                        sources: metadata.sources,
                        confidence: metadata.confidence,
                        responseTime: metadata.responseTime,
                    }
                }
                return newMessages
            })

        } catch (error) {
            setMessages(prev => {
                const newMessages = [...prev]
                const lastIdx = newMessages.length - 1
                if (newMessages[lastIdx]?.role === 'assistant') {
                    newMessages[lastIdx] = {
                        role: 'assistant',
                        content: 'Sorry, something went wrong. Please try again.',
                        isStreaming: false,
                    }
                }
                return newMessages
            })
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
                        <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
                            <Sparkles className="w-6 h-6" />
                            HomeInsight AI
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/search" className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" />
                                Back to search
                            </Link>
                            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                <Heart className="w-4 h-4" />
                                Save
                            </button>
                            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                <Share2 className="w-4 h-4" />
                                Share
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
                                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-20 h-20" />
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
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm flex flex-col items-center justify-center">
                                <div className="mb-2 p-2 bg-orange-50 text-orange-600 rounded-lg">
                                    <Car className="w-5 h-5" />
                                </div>
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
                            <div className="bg-white border-b border-slate-100 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">AI Assistant</div>
                                        <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            Online
                                        </div>
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
                                                <div className="flex items-center gap-1">
                                                    <div className="p-1 bg-blue-50 text-blue-600 rounded-full">
                                                        <DollarSign className="w-4 h-4" />
                                                    </div>
                                                    {q}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="h-96 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <div className="text-4xl mb-2">💬</div>
                                        <p>Ask me anything about this property!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[90%] rounded-xl p-4 ${msg.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-50 border border-gray-200'
                                                    }`}
                                            >
                                                {msg.role === 'user' ? (
                                                    <div className="text-sm">{msg.content}</div>
                                                ) : (
                                                    <div className="text-sm">
                                                        <MarkdownRenderer content={msg.content} />

                                                        {/* Streaming indicator */}
                                                        {msg.isStreaming && (
                                                            <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                                                        )}

                                                        {/* Metadata footer */}
                                                        {!msg.isStreaming && (msg.sources?.length || msg.responseTime) && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2 text-xs">
                                                                {msg.confidence && (
                                                                    <span className={`px-2 py-1 rounded-full ${msg.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                                                            msg.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                                'bg-gray-100 text-gray-700'
                                                                        }`}>
                                                                        {msg.confidence} confidence
                                                                    </span>
                                                                )}
                                                                {msg.responseTime && (
                                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                                                        {(msg.responseTime / 1000).toFixed(1)}s
                                                                    </span>
                                                                )}
                                                                {msg.sources && msg.sources.length > 0 && (
                                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                                        {msg.sources.length} sources
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
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
