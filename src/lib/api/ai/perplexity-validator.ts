import { queryPerplexity } from './perplexity'

// ============================================
// PERPLEXITY VALIDATOR
// Validates and enriches ALL API responses
// ============================================

export interface ValidationResult {
    isValid: boolean
    confidence: 'high' | 'medium' | 'low'
    enrichedData: Record<string, any>
    corrections: Array<{ field: string; original: any; corrected: any; reason: string }>
    additionalContext: string
    sources: string[]
}

export async function validateAndEnrich(
    category: string,
    apiData: Record<string, any>,
    context: { address: string; city: string; state: string; zipCode: string }
): Promise<ValidationResult> {

    // Build validation query based on category
    const validationQuery = buildValidationQuery(category, apiData, context)

    if (!validationQuery) {
        // No validation needed for this category
        return {
            isValid: true,
            confidence: 'medium',
            enrichedData: apiData,
            corrections: [],
            additionalContext: '',
            sources: [],
        }
    }

    const response = await queryPerplexity(validationQuery.query, validationQuery.systemPrompt)
    const content = response.data?.choices?.[0]?.message?.content || ''
    const citations = response.data?.citations || []

    // Parse validation response
    const result = parseValidationResponse(category, apiData, content)

    return {
        ...result,
        sources: citations,
    }
}

function buildValidationQuery(
    category: string,
    apiData: Record<string, any>,
    context: { address: string; city: string; state: string; zipCode: string }
): { query: string; systemPrompt: string } | null {

    switch (category) {
        case 'neighborhood_demographics':
            return {
                query: `Verify demographics for ${context.city}, ${context.zipCode}: Population ${apiData.total_population}, Median income $${apiData.median_household_income}, Median age ${apiData.median_age}. Are these numbers accurate for 2024?`,
                systemPrompt: `You are a demographic data analyst. Verify these Census statistics against current data.
        
        If the numbers seem off, provide corrected values with sources.
        Also add any important demographic context (growth trends, notable changes).
        
        Format corrections as: "CORRECTION: [field] should be [value] (source: [source])"`,
            }

        case 'schools':
            return {
                query: `Verify school ratings near ${context.address}: ${JSON.stringify(apiData.schools?.slice(0, 3) || [])}. Are these ratings current? What are the actual GreatSchools ratings?`,
                systemPrompt: `You are an education researcher. Verify school ratings against GreatSchools.org and Niche.com.
        
        Provide:
        1. Corrected ratings if different
        2. Any schools that were missed
        3. Recent news about these schools (test scores, awards, issues)
        
        Format: "School Name - Rating X/10 (GreatSchools) - Key info"`,
            }

        case 'neighborhood_safety':
        case 'crime':
            return {
                query: `Verify crime statistics for ${context.city}, ${context.zipCode}: ${JSON.stringify(apiData.crime || apiData)}. What are the actual crime rates? Is this area safe?`,
                systemPrompt: `You are a public safety analyst. Verify crime data against FBI UCR, local police reports, and NeighborhoodScout.
        
        Provide:
        1. Violent crime rate per 1,000 residents
        2. Property crime rate per 1,000 residents  
        3. Safety grade (A-F)
        4. Comparison to state/national averages
        5. Recent crime news or trends`,
            }

        case 'environmental_risk':
            return {
                query: `Verify environmental risks for ${context.address}: Flood zone ${apiData.floodZone || 'unknown'}, Wildfire risk ${apiData.wildfireRisk || 'unknown'}, Earthquake risk ${apiData.earthquakeRisk || 'unknown'}`,
                systemPrompt: `You are an environmental risk analyst. Verify these risks against FEMA flood maps, CAL FIRE data, and USGS earthquake data.
        
        Provide:
        1. Actual FEMA flood zone designation
        2. Wildfire risk level (very low to very high)
        3. Distance to nearest fault line
        4. Recent natural disasters in this area
        5. Insurance implications`,
            }

        case 'financial_value':
        case 'financial_investment':
            // Already handled by perplexity-valuation.ts
            return null

        case 'location_commute':
            return {
                query: `Verify commute from ${context.address} to downtown San Francisco. API says ${apiData.duration || 'unknown'} minutes. What is the actual commute time with traffic?`,
                systemPrompt: `You are a commute analyst. Verify commute times using Google Maps and local knowledge.
        
        Provide:
        1. Morning rush hour commute (7-9am)
        2. Evening rush hour commute (5-7pm)
        3. BART access and travel time
        4. Common traffic bottlenecks
        5. Work from home trends in this area`,
            }

        default:
            return null
    }
}

