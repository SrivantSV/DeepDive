'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
    Sparkles,
    Send,
    Bot,
    ArrowRight,
    MessageCircle,
    Check,
    Layers,
    Search
} from 'lucide-react'

// --- Types ---

interface PropertyDetails {
    address: string
    city: string
    state: string
    zipCode: string
    estimatedValue: number | null
    beds: number | null
    baths: number | null
    sqft: number | null
    yearBuilt: number | null
    lotSize: number | null
    propertyType: string | null
    description: string
    sources: string[]
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

export default function DeepDivePage() {
    const searchParams = useSearchParams()
    const query = searchParams.get('q')

    const [property, setProperty] = useState<PropertyDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (query) {
            fetchAnalysis(query)
        } else {
            setLoading(false)
        }
    }, [query])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchAnalysis = async (address: string) => {
        try {
            const response = await fetch(`/api/analyze?q=${encodeURIComponent(address)}`)
            const result = await response.json()
            if (result.data) {
                setProperty(result.data)

                // Add initial greeting
                setMessages([
                    {
                        role: 'assistant',
                        content: `I've analyzed ${result.data.address}. I found some initial details, but since this is a deep dive, I can look up anything specific you need. What would you like to know?`
                    }
                ])
            }
        } catch (error) {
            console.error('Failed to analyze property:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendMessage = async (question: string) => {
        if (!question.trim() || !property || chatLoading) return

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
                        address: property.address,
                        city: property.city,
                        state: property.state,
                        zipCode: property.zipCode,
                        price: property.estimatedValue,
                        bedrooms: property.beds,
                        bathrooms: property.baths,
                        sqft: property.sqft,
                        yearBuilt: property.yearBuilt,
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
                                setMessages(prev => {
                                    const newMessages = [...prev]
                                    const lastIdx = newMessages.length - 1
                                    if (newMessages[lastIdx]?.role === 'assistant') {
                                        newMessages[lastIdx] = { ...newMessages[lastIdx], content: fullContent }
                                    }
                                    return newMessages
                                })
                            } else if (data.type === 'metadata' || data.type === 'done') {
                                metadata = { ...metadata, ...data }
                            }
                        } catch (e) { }
                    }
                }
            }

            // Finalize
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
        'Check for permit issues',
        'Estimate the rental yield',
        'Any red flags?',
    ]

    const formatPrice = (price: number | null) => price ? `$${price.toLocaleString()}` : 'Price not available'

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Analyzing Property...</h2>
                        <p className="text-slate-500">
                            Our AI is gathering data from 1500+ sources to build a deep dive report for <span className="font-semibold text-slate-700">{query || 'this address'}</span>.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Analysis Failed</h1>
                    <p className="text-slate-500 mb-6">We couldn't find enough public data to generate a deep dive report for this address.</p>
                    <Link href="/" className="btn-primary">
                        Try Another Address
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
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full tracking-wider">Deep Dive</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to Search</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* --- Left Column: Property Details (Scrollable) --- */}
                    <div className="lg:col-span-7 space-y-6 lg:space-y-8 animate-slide-up">

                        {/* Property Header */}
                        <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden border-t-4 border-blue-500">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Sparkles className="w-32 h-32 text-blue-600" />
                            </div>

                            <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
                                {property.address}
                            </h1>
                            <p className="text-lg text-slate-500 mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                {property.city}, {property.state} {property.zipCode}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-slate-100">
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Est. Value</div>
                                    <div className="text-xl font-bold text-emerald-600">{formatPrice(property.estimatedValue)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Beds</div>
                                    <div className="text-xl font-bold text-slate-800 flex items-center gap-1">
                                        <BedDouble className="w-4 h-4 text-blue-500" /> {property.beds || '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Baths</div>
                                    <div className="text-xl font-bold text-slate-800 flex items-center gap-1">
                                        <Bath className="w-4 h-4 text-blue-500" /> {property.baths || '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Sq Ft</div>
                                    <div className="text-xl font-bold text-slate-800 flex items-center gap-1">
                                        <Ruler className="w-4 h-4 text-blue-500" /> {property.sqft?.toLocaleString() || '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">AI Summary</div>
                                <p className="text-slate-700 leading-relaxed">
                                    {property.description}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card p-5 rounded-xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 font-medium">Year Built</div>
                                    <div className="text-lg font-bold text-slate-900">{property.yearBuilt || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="glass-card p-5 rounded-xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 font-medium">Lot Size</div>
                                    <div className="text-lg font-bold text-slate-900">{property.lotSize ? `${property.lotSize.toLocaleString()} sqft` : 'N/A'}</div>
                                </div>
                            </div>
                            <div className="glass-card p-5 rounded-xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 font-medium">Price/SqFt</div>
                                    <div className="text-lg font-bold text-slate-900">
                                        {property.estimatedValue && property.sqft ? `$${Math.round(property.estimatedValue / property.sqft)}` : 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-5 rounded-xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                                    <Car className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 font-medium">Type</div>
                                    <div className="text-lg font-bold text-slate-900">{property.propertyType || 'Unknown'}</div>
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
                                        <h3 className="font-bold text-slate-900">DeepDive Analyzer</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <span className="text-xs font-medium text-green-600">Live Web Search Active</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
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
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-slate-100">
                                    <div className="flex gap-2 relative">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                                            placeholder="Ask DeepDive to find permit history, crime stats..."
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
                                    {/* Quick Prompts */}
                                    {messages.length < 3 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 no-scrollbar">
                                            {quickQuestions.map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => sendMessage(q)}
                                                    className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-medium rounded-lg border border-slate-200 hover:border-blue-100 transition-colors"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
