'use client'

import { useState } from 'react'

interface TestResult {
    api: string
    status: 'pending' | 'success' | 'error' | 'mock' | 'perplexity'
    source?: string
    responseTime?: number
    data?: unknown
    error?: string
}

const API_GROUPS: Record<string, string[]> = {
    'Google Maps': ['google-places', 'google-routes', 'google-elevation', 'google-geocoding', 'google-airquality', 'google-pollen', 'google-solar'],
    'Property': ['simplyrets', 'estated', 'rentcast', 'mashvisor', 'regrid'],
    'Neighborhood': ['neighborhoodscout', 'greatschools', 'census', 'spotcrime', 'fbi-ucr'],
    'Environmental': ['fema', 'howloud', 'airnow', 'usgs', 'epa', 'wildfire', 'noaa', 'openweather'],
    'Financial': ['fred', 'freddiemac', 'bls'],
    'Utilities': ['broadband', 'fcc', 'energysage'],
    'AI': ['perplexity', 'gemini'],
}

export default function TestPage() {
    const [results, setResults] = useState<Record<string, TestResult>>({})
    const [testing, setTesting] = useState(false)
    const [expandedApi, setExpandedApi] = useState<string | null>(null)

    const testApi = async (api: string) => {
        setResults(prev => ({ ...prev, [api]: { api, status: 'pending' } }))

        try {
            const start = Date.now()
            const res = await fetch(`/api/test/${api}`)
            const data = await res.json()

            setResults(prev => ({
                ...prev,
                [api]: {
                    api,
                    status: data.source === 'live' ? 'success' : data.source === 'perplexity' ? 'perplexity' : 'mock',
                    source: data.source,
                    responseTime: Date.now() - start,
                    data: data.data,
                }
            }))
        } catch (error) {
            setResults(prev => ({
                ...prev,
                [api]: {
                    api,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                }
            }))
        }
    }

    const testAll = async () => {
        setTesting(true)
        const allApis = Object.values(API_GROUPS).flat()

        for (const api of allApis) {
            await testApi(api)
            await new Promise(r => setTimeout(r, 100))
        }

        setTesting(false)
    }

    const testGroup = async (group: string) => {
        const apis = API_GROUPS[group]
        for (const api of apis) {
            await testApi(api)
            await new Promise(r => setTimeout(r, 100))
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return '✅'
            case 'perplexity': return '🔄'
            case 'mock': return '⚠️'
            case 'error': return '❌'
            case 'pending': return '⏳'
            default: return '⬜'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-green-100 border-green-300 text-green-800'
            case 'perplexity': return 'bg-blue-100 border-blue-300 text-blue-800'
            case 'mock': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
            case 'error': return 'bg-red-100 border-red-300 text-red-800'
            default: return 'bg-gray-50 border-gray-200 text-gray-800'
        }
    }

    const summary = {
        total: Object.keys(results).length,
        live: Object.values(results).filter(r => r.status === 'success').length,
        perplexity: Object.values(results).filter(r => r.status === 'perplexity').length,
        mock: Object.values(results).filter(r => r.status === 'mock').length,
        error: Object.values(results).filter(r => r.status === 'error').length,
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">API Test Dashboard</h1>
                <p className="text-gray-600 mt-1">Test all 33 APIs and verify data flow</p>
            </div>

            {/* Summary Bar */}
            {summary.total > 0 && (
                <div className="flex gap-4 mb-6 p-4 bg-white rounded-lg border shadow-sm">
                    <div className="px-4 py-2 bg-gray-100 rounded-lg">
                        <span className="font-semibold">{summary.total}</span> tested
                    </div>
                    <div className="px-4 py-2 bg-green-100 rounded-lg text-green-800">
                        ✅ <span className="font-semibold">{summary.live}</span> live
                    </div>
                    <div className="px-4 py-2 bg-blue-100 rounded-lg text-blue-800">
                        🔄 <span className="font-semibold">{summary.perplexity}</span> perplexity
                    </div>
                    <div className="px-4 py-2 bg-yellow-100 rounded-lg text-yellow-800">
                        ⚠️ <span className="font-semibold">{summary.mock}</span> mock
                    </div>
                    <div className="px-4 py-2 bg-red-100 rounded-lg text-red-800">
                        ❌ <span className="font-semibold">{summary.error}</span> errors
                    </div>
                </div>
            )}

            {/* Test All Button */}
            <button
                onClick={testAll}
                disabled={testing}
                className="mb-8 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {testing ? '⏳ Testing...' : '🚀 Test All 33 APIs'}
            </button>

            {/* API Groups */}
            <div className="space-y-8">
                {Object.entries(API_GROUPS).map(([group, apis]) => {
                    const expandedResult = expandedApi && apis.includes(expandedApi) ? results[expandedApi] : null
                    return (
                        <div key={group} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                                <h2 className="text-lg font-semibold text-gray-900">{group}</h2>
                                <button
                                    onClick={() => testGroup(group)}
                                    className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                                >
                                    Test Group
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {apis.map(api => {
                                        const result = results[api]
                                        return (
                                            <div
                                                key={api}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${expandedApi === api ? 'ring-2 ring-blue-500' : ''
                                                    } ${result ? getStatusColor(result.status) : 'bg-gray-50 border-gray-200'}`}
                                                onClick={() => setExpandedApi(expandedApi === api ? null : api)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium text-sm">{api}</span>
                                                    <span>{result ? getStatusIcon(result.status) : '⬜'}</span>
                                                </div>
                                                {result?.responseTime && (
                                                    <span className="text-xs opacity-70">{result.responseTime}ms</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {expandedResult?.data ? (
                                <div className="p-4 bg-gray-900 border-t">
                                    <p className="text-green-400 text-sm mb-2">Response Data for {expandedApi}:</p>
                                    <pre className="text-gray-300 text-xs overflow-auto max-h-64">
                                        {JSON.stringify(expandedResult.data, null, 2)}
                                    </pre>
                                </div>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