function parseValidationResponse(
    category: string,
    originalData: Record<string, any>,
    validationContent: string
): Omit<ValidationResult, 'sources'> {

    const corrections: ValidationResult['corrections'] = []

    // Look for correction patterns
    const correctionMatches = validationContent.matchAll(/CORRECTION:\s*(\w+)\s*should be\s*([^\(]+)\s*\(([^)]+)\)/gi)
    for (const match of correctionMatches) {
        corrections.push({
            field: match[1].trim(),
            original: originalData[match[1].toLowerCase()],
            corrected: match[2].trim(),
            reason: match[3].trim(),
        })
    }

    // Merge original data with corrections
    const enrichedData = { ...originalData }
    for (const correction of corrections) {
        const key = correction.field.toLowerCase()
        if (key in enrichedData) {
            enrichedData[key] = correction.corrected
        }
    }

    // Add validation content as additional context
    enrichedData._validationContext = validationContent
    enrichedData._validated = true
    enrichedData._validatedAt = new Date().toISOString()

    return {
        isValid: corrections.length === 0,
        confidence: corrections.length === 0 ? 'high' : corrections.length <= 2 ? 'medium' : 'low',
        enrichedData,
        corrections,
        additionalContext: validationContent,
    }
}

// ============================================
// COMPREHENSIVE QUESTION ANSWERER
// Final fallback that can answer ANY question
// ============================================

export async function answerAnyQuestion(
    question: string,
    context: {
        address: string
        city: string
        state: string
        zipCode: string
        propertyDetails?: Record<string, any>
    },
    previousApiData?: Record<string, any>
): Promise<{
    answer: string
    confidence: 'high' | 'medium' | 'low'
    sources: string[]
    followUpQuestions: string[]
}> {

    const contextString = `
Property: ${context.address}
City: ${context.city}, ${context.state} ${context.zipCode}
${context.propertyDetails ? `Details: ${JSON.stringify(context.propertyDetails)}` : ''}
${previousApiData ? `\nExisting data from our APIs:\n${JSON.stringify(previousApiData, null, 2)}` : ''}
  `.trim()

    const response = await queryPerplexity(
        `${question}\n\nContext:\n${contextString}`,
        `You are HomeInsight AI, an expert real estate assistant. Answer the user's question about this property with specific, actionable information.

    Guidelines:
    1. Be specific with numbers, dates, and facts
    2. Always cite your sources
    3. If the existing API data seems wrong, provide corrections
    4. Include both positives and negatives (be balanced)
    5. End with 2-3 relevant follow-up questions the user might want to ask
    
    Format your response clearly with sections if needed.
    If you're not confident about something, say so.`
    )

    const content = response.data?.choices?.[0]?.message?.content || ''
    const citations = response.data?.citations || []

    // Extract follow-up questions if present
    const followUpQuestions: string[] = []
    const followUpMatch = content.match(/(?:follow[- ]?up|related|you might also ask)[:\s]*([^]*?)$/i)
    if (followUpMatch) {
        const questions = followUpMatch[1].match(/[•\-\d.]\s*([^•\-\n]+\?)/g)
        if (questions) {
            followUpQuestions.push(...questions.map(q => q.replace(/^[•\-\d.\s]+/, '').trim()))
        }
    }

    // Determine confidence based on content
    let confidence: 'high' | 'medium' | 'low' = 'medium'
    if (citations.length >= 3 && content.length > 500) {
        confidence = 'high'
    } else if (citations.length === 0 || content.length < 200) {
        confidence = 'low'
    }

    return {
        answer: content,
        confidence,
        sources: citations,
        followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : [
            'What else would you like to know about this property?',
            'Would you like me to analyze the investment potential?',
            'Should I check for any red flags?',
        ],
    }
}
