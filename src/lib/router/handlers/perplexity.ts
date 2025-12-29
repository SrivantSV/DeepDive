import { HandlerResult, PropertyContext } from '../types'
import { queryPerplexity } from '@/lib/api/ai/perplexity'

// Query strategies - try these in order until we get good results
const NEIGHBORHOOD_SENTIMENT_QUERIES = [
    // Strategy 1: Reddit specific
    (ctx: PropertyContext) => ({
        query: `site:reddit.com "${ctx.city}" neighborhood review OR living experience OR "what's it like" OR "moving to"`,
        systemPrompt: 'Search Reddit for real resident experiences. Summarize what people say about living in this area. Include specific quotes if available.',
    }),

    // Strategy 2: Nextdoor and local forums
    (ctx: PropertyContext) => ({
        query: `"${ctx.city}" ${ctx.state} neighborhood reviews Nextdoor OR local forum OR community`,
        systemPrompt: 'Find local community discussions about this neighborhood. What do residents like and dislike?',
    }),

    // Strategy 3: Neighborhood vibe general
    (ctx: PropertyContext) => ({
        query: `What is it like to live in ${ctx.city}, ${ctx.state}? pros cons neighborhood character community vibe`,
        systemPrompt: 'Describe the neighborhood character, community vibe, and what daily life is like. Include both positives and negatives.',
    }),

    // Strategy 4: Specific address area
    (ctx: PropertyContext) => ({
        query: `${ctx.zipCode} ${ctx.city} neighborhood safe family-friendly walkable restaurants shops parks`,
        systemPrompt: 'Describe this specific area. Is it safe? Family-friendly? Walkable? What amenities are nearby?',
    }),

    // Strategy 5: Real estate context
    (ctx: PropertyContext) => ({
        query: `${ctx.city} ${ctx.state} neighborhood guide best areas to live 2024`,
        systemPrompt: 'Provide a neighborhood guide. What are the best and worst aspects of living here?',
    }),
]

const CRIME_QUERIES = [
    (ctx: PropertyContext) => ({
        query: `${ctx.city} ${ctx.state} crime rate statistics 2024 safe neighborhood`,
        systemPrompt: 'Find crime statistics for this area. Include crime rates, safety grades, and comparison to state/national averages.',
    }),
    (ctx: PropertyContext) => ({
        query: `site:reddit.com "${ctx.city}" crime safe neighborhood`,
        systemPrompt: 'Search Reddit for discussions about safety and crime in this area.',
    }),
    (ctx: PropertyContext) => ({
        query: `${ctx.zipCode} crime statistics NeighborhoodScout OR CrimeGrade OR SpotCrime`,
        systemPrompt: 'Find crime data from crime tracking websites for this zip code.',
    }),
]

const SCHOOL_QUERIES = [
    (ctx: PropertyContext) => ({
        query: `best schools near ${ctx.city} ${ctx.state} ${ctx.zipCode} ratings GreatSchools Niche`,
        systemPrompt: 'Find school ratings and reviews. Include elementary, middle, and high schools. Provide ratings out of 10.',
    }),
    (ctx: PropertyContext) => ({
        query: `${ctx.city} school district quality ratings test scores 2024`,
        systemPrompt: 'Evaluate the local school district. Include test scores, ratings, and parent reviews.',
    }),
    (ctx: PropertyContext) => ({
        query: `site:reddit.com "${ctx.city}" schools education`,
        systemPrompt: 'Search Reddit for parent discussions about local schools.',
    }),
]

const NOISE_QUERIES = [
    (ctx: PropertyContext) => ({
        query: `${ctx.address} ${ctx.city} noise level traffic airport train quiet`,
        systemPrompt: 'Assess noise levels at this address. Check for traffic, airport flight paths, trains, or other noise sources.',
    }),
    (ctx: PropertyContext) => ({
        query: `${ctx.city} ${ctx.zipCode} noise complaints traffic`,
        systemPrompt: 'Find any noise complaints or issues in this area.',
    }),
]

const PERMIT_QUERIES = [
    (ctx: PropertyContext) => ({
        query: `"${ctx.address}" building permit construction renovation`,
        systemPrompt: 'Find any building permits for this specific address.',
    }),
    (ctx: PropertyContext) => ({
        query: `${ctx.city} ${ctx.state} building permits lookup ${ctx.address.split(' ')[0]}`,
        systemPrompt: 'Search for building permit records. Include permit type, date, and description.',
    }),
]

