import { QuestionCategory, QUESTION_PATTERNS } from './types'
import { API_INDEX } from './api-index'

export function classifyQuestion(question: string): QuestionCategory {
    const lowerQuestion = question.toLowerCase()

    // Check each pattern category
    for (const [category, patterns] of Object.entries(QUESTION_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(lowerQuestion)) {
                console.log(`[Classifier] Matched "${question}" to category: ${category}`)
                return category as QuestionCategory
            }
        }
    }

    console.log(`[Classifier] No pattern match for "${question}", classifying as general`)

    // For general questions, we'll still route to Perplexity handler
    return 'general'
}

export function determineApis(
    category: QuestionCategory,
    question: string
): string[] {
    const apis: string[] = []
    const lowerQuestion = question.toLowerCase()

    // Check which APIs match the question keywords
    for (const [apiName, apiInfo] of Object.entries(API_INDEX)) {
        for (const keyword of apiInfo.useWhen) {
            if (lowerQuestion.includes(keyword.toLowerCase())) {
                apis.push(apiName)
                break
            }
        }
    }

    // Category-based defaults
    const categoryDefaults: Record<QuestionCategory, string[]> = {
        location_distance: ['google_places', 'google_routes'],
        location_amenities: ['google_places'],
        location_commute: ['google_routes'],
        financial_value: ['estated', 'simplyrets'],
        financial_investment: ['estated', 'rentcast', 'mashvisor'],
        financial_cost: ['estated', 'fred', 'simplyrets'],
        financial_mortgage: ['fred'],
        environmental_risk: ['fema', 'usgs', 'wildfire'],
        environmental_quality: ['howloud', 'google_airquality'],
        neighborhood_safety: ['neighborhoodscout', 'spotcrime'],
        neighborhood_vibe: ['perplexity'],
        neighborhood_demographics: ['census'],
        schools: ['greatschools'],
        property_features: ['simplyrets'],
        property_condition: ['gemini_vision'],
        property_history: ['perplexity'],
        property_legal: ['regrid', 'perplexity'],
        utilities: ['broadband', 'google_solar'],
        comparison: ['simplyrets', 'estated'],
        red_flags: ['fema', 'neighborhoodscout', 'perplexity', 'wildfire', 'usgs'],
        general: ['perplexity'], // Use Perplexity for unclassified questions
    }

    // Add defaults if no specific APIs found
    if (apis.length === 0 && categoryDefaults[category]) {
        apis.push(...categoryDefaults[category])
    }

    return [...new Set(apis)] // Remove duplicates
}

export function needsExtrapolation(category: QuestionCategory): boolean {
    const extrapolationCategories: QuestionCategory[] = [
        'financial_value',
        'financial_investment',
        'financial_cost',
        'red_flags',
        'comparison',
    ]
    return extrapolationCategories.includes(category)
}

export function needsPerplexity(category: QuestionCategory, question: string): boolean {
    const perplexityCategories: QuestionCategory[] = [
        'neighborhood_vibe',
        'property_history',
        'general', // Also use Perplexity for unclassified questions
    ]

    const perplexityKeywords = [
        'permit', 'hoa', 'neighbor', 'reddit', 'nextdoor', 'sex offender',
        'development', 'construction', 'what is it like', 'liens', 'sentiment'
    ]

    if (perplexityCategories.includes(category)) return true

    const lowerQuestion = question.toLowerCase()
    return perplexityKeywords.some(kw => lowerQuestion.includes(kw))
}

export function needsVision(question: string, hasPhotos: boolean): boolean {
    if (!hasPhotos) return false

    const visionKeywords = [
        'fit', 'garage', 'kitchen', 'updated', 'condition', 'look like',
        'natural light', 'backyard', 'private', 'room', 'photo'
    ]

    const lowerQuestion = question.toLowerCase()
    return visionKeywords.some(kw => lowerQuestion.includes(kw))
}
