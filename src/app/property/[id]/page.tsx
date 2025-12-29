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
    MessageCircle,
    Check
} from 'lucide-react'

// --- Types ---

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

// --- Helper Components ---

function MarkdownRenderer({ content }: { content: string }) {
    return (
        <ReactMarkdown
            components={{
                h2: ({ children }) => (
                    <h2 className="text-sm font-bold mt-4 mb-2 text-slate-800">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-xs font-semibold mt-3 mb-1 text-slate-700 uppercase tracking-wider">{children}</h3>
                ),
                p: ({ children }) => (
                    <p className="my-2 text-slate-600 leading-relaxed text-sm">{children}</p>
                ),
                ul: ({ children }) => (
                    <ul className="my-2 space-y-1">{children}</ul>
                ),
                li: ({ children }) => (
                    <li className="flex items-start gap-2 text-slate-600 text-sm">
                        <span className="text-blue-500 mt-1.5">•</span>
                        <span>{children}</span>
                    </li>
                ),
                strong: ({ children }) => (
                    <strong className="font-semibold text-slate-800">{children}</strong>
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

// --- Main Page Component ---

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
        'Tell me about the neighborhood',
        'What are the nearby schools?',
        'Estimate the rental yield',
        'Any concerns with this property?',
    ]

    const formatPrice = (price: number) => `$${price.toLocaleString()}`

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading property details...</p>
                </div>
            </div>
        )
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Property not found</h1>
                    <Link href="/search" className="text-blue-600 hover:underline">
                        ← Back to search
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* --- Sticky Header --- */}
            <header className="sticky top-0 z-50 glass border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="hidden sm:inline">HomeInsight AI</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/search"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to Search</span>
                        </Link>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                        <button className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                            <Heart className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">

                {/* --- Photo Gallery --- */}
                <section className="mb-8 animate-fade-in">
                    <div className="grid grid-cols-4 gap-2 lg:gap-3 h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-lg border border-white/20">
                        {/* Main Photo */}
                        <div className="col-span-4 lg:col-span-2 row-span-2 relative group cursor-pointer" onClick={() => setActivePhoto(0)}>
                            {listing.photos && listing.photos.length > 0 ? (
                                <>
                                    <Image
                                        src={listing.photos[0]}
                                        alt={listing.address.full}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                        <p className="text-white font-medium flex items-center gap-2">
                                            <ImageIcon className="w-5 h-5" /> View all photos
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400">
                                    <ImageIcon className="w-20 h-20" />
                                </div>
                            )}
                        </div>

                        {/* Side Photos */}
                        <div className="hidden lg:grid grid-cols-2 lg:col-span-2 gap-2 lg:gap-3 box-border h-full">
                            {listing.photos?.slice(1, 5).map((photo, index) => (
                                <div
                                    key={index}
                                    className="relative cursor-pointer group overflow-hidden bg-slate-200"
                                    onClick={() => setActivePhoto(index + 1)}
                                >
                                    <Image
                                        src={photo}
                                        alt={`Property view ${index + 2}`}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {index === 3 && listing.photos.length > 5 && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center group-hover:bg-black/70 transition-colors">
                                            <span className="text-white font-bold text-lg">+{listing.photos.length - 5} photos</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* --- Left Column: Property Details (Scrollable) --- */}
                    <div className="lg:col-span-7 space-y-6 lg:space-y-8 animate-slide-up">

                        {/* Header Info */}
                        <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Sparkles className="w-32 h-32 text-blue-600" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex flex-wrap items-center gap-4 mb-3">
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        {formatPrice(listing.listPrice)}
                                    </h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${listing.mls.status === 'Active'
                                            ? 'bg-green-100 text-green-700 border-green-200'
                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        }`}>
                                        {listing.mls.status}
                                    </span>
                                </div>

                                <p className="text-lg text-slate-600 mb-6 font-medium">{listing.address.full}</p>

                                <div className="flex flex-wrap gap-6 text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <BedDouble className="w-5 h-5 text-blue-500" />
                                        <span className="font-semibold">{listing.property.bedrooms}</span> Beds
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Bath className="w-5 h-5 text-blue-500" />
                                        <span className="font-semibold">{listing.property.bathsFull + listing.property.bathsHalf * 0.5}</span> Baths
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Ruler className="w-5 h-5 text-blue-500" />
                                        <span className="font-semibold">{listing.property.area?.toLocaleString()}</span> Sq Ft
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                        Built <span className="font-semibold">{listing.property.yearBuilt}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            {[
                                { label: 'Price/SqFt', value: `$${(listing.listPrice / listing.property.area).toFixed(0)}`, icon: DollarSign },
                                { label: 'Days on Market', value: listing.mls.daysOnMarket, icon: Calendar },
                                { label: 'Lot Size', value: listing.property.lotSize ? `${(listing.property.lotSize / 43560).toFixed(2)} ac` : 'N/A', icon: MapPin },
                                { label: 'Garage', value: listing.property.garageSpaces, icon: Car },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-4 rounded-xl flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform">
                                    <div className="mb-2 p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="font-bold text-slate-900 text-lg">{stat.value}</div>
                                    <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* About Section */}
                        <div className="glass-card p-6 md:p-8 rounded-2xl">
                            <h2 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                                About this home
                            </h2>
                            <p className="text-slate-600 leading-relaxed text-base">
                                {listing.remarks || 'No description available for this property.'}
                            </p>
                        </div>

                        {/* Detailed Specs */}
                        <div className="glass-card p-6 md:p-8 rounded-2xl">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                                Property Details
                            </h2>
                            <div className="grid md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Interior</h3>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500 text-sm">Property Type</span>
                                        <span className="font-medium text-slate-900">{listing.property.type}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500 text-sm">Stories</span>
                                        <span className="font-medium text-slate-900">{listing.property.stories || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500 text-sm">Heating</span>
                                        <span className="font-medium text-slate-900">{listing.property.heating || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500 text-sm">Cooling</span>
                                        <span className="font-medium text-slate-900">{listing.property.cooling || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Exterior</h3>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500 text-sm">Year Built</span>
                                        <span className="font-medium text-slate-900">{listing.property.yearBuilt}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500 text-sm">Pool</span>
                                        <span className="font-medium text-slate-900">{listing.property.pool || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500 text-sm">Garage Spaces</span>
                                        <span className="font-medium text-slate-900">{listing.property.garageSpaces}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500 text-sm">MLS ID</span>
                                        <span className="font-medium text-slate-900 font-mono text-xs">{listing.mlsId}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* --- Right Column: Sticky AI Chat --- */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-24 space-y-4">
                            <div className="glass-card rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-8rem)]">

                                {/* Chat Header */}
                                <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">DeepDive AI Assistant</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <span className="text-xs font-medium text-green-600">Online & Ready</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 1 }}>
                                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                                                <MessageCircle className="w-8 h-8" />
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-800">What would you like to know?</h4>
                                            <p className="text-sm text-slate-500 max-w-xs">
                                                I can analyze investment potential, neighborhood safety, rental yields, and more.
                                            </p>

                                            <div className="grid grid-cols-1 gap-2 w-full mt-4">
                                                {quickQuestions.map((q, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => sendMessage(q)}
                                                        className="text-left px-4 py-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-sm text-slate-700 transition-all shadow-sm hover:shadow-md flex items-center justify-between"
                                                    >
                                                        <span>{q}</span>
                                                        <ArrowRight className="w-3 h-3 text-blue-400" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                                            : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
                                                            }`}
                                                    >
                                                        {msg.role === 'user' ? (
                                                            <div className="text-sm leading-relaxed">{msg.content}</div>
                                                        ) : (
                                                            <div className="text-sm">
                                                                <MarkdownRenderer content={msg.content} />

                                                                {msg.isStreaming && (
                                                                    <div className="flex items-center gap-1 mt-2 h-4">
                                                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                                                    </div>
                                                                )}

                                                                {!msg.isStreaming && (msg.sources?.length || msg.responseTime) && (
                                                                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                                                                        {msg.confidence && (
                                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${msg.confidence === 'high' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                                                msg.confidence === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                                                                    'bg-slate-50 text-slate-700 border border-slate-100'
                                                                                }`}>
                                                                                <Check className="w-3 h-3" /> {msg.confidence} Confidence
                                                                            </span>
                                                                        )}
                                                                        {msg.sources && msg.sources.length > 0 && (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-medium uppercase tracking-wider">
                                                                                <Layers className="w-3 h-3" /> {msg.sources.length} Sources
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-slate-100">
                                    <div className="flex gap-2 relative">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                                            placeholder="Ask a question about this property..."
                                            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm shadow-inner"
                                            disabled={chatLoading}
                                        />
                                        <button
                                            onClick={() => sendMessage(input)}
                                            disabled={chatLoading || !input.trim()}
                                            className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-200"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-2 text-center text-[10px] text-slate-400">
                                        Powered by DeepDive AI. Answers are estimates and not financial advice.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
