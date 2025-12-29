import { queryPerplexity } from './perplexity'

// ============================================
// PROPERTY VALUATION VIA PERPLEXITY
// ============================================

export interface PropertyValuation {
    estimatedValue: number | null
    valueRange: { low: number; high: number } | null
    confidence: 'high' | 'medium' | 'low'
    zestimate: number | null
    redfinEstimate: number | null
    realtorEstimate: number | null
    pricePerSqft: number | null
    marketTrend: 'rising' | 'stable' | 'declining' | null
    priceHistory: Array<{ date: string; price: number; event: string }>
    comparableSales: Array<{ address: string; price: number; date: string; sqft: number; beds: number; baths: number }>
    taxAssessment: { value: number; year: number } | null
    daysOnMarket: number | null
    listingStatus: string | null
    rawAnalysis: string
    sources: string[]
}

export async function getComprehensiveValuation(
    address: string,
    propertyDetails?: {
        beds?: number
        baths?: number
        sqft?: number
        yearBuilt?: number
        lotSize?: number
        listPrice?: number
    }
): Promise<{ data: PropertyValuation; source: 'live' | 'mock' }> {

    const detailsString = propertyDetails
        ? `Property details: ${propertyDetails.beds || '?'} beds, ${propertyDetails.baths || '?'} baths, ${propertyDetails.sqft || '?'} sqft, built ${propertyDetails.yearBuilt || '?'}, lot ${propertyDetails.lotSize || '?'} sqft${propertyDetails.listPrice ? `, listed at $${propertyDetails.listPrice.toLocaleString()}` : ''}`
        : ''

    // Query 1: Get Zillow/Redfin estimates
    const estimateQuery = await queryPerplexity(
        `What is the current estimated value of ${address}? Search Zillow Zestimate, Redfin Estimate, and Realtor.com. ${detailsString}`,
        `You are a real estate valuation expert. Find the most current home value estimates from major real estate websites.
    
    Return specific numbers when found:
    - Zillow Zestimate: $X
    - Redfin Estimate: $X  
    - Realtor.com Estimate: $X
    - Price per square foot: $X/sqft
    
    If a specific estimate isn't found, say "not found" for that source.
    Always cite your sources with URLs when possible.`
    )

    // Query 2: Get price history and sales data
    const historyQuery = await queryPerplexity(
        `${address} price history, previous sales, and when it was last sold. Also find recent comparable sales within 0.5 miles.`,
        `You are a real estate analyst researching property history.
    
    Find:
    1. All previous sale prices and dates for this specific property
    2. Current listing price and days on market (if listed)
    3. 3-5 comparable sales nearby from the last 6 months with prices
    
    Format comparable sales as: "123 Street Name - $X - sold MM/YYYY - X beds/X baths/X sqft"
    Be specific with dates and dollar amounts.`
    )

    // Query 3: Get tax assessment and market context
    const assessmentQuery = await queryPerplexity(
        `${address} county tax assessment value and local real estate market trends 2024`,
        `You are a property tax and market analyst.
    
    Find:
    1. Current county tax assessed value
    2. Annual property tax amount
    3. Local market trend (prices rising, stable, or declining)
    4. Average days on market for this area
    5. Median home price for this ZIP code
    
    Be specific with numbers and cite county assessor records when possible.`
    )

    // Parse the responses
    const valuation = parseValuationResponses(
        estimateQuery.data?.choices?.[0]?.message?.content || '',
        historyQuery.data?.choices?.[0]?.message?.content || '',
        assessmentQuery.data?.choices?.[0]?.message?.content || '',
        propertyDetails
    )

    // Collect all citations
    const allCitations = [
        ...(estimateQuery.data?.citations || []),
        ...(historyQuery.data?.citations || []),
        ...(assessmentQuery.data?.citations || []),
    ]

    return {
        data: {
            ...valuation,
            sources: allCitations,
        },
        source: 'live',
    }
}

