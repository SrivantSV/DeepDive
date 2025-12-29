import { classifyQuestion, determineApis, needsExtrapolation, needsPerplexity, needsVision, } from './classifier'
import { EXTRAPOLATION_RECIPES } from './api-index'
import { handleDirectApi } from './handlers/direct-api'
import { handleExtrapolation } from './handlers/extrapolator'
import { handlePerplexity } from './handlers/perplexity'
import { handleVision } from './handlers/vision'
import { formatResponse } from './handlers/formatter'
import { validateAndEnrich, answerAnyQuestion } from '@/lib/api/ai/perplexity-validator'
import {
    getComprehensiveValuation,
    analyzeIfOverpriced,
    analyzeInvestmentPotential
} from '@/lib/api/ai/perplexity-valuation'
import {
    RouterInput,
    RouterDecision,
    HandlerResult,
    RouterResponse,
    HandlerType,
    PropertyContext,
    QuestionCategory,
} from './types'

// Add queryPerplexity import for handler usage
import { queryPerplexity, queryPerplexityStreaming } from '@/lib/api/ai/perplexity'

// Add this new function for streaming
export async function routeQuestionStreaming(
    input: {
        question: string
        propertyContext?: Partial<PropertyContext>
    },
    onChunk: (chunk: string) => void,
    onMetadata: (metadata: any) => void
): Promise<RouterResponse> {
    const startTime = Date.now()

    // Default property context
    const context: PropertyContext = {
        address: input.propertyContext?.address || '350 Alamo Square Dr, Danville, CA 94526',
        lat: input.propertyContext?.lat || 37.8207,
        lng: input.propertyContext?.lng || -121.9706,
        zipCode: input.propertyContext?.zipCode || '94526',
        city: input.propertyContext?.city || 'Danville',
        state: input.propertyContext?.state || 'CA',
        price: input.propertyContext?.price,
        bedrooms: input.propertyContext?.bedrooms,
        bathrooms: input.propertyContext?.bathrooms,
        sqft: input.propertyContext?.sqft,
        yearBuilt: input.propertyContext?.yearBuilt,
    }

    const question = input.question.trim()
    const category = classifyQuestion(question)

    // Send initial metadata
    onMetadata({
        category,
        status: 'analyzing',
        message: `Analyzing your question about ${context.address}...`
    })

    // Build the query based on category
    const { query, systemPrompt } = buildQueryForCategory(category, question, context)

    // Send status update
    onMetadata({ status: 'searching', message: 'Searching real estate databases...' })

    // Stream the response
    const result = await queryPerplexityStreaming(query, systemPrompt, onChunk)

    // Send final metadata
    onMetadata({
        status: 'complete',
        sources: result.citations,
        responseTime: Date.now() - startTime,
    })

    return {
        answer: result.content,
        confidence: result.citations.length > 2 ? 'high' : 'medium',
        sources: result.citations,
        followUpSuggestions: getFollowUpSuggestions(category),
        responseTime: Date.now() - startTime,
        category,
        validated: true,
    }
}

