export type QuestionCategory =
    | 'location_distance'      // "How far is Whole Foods?"
    | 'location_amenities'     // "What restaurants are nearby?"
    | 'location_commute'       // "Commute time to SF?"
    | 'financial_value'        // "Is this overpriced?"
    | 'financial_investment'   // "Good investment?"
    | 'financial_cost'         // "True monthly cost?"
    | 'financial_mortgage'     // "What's the rate?"
    | 'environmental_risk'     // "Flood zone? Fire risk?"
    | 'environmental_quality'  // "Air quality? Noise?"
    | 'neighborhood_safety'    // "Is it safe?"
    | 'neighborhood_vibe'      // "What do neighbors say?"
    | 'neighborhood_demographics' // "Who lives here?"
    | 'schools'                // "How are the schools?"
    | 'property_features'      // "Does it have a pool?"
    | 'property_condition'     // "Is the kitchen updated?"
    | 'property_history'       // "Any permit issues?"
    | 'property_legal'         // "What's the zoning?"
    | 'utilities'              // "Internet speeds?"
    | 'comparison'             // "Which house is better?"
    | 'red_flags'              // "Any red flags?"
    | 'general'                // Catch-all

export type HandlerType =
    | 'DIRECT_API'
    | 'EXTRAPOLATOR'
    | 'PERPLEXITY'
    | 'VISION'

export interface PropertyContext {
    address: string
    lat: number
    lng: number
    zipCode: string
    city: string
    state: string
    price?: number
    bedrooms?: number
    bathrooms?: number
    sqft?: number
    yearBuilt?: number
    lotSize?: number
    mlsId?: string
    photos?: string[]
    listingData?: Record<string, unknown>
    cachedData?: {
        estated?: Record<string, unknown>
        rentcast?: Record<string, unknown>
        schools?: Record<string, unknown>
        crime?: Record<string, unknown>
        flood?: Record<string, unknown>
        listing?: { listPrice?: number }
        [key: string]: unknown
    }
}

export interface ConversationMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface RouterInput {
    question: string
    propertyContext: PropertyContext
    conversationHistory?: ConversationMessage[]
}

export interface ApiCallConfig {
    api: string
    method: string
    params: Record<string, unknown>
}

export interface ExtrapolationConfig {
    type: string
    dataSources: string[]
    logic: string
}

export interface PerplexityQueryConfig {
    template: string
    params: Record<string, string>
}

export interface VisionAnalysisConfig {
    prompt: string
    photoIndices: number[]
}

export interface RouterDecision {
    questionCategory: QuestionCategory
    handlers: HandlerType[]
    parallel: boolean
    apiCalls?: ApiCallConfig[]
    extrapolation?: ExtrapolationConfig
    perplexityQueries?: PerplexityQueryConfig[]
    visionAnalysis?: VisionAnalysisConfig
}

export interface HandlerResult {
    success: boolean
    data: Record<string, unknown> | null
    source: 'live' | 'mock'
    error?: string
}

export interface AskSellerButton {
    show: boolean
    questions: string[]
}

export interface FormattedResponse {
    answer: string
    sources: string[]
    confidence: 'high' | 'medium' | 'low'
    followUpSuggestions: string[]
    askSellerButton?: AskSellerButton
}

export interface RouterResponse extends FormattedResponse {
    responseTime: number
    category: string
    validated?: boolean
    corrections?: Array<{ field: string; original: any; corrected: any; reason: string }>
}