function parseValuationResponses(
    estimateResponse: string,
    historyResponse: string,
    assessmentResponse: string,
    propertyDetails?: { sqft?: number; listPrice?: number }
): Omit<PropertyValuation, 'sources'> {

    // Extract dollar amounts from text
    const extractPrice = (text: string, pattern: RegExp): number | null => {
        const match = text.match(pattern)
        if (match) {
            const numStr = match[1].replace(/,/g, '').replace(/\$/g, '')
            const num = parseFloat(numStr)
            // Handle millions (e.g., "2.1M" or "2.1 million")
            if (text.toLowerCase().includes('million') || match[0].toLowerCase().includes('m')) {
                return num * 1000000
            }
            return num
        }
        return null
    }

    // Extract Zestimate
    const zestimate = extractPrice(estimateResponse, /zestimate[:\s]*\$?([\d,\.]+)\s*(m|million)?/i)
        || extractPrice(estimateResponse, /zillow[:\s]*\$?([\d,\.]+)\s*(m|million)?/i)

    // Extract Redfin estimate
    const redfinEstimate = extractPrice(estimateResponse, /redfin[:\s]*\$?([\d,\.]+)\s*(m|million)?/i)
        || extractPrice(estimateResponse, /redfin estimate[:\s]*\$?([\d,\.]+)\s*(m|million)?/i)

    // Extract Realtor estimate
    const realtorEstimate = extractPrice(estimateResponse, /realtor[:\s]*\$?([\d,\.]+)\s*(m|million)?/i)

    // Extract price per sqft
    let pricePerSqft = extractPrice(estimateResponse, /\$?([\d,]+)\s*(?:per |\/)\s*(?:sq\.?\s*ft|sqft|square foot)/i)

    // Calculate estimated value (average of available estimates)
    const estimates = [zestimate, redfinEstimate, realtorEstimate].filter(e => e !== null) as number[]
    const estimatedValue = estimates.length > 0
        ? Math.round(estimates.reduce((a, b) => a + b, 0) / estimates.length)
        : null

    // Calculate value range
    const valueRange = estimates.length > 0
        ? {
            low: Math.round(Math.min(...estimates) * 0.95),
            high: Math.round(Math.max(...estimates) * 1.05),
        }
        : null

    // Calculate price per sqft if we have value and sqft
    if (!pricePerSqft && estimatedValue && propertyDetails?.sqft) {
        pricePerSqft = Math.round(estimatedValue / propertyDetails.sqft)
    }

    // Extract price history
    const priceHistory: PropertyValuation['priceHistory'] = []
    const saleMatches = historyResponse.matchAll(/(?:sold|sale|listed)[:\s]*(?:for\s*)?\$?([\d,\.]+)\s*(?:m|million)?\s*(?:on|in)?\s*(\d{1,2}\/\d{1,2}\/\d{2,4}|\w+\s+\d{4}|\d{4})/gi)
    for (const match of saleMatches) {
        let price = parseFloat(match[1].replace(/,/g, ''))
        if (match[0].toLowerCase().includes('million') || match[0].toLowerCase().includes('m')) {
            price *= 1000000
        }
        priceHistory.push({
            date: match[2],
            price: price,
            event: match[0].toLowerCase().includes('list') ? 'Listed' : 'Sold',
        })
    }

    // Extract comparable sales
    const comparableSales: PropertyValuation['comparableSales'] = []
    const compMatches = historyResponse.matchAll(/(\d+\s+[\w\s]+(?:st|rd|th|ave|blvd|dr|ln|ct|way|pl|cir))[,\s\-]+\$?([\d,\.]+)\s*(?:m|million)?[,\s\-]+(?:sold\s*)?(\d{1,2}\/\d{2,4}|\w+\s*\d{4})[,\s\-]+(\d+)\s*(?:beds?|bd)[,\s\/]+(\d+\.?\d*)\s*(?:baths?|ba)[,\s\/]+(\d+,?\d*)\s*(?:sqft|sq)/gi)
    for (const match of compMatches) {
        let price = parseFloat(match[2].replace(/,/g, ''))
        if (match[0].toLowerCase().includes('million')) {
            price *= 1000000
        }
        comparableSales.push({
            address: match[1].trim(),
            price: price,
            date: match[3],
            beds: parseInt(match[4]),
            baths: parseFloat(match[5]),
            sqft: parseInt(match[6].replace(/,/g, '')),
        })
    }

    // Extract tax assessment
    let taxAssessment: PropertyValuation['taxAssessment'] = null
    const taxMatch = assessmentResponse.match(/(?:assessed|assessment)[:\s]*\$?([\d,\.]+)\s*(?:m|million)?/i)
    if (taxMatch) {
        let value = parseFloat(taxMatch[1].replace(/,/g, ''))
        if (assessmentResponse.toLowerCase().includes('million')) {
            value *= 1000000
        }
        const yearMatch = assessmentResponse.match(/(?:20\d{2})/g)
        taxAssessment = {
            value: value,
            year: yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : new Date().getFullYear(),
        }
    }

    // Determine market trend
    let marketTrend: PropertyValuation['marketTrend'] = null
    if (assessmentResponse.toLowerCase().includes('rising') || assessmentResponse.toLowerCase().includes('increasing') || assessmentResponse.toLowerCase().includes('up ')) {
        marketTrend = 'rising'
    } else if (assessmentResponse.toLowerCase().includes('declining') || assessmentResponse.toLowerCase().includes('decreasing') || assessmentResponse.toLowerCase().includes('down ')) {
        marketTrend = 'declining'
    } else if (assessmentResponse.toLowerCase().includes('stable') || assessmentResponse.toLowerCase().includes('flat')) {
        marketTrend = 'stable'
    }

    // Extract days on market
    const domMatch = historyResponse.match(/(\d+)\s*(?:days?)\s*(?:on\s*)?(?:market|dom)/i)
    const daysOnMarket = domMatch ? parseInt(domMatch[1]) : null

    // Determine confidence
    let confidence: PropertyValuation['confidence'] = 'low'
    if (estimates.length >= 2 && priceHistory.length > 0) {
        confidence = 'high'
    } else if (estimates.length >= 1 || priceHistory.length > 0) {
        confidence = 'medium'
    }

    // Combine raw analysis
    const rawAnalysis = `
## Valuation Estimates
${estimateResponse}

## Price History & Comparables
${historyResponse}

## Tax Assessment & Market Context
${assessmentResponse}
  `.trim()

    return {
        estimatedValue,
        valueRange,
        confidence,
        zestimate,
        redfinEstimate,
        realtorEstimate,
        pricePerSqft,
        marketTrend,
        priceHistory,
        comparableSales,
        taxAssessment,
        daysOnMarket,
        listingStatus: historyResponse.toLowerCase().includes('active') ? 'Active' :
            historyResponse.toLowerCase().includes('pending') ? 'Pending' : null,
        rawAnalysis,
    }
}