function buildQueryForCategory(
    category: string,
    question: string,
    context: PropertyContext
): { query: string; systemPrompt: string } {

    const propertyInfo = `
Property: ${context.address}
${context.price ? `List Price: $${context.price.toLocaleString()}` : ''}
${context.bedrooms ? `Bedrooms: ${context.bedrooms}` : ''}
${context.bathrooms ? `Bathrooms: ${context.bathrooms}` : ''}
${context.sqft ? `Square Feet: ${context.sqft.toLocaleString()}` : ''}
${context.yearBuilt ? `Year Built: ${context.yearBuilt}` : ''}
City: ${context.city}, ${context.state} ${context.zipCode}
  `.trim()

    const baseSystemPrompt = `You are HomeInsight AI, an expert real estate analyst. Provide detailed, accurate answers with specific numbers and facts.

Format your response with clear sections using markdown:
- Use ## for main headers
- Use **bold** for important values
- Use bullet points for lists
- Include specific dollar amounts, percentages, and dates
- Be concise but thorough

Property Context:
${propertyInfo}`

    switch (category) {
        case 'financial_value':
            return {
                query: `Is ${context.address} overpriced at ${context.price ? `$${context.price.toLocaleString()}` : 'its current price'}?

Find:
1. Zillow Zestimate
2. Redfin Estimate  
3. Recent comparable sales
4. Price per square foot vs area average

Give a clear verdict: OVERPRICED, FAIRLY PRICED, or GOOD VALUE.
Suggest a fair offer price.`,
                systemPrompt: baseSystemPrompt + `

Structure your response:
## Valuation Analysis

### Estimated Value
[Zestimate, Redfin estimate, your assessment]

### Verdict: [OVERPRICED/FAIRLY PRICED/GOOD VALUE]
[Explanation with specific numbers]

### Suggested Offer
$[amount] - [reasoning]

### Comparable Sales
[List 2-3 recent sales]`,
            }

        case 'financial_investment':
            return {
                query: `What is the investment potential of ${context.address}?
${context.price ? `Price: $${context.price.toLocaleString()}` : ''}

Find:
1. Estimated monthly rent (Zillow Rent Zestimate)
2. Cap rate calculation
3. Cash flow analysis
4. Rental market trends
5. Comparable rentals`,
                systemPrompt: baseSystemPrompt + `

Structure your response:
## Investment Analysis

### Rental Income Potential
- **Estimated Rent:** $X/month
- **Annual Gross:** $X

### Key Metrics
- **Cap Rate:** X%
- **Cash-on-Cash:** X% 
- **Monthly Cash Flow:** $X

### Market Context
[Rental trends, vacancy rates]

### Verdict
[STRONG/MODERATE/WEAK investment with explanation]`,
            }

        case 'red_flags':
        case 'environmental_risk':
            return {
                query: `What are the potential red flags or risks for ${context.address}?

Check:
1. Flood zone (FEMA)
2. Wildfire risk
3. Earthquake/seismic risk
4. Crime statistics
5. Noise levels
6. Environmental hazards
7. HOA issues
8. Permit problems`,
                systemPrompt: baseSystemPrompt + `

Structure your response:
## Red Flags Assessment

### Natural Hazards
- **Flood Risk:** [Zone X/A/etc] - [explanation]
- **Wildfire Risk:** [Low/Moderate/High]
- **Earthquake Risk:** [assessment]

### Safety & Community
- **Crime:** [Grade A-F, specific stats]
- **Noise:** [assessment]

### Property Issues
[Any liens, permits, HOA issues]

### Overall Assessment
[Summary with recommendation]`,
            }

        case 'schools':
            return {
                query: `What are the schools near ${context.address}? Include ratings and distances.`,
                systemPrompt: baseSystemPrompt + `

Structure your response:
## Schools Near ${context.address}

### Elementary Schools
- **[School Name]** - Rating: X/10 - Distance: X mi
  [Brief description]

### Middle Schools
- **[School Name]** - Rating: X/10 - Distance: X mi

### High Schools
- **[School Name]** - Rating: X/10 - Distance: X mi

### School District
[Overall district quality and notes]`,
            }

        case 'neighborhood_safety':
            return {
                query: `How safe is the neighborhood around ${context.address}? Include crime statistics.`,
                systemPrompt: baseSystemPrompt + `

Structure your response:
## Safety Analysis

### Crime Statistics
- **Overall Grade:** [A-F]
- **Violent Crime:** X per 1,000 (vs national avg)
- **Property Crime:** X per 1,000

### Compared to Area
[How it compares to nearby cities]

### Recent Trends
[Is crime increasing or decreasing?]

### Safety Tips
[Any specific considerations]`,
            }

        case 'neighborhood_vibe':
        case 'neighborhood_demographics':
            return {
                query: `What is it like to live in ${context.city} near ${context.address}? What do residents say?`,
                systemPrompt: baseSystemPrompt + `

Structure your response:
## Neighborhood Guide: ${context.city}

### The Vibe
[2-3 sentence description of neighborhood character]

### What Residents Love
- [Point 1]
- [Point 2]
- [Point 3]

### Common Complaints
- [Point 1]
- [Point 2]

### Demographics
- Median Age: X
- Median Income: $X
- Education Level: X%

### Best For
[Who would love this neighborhood?]`,
            }

        case 'location_commute':
            return {
                query: `What is the commute from ${context.address} to San Francisco and other Bay Area locations?`,
                systemPrompt: baseSystemPrompt + `

Structure your response:
## Commute Analysis

### To San Francisco
- **Without Traffic:** X minutes
- **Rush Hour (8am):** X minutes
- **Route:** [Best route]

### To San Jose
- **Without Traffic:** X minutes
- **Rush Hour:** X minutes

### Public Transit
- **BART Access:** [Nearest station, travel time]
- **Bus:** [Options]

### Work From Home
[Local trends and co-working spaces]`,
            }

        default:
            return {
                query: `${question}

Property: ${context.address}, ${context.city}, ${context.state} ${context.zipCode}`,
                systemPrompt: baseSystemPrompt + `

Provide a helpful, specific answer to the user's question about this property. Use clear formatting with headers and bullet points.`,
            }
    }
}

