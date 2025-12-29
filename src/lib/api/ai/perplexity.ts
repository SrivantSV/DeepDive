import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockPerplexity } from '@/lib/mock/ai.mock'

const client = createApiClient({
    name: 'Perplexity',
    baseURL: 'https://api.perplexity.ai',
    headers: {
        'Authorization': `Bearer ${env.perplexity.apiKey}`,
        'Content-Type': 'application/json',
    },
    timeout: 30000, // Perplexity can be slow
})

export interface PerplexityMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface PerplexityChoice {
    index: number
    message: {
        role: string
        content: string
    }
    finish_reason: string
}

export interface PerplexityResponse {
    id: string
    model: string
    choices: PerplexityChoice[]
    citations?: string[]
}

export interface PerplexityConfig {
    model?: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro'
    temperature?: number
    maxTokens?: number
    returnCitations?: boolean
}

const DEFAULT_CONFIG: PerplexityConfig = {
    model: 'sonar',
    temperature: 0.2,
    maxTokens: 1000,
    returnCitations: true,
}

export async function queryPerplexity(
    query: string,
    systemPrompt?: string,
    config: PerplexityConfig = {}
) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }

    if (shouldUseMock('perplexity')) {
        return { data: mockPerplexity.response, error: null, source: 'mock' as const }
    }

    const messages: PerplexityMessage[] = []

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: query })

    return client.request<PerplexityResponse>(
        '/chat/completions',
        {
            method: 'POST',
            data: {
                model: mergedConfig.model,
                messages,
                temperature: mergedConfig.temperature,
                max_tokens: mergedConfig.maxTokens,
                return_citations: mergedConfig.returnCitations,
            },
        },
        mockPerplexity.response
    )
}

// ============================================
// PRE-BUILT QUERY TEMPLATES
// ============================================

export const PerplexityQueries = {
    // Property Records
    permitHistory: (address: string, city: string) => ({
        query: `Find all building permits for ${address} in ${city}. Include permit types, dates, and descriptions.`,
        systemPrompt: 'You are a real estate researcher. Return factual permit information. If you cannot find specific permits, say so clearly.',
    }),

    liens: (address: string) => ({
        query: `Search for any liens, judgments, or encumbrances on the property at ${address}. Include tax liens, mechanic's liens, and any legal judgments.`,
        systemPrompt: 'You are a title researcher. Return only verified public record information.',
    }),

    hoaInfo: (address: string, neighborhood: string) => ({
        query: `Find HOA information for ${address} or ${neighborhood}. Include HOA name, monthly fees, rules, and any recent issues or special assessments.`,
        systemPrompt: 'You are a real estate researcher specializing in HOA research.',
    }),

    // Neighborhood
    neighborhoodSentiment: (neighborhood: string, city: string) => ({
        query: `Search Reddit, Nextdoor, and local forums for reviews and opinions about living in ${neighborhood}, ${city}. What do residents say about the area? Include both positives and negatives.`,
        systemPrompt: 'You are a neighborhood researcher. Summarize real resident opinions objectively. Include specific quotes when possible.',
    }),

    crimeNews: (neighborhood: string, city: string) => ({
        query: `Find recent crime news and safety information for ${neighborhood} in ${city}. Include any trends or notable incidents from the past year.`,
        systemPrompt: 'You are a safety researcher. Report factually without sensationalism.',
    }),

    sexOffenders: (address: string, zipCode: string) => ({
        query: `Search the National Sex Offender Public Website (NSOPW) for registered sex offenders near ${address}, zip code ${zipCode}.`,
        systemPrompt: 'You are a safety researcher. Report only verified public registry information.',
    }),

    // Development
    upcomingDevelopment: (neighborhood: string, city: string) => ({
        query: `Find any planned or approved construction, development, or zoning changes in or near ${neighborhood}, ${city}. Include commercial projects, residential developments, and infrastructure changes.`,
        systemPrompt: 'You are an urban planning researcher. Focus on verified approved or planned projects.',
    }),

    // Financial
    comparableSales: (address: string, city: string) => ({
        query: `Find recent comparable home sales near ${address} in ${city}. Include addresses, sale prices, dates, and property details for similar homes sold in the last 6 months.`,
        systemPrompt: 'You are a real estate analyst. Return verified sales data only.',
    }),

    priceHistory: (address: string) => ({
        query: `Find the complete price history for ${address}. Include all previous sales, listing prices, and any price changes.`,
        systemPrompt: 'You are a real estate researcher. Return chronological price history.',
    }),

    neighborhoodAppreciation: (neighborhood: string, city: string) => ({
        query: `What is the home value appreciation rate in ${neighborhood}, ${city} over the past 1, 3, and 5 years? Compare to the city and national averages.`,
        systemPrompt: 'You are a real estate market analyst. Provide data-backed appreciation statistics.',
    }),

    // Lifestyle
    neighborhoodVibe: (neighborhood: string, city: string) => ({
        query: `Describe the vibe and character of ${neighborhood} in ${city}. Is it family-friendly? Young professionals? Quiet or lively? What are the best and worst aspects of living there?`,
        systemPrompt: 'You are a neighborhood expert. Provide a balanced, realistic description of the area.',
    }),

    noiseComplaints: (address: string, neighborhood: string) => ({
        query: `Search for noise complaints or issues near ${address} in ${neighborhood}. Include traffic noise, train noise, airport flight paths, or any neighbor complaints about noise.`,
        systemPrompt: 'You are an environmental researcher focusing on noise pollution.',
    }),

    // Legal
    zoningDetails: (address: string, city: string) => ({
        query: `What is the zoning code for ${address} in ${city}? What does this zoning allow? Can an ADU (Accessory Dwelling Unit) be built? What are the setback requirements?`,
        systemPrompt: 'You are a zoning expert. Provide specific zoning code information and what it permits.',
    }),
}

