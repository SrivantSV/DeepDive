import { queryPerplexity } from './perplexity'

export interface PropertyValuation {
    estimatedValue: number | null
    valueRange: { low: number; high: number } | null
    confidence: 'high' | 'medium' | 'low'
    zestimate: number | null
    redfinEstimate: number | null
    pricePerSqft: number | null
    marketTrend: string | null
    priceHistory: Array<{ date: string; price: number; event: string }>
    comparableSales: Array<{ address: string; price: number; date: string }>
    taxAssessment: { value: number; year: number } | null
    daysOnMarket: number | null
    rawAnalysis: string
    sources: string[]
}

export interface OverpricedAnalysis {
    verdict: 'overpriced' | 'fair' | 'underpriced'
    listPrice: number
    estimatedValue: number | null
    difference: number | null
    differencePercent: number | null
    suggestedOffer: number | null
    pricePerSqft: number | null
    analysis: string
    sources: string[]
}

// ============================================
// SINGLE COMPREHENSIVE VALUATION QUERY
// ============================================

export async function getComprehensiveValuation(
    address: string,
    propertyDetails?: {
        beds?: number
        baths?: number
        sqft?: number
        yearBuilt?: number
        listPrice?: number
    }
): Promise<{ data: PropertyValuation; source: 'live' | 'mock' }> {

    const detailsContext = propertyDetails
        ? `Property: ${propertyDetails.beds || '?'} beds, ${propertyDetails.baths || '?'} baths, ${propertyDetails.sqft || '?'} sqft, built ${propertyDetails.yearBuilt || '?'}${propertyDetails.listPrice ? `, currently listed at $${propertyDetails.listPrice.toLocaleString()}` : ''}`
        : ''

    // Single comprehensive query with structured output request
    const response = await queryPerplexity(
        `What is the current market value of ${address}? ${detailsContext}
    
    Find and report:
    1. Zillow Zestimate (exact dollar amount)
    2. Redfin Estimate (exact dollar amount)
    3. Price per square foot for this property
    4. Last 3 sale prices for this property with dates
    5. 3 comparable sales nearby with addresses and prices
    6. Current tax assessed value
    7. Is the market rising, stable, or declining?
    8. Days on market if currently listed`,

        `You are a real estate valuation expert. Search Zillow, Redfin, Realtor.com, and county records.

IMPORTANT: Always provide specific dollar amounts when found. Format numbers clearly like "$2,150,000" not "around 2 million".

Structure your response EXACTLY like this:

ZESTIMATE: $[amount] or "Not found"
REDFIN_ESTIMATE: $[amount] or "Not found"
PRICE_PER_SQFT: $[amount]
MARKET_TREND: [rising/stable/declining]
DAYS_ON_MARKET: [number] or "Not listed"

PRICE_HISTORY:
- [date]: $[price] ([event: Sold/Listed])
- [date]: $[price] ([event])

COMPARABLE_SALES:
- [address]: $[price] ([date])
- [address]: $[price] ([date])

TAX_ASSESSMENT: $[amount] ([year])

SUMMARY: [2-3 sentence summary of property value]`
    )

    const content = response.data?.choices?.[0]?.message?.content || ''
    const citations = response.data?.citations || []

    // Parse the structured response
    const valuation = parseStructuredValuation(content, propertyDetails?.sqft)

    return {
        data: {
            ...valuation,
            rawAnalysis: content,
            sources: citations,
        },
        source: 'live',
    }
}