function getFollowUpSuggestions(category: string): string[] {
    const suggestions: Record<string, string[]> = {
        financial_value: [
            'Is this a good investment?',
            'What would my monthly payment be?',
            'Show me comparable sales',
        ],
        financial_investment: [
            'Is this property overpriced?',
            'What about Airbnb income?',
            'What are the tax benefits?',
        ],
        red_flags: [
            'How safe is this neighborhood?',
            'What about the schools?',
            'Is there earthquake insurance needed?',
        ],
        schools: [
            'Is this neighborhood safe?',
            'What do residents say about the area?',
            'What is the commute like?',
        ],
        neighborhood_safety: [
            'How are the schools?',
            'What do neighbors say?',
            'Any red flags to know about?',
        ],
        neighborhood_vibe: [
            'Is this area safe?',
            'How are the schools?',
            'What is the commute to SF?',
        ],
    }

    return suggestions[category] || [
        'Is this property overpriced?',
        'Any red flags?',
        'How are the schools?',
    ]
}

export async function routeQuestion(input: {
    question: string
    propertyContext?: Partial<PropertyContext>
}): Promise<RouterResponse> {
    const startTime = Date.now()

    // Default property context
    const context: PropertyContext = {
        address: input.propertyContext?.address || '350 Alamo Square Dr, Danville, CA 94526',
        lat: input.propertyContext?.lat || 37.8207,
        lng: input.propertyContext?.lng || -121.9706,
        zipCode: input.propertyContext?.zipCode || '94526',
        city: input.propertyContext?.city || 'Danville',
        state: input.propertyContext?.state || 'CA',
        price: input.propertyContext?.price,
        bedrooms: input.propertyContext?.bedrooms,
        bathrooms: input.propertyContext?.bathrooms,
        sqft: input.propertyContext?.sqft,
        yearBuilt: input.propertyContext?.yearBuilt,
    }

    const question = input.question.trim()

    // Step 1: Classify the question
    const category = classifyQuestion(question)
    console.log(`[Router] Category: ${category}`)

    // Step 2: Special handling for valuation questions
    if (category === 'financial_value' || question.toLowerCase().includes('overpriced') || question.toLowerCase().includes('worth')) {
        return handleValuationQuestion(question, context, startTime)
    }

    if (category === 'financial_investment' || question.toLowerCase().includes('investment') || question.toLowerCase().includes('roi')) {
        return handleInvestmentQuestion(question, context, startTime)
    }

    // Step 3: Determine APIs and handlers
    const apis = determineApis(category, question)
    console.log(`[Router] APIs: ${apis.join(', ')}`)

    // Step 4: Execute handlers
    let handlerResults: Record<string, any> = {}
    let sources: string[] = []

    // Run API handlers
    if (apis.length > 0) {
        try {
            const apiResult = await handleDirectApi(
                apis.map(api => ({ api, method: 'default', params: context as any })),
                context
            )
            // Check if apiResult.data is an array (from previous implementation) or object
            if (Array.isArray(apiResult)) {
                // handleDirectApi previously returned HandlerResult[] if called distinctly, 
                // but the imported function signature expects ApiCall[]. 
                // Looking at previous router/index.ts, handleDirectApi handled ApiCall[].
                // However, handleDirectApi in 'handlers/direct-api.ts' returns Promise<HandlerResult> which contains data: any. 
                // Let's assume the data structure matches what we expect or we aggregate it.
                // In the new implementation we treat it as a single aggregated result or we need to merge.
                // The new code assumes handleDirectApi returns a single object with .data property that is a Record.
                // Let's adjust slightly to be safe:
                handlerResults = { ...handlerResults, ...(apiResult.data || {}) }
            } else {
                handlerResults = { ...handlerResults, ...(apiResult.data || {}) }
            }
            sources.push(...apis)
        } catch (error) {
            console.error('[Router] API handler error:', error)
        }
    }

    // Step 4b: Run Extrapolator if needed
    if (needsExtrapolation(category)) {
        try {
            // Map category to extrapolation type
            const categoryToType: Record<string, string> = {
                financial_value: 'overpriced_check',
                financial_investment: 'investment_analysis',
                financial_cost: 'true_monthly_cost',
                red_flags: 'red_flags',
                comparison: 'comparison', // Might need recipe
            }

            const type = categoryToType[category]
            // Use EXTRAPOLATION_RECIPES from api-index
            const recipe = EXTRAPOLATION_RECIPES[type]

            if (type && recipe) {
                console.log(`[Router] Running Extrapolator: ${type}`)
                const config = {
                    type,
                    dataSources: recipe.dataSources,
                    logic: recipe.logic
                }

                // Pass the handlerResults as context/data for extrapolation
                const extraContext = { ...context, ...handlerResults }
                const extrapolationResult = await handleExtrapolation(config, extraContext as any)

                if (extrapolationResult.success && extrapolationResult.data) {
                    handlerResults = { ...handlerResults, ...extrapolationResult.data }
                    sources.push('Extrapolator')
                }
            }
        } catch (error) {
            console.error('[Router] Extrapolator error:', error)
        }
    }

    // Step 5: ALWAYS validate and enrich with Perplexity
    console.log(`[Router] Validating with Perplexity...`)
    const validation = await validateAndEnrich(category, handlerResults, context)

    if (validation.corrections.length > 0) {
        console.log(`[Router] Perplexity made ${validation.corrections.length} corrections`)
    }

    handlerResults = validation.enrichedData
    sources.push(...validation.sources.slice(0, 3)) // Add top 3 citations

    // Step 6: If still no good data, use Perplexity as primary source
    if (Object.keys(handlerResults).length === 0 || validation.confidence === 'low') {
        console.log(`[Router] Using Perplexity as primary source`)
        const perplexityAnswer = await answerAnyQuestion(question, context, handlerResults)

        return {
            answer: perplexityAnswer.answer,
            confidence: perplexityAnswer.confidence,
            sources: perplexityAnswer.sources,
            followUpSuggestions: perplexityAnswer.followUpQuestions,
            responseTime: Date.now() - startTime,
            category,
            validated: true,
        }
    }

    // Step 7: Format response
    // We need to adapt the formatResponse signature or output if it changed.
    // The imported formatResponse expects (question, category, results[], context).
    // We will wrap our handlerResults into a structure it expects or update formatResponse later if needed.
    // For now, let's just make sure we pass what it needs.
    // Actually, allow formatResponse to handle the enriched data.
    // If formatResponse is strictly typed to HandlerResult[], we might need to mock that structure.

    const mockHandlerResults = [{
        success: true,
        data: handlerResults,
        source: 'live',
    }]

    const formatted = await formatResponse(question, category, mockHandlerResults as any, context)

    return {
        answer: formatted.answer,
        confidence: validation.confidence,
        sources: [...new Set(sources)], // Deduplicate
        followUpSuggestions: formatted.followUpSuggestions,
        responseTime: Date.now() - startTime,
        category,
        validated: true,
        corrections: validation.corrections.length > 0 ? validation.corrections : undefined,
    }
}

