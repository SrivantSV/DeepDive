import { queryPerplexity } from '@/lib/api/ai/perplexity'

async function queryWithRetry(
    queries: Array<{ query: string; systemPrompt: string }>
): Promise<{ content: string; citations: string[]; success: boolean }> {

    for (const { query, systemPrompt } of queries) {
        const response = await queryPerplexity(query, systemPrompt)
        const content = response.data?.choices?.[0]?.message?.content || ''

        if (content && content.length > 100 && !content.toLowerCase().includes("couldn't find")) {
            return {
                content,
                citations: response.data?.citations || [],
                success: true,
            }
        }

        // Wait before next attempt
        await new Promise(r => setTimeout(r, 300))
    }

    return { content: '', citations: [], success: false }
}

// ============================================
// GREATSCHOOLS REPLACEMENT
// ============================================
export async function getSchoolsViaPerplexity(lat: number, lng: number, city: string) {
    const queries = [
        {
            query: `best schools near ${city} ratings GreatSchools Niche elementary middle high school`,
            systemPrompt: 'Find school ratings. Include school name, type, grades, rating out of 10, and distance. Be specific.',
        },
        {
            query: `${city} school district quality test scores parent reviews 2024`,
            systemPrompt: 'Find detailed school information including test scores and parent feedback.',
        },
        {
            query: `site:greatschools.org OR site:niche.com ${city} schools`,
            systemPrompt: 'Find school ratings from GreatSchools or Niche.',
        },
    ]

    const result = await queryWithRetry(queries)

    return {
        data: {
            schools: result.content ? [{ raw: result.content }] : [],
            raw: result.content || 'No school information found after multiple searches.',
            citations: result.citations,
        },
        source: result.success ? 'live' as const : 'mock' as const,
        error: result.success ? null : 'No results after retries',
    }
}

// ============================================
// NEIGHBORHOODSCOUT REPLACEMENT
// ============================================
export async function getCrimeDataViaPerplexity(address: string, city: string) {
    const queries = [
        {
            query: `${city} crime rate statistics 2024 violent property crime per capita`,
            systemPrompt: 'Find crime statistics. Include violent crime rate, property crime rate, safety grade (A-F), and comparison to national average.',
        },
        {
            query: `site:neighborhoodscout.com OR site:areavibes.com ${city} crime safety`,
            systemPrompt: 'Find crime grades and safety ratings for this area.',
        },
        {
            query: `Is ${city} safe? crime rate neighborhood safety 2024`,
            systemPrompt: 'Assess the safety of this area with specific statistics.',
        },
    ]

    const result = await queryWithRetry(queries)

    return {
        data: {
            crime: result.content ? { raw: result.content } : null,
            raw: result.content || 'No crime data found after multiple searches.',
            citations: result.citations,
        },
        source: result.success ? 'live' as const : 'mock' as const,
        error: result.success ? null : 'No results after retries',
    }
}

// ============================================
// SPOTCRIME REPLACEMENT
// ============================================
export async function getCrimeIncidentsViaPerplexity(lat: number, lng: number, city: string) {
    const queries = [
        {
            query: `${city} recent crime incidents news 2024`,
            systemPrompt: 'Find recent crime incidents in this area. Include type, date, and location.',
        },
        {
            query: `site:spotcrime.com OR site:crimemapping.com ${city}`,
            systemPrompt: 'Find recent crime reports.',
        },
    ]

    const result = await queryWithRetry(queries)

    return {
        data: {
            incidents: result.content ? [{ raw: result.content }] : [],
            raw: result.content || 'No recent crime incidents found.',
            citations: result.citations,
        },
        source: result.success ? 'live' as const : 'mock' as const,
        error: result.success ? null : 'No results after retries',
    }
}

