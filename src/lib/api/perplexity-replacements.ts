import { queryPerplexity } from '@/lib/api/ai/perplexity'

// ============================================
// GREATSCHOOLS REPLACEMENT
// ============================================
export async function getSchoolsViaPerplexity(lat: number, lng: number, city: string) {
    const response = await queryPerplexity(
        `Find the top-rated K-12 schools near ${city} (coordinates: ${lat}, ${lng}). 
    Include for each school:
    - School name
    - Type (public/private/charter)
    - Grades served
    - Rating out of 10
    - Distance from location
    - Key strengths
    Format as a structured list.`,
        'You are a school research assistant. Return factual school ratings and information. Use GreatSchools ratings when available.'
    )

    const content = (response.data as { choices?: Array<{ message?: { content?: string } }>; citations?: string[] })?.choices?.[0]?.message?.content || ''
    const citations = (response.data as { citations?: string[] })?.citations

    return {
        data: {
            schools: parseSchoolsFromText(content),
            raw: content,
            citations,
        },
        source: response.source,
        error: response.error,
    }
}

// ============================================
// NEIGHBORHOODSCOUT REPLACEMENT
// ============================================
export async function getCrimeDataViaPerplexity(address: string, city: string) {
    const response = await queryPerplexity(
        `What are the crime statistics and safety grade for ${address}, ${city}?
    Include:
    - Overall safety grade (A-F)
    - Violent crime rate (per 100k)
    - Property crime rate (per 100k)
    - Comparison to national average
    - Recent crime trends
    - Safest vs most concerning aspects`,
        'You are a neighborhood safety analyst. Return factual crime statistics. Reference NeighborhoodScout, FBI UCR, or local police data when available.'
    )

    const content = (response.data as { choices?: Array<{ message?: { content?: string } }>; citations?: string[] })?.choices?.[0]?.message?.content || ''
    const citations = (response.data as { citations?: string[] })?.citations

    return {
        data: {
            crime: parseCrimeFromText(content),
            raw: content,
            citations,
        },
        source: response.source,
        error: response.error,
    }
}

// ============================================
// SPOTCRIME REPLACEMENT
// ============================================
export async function getCrimeIncidentsViaPerplexity(lat: number, lng: number, city: string) {
    const response = await queryPerplexity(
        `Find recent crime incidents near coordinates ${lat}, ${lng} in ${city} from the past 30 days.
    Include for each incident:
    - Type of crime
    - Date
    - Approximate location
    - Brief description
    List the most recent 10 incidents.`,
        'You are a crime incident researcher. Return factual recent crime reports from news and police reports.'
    )

    const content = (response.data as { choices?: Array<{ message?: { content?: string } }>; citations?: string[] })?.choices?.[0]?.message?.content || ''
    const citations = (response.data as { citations?: string[] })?.citations

    return {
        data: {
            incidents: parseIncidentsFromText(content),
            raw: content,
            citations,
        },
        source: response.source,
        error: response.error,
    }
}

// ============================================
// HOWLOUD REPLACEMENT
// ============================================
export async function getNoiseDataViaPerplexity(address: string, city: string) {
    const response = await queryPerplexity(
        `What is the noise level at ${address}, ${city}?
    Analyze:
    - Traffic noise (nearby highways, busy roads)
    - Airport noise (flight paths, distance to airport)
    - Train noise (rail lines nearby)
    - Local noise (bars, venues, commercial areas)
    - Overall noise assessment (Quiet/Moderate/Noisy)
    - Any noise complaints in the area`,
        'You are an environmental noise analyst. Return factual noise assessments based on location data and resident reports.'
    )

    const content = (response.data as { choices?: Array<{ message?: { content?: string } }>; citations?: string[] })?.choices?.[0]?.message?.content || ''
    const citations = (response.data as { citations?: string[] })?.citations

    return {
        data: {
            noise: parseNoiseFromText(content),
            raw: content,
            citations,
        },
        source: response.source,
        error: response.error,
    }
}

// ============================================
// ESTATED REPLACEMENT (Property Data)
// ============================================
export async function getPropertyDataViaPerplexity(address: string) {
    const response = await queryPerplexity(
        `Find property details for ${address}.
    Include:
    - Year built
    - Square footage
    - Lot size
    - Bedrooms/bathrooms
    - Last sale date and price
    - Current estimated value
    - Property tax amount
    - Owner information (if public)
    - Zoning
    - Any recent permits`,
        'You are a property research specialist. Return factual property data from public records, Zillow, Redfin, or county assessor data.'
    )

    const content = (response.data as { choices?: Array<{ message?: { content?: string } }>; citations?: string[] })?.choices?.[0]?.message?.content || ''
    const citations = (response.data as { citations?: string[] })?.citations

    return {
        data: {
            property: parsePropertyFromText(content),
            raw: content,
            citations,
        },
        source: response.source,
        error: response.error,
    }
}

// ============================================
// PARSING HELPERS
// ============================================
interface SchoolData {
    name?: string
    type?: string
    grades?: string
    rating?: number
    distance?: string
    raw?: string
}

interface CrimeData {
    overallGrade?: string
    violentCrimeRate?: number
    propertyCrimeRate?: number
    raw?: string
}

interface IncidentData {
    type?: string
    date?: string
    location?: string
    raw?: string
}

interface NoiseData {
    traffic?: string
    airport?: string
    overall?: string
    raw?: string
}

interface PropertyData {
    yearBuilt?: number
    sqft?: number
    bedrooms?: number
    bathrooms?: number
    raw?: string
}

function parseSchoolsFromText(text: string): SchoolData[] {
    // Return raw text for now - can add structured parsing later
    return [{ raw: text }]
}

function parseCrimeFromText(text: string): CrimeData {
    return { raw: text }
}

function parseIncidentsFromText(text: string): IncidentData[] {
    return [{ raw: text }]
}

function parseNoiseFromText(text: string): NoiseData {
    return { raw: text }
}

function parsePropertyFromText(text: string): PropertyData {
    return { raw: text }
}