// ============================================
// SPECIAL HANDLERS FOR VALUATION QUESTIONS
// ============================================

async function handleValuationQuestion(
    question: string,
    context: PropertyContext,
    startTime: number
): Promise<RouterResponse> {

    console.log(`[Router] Handling valuation question with Perplexity`)

    // Check if asking about overpriced specifically
    if (question.toLowerCase().includes('overpriced') || question.toLowerCase().includes('worth') || question.toLowerCase().includes('fair price')) {
        if (!context.price) {
            // No list price provided, just get valuation
            const valuation = await getComprehensiveValuation(context.address, {
                beds: context.bedrooms,
                baths: context.bathrooms,
                sqft: context.sqft,
                yearBuilt: context.yearBuilt,
            })

            return {
                answer: formatValuationResponse(valuation.data),
                confidence: valuation.data.confidence,
                sources: valuation.data.sources,
                followUpSuggestions: [
                    'What would my monthly cost be?',
                    'Is this a good investment?',
                    'How have prices changed in this area?',
                ],
                responseTime: Date.now() - startTime,
                category: 'financial_value',
                validated: true,
            }
        }

        // Has list price, do overpriced analysis
        const analysis = await analyzeIfOverpriced(context.address, context.price, {
            beds: context.bedrooms,
            baths: context.bathrooms,
            sqft: context.sqft,
            yearBuilt: context.yearBuilt,
        })

        return {
            answer: formatOverpricedResponse(analysis.data),
            confidence: analysis.data.verdict === 'fair' ? 'high' : 'medium',
            sources: analysis.data.sources,
            followUpSuggestions: [
                'What should I offer?',
                'Show me comparable sales',
                'What would my monthly payment be?',
            ],
            responseTime: Date.now() - startTime,
            category: 'financial_value',
            validated: true,
        }
    }

    // General valuation question
    const valuation = await getComprehensiveValuation(context.address, {
        beds: context.bedrooms,
        baths: context.bathrooms,
        sqft: context.sqft,
        yearBuilt: context.yearBuilt,
        listPrice: context.price,
    })

    return {
        answer: formatValuationResponse(valuation.data),
        confidence: valuation.data.confidence,
        sources: valuation.data.sources,
        followUpSuggestions: [
            'Is this property overpriced?',
            'Show me price history',
            'What are comparable sales?',
        ],
        responseTime: Date.now() - startTime,
        category: 'financial_value',
        validated: true,
    }
}

