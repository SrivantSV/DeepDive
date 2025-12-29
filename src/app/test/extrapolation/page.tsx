'use client'

import { useState } from 'react'

const TEST_PROPERTY = {
    address: '1148 Greenbrook Drive, Danville, CA 94526',
    lat: 37.8044,
    lng: -121.9523,
    zipCode: '94526',
    city: 'Danville',
    state: 'CA',
}

const EXTRAPOLATION_TESTS = [
    {
        id: 'investment',
        name: 'Investment Analysis',
        question: 'Is this a good investment?',
        description: 'Calculates cap rate, cash-on-cash return, ROI, and investment score',
        expectedFields: ['investmentScore', 'capRate', 'cashOnCash', 'monthlyRent'],
    },
    {
        id: 'overpriced',
        name: 'Overpriced Check',
        question: 'Is this property overpriced?',
        description: 'Compares list price to AVM and market comps',
        expectedFields: ['verdict', 'estimatedValue', 'difference'],
    },
    {
        id: 'monthly_cost',
        name: 'True Monthly Cost',
        question: 'What would my true monthly cost be?',
        description: 'Calculates mortgage + tax + insurance + HOA + maintenance',
        expectedFields: ['totalMonthly', 'breakdown', 'affordability'],
    },
    {
        id: 'red_flags',
        name: 'Red Flags Scanner',
        question: 'Any red flags I should know about?',
        description: 'Scans flood, wildfire, earthquake, crime, noise, toxic sites',
        expectedFields: ['totalFlags', 'flags', 'overallAssessment'],
    },
    {
        id: 'schools',
        name: 'School Analysis',
        question: 'How are the schools?',
        description: 'Finds nearby schools with ratings',
        expectedFields: ['schools', 'raw'],
    },
    {
        id: 'safety',
        name: 'Safety Analysis',
        question: 'Is this neighborhood safe?',
        description: 'Crime statistics and safety grade',
        expectedFields: ['crime', 'raw'],
    },
    {
        id: 'commute',
        name: 'Commute Analysis',
        question: 'What is the commute to San Francisco?',
        description: 'Drive time with and without traffic',
        expectedFields: ['duration', 'distance'],
    },
]

interface TestResult {
    id: string
    status: 'pending' | 'success' | 'error'
    responseTime?: number
    response?: {
        answer?: string
        confidence?: string
        sources?: string[]
        followUpSuggestions?: string[]
    }
    error?: string
}

export default function ExtrapolationTestPage() {
    const [results, setResults] = useState<Record<string, TestResult>>({})
    const [testing, setTesting] = useState(false)
    const [expandedTest, setExpandedTest] = useState<string | null>(null)

    const runTest = async (test: typeof EXTRAPOLATION_TESTS[0]) => {
        setResults(prev => ({ ...prev, [test.id]: { id: test.id, status: 'pending' } }))

        try {
            const start = Date.now()
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: test.question,
                    propertyContext: TEST_PROPERTY,
                }),
            })
            const data = await res.json()

            setResults(prev => ({
                ...prev,
                [test.id]: {
                    id: test.id,
                    status: 'success',
                    responseTime: Date.now() - start,
                    response: data,
                }
            }))
        } catch (error) {
            setResults(prev => ({
                ...prev,
                [test.id]: {
                    id: test.id,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                }
            }))
        }
    }

    const runAllTests = async () => {
        setTesting(true)
        for (const test of EXTRAPOLATION_TESTS) {
            await runTest(test)
            await new Promise(r => setTimeout(r, 500))
        }
        setTesting(false)
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return '✅'
            case 'error': return '❌'
            case 'pending': return '⏳'
            default: return '⬜'
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Extrapolation Tests</h1>
                <p className="text-gray-600 mt-1">Test complex data calculations and multi-source analysis</p>
            </div>

            {/* Test Property */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-800 font-medium">Test Property:</span>
                <span className="ml-2 text-blue-900">{TEST_PROPERTY.address}</span>
            </div>

            <button
                onClick={runAllTests}
                disabled={testing}
                className="mb-8 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {testing ? '⏳ Running Tests...' : '🚀 Run All Extrapolation Tests'}
            </button>

            {/* Test Cards */}
            <div className="space-y-4">
                {EXTRAPOLATION_TESTS.map(test => {
                    const result = results[test.id]
                    return (
                        <div key={test.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{test.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                                        <p className="text-sm text-blue-600 mt-2">Q: &quot;{test.question}&quot;</p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4">
                                        {result?.responseTime && (
                                            <span className="text-sm text-gray-500">{result.responseTime}ms</span>
                                        )}
                                        <span className="text-2xl">
                                            {result ? getStatusIcon(result.status) : '⬜'}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); runTest(test) }}
                                            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                                        >
                                            Run
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Response */}
                            {expandedTest === test.id && result?.response && (
                                <div className="border-t bg-gray-50 p-4 space-y-4">
                                    {/* Formatted Answer */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Formatted Answer:</h4>
                                        <div className="bg-white p-4 rounded-lg border prose prose-sm max-w-none">
                                            <pre className="whitespace-pre-wrap text-gray-800 text-sm font-sans">
                                                {result.response.answer}
                                            </pre>
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="bg-white p-3 rounded-lg border">
                                            <span className="text-gray-500">Confidence:</span>
                                            <span className={`ml-2 font-semibold ${result.response.confidence === 'high' ? 'text-green-600' :
                                                    result.response.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {result.response.confidence}
                                            </span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border">
                                            <span className="text-gray-500">Sources:</span>
                                            <span className="ml-2 font-semibold text-gray-900">
                                                {result.response.sources?.join(', ') || 'None'}
                                            </span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border">
                                            <span className="text-gray-500">Follow-ups:</span>
                                            <span className="ml-2 font-semibold text-gray-900">
                                                {result.response.followUpSuggestions?.length || 0} suggestions
                                            </span>
                                        </div>
                                    </div>

                                    {/* Raw Response */}
                                    <details className="bg-gray-900 rounded-lg overflow-hidden">
                                        <summary className="p-3 text-gray-300 cursor-pointer hover:bg-gray-800 text-sm">
                                            View Raw Response
                                        </summary>
                                        <pre className="p-4 text-xs text-gray-300 overflow-auto max-h-64">
                                            {JSON.stringify(result.response, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
