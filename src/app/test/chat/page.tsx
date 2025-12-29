'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

const TEST_PROPERTY = {
    address: '1148 Greenbrook Drive, Danville, CA 94526',
    lat: 37.8044,
    lng: -121.9523,
    zipCode: '94526',
    city: 'Danville',
    state: 'CA',
}

const SAMPLE_QUESTIONS = [
    // Location
    'How far is the nearest Whole Foods?',
    'What restaurants are nearby?',
    'What is the commute to San Francisco?',

    // Financial
    'Is this property overpriced?',
    'Is this a good investment?',
    'What would my true monthly cost be?',
    'What are current mortgage rates?',

    // Environmental
    'Is this in a flood zone?',
    'What is the wildfire risk?',
    'How is the air quality?',
    'Is this area quiet or noisy?',

    // Neighborhood
    'Is this neighborhood safe?',
    'How are the schools?',
    'What do neighbors say about this area?',

    // Property
    'What is the zoning?',
    'What internet providers are available?',

    // Analysis
    'Any red flags I should know about?',
]

interface Message {
    role: 'user' | 'assistant'
    content: string
    isStreaming?: boolean
    metadata?: {
        confidence?: string
        sources?: string[]
        responseTime?: number
        followUpSuggestions?: string[]
    }
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

export default function ChatTestPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Update the message sending to use streaming
    const sendMessage = async (question: string) => {
        if (!question.trim() || loading) return

        setMessages(prev => [...prev, { role: 'user', content: question }])
        setInput('')
        setLoading(true)

        // Add empty assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }])

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    propertyContext: TEST_PROPERTY,
                }),
            })

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No reader')

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
                                    // Only update if it's the last message and it's the assistant
                                    if (newMessages[lastIdx].role === 'assistant') {
                                        newMessages[lastIdx] = {
                                            ...newMessages[lastIdx],
                                            content: fullContent
                                        }
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
                if (newMessages[lastIdx].role === 'assistant') {
                    newMessages[lastIdx] = {
                        role: 'assistant',
                        content: fullContent,
                        isStreaming: false,
                        metadata: {
                            sources: metadata.sources,
                            confidence: metadata.confidence,
                            responseTime: metadata.responseTime,
                            followUpSuggestions: metadata.followUpSuggestions,
                        }
                    }
                }
                return newMessages
            })

        } catch (error) {
            setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: 'Error: ' + (error instanceof Error ? error.message : 'Unknown'),
                    isStreaming: false,
                }
                return newMessages
            })
        } finally {
            setLoading(false)
        }
    }

    const clearChat = () => {
        setMessages([])
    }

    return (
        <div className="flex h-[calc(100vh-56px)]">
            {/* Sidebar with sample questions */}
            <div className="w-80 bg-white border-r overflow-y-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-gray-900">Sample Questions</h2>
                    <button
                        onClick={clearChat}
                        className="text-sm text-red-600 hover:text-red-700"
                    >
                        Clear Chat
                    </button>
                </div>
                <div className="space-y-2">
                    {SAMPLE_QUESTIONS.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(q)}
                            disabled={loading}
                            className="w-full text-left p-3 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors border"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col bg-gray-50">
                {/* Property Context Header */}
                <div className="p-4 bg-blue-50 border-b border-blue-200">
                    <span className="text-blue-800 font-medium">Testing Property:</span>
                    <span className="ml-2 text-blue-900">{TEST_PROPERTY.address}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-20">
                            <div className="text-4xl mb-4">💬</div>
                            <p>Click a sample question or type your own to test the chatbot</p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-2xl rounded-xl p-4 ${msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border shadow-sm'
                                }`}>

                                {msg.role === 'user' ? (
                                    <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>
                                ) : (
                                    <div className="text-sm text-gray-800">
                                        <MarkdownRenderer content={msg.content} />

                                        {msg.isStreaming && (
                                            <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                                        )}
                                    </div>
                                )}

                                {msg.metadata && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2 text-xs">
                                        {msg.metadata.responseTime && (
                                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                                                ⏱ {msg.metadata.responseTime}ms
                                            </span>
                                        )}
                                        {msg.metadata.confidence && (
                                            <span className={`px-2 py-1 rounded ${msg.metadata.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                                msg.metadata.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {msg.metadata.confidence} confidence
                                            </span>
                                        )}
                                        {msg.metadata.sources && msg.metadata.sources.length > 0 && (
                                            <span className="px-2 py-1 bg-blue-100 rounded text-blue-700">
                                                📊 {msg.metadata.sources.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Follow-up suggestions */}
                                {msg.metadata?.followUpSuggestions && msg.metadata.followUpSuggestions.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-2">Suggested follow-ups:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.metadata.followUpSuggestions.map((suggestion, j) => (
                                                <button
                                                    key={j}
                                                    onClick={() => sendMessage(suggestion)}
                                                    disabled={loading}
                                                    className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && messages.length > 0 && !messages[messages.length - 1].isStreaming && (
                        <div className="flex justify-start">
                            <div className="bg-white border rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Connecting...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t">
                    <div className="flex gap-3 max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage(input)}
                            placeholder="Ask anything about this property..."
                            className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={loading || !input.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
