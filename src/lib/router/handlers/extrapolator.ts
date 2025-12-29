import { HandlerResult, PropertyContext, ExtrapolationConfig } from '../types'
import * as property from '@/lib/api/property'
import * as neighborhood from '@/lib/api/neighborhood'
import * as financial from '@/lib/api/financial'
import * as environmental from '@/lib/api/environmental'

export async function handleExtrapolation(
    config: ExtrapolationConfig,
    context: PropertyContext
): Promise<HandlerResult> {
    switch (config.type) {
        case 'investment_analysis':
            return calculateInvestmentAnalysis(context)
        case 'overpriced_check':
            return checkIfOverpriced(context)
        case 'true_monthly_cost':
            return calculateTrueMonthlyCost(context)
        case 'red_flags':
            return scanForRedFlags(context)
        default:
            return { success: false, data: null, source: 'mock', error: 'Unknown extrapolation type' }
    }
}

async function calculateInvestmentAnalysis(context: PropertyContext): Promise<HandlerResult> {
    const [estatedRes, rentcastRes, mashvisorRes] = await Promise.all([
        property.getPropertyData(context.address),
        property.getRentEstimate({ address: context.address }),
        property.getInvestmentAnalysis(context.address),
    ])

    const estated = estatedRes.data as { valuation?: { value?: number }; taxes?: { amount?: number } } | null
    const rentcast = rentcastRes.data as { rent?: number } | null
    const mashvisor = mashvisorRes.data as {
        rental_data?: { airbnb_rent?: number; airbnb_occupancy?: number };
        neighborhood?: { optimal_strategy?: string; investment_score?: number }
    } | null

    const propertyValue = estated?.valuation?.value || 1000000
    const monthlyRent = rentcast?.rent || 4000
    const annualRent = monthlyRent * 12

    const annualTax = estated?.taxes?.amount || propertyValue * 0.012
    const annualInsurance = propertyValue * 0.003
    const annualMaintenance = propertyValue * 0.01
    const vacancyLoss = annualRent * 0.05

    const annualExpenses = annualTax + annualInsurance + annualMaintenance + vacancyLoss
    const noi = annualRent - annualExpenses

    const capRate = (noi / propertyValue) * 100
    const grossYield = (annualRent / propertyValue) * 100

    const downPayment = propertyValue * 0.25
    const loanAmount = propertyValue * 0.75
    const monthlyMortgage = calculateMonthlyMortgage(loanAmount, 6.5, 30)
    const annualMortgage = monthlyMortgage * 12
    const annualCashFlow = noi - annualMortgage
    const cashOnCash = (annualCashFlow / downPayment) * 100

    const investmentScore = calculateInvestmentScore(capRate, cashOnCash, mashvisor?.neighborhood?.investment_score)

    return {
        success: true,
        data: {
            summary: {
                investmentScore,
                verdict: investmentScore > 70 ? 'Good Investment' : investmentScore > 50 ? 'Average' : 'Below Average',
            },
            metrics: {
                capRate: Math.round(capRate * 100) / 100,
                cashOnCash: Math.round(cashOnCash * 100) / 100,
                grossYield: Math.round(grossYield * 100) / 100,
                monthlyRent,
                annualCashFlow: Math.round(annualCashFlow),
            },
            assumptions: {
                propertyValue,
                downPayment,
                interestRate: 6.5,
                annualExpenses: Math.round(annualExpenses),
            },
            airbnbPotential: mashvisor?.rental_data ? {
                estimatedRent: mashvisor.rental_data.airbnb_rent,
                occupancy: mashvisor.rental_data.airbnb_occupancy,
                recommendation: mashvisor.neighborhood?.optimal_strategy,
            } : null,
        },
        source: estatedRes.source === 'live' ? 'live' : 'mock',
    }
}

async function checkIfOverpriced(context: PropertyContext): Promise<HandlerResult> {
    const estatedRes = await property.getPropertyData(context.address)
    const estated = estatedRes.data as {
        valuation?: { value?: number; value_low?: number; value_high?: number }
    } | null

    const listPrice = context.cachedData?.listing?.listPrice || 1250000
    const avm = estated?.valuation?.value || 1200000
    const avmLow = estated?.valuation?.value_low || avm * 0.9
    const avmHigh = estated?.valuation?.value_high || avm * 1.1

    const priceDiff = listPrice - avm
    const priceDiffPercent = (priceDiff / avm) * 100

    let verdict: string
    let confidence: 'high' | 'medium' | 'low'

    if (listPrice <= avmLow) {
        verdict = 'Potentially Underpriced'
        confidence = 'medium'
    } else if (listPrice <= avm) {
        verdict = 'Fair Price'
        confidence = 'high'
    } else if (listPrice <= avmHigh) {
        verdict = 'Slightly Above Market'
        confidence = 'medium'
    } else {
        verdict = 'Overpriced'
        confidence = 'high'
    }

    return {
        success: true,
        data: {
            verdict,
            confidence,
            listPrice,
            estimatedValue: avm,
            valueRange: { low: avmLow, high: avmHigh },
            difference: {
                amount: priceDiff,
                percent: Math.round(priceDiffPercent * 10) / 10,
            },
            recommendation: priceDiffPercent > 10
                ? `Consider offering $${Math.round(avm).toLocaleString()} based on market value`
                : 'Price is within reasonable range',
        },
        source: estatedRes.source,
    }
}