interface PerplexityQuery {
    template: string
    params: Record<string, string>
}

export async function handlePerplexity(
    queries: PerplexityQuery[],
    context: PropertyContext
): Promise<HandlerResult> {
    const results: Array<{ query: string; response: string; citations?: string[]; success: boolean }> = []

    for (const queryConfig of queries) {
        const queryStrategies = getQueryStrategies(queryConfig.template, context, queryConfig.params)

        let foundGoodResult = false

        // Try each strategy until we get a good result
        for (const strategy of queryStrategies) {
            const response = await queryPerplexity(strategy.query, strategy.systemPrompt)

            const content = response.data?.choices?.[0]?.message?.content || ''

            // Check if we got a useful response (not empty, not "I couldn't find")
            if (isUsefulResponse(content)) {
                results.push({
                    query: strategy.query,
                    response: content,
                    citations: response.data?.citations,
                    success: true,
                })
                foundGoodResult = true
                break // Got a good result, move to next query type
            }

            // Small delay between retries
            await new Promise(r => setTimeout(r, 500))
        }

        // If all strategies failed, note it but continue
        if (!foundGoodResult) {
            results.push({
                query: queryConfig.template,
                response: '',
                success: false,
            })
        }
    }

    // Synthesize all results
    const successfulResults = results.filter(r => r.success)

    if (successfulResults.length === 0) {
        return {
            success: false,
            data: {
                message: 'Unable to find detailed information after multiple search attempts.',
                attemptedQueries: results.map(r => r.query),
            },
            source: 'mock',
        }
    }

    return {
        success: true,
        data: {
            queries: successfulResults,
            summary: synthesizeResults(successfulResults),
            allCitations: successfulResults.flatMap(r => r.citations || []),
        },
        source: 'live',
    }
}

function getQueryStrategies(template: string, context: PropertyContext, params?: Record<string, string>) {
    switch (template) {
        case 'neighborhoodSentiment':
        case 'neighborhoodVibe':
            return NEIGHBORHOOD_SENTIMENT_QUERIES.map(fn => fn(context))
        case 'crimeNews':
        case 'safety':
            return CRIME_QUERIES.map(fn => fn(context))
        case 'schools':
            return SCHOOL_QUERIES.map(fn => fn(context))
        case 'noise':
        case 'noiseComplaints':
            return NOISE_QUERIES.map(fn => fn(context))
        case 'permitHistory':
            return PERMIT_QUERIES.map(fn => fn(context))
        case 'general':
            // For general questions, use the actual question with property context
            const question = params?.question || template
            return [
                {
                    query: `${question} ${context.address} ${context.city} ${context.state}`,
                    systemPrompt: `Answer this real estate question about the property at ${context.address}, ${context.city}, ${context.state}. Be specific, factual, and helpful. If you can find specific data, include it.`,
                },
                {
                    query: `${question} ${context.city} ${context.state} real estate`,
                    systemPrompt: `Answer this question about real estate in ${context.city}, ${context.state}. Be specific and factual.`,
                },
                {
                    query: question,
                    systemPrompt: `Answer this real estate question. Provide helpful, accurate information.`,
                },
            ]
        default:
            // Generic fallback - use template as topic
            return [{
                query: `${context.address} ${context.city} ${template}`,
                systemPrompt: `Find information about ${template} for this property at ${context.address}.`,
            }]
    }
}

function isUsefulResponse(content: string): boolean {
    if (!content || content.length < 100) return false

    const unhelpfulPhrases = [
        "i couldn't find",
        "i could not find",
        "no specific information",
        "unable to find",
        "no results",
        "i don't have access",
        "i cannot access",
        "no data available",
    ]

    const lowerContent = content.toLowerCase()
    return !unhelpfulPhrases.some(phrase => lowerContent.includes(phrase))
}

function synthesizeResults(results: Array<{ response: string }>): string {
    if (results.length === 1) {
        return results[0].response
    }

    // Combine multiple successful results
    return results.map(r => r.response).join('\n\n---\n\n')
}