// ============================================
// OVERPRICED ANALYSIS
// ============================================

export async function analyzeIfOverpriced(
    address: string,
    listPrice: number,
    propertyDetails?: {
        beds?: number
        baths?: number
        sqft?: number
        yearBuilt?: number
    }
): Promise<{ data: OverpricedAnalysis; source: 'live' | 'mock' }> {

    // Get comprehensive valuation first
    const valuation = await getComprehensiveValuation(address, { ...propertyDetails, listPrice })

    // Additional query for overpriced analysis
    const analysisQuery = await queryPerplexity(
        `Is ${address} overpriced at $${listPrice.toLocaleString()}? Compare to Zillow estimate, recent comparable sales, and price per sqft for the area. ${propertyDetails?.sqft ? `Property is ${propertyDetails.sqft} sqft.` : ''}`,
        `You are a real estate investment analyst helping a buyer determine if a property is fairly priced.

    Analyze:
    1. Compare list price to Zestimate and Redfin estimate
    2. Calculate price per sqft and compare to area average
    3. Look at recent comparable sales
    4. Consider days on market
    5. Check if there have been price reductions
    
    Give a clear verdict: OVERPRICED, FAIRLY PRICED, or GOOD VALUE
    Explain your reasoning with specific numbers.
    Suggest a fair offer price.`
    )

    const analysisContent = analysisQuery.data?.choices?.[0]?.message?.content || ''

    // Determine verdict
    let verdict: 'overpriced' | 'fair' | 'underpriced' = 'fair'
    if (analysisContent.toLowerCase().includes('overpriced')) {
        verdict = 'overpriced'
    } else if (analysisContent.toLowerCase().includes('good value') || analysisContent.toLowerCase().includes('underpriced') || analysisContent.toLowerCase().includes('below')) {
        verdict = 'underpriced'
    }

    // Calculate difference from estimated value
    const difference = valuation.data.estimatedValue
        ? listPrice - valuation.data.estimatedValue
        : null
    const differencePercent = valuation.data.estimatedValue
        ? ((listPrice - valuation.data.estimatedValue) / valuation.data.estimatedValue) * 100
        : null

    // Extract suggested offer
    const offerMatch = analysisContent.match(/(?:fair|suggest|offer|recommend)[:\s]*\$?([\d,\.]+)\s*(?:m|million)?/i)
    let suggestedOffer = null
    if (offerMatch) {
        suggestedOffer = parseFloat(offerMatch[1].replace(/,/g, ''))
        if (analysisContent.toLowerCase().includes('million')) {
            suggestedOffer *= 1000000
        }
    } else if (valuation.data.estimatedValue) {
        // Default to 95% of estimated value if overpriced, 98% if fair
        suggestedOffer = verdict === 'overpriced'
            ? Math.round(valuation.data.estimatedValue * 0.95)
            : Math.round(valuation.data.estimatedValue * 0.98)
    }

    return {
        data: {
            verdict,
            listPrice,
            estimatedValue: valuation.data.estimatedValue,
            difference,
            differencePercent: differencePercent ? Math.round(differencePercent * 10) / 10 : null,
            suggestedOffer,
            pricePerSqft: valuation.data.pricePerSqft,
            comparableSales: valuation.data.comparableSales,
            marketTrend: valuation.data.marketTrend,
            daysOnMarket: valuation.data.daysOnMarket,
            analysis: analysisContent,
            sources: [
                ...(valuation.data.sources || []),
                ...(analysisQuery.data?.citations || []),
            ],
        },
        source: 'live',
    }
}

export interface OverpricedAnalysis {
    verdict: 'overpriced' | 'fair' | 'underpriced'
    listPrice: number
    estimatedValue: number | null
    difference: number | null
    differencePercent: number | null
    suggestedOffer: number | null
    pricePerSqft: number | null
    comparableSales: PropertyValuation['comparableSales']
    marketTrend: PropertyValuation['marketTrend']
    daysOnMarket: number | null
    analysis: string
    sources: string[]
}
