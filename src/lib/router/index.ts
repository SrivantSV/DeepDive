import { classifyQuestion, determineApis, needsExtrapolation, needsPerplexity, needsVision, } from './classifier'
import { EXTRAPOLATION_RECIPES } from './api-index'
import { handleDirectApi } from './handlers/direct-api'
import { handleExtrapolation } from './handlers/extrapolator'
import { handlePerplexity } from './handlers/perplexity'
import { handleVision } from './handlers/vision'
import { formatResponse } from './handlers/formatter'
import { validateAndEnrich, answerAnyQuestion } from '@/lib/api/ai/perplexity-validator'
import { getComprehensiveValuation, analyzeIfOverpriced } from '@/lib/api/ai/perplexity-valuation'
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
import { queryPerplexity } from '@/lib/api/ai/perplexity'

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

    console.log(`[Router] Handling investment question with Perplexity`)

    // Get valuation data
    const valuation = await getComprehensiveValuation(context.address, {
        beds: context.bedrooms,
        baths: context.bathrooms,
        sqft: context.sqft,
        yearBuilt: context.yearBuilt,
        listPrice: context.price,
    })

    // Get rental estimate via Perplexity
    const rentalQuery = await queryPerplexity(
        `What is the rental estimate for ${context.address}? ${context.bedrooms} beds, ${context.bathrooms} baths, ${context.sqft} sqft. Search Rentometer, Zillow rent Zestimate, and Rentcast.`,
        `You are a rental market analyst. Find rental estimates for this property.
    
    Provide:
    1. Estimated monthly rent
    2. Rent range (low to high)
    3. Rent per sqft
    4. Comparable rentals nearby
    5. Rental market trend (increasing/stable/decreasing)`
    )

    const rentalContent = rentalQuery.data?.choices?.[0]?.message?.content || ''

    // Extract rent estimate
    const rentMatch = rentalContent.match(/\$?([\d,]+)\s*(?:\/month|per month|monthly)/i)
    const estimatedRent = rentMatch ? parseInt(rentMatch[1].replace(/,/g, '')) : null

    // Calculate investment metrics
    const propertyValue = valuation.data.estimatedValue || context.price || 0
    const monthlyRent = estimatedRent || Math.round(propertyValue * 0.004) // Default 0.4% rule
    const annualRent = monthlyRent * 12
    const expenses = annualRent * 0.35 // 35% expense ratio
    const noi = annualRent - expenses
    const capRate = propertyValue > 0 ? (noi / propertyValue) * 100 : 0

    const downPayment = propertyValue * 0.20
    const loanAmount = propertyValue * 0.80
    const monthlyMortgage = (loanAmount * 0.065 / 12) / (1 - Math.pow(1 + 0.065 / 12, -360))
    const annualMortgage = monthlyMortgage * 12
    const annualCashFlow = noi - annualMortgage
    const cashOnCash = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0

    // Score 1-100
    let score = 50
    if (capRate > 5) score += 15
    if (capRate > 7) score += 10
    if (cashOnCash > 5) score += 10
    if (cashOnCash > 8) score += 10
    if (annualCashFlow > 0) score += 5
    if (valuation.data.marketTrend === 'rising') score += 5
    if (valuation.data.marketTrend === 'declining') score -= 10

    const investmentResponse = `## Investment Analysis: ${score >= 70 ? '✅ Strong' : score >= 50 ? '⚠️ Average' : '❌ Below Average'} (Score: ${score}/100)

### Property Value
- **Estimated Value:** ${valuation.data.estimatedValue ? `$${valuation.data.estimatedValue.toLocaleString()}` : 'Unknown'}
- **List Price:** ${context.price ? `$${context.price.toLocaleString()}` : 'Not provided'}
- **Price/sqft:** ${valuation.data.pricePerSqft ? `$${valuation.data.pricePerSqft}` : 'Unknown'}

### Rental Income
- **Estimated Monthly Rent:** $${monthlyRent.toLocaleString()}
- **Annual Gross Rent:** $${annualRent.toLocaleString()}
- **Net Operating Income:** $${noi.toLocaleString()} (after 35% expenses)

### Key Metrics
- **Cap Rate:** ${capRate.toFixed(2)}% ${capRate > 5 ? '✅' : '⚠️'}
- **Cash-on-Cash Return:** ${cashOnCash.toFixed(2)}% ${cashOnCash > 8 ? '✅' : '⚠️'}
- **Monthly Cash Flow:** $${Math.round(annualCashFlow / 12).toLocaleString()} ${annualCashFlow > 0 ? '✅' : '❌'}

### Market Context
- **Market Trend:** ${valuation.data.marketTrend || 'Unknown'}
- **Days on Market:** ${valuation.data.daysOnMarket || 'Unknown'}

### Rental Market
${rentalContent}

### Recommendation
${score >= 70 ? 'This property shows strong investment potential with solid rental income and good returns.' :
            score >= 50 ? 'This property has average investment potential. Consider negotiating the price or look for value-add opportunities.' :
                'This property may not be ideal for investment at current prices. The returns are below market expectations.'}
`

    return {
        answer: investmentResponse,
        confidence: valuation.data.confidence,
        sources: [
            ...valuation.data.sources,
            ...(rentalQuery.data?.citations || []),
        ],
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