// Question patterns for classification
export const QUESTION_PATTERNS: Record<QuestionCategory, RegExp[]> = {
    location_distance: [
        /how far/i,
        /distance to/i,
        /nearest/i,
        /closest/i,
        /miles to/i,
        /minutes to/i,
        /how long.*(drive|walk|bike)/i,
        /get to\b/i,
    ],
    location_amenities: [
        /what.*(nearby|around|close)/i,
        /restaurants/i,
        /grocery/i,
        /shopping/i,
        /parks near/i,
        /things to do/i,
        /what's around/i,
        /amenities/i,
        /coffee/i,
        /gym/i,
        /pharmacy/i,
    ],
    location_commute: [
        /commute/i,
        /rush hour/i,
        /traffic/i,
        /drive to work/i,
        /get to.*(downtown|sf|work|office|city)/i,
    ],
    financial_value: [
        /overpriced/i,
        /underpriced/i,
        /worth/i,
        /fair price/i,
        /value/i,
        /good deal/i,
        /asking too much/i,
    ],
    financial_investment: [
        /good investment/i,
        /roi/i,
        /cap rate/i,
        /cash flow/i,
        /rental income/i,
        /airbnb/i,
        /return on/i,
        /invest/i,
    ],
    financial_cost: [
        /monthly cost/i,
        /true cost/i,
        /total cost/i,
        /afford/i,
        /payment/i,
        /how much.*(month|cost)/i,
    ],
    financial_mortgage: [
        /mortgage rate/i,
        /interest rate/i,
        /loan/i,
        /financing/i,
        /current rate/i,
    ],
    environmental_risk: [
        /flood/i,
        /earthquake/i,
        /wildfire/i,
        /fire risk/i,
        /natural disaster/i,
        /hazard/i,
        /risk/i,
    ],
    environmental_quality: [
        /air quality/i,
        /noise/i,
        /pollution/i,
        /quiet/i,
        /loud/i,
        /pollen/i,
        /allergi/i,
    ],
    neighborhood_safety: [
        /safe/i,
        /crime/i,
        /dangerous/i,
        /security/i,
        /sex offender/i,
        /violent/i,
    ],
    neighborhood_vibe: [
        /what.*(like|living)/i,
        /neighborhood feel/i,
        /neighbors/i,
        /community/i,
        /vibe/i,
        /character/i,
        /what do.*(people|residents|neighbors).*(say|think)/i,
        /sentiment/i,
    ],
    neighborhood_demographics: [
        /who lives/i,
        /demographics/i,
        /median income/i,
        /population/i,
        /families/i,
        /average age/i,
        /median age/i,
        /how old.*(people|residents)/i,
        /income level/i,
        /wealthy/i,
        /affluent/i,
        /education level/i,
        /growing area/i,
        /population growth/i,
        /is it growing/i,
        /household/i,
    ],
    schools: [
        /school/i,
        /education/i,
        /district/i,
        /elementary/i,
        /high school/i,
        /middle school/i,
        /kids/i,
        /children/i,
    ],
    property_features: [
        /does it have/i,
        /pool/i,
        /garage/i,
        /backyard/i,
        /bedrooms/i,
        /bathrooms/i,
        /sqft/i,
        /square feet/i,
        /lot size/i,
        /how big/i,
        /how many.*(bed|bath|room)/i,
    ],
    property_condition: [
        /condition/i,
        /updated/i,
        /renovated/i,
        /new kitchen/i,
        /roof age/i,
        /how old.*(house|home|property|roof|hvac)/i,
        /year built/i,
        /when.*(built|constructed)/i,
    ],
    property_history: [
        /permit/i,
        /renovation history/i,
        /previous owner/i,
        /sold before/i,
        /sales history/i,
        /price history/i,
    ],
    property_legal: [
        /zoning/i,
        /adu/i,
        /what can i build/i,
        /legal/i,
        /restrictions/i,
        /hoa/i,
    ],
    utilities: [
        /internet/i,
        /wifi/i,
        /fiber/i,
        /utilities/i,
        /electric/i,
        /solar/i,
        /broadband/i,
        /speed/i,
    ],
    comparison: [
        /compare/i,
        /which.*(better|best)/i,
        /vs/i,
        /versus/i,
        /difference between/i,
    ],
    red_flags: [
        /red flag/i,
        /concern/i,
        /worry/i,
        /problem/i,
        /issue/i,
        /wrong with/i,
        /any.*(problem|issue|concern)/i,
    ],
    general: [],
}
