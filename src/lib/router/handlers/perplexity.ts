import { HandlerResult, PropertyContext, PerplexityQueryConfig } from '../types'
import { PerplexityQueries, executeQuery } from '@/lib/api/ai/perplexity'

export async function handlePerplexity(
    queries: PerplexityQueryConfig[],
    context: PropertyContext
): Promise<HandlerResult> {
    const results: Array<{
        query: string
        response: string
        citations?: string[]
    }> = []

    for (const query of queries) {
        const templateFn = PerplexityQueries[query.template as keyof typeof PerplexityQueries]

        if (!templateFn) {
            continue
        }

        // Build the query with params - handle different template signatures
        let builtQuery: { query: string; systemPrompt: string }

        switch (query.template) {
            case 'permitHistory':
                builtQuery = (templateFn as (addr: string, city: string) => { query: string; systemPrompt: string })(
                    query.params.address || context.address,
                    query.params.city || context.city
                )
                break
            case 'liens':
            case 'priceHistory':
                builtQuery = (templateFn as (addr: string) => { query: string; systemPrompt: string })(
                    query.params.address || context.address
                )
                break
            case 'hoaInfo':
                builtQuery = (templateFn as (addr: string, nh: string) => { query: string; systemPrompt: string })(
                    query.params.address || context.address,
                    query.params.neighborhood || context.city
                )
                break
            case 'neighborhoodSentiment':
            case 'crimeNews':
            case 'upcomingDevelopment':
            case 'neighborhoodAppreciation':
            case 'neighborhoodVibe':
                builtQuery = (templateFn as (nh: string, city: string) => { query: string; systemPrompt: string })(
                    query.params.neighborhood || context.city,
                    query.params.city || context.city
                )
                break
            case 'sexOffenders':
                builtQuery = (templateFn as (addr: string, zip: string) => { query: string; systemPrompt: string })(
                    query.params.address || context.address,
                    query.params.zipCode || context.zipCode
                )
                break
            case 'comparableSales':
                builtQuery = (templateFn as (addr: string, city: string) => { query: string; systemPrompt: string })(
                    query.params.address || context.address,
                    query.params.city || context.city
                )
                break
            case 'noiseComplaints':
                builtQuery = (templateFn as (addr: string, nh: string) => { query: string; systemPrompt: string })(
                    query.params.address || context.address,
                    query.params.neighborhood || context.city
                )
                break
            case 'zoningDetails':
                builtQuery = (templateFn as (addr: string, city: string) => { query: string; systemPrompt: string })(
                    query.params.address || context.address,
                    query.params.city || context.city
                )
                break
            default:
                // Generic two-param call
                builtQuery = (templateFn as (a: string, b: string) => { query: string; systemPrompt: string })(
                    query.params.address || context.address,
                    query.params.city || context.city
                )
        }

        const response = await executeQuery(builtQuery)

        if (response.data) {
            const data = response.data as {
                choices?: Array<{ message?: { content?: string } }>
                citations?: string[]
            }
            const content = data.choices?.[0]?.message?.content || ''
            results.push({
                query: builtQuery.query,
                response: content,
                citations: data.citations,
            })
        }
    }

    return {
        success: results.length > 0,
        data: {
            queries: results,
            summary: results.map(r => r.response).join('\n\n'),
        },
        source: results.length > 0 ? 'live' : 'mock',
    }
}