function parseStructuredValuation(content: string, sqft?: number): Omit<PropertyValuation, 'rawAnalysis' | 'sources'> {
    // Extract values using clear patterns
    const extractDollarAmount = (pattern: RegExp): number | null => {
        const match = content.match(pattern)
        if (!match) return null

        // Handle various formats: $2,150,000 or $2.15M or 2.15 million
        let value = match[1].replace(/,/g, '').replace(/\$/g, '')

        if (value.toLowerCase().includes('m') || match[0].toLowerCase().includes('million')) {
            // Convert millions
            const numPart = parseFloat(value.replace(/[^\d.]/g, ''))
            return Math.round(numPart * 1000000)
        }

        return parseInt(value, 10) || null
    }

    // Zestimate - look for various patterns
    const zestimate = extractDollarAmount(/ZESTIMATE[:\s]*\$?([\d,\.]+\s*(?:M|million)?)/i)
        || extractDollarAmount(/Zillow\s*(?:Zestimate)?[:\s]*\$?([\d,\.]+\s*(?:M|million)?)/i)
        || extractDollarAmount(/Zestimate[:\s]*\$?([\d,\.]+\s*(?:M|million)?)/i)

    // Redfin
    const redfinEstimate = extractDollarAmount(/REDFIN_ESTIMATE[:\s]*\$?([\d,\.]+\s*(?:M|million)?)/i)
        || extractDollarAmount(/Redfin\s*(?:Estimate)?[:\s]*\$?([\d,\.]+\s*(?:M|million)?)/i)

    // Price per sqft
    let pricePerSqft = extractDollarAmount(/PRICE_PER_SQFT[:\s]*\$?([\d,]+)/i)
        || extractDollarAmount(/\$?([\d,]+)\s*(?:per\s*)?(?:sq\.?\s*ft|sqft|\/sqft)/i)

    // Market trend
    let marketTrend: string | null = null
    if (/MARKET_TREND[:\s]*(rising|increasing|up)/i.test(content)) marketTrend = 'rising'
    else if (/MARKET_TREND[:\s]*(declining|decreasing|down)/i.test(content)) marketTrend = 'declining'
    else if (/MARKET_TREND[:\s]*(stable|flat)/i.test(content)) marketTrend = 'stable'
    else if (/market[^.]*rising|prices[^.]*increasing|seller'?s?\s*market/i.test(content)) marketTrend = 'rising'
    else if (/market[^.]*declining|prices[^.]*decreasing|buyer'?s?\s*market/i.test(content)) marketTrend = 'declining'

    // Days on market
    const domMatch = content.match(/DAYS_ON_MARKET[:\s]*(\d+)/i) || content.match(/(\d+)\s*days?\s*on\s*market/i)
    const daysOnMarket = domMatch ? parseInt(domMatch[1], 10) : null

    // Tax assessment
    const taxMatch = content.match(/TAX_ASSESSMENT[:\s]*\$?([\d,\.]+)/i)
        || content.match(/assessed\s*(?:value)?[:\s]*\$?([\d,\.]+)/i)
    let taxAssessment: PropertyValuation['taxAssessment'] = null
    if (taxMatch) {
        const value = parseInt(taxMatch[1].replace(/,/g, ''), 10)
        const yearMatch = content.match(/TAX_ASSESSMENT[^)]*\((\d{4})\)/i) || content.match(/(\d{4})\s*(?:tax|assessment)/i)
        taxAssessment = {
            value: value,
            year: yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear(),
        }
    }

    // Price history
    const priceHistory: PropertyValuation['priceHistory'] = []
    const historySection = content.match(/PRICE_HISTORY[:\s]*([\s\S]*?)(?=COMPARABLE|TAX_ASSESSMENT|SUMMARY|$)/i)
    if (historySection) {
        const historyMatches = historySection[1].matchAll(/[-•]\s*([^:]+)[:\s]*\$?([\d,\.]+\s*(?:M|million)?)\s*\(([^)]+)\)/gi)
        for (const match of historyMatches) {
            let price = parseFloat(match[2].replace(/,/g, ''))
            if (match[2].toLowerCase().includes('m') || match[0].toLowerCase().includes('million')) {
                price *= 1000000
            }
            priceHistory.push({
                date: match[1].trim(),
                price: Math.round(price),
                event: match[3].trim(),
            })
        }
    }

    // Also try to find sale history in other formats
    if (priceHistory.length === 0) {
        const saleMatches = content.matchAll(/(?:sold|sale)[^$]*\$?([\d,\.]+\s*(?:M|million)?)[^0-9]*(\d{1,2}\/\d{1,2}\/\d{2,4}|\w+\s+\d{4}|\d{4})/gi)
        for (const match of saleMatches) {
            let price = parseFloat(match[1].replace(/,/g, ''))
            if (match[0].toLowerCase().includes('million') || match[1].toLowerCase().includes('m')) {
                price *= 1000000
            }
            priceHistory.push({
                date: match[2].trim(),
                price: Math.round(price),
                event: 'Sold',
            })
        }
    }

    // Comparable sales
    const comparableSales: PropertyValuation['comparableSales'] = []
    const compsSection = content.match(/COMPARABLE_SALES[:\s]*([\s\S]*?)(?=TAX_ASSESSMENT|SUMMARY|$)/i)
    if (compsSection) {
        const compMatches = compsSection[1].matchAll(/[-•]\s*([^:$]+)[:\s]*\$?([\d,\.]+\s*(?:M|million)?)\s*(?:\(([^)]+)\))?/gi)
        for (const match of compMatches) {
            let price = parseFloat(match[2].replace(/,/g, ''))
            if (match[2].toLowerCase().includes('m')) {
                price *= 1000000
            }
            comparableSales.push({
                address: match[1].trim(),
                price: Math.round(price),
                date: match[3]?.trim() || 'Recent',
            })
        }
    }

    // Calculate estimated value
    const estimates = [zestimate, redfinEstimate].filter(e => e !== null) as number[]
    const estimatedValue = estimates.length > 0
        ? Math.round(estimates.reduce((a, b) => a + b, 0) / estimates.length)
        : null

    // Calculate value range
    const valueRange = estimatedValue
        ? {
            low: Math.round(estimatedValue * 0.95),
            high: Math.round(estimatedValue * 1.05),
        }
        : null

    // Calculate price per sqft if missing
    if (!pricePerSqft && estimatedValue && sqft) {
        pricePerSqft = Math.round(estimatedValue / sqft)
    }

    // Determine confidence
    let confidence: PropertyValuation['confidence'] = 'low'
    if (estimates.length >= 2) confidence = 'high'
    else if (estimates.length === 1 || priceHistory.length > 0) confidence = 'medium'

    return {
        estimatedValue,
        valueRange,
        confidence,
        zestimate,
        redfinEstimate,
        pricePerSqft,
        marketTrend,
        priceHistory,
        comparableSales,
        taxAssessment,
        daysOnMarket,
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

    const response = await queryPerplexity(
        `Is ${address} overpriced at $${listPrice.toLocaleString()}?
    
    Property: ${propertyDetails?.beds || '?'} beds, ${propertyDetails?.baths || '?'} baths, ${propertyDetails?.sqft || '?'} sqft
    
    Compare:
    1. Zillow Zestimate
    2. Redfin Estimate
    3. Recent comparable sales
    4. Price per sqft vs area average
    5. Days on market`,

        `You are a real estate pricing expert helping a buyer negotiate.

Analyze whether this property is fairly priced and structure your response like this:

VERDICT: [OVERPRICED / FAIRLY_PRICED / GOOD_VALUE]
ESTIMATED_VALUE: $[amount]
DIFFERENCE: $[amount] [over/under]
SUGGESTED_OFFER: $[amount]
PRICE_PER_SQFT: $[amount] (area average: $[amount])

REASONING:
[2-3 bullet points explaining your verdict]

NEGOTIATION_TIP:
[1-2 sentences on how to approach negotiations]`
    )

    const content = response.data?.choices?.[0]?.message?.content || ''
    const citations = response.data?.citations || []

    // Parse verdict
    let verdict: OverpricedAnalysis['verdict'] = 'fair'
    if (/VERDICT[:\s]*OVERPRICED/i.test(content) || /is\s+overpriced/i.test(content)) {
        verdict = 'overpriced'
    } else if (/VERDICT[:\s]*GOOD_VALUE/i.test(content) || /good\s+value|under\s*priced|below\s+market/i.test(content)) {
        verdict = 'underpriced'
    }

    // Parse estimated value
    const valueMatch = content.match(/ESTIMATED_VALUE[:\s]*\$?([\d,\.]+\s*(?:M|million)?)/i)
        || content.match(/(?:Zestimate|estimated?|worth)[:\s]*\$?([\d,\.]+\s*(?:M|million)?)/i)
    let estimatedValue: number | null = null
    if (valueMatch) {
        estimatedValue = parseFloat(valueMatch[1].replace(/,/g, ''))
        if (valueMatch[1].toLowerCase().includes('m')) estimatedValue *= 1000000
        estimatedValue = Math.round(estimatedValue)
    }

    // Parse suggested offer
    const offerMatch = content.match(/SUGGESTED_OFFER[:\s]*\$?([\d,\.]+\s*(?:M|million)?)/i)
        || content.match(/(?:offer|suggest)[^$]*\$?([\d,\.]+\s*(?:M|million)?)/i)
    let suggestedOffer: number | null = null
    if (offerMatch) {
        suggestedOffer = parseFloat(offerMatch[1].replace(/,/g, ''))
        if (offerMatch[1].toLowerCase().includes('m')) suggestedOffer *= 1000000
        suggestedOffer = Math.round(suggestedOffer)
    }

    // Calculate difference
    const difference = estimatedValue ? listPrice - estimatedValue : null
    const differencePercent = estimatedValue ? ((listPrice - estimatedValue) / estimatedValue) * 100 : null

    // Parse price per sqft
    const ppsMatch = content.match(/PRICE_PER_SQFT[:\s]*\$?([\d,]+)/i)
    const pricePerSqft = ppsMatch ? parseInt(ppsMatch[1].replace(/,/g, ''), 10) : null

    // Default suggested offer if not parsed
    if (!suggestedOffer && estimatedValue) {
        suggestedOffer = verdict === 'overpriced'
            ? Math.round(estimatedValue * 0.95)
            : Math.round(estimatedValue * 0.98)
    }

    return {
        data: {
            verdict,
            listPrice,
            estimatedValue,
            difference,
            differencePercent: differencePercent ? Math.round(differencePercent * 10) / 10 : null,
            suggestedOffer,
            pricePerSqft,
            analysis: content,
            sources: citations,
        },
        source: 'live',
    }
}