// Helper to execute a pre-built query
export async function executeQuery(
    queryTemplate: { query: string; systemPrompt: string },
    config?: PerplexityConfig
) {
    return queryPerplexity(queryTemplate.query, queryTemplate.systemPrompt, config)
}

// Batch execute multiple queries in parallel
export async function batchQueries(
    queries: Array<{ query: string; systemPrompt: string }>,
    config?: PerplexityConfig
) {
    const results = await Promise.allSettled(
        queries.map(q => executeQuery(q, config))
    )

    return results.map((result, index) => ({
        query: queries[index].query,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
    }))
}

// STREAMING query
export async function queryPerplexityStreaming(
    query: string,
    systemPrompt: string | undefined,
    onChunk: (chunk: string) => void
): Promise<{ content: string; citations: string[]; source: 'live' | 'mock' }> {

    if (shouldUseMock('perplexity')) {
        // Simulate streaming for mock
        const mockContent = mockPerplexity.response.choices[0].message.content
        const words = mockContent.split(' ')
        for (const word of words) {
            onChunk(word + ' ')
            await new Promise(r => setTimeout(r, 20))
        }
        return { content: mockContent, citations: [], source: 'mock' }
    }

    try {
        const messages: PerplexityMessage[] = []
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt })
        }
        messages.push({ role: 'user', content: query })

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.perplexity.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages,
                temperature: 0.2,
                max_tokens: 2000,
                return_citations: true,
                search_recency_filter: 'month',
                stream: true,
            }),
        })

        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let fullContent = ''
        let citations: string[] = []

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') continue

                    try {
                        const parsed = JSON.parse(data)

                        // Extract content delta
                        const delta = parsed.choices?.[0]?.delta?.content
                        if (delta) {
                            fullContent += delta
                            onChunk(delta)
                        }

                        // Extract citations if present
                        if (parsed.citations) {
                            citations = parsed.citations
                        }
                    } catch (e) {
                        // Skip unparseable lines
                    }
                }
            }
        }

        return { content: fullContent, citations, source: 'live' }
    } catch (error) {
        console.error('[Perplexity Streaming] Error:', error)

        // Fallback to non-streaming
        const fallback = await queryPerplexity(query, systemPrompt)
        const content = fallback.data?.choices?.[0]?.message?.content || ''
        onChunk(content)
        return { content, citations: fallback.data?.citations || [], source: 'mock' }
    }
}