// ============================================
// HOWLOUD REPLACEMENT
// ============================================
export async function getNoiseDataViaPerplexity(address: string, city: string) {
    const queries = [
        {
            query: `${city} noise level traffic airport flight path quiet neighborhood`,
            systemPrompt: 'Assess noise levels. Check for traffic noise, airport proximity, train tracks, and general quietness.',
        },
        {
            query: `${address} near highway airport train noise`,
            systemPrompt: 'Identify any noise sources near this specific address.',
        },
    ]

    const result = await queryWithRetry(queries)

    return {
        data: {
            noise: result.content ? { raw: result.content } : null,
            raw: result.content || 'No specific noise information found.',
            citations: result.citations,
        },
        source: result.success ? 'live' as const : 'mock' as const,
        error: result.success ? null : 'No results after retries',
    }
}

// ============================================
// ESTATED REPLACEMENT
// ============================================
export async function getPropertyDataViaPerplexity(address: string) {
    const queries = [
        {
            query: `"${address}" property details year built square feet bedrooms bathrooms`,
            systemPrompt: 'Find property details: year built, square footage, bedrooms, bathrooms, lot size, last sale price.',
        },
        {
            query: `${address} Zillow OR Redfin OR Realtor property information`,
            systemPrompt: 'Find property data from real estate websites.',
        },
        {
            query: `${address} county assessor property records`,
            systemPrompt: 'Find property tax and assessment records.',
        },
    ]

    const result = await queryWithRetry(queries)

    return {
        data: {
            property: result.content ? { raw: result.content } : null,
            raw: result.content || 'No property data found.',
            citations: result.citations,
        },
        source: result.success ? 'live' as const : 'mock' as const,
        error: result.success ? null : 'No results after retries',
    }
}

// ============================================
// NEIGHBORHOOD SENTIMENT (More Thorough)
// ============================================
export async function getNeighborhoodSentimentViaPerplexity(address: string, city: string, state: string) {
    const queries = [
        // Reddit first - best for real opinions
        {
            query: `site:reddit.com "${city}" OR "${city} ${state}" neighborhood living experience review`,
            systemPrompt: 'Search Reddit for real resident experiences. Find posts about what it\'s like to live in this area. Include specific quotes and opinions. Look for both positive and negative feedback.',
        },
        // Nextdoor/community
        {
            query: `"${city}" neighborhood community reviews "what's it like" living`,
            systemPrompt: 'Find community discussions and reviews about living in this neighborhood.',
        },
        // General vibe
        {
            query: `${city} ${state} neighborhood guide character vibe community family-friendly`,
            systemPrompt: 'Describe the character and vibe of this neighborhood. Is it family-friendly? Young professionals? Quiet or lively?',
        },
        // Pros and cons
        {
            query: `pros cons living in ${city} ${state} 2024`,
            systemPrompt: 'List the pros and cons of living in this area based on resident feedback.',
        },
        // Real estate descriptions
        {
            query: `${city} ${state} neighborhood description lifestyle amenities`,
            systemPrompt: 'Describe the lifestyle, amenities, and overall feel of this neighborhood.',
        },
    ]

    const result = await queryWithRetry(queries)

    if (!result.success) {
        // Last resort - very general query
        const fallback = await queryPerplexity(
            `Tell me everything about living in ${city}, ${state}. What is the neighborhood like? Is it safe? Family-friendly? What do residents say?`,
            'Provide a comprehensive overview of this area for someone considering moving there.'
        )

        const fallbackContent = fallback.data?.choices?.[0]?.message?.content || ''
        if (fallbackContent && fallbackContent.length > 100) {
            return {
                data: {
                    sentiment: { raw: fallbackContent },
                    raw: fallbackContent,
                    citations: fallback.data?.citations || [],
                },
                source: 'live' as const,
                error: null,
            }
        }
    }

    return {
        data: {
            sentiment: result.content ? { raw: result.content } : null,
            raw: result.content || 'Unable to find neighborhood sentiment after exhaustive search.',
            citations: result.citations,
        },
        source: result.success ? 'live' as const : 'mock' as const,
        error: result.success ? null : 'No results after multiple search strategies',
    }
}