async function calculateTrueMonthlyCost(context: PropertyContext): Promise<HandlerResult> {
    const [estatedRes, fredRes] = await Promise.all([
        property.getPropertyData(context.address),
        financial.getMortgageRates(),
    ])

    const estated = estatedRes.data as {
        valuation?: { value?: number };
        taxes?: { amount?: number }
    } | null
    const fredData = fredRes.data as { observations?: Array<{ value?: string }> } | null

    const listPrice = context.cachedData?.listing?.listPrice || estated?.valuation?.value || 1250000
    const rate = parseFloat(fredData?.observations?.[0]?.value || '6.85')

    const downPayment = listPrice * 0.20
    const loanAmount = listPrice - downPayment
    const monthlyMortgage = calculateMonthlyMortgage(loanAmount, rate, 30)

    const monthlyTax = (estated?.taxes?.amount || listPrice * 0.012) / 12
    const monthlyInsurance = (listPrice * 0.003) / 12
    const monthlyHOA = 0
    const monthlyMaintenance = (listPrice * 0.01) / 12

    const totalMonthly = monthlyMortgage + monthlyTax + monthlyInsurance + monthlyHOA + monthlyMaintenance

    return {
        success: true,
        data: {
            totalMonthly: Math.round(totalMonthly),
            breakdown: {
                mortgage: Math.round(monthlyMortgage),
                propertyTax: Math.round(monthlyTax),
                insurance: Math.round(monthlyInsurance),
                hoa: monthlyHOA,
                maintenance: Math.round(monthlyMaintenance),
            },
            assumptions: {
                purchasePrice: listPrice,
                downPayment,
                downPaymentPercent: 20,
                interestRate: rate,
                loanTerm: 30,
            },
            affordability: {
                requiredIncome: Math.round(totalMonthly / 0.28 * 12),
                dtiAt100k: Math.round((totalMonthly / (100000 / 12)) * 100),
            },
        },
        source: estatedRes.source,
    }
}

interface RedFlag {
    severity: 'high' | 'medium' | 'low'
    category: string
    issue: string
    details: string
}

async function scanForRedFlags(context: PropertyContext): Promise<HandlerResult> {
    const [femaRes, wildfireRes, usgsRes, noiseRes, crimeRes] = await Promise.all([
        environmental.getFloodZone(context.lat, context.lng),
        environmental.getWildfireRisk(context.lat, context.lng),
        environmental.getRecentEarthquakes(context.lat, context.lng),
        environmental.getNoiseScore(context.address),
        neighborhood.getNeighborhoodData(context.address),
    ])

    const redFlags: RedFlag[] = []

    // Check flood zone
    const floodData = femaRes.data as { flood_zone?: string } | null
    const floodZone = floodData?.flood_zone
    if (floodZone && !['X', 'C'].includes(floodZone)) {
        redFlags.push({
            severity: floodZone.startsWith('A') || floodZone.startsWith('V') ? 'high' : 'medium',
            category: 'Environmental',
            issue: 'Flood Zone',
            details: `Property is in FEMA flood zone ${floodZone}. Flood insurance may be required.`,
        })
    }

    // Check wildfire
    const wildfireData = wildfireRes.data as { risk_index?: number; risk_category?: string } | null
    if (wildfireData?.risk_index && wildfireData.risk_index >= 4) {
        redFlags.push({
            severity: 'high',
            category: 'Environmental',
            issue: 'Wildfire Risk',
            details: `High wildfire risk (${wildfireData.risk_category}). May affect insurance costs.`,
        })
    }

    // Check earthquakes
    const usgsData = usgsRes.data as { features?: Array<{ properties: { mag: number } }> } | null
    const recentQuakes = usgsData?.features?.filter(f => f.properties.mag >= 4) || []
    if (recentQuakes.length > 2) {
        redFlags.push({
            severity: 'medium',
            category: 'Environmental',
            issue: 'Seismic Activity',
            details: `${recentQuakes.length} earthquakes of magnitude 4+ within 100km in the past year.`,
        })
    }

    // Check noise
    const noiseData = noiseRes.data as { soundscore?: number; category?: string } | null
    if (noiseData?.soundscore && noiseData.soundscore < 60) {
        redFlags.push({
            severity: 'low',
            category: 'Quality of Life',
            issue: 'Noise Level',
            details: `Soundscore of ${noiseData.soundscore}/100 indicates a ${noiseData.category} area.`,
        })
    }

    // Check crime
    const crimeData = crimeRes.data as {
        crime?: { overall_grade?: string; comparison_to_national?: string }
    } | null
    if (crimeData?.crime?.overall_grade && ['D', 'F'].includes(crimeData.crime.overall_grade)) {
        redFlags.push({
            severity: 'high',
            category: 'Safety',
            issue: 'Crime Rate',
            details: `Crime grade of ${crimeData.crime.overall_grade}. ${crimeData.crime.comparison_to_national}`,
        })
    }

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 }
    redFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return {
        success: true,
        data: {
            totalFlags: redFlags.length,
            highSeverity: redFlags.filter(f => f.severity === 'high').length,
            mediumSeverity: redFlags.filter(f => f.severity === 'medium').length,
            lowSeverity: redFlags.filter(f => f.severity === 'low').length,
            flags: redFlags,
            overallAssessment: redFlags.filter(f => f.severity === 'high').length > 0
                ? 'Significant concerns found - investigate further'
                : redFlags.length > 3
                    ? 'Several minor concerns - review carefully'
                    : 'No major red flags detected',
        },
        source: 'mock',
    }
}

function calculateMonthlyMortgage(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 100 / 12
    const numPayments = years * 12
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
}

function calculateInvestmentScore(capRate: number, cashOnCash: number, neighborhoodScore?: number): number {
    const capScore = Math.min(capRate * 10, 100)
    const cocScore = Math.min((cashOnCash + 10) * 5, 100)
    const nhScore = neighborhoodScore || 50

    return Math.round(capScore * 0.4 + cocScore * 0.4 + nhScore * 0.2)
}