async function handleInvestmentQuestion(
    question: string,
    context: PropertyContext,
    startTime: number
): Promise<RouterResponse> {

    console.log(`[Router] Handling investment question`)

    const investment = await analyzeInvestmentPotential(context.address, {
        price: context.price,
        beds: context.bedrooms,
        baths: context.bathrooms,
        sqft: context.sqft,
        yearBuilt: context.yearBuilt,
    })

    const data = investment.data

    const scoreLabel = data.investmentScore >= 70 ? '✅ Strong'
        : data.investmentScore >= 50 ? '⚠️ Moderate'
            : '❌ Below Average'

    const answer = `## Investment Analysis: ${scoreLabel} (Score: ${data.investmentScore}/100)

### Property Value
- **Estimated Value:** ${context.price ? `$${context.price.toLocaleString()}` : 'Not provided'}
- **Price/sqft:** ${context.sqft && context.price ? `$${Math.round(context.price / context.sqft)}` : 'Unknown'}

### Rental Income
- **Estimated Monthly Rent:** ${data.monthlyRent ? `$${data.monthlyRent.toLocaleString()}` : 'Unknown'}
- **Annual Gross Rent:** ${data.annualRent ? `$${data.annualRent.toLocaleString()}` : 'Unknown'}
- **Net Operating Income:** ${data.noi ? `$${data.noi.toLocaleString()}` : 'Unknown'} (after 35% expenses)

### Key Metrics
- **Cap Rate:** ${data.capRate ? `${data.capRate.toFixed(2)}%` : 'N/A'} ${data.capRate && data.capRate > 5 ? '✅' : '⚠️'}
- **Cash-on-Cash Return:** ${data.cashOnCash ? `${data.cashOnCash.toFixed(2)}%` : 'N/A'} ${data.cashOnCash && data.cashOnCash > 6 ? '✅' : '⚠️'}
- **Monthly Cash Flow:** ${data.monthlyCashFlow ? `$${data.monthlyCashFlow.toLocaleString()}` : 'N/A'} ${data.monthlyCashFlow > 0 ? '✅' : '❌'}

### Market Analysis
${data.rawAnalysis}

### Recommendation
${data.investmentScore >= 70 ? 'This property shows strong investment potential with solid rental income.' :
            data.investmentScore >= 50 ? 'This property has moderate investment potential. Consider negotiating the price.' :
                'This property may not be ideal for investment at current prices.'}
`

    return {
        answer,
        confidence: data.monthlyRent ? 'high' : 'medium',
        sources: data.sources,
        followUpSuggestions: [
            'What would the Airbnb income be?',
            'Is this property overpriced?',
            'What are the tax benefits?',
        ],
        responseTime: Date.now() - startTime,
        category: 'financial_investment',
        validated: true,
    }
}