// ============================================
// INVESTMENT ANALYSIS
// ============================================

export async function analyzeInvestmentPotential(
    address: string,
    propertyDetails?: {
        price?: number
        beds?: number
        baths?: number
        sqft?: number
        yearBuilt?: number
    }
): Promise<{ data: any; source: 'live' | 'mock' }> {

    const price = propertyDetails?.price || 0

    const response = await queryPerplexity(
        `What is the investment potential of ${address}?
    
    Property: ${propertyDetails?.beds || '?'} beds, ${propertyDetails?.baths || '?'} baths, ${propertyDetails?.sqft || '?'} sqft
    ${price ? `List Price: $${price.toLocaleString()}` : ''}
    
    Find:
    1. Estimated monthly rent (Zillow Rent Zestimate, Rentometer)
    2. Rental market trend
    3. Comparable rentals nearby
    4. Vacancy rates in area
    5. Local rental demand`,

        `You are a real estate investment analyst.

Structure your response like this:

ESTIMATED_RENT: $[amount]/month
RENT_RANGE: $[low] - $[high]/month
RENT_PER_SQFT: $[amount]
VACANCY_RATE: [X]%
RENTAL_TREND: [increasing/stable/decreasing]

COMPARABLE_RENTALS:
- [address or description]: $[rent]/month ([beds]bd/[baths]ba)

MARKET_ANALYSIS:
[2-3 sentences on rental market conditions]

INVESTMENT_RATING: [STRONG / MODERATE / WEAK]
[1-2 sentences explaining rating]`
    )

    const content = response.data?.choices?.[0]?.message?.content || ''
    const citations = response.data?.citations || []

    // Parse rent estimate
    const rentMatch = content.match(/ESTIMATED_RENT[:\s]*\$?([\d,]+)/i)
        || content.match(/rent[:\s]*\$?([\d,]+)\s*(?:\/|\s*per\s*)month/i)
        || content.match(/\$?([\d,]+)\s*(?:\/|\s*per\s*)(?:month|mo)/i)
    const monthlyRent = rentMatch ? parseInt(rentMatch[1].replace(/,/g, ''), 10) : null

    // Calculate investment metrics
    const propertyValue = price || 0
    const annualRent = (monthlyRent || 0) * 12
    const expenses = annualRent * 0.35 // 35% expense ratio
    const noi = annualRent - expenses

    // Cap rate (avoid division by zero)
    const capRate = propertyValue > 0 && monthlyRent ? (noi / propertyValue) * 100 : null

    // Cash-on-cash (20% down payment)
    const downPayment = propertyValue * 0.20
    const loanAmount = propertyValue * 0.80
    const annualMortgage = loanAmount > 0 ? (loanAmount * 0.07 / 12) / (1 - Math.pow(1 + 0.07 / 12, -360)) * 12 : 0
    const annualCashFlow = noi - annualMortgage
    const cashOnCash = downPayment > 0 && monthlyRent ? (annualCashFlow / downPayment) * 100 : null

    // Investment score
    let investmentScore = 50
    if (capRate && capRate > 4) investmentScore += 10
    if (capRate && capRate > 6) investmentScore += 10
    if (cashOnCash && cashOnCash > 4) investmentScore += 10
    if (cashOnCash && cashOnCash > 8) investmentScore += 10
    if (annualCashFlow > 0) investmentScore += 10

    // Parse rating from response
    let rating = 'moderate'
    if (/INVESTMENT_RATING[:\s]*STRONG/i.test(content)) rating = 'strong'
    else if (/INVESTMENT_RATING[:\s]*WEAK/i.test(content)) rating = 'weak'

    return {
        data: {
            monthlyRent,
            annualRent,
            noi,
            capRate: capRate ? Math.round(capRate * 100) / 100 : null,
            cashOnCash: cashOnCash ? Math.round(cashOnCash * 100) / 100 : null,
            annualCashFlow: Math.round(annualCashFlow),
            monthlyCashFlow: Math.round(annualCashFlow / 12),
            investmentScore,
            rating,
            rawAnalysis: content,
            sources: citations,
        },
        source: 'live',
    }
}