// ============================================
// RESPONSE FORMATTERS
// ============================================

function formatValuationResponse(valuation: any): string {
    return `## Property Valuation for ${valuation.address || 'This Property'}

### Estimated Value
${valuation.estimatedValue ? `**$${valuation.estimatedValue.toLocaleString()}**` : 'Unable to determine'}
${valuation.valueRange ? `Range: $${valuation.valueRange.low.toLocaleString()} - $${valuation.valueRange.high.toLocaleString()}` : ''}

### Value Estimates by Source
- **Zillow Zestimate:** ${valuation.zestimate ? `$${valuation.zestimate.toLocaleString()}` : 'Not found'}
- **Redfin Estimate:** ${valuation.redfinEstimate ? `$${valuation.redfinEstimate.toLocaleString()}` : 'Not found'}
- **Realtor.com:** ${valuation.realtorEstimate ? `$${valuation.realtorEstimate.toLocaleString()}` : 'Not found'}

### Price Metrics
- **Price per sqft:** ${valuation.pricePerSqft ? `$${valuation.pricePerSqft}` : 'Unknown'}
- **Market Trend:** ${valuation.marketTrend || 'Unknown'}

### Tax Assessment
${valuation.taxAssessment ? `- Assessed Value: $${valuation.taxAssessment.value.toLocaleString()} (${valuation.taxAssessment.year})` : 'Not found'}

### Price History
${valuation.priceHistory?.length > 0
            ? valuation.priceHistory.map((h: any) => `- ${h.date}: $${h.price.toLocaleString()} (${h.event})`).join('\n')
            : 'No price history found'}

### Comparable Sales
${valuation.comparableSales?.length > 0
            ? valuation.comparableSales.map((c: any) => `- ${c.address}: $${c.price.toLocaleString()} - ${c.beds}bd/${c.baths}ba - ${c.sqft?.toLocaleString() || '?'} sqft`).join('\n')
            : 'No comparable sales found'}

*Confidence: ${valuation.confidence}*
`
}

function formatOverpricedResponse(analysis: any): string {
    const verdictEmoji = analysis.verdict === 'overpriced' ? '⚠️' : analysis.verdict === 'underpriced' ? '✅' : '➖'

    return `## Price Analysis: ${verdictEmoji} ${analysis.verdict.toUpperCase()}

### Pricing Summary
- **List Price:** $${analysis.listPrice.toLocaleString()}
- **Estimated Value:** ${analysis.estimatedValue ? `$${analysis.estimatedValue.toLocaleString()}` : 'Unknown'}
- **Difference:** ${analysis.difference ? `$${Math.abs(analysis.difference).toLocaleString()} ${analysis.difference > 0 ? 'over' : 'under'} (${Math.abs(analysis.differencePercent || 0)}%)` : 'Unknown'}

### Suggested Offer
${analysis.suggestedOffer ? `**$${analysis.suggestedOffer.toLocaleString()}**` : 'Unable to calculate'}

### Market Context
- **Price/sqft:** ${analysis.pricePerSqft ? `$${analysis.pricePerSqft}` : 'Unknown'}
- **Days on Market:** ${analysis.daysOnMarket || 'Unknown'}
- **Market Trend:** ${analysis.marketTrend || 'Unknown'}

### Comparable Sales
${analysis.comparableSales?.length > 0
            ? analysis.comparableSales.slice(0, 5).map((c: any) => `- ${c.address}: $${c.price.toLocaleString()}`).join('\n')
            : 'No comparable sales found'}

### Analysis
${analysis.analysis}
`
}
