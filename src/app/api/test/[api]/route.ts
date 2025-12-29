import { NextRequest, NextResponse } from 'next/server'
import { logApiStatus } from '@/lib/utils/env'

// Import all API modules
import * as google from '@/lib/api/google'
import * as property from '@/lib/api/property'
import * as neighborhood from '@/lib/api/neighborhood'
import * as environmental from '@/lib/api/environmental'
import * as financial from '@/lib/api/financial'
import * as utilities from '@/lib/api/utilities'
import * as ai from '@/lib/api/ai'

// Log status on first load
logApiStatus()

const TEST_ADDRESS = '1148 Greenbrook Drive, Danville, CA 94526'
const TEST_LAT = 37.8044
const TEST_LNG = -121.9523

type TestResult = {
    api: string
    status: 'success' | 'error' | 'mock'
    data?: unknown
    error?: string
    source?: 'live' | 'mock'
    responseTime: number
}

type ApiResponse = {
    data: unknown
    error: string | null
    source: 'live' | 'mock'
}

async function runTest(
    name: string,
    testFn: () => Promise<ApiResponse>
): Promise<TestResult> {
    const start = Date.now()
    try {
        const result = await testFn()
        return {
            api: name,
            status: result.source === 'mock' ? 'mock' : 'success',
            data: result.data,
            source: result.source,
            responseTime: Date.now() - start,
        }
    } catch (error) {
        return {
            api: name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - start,
        }
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ api: string }> }
) {
    const { api: apiName } = await params

    const tests: Record<string, () => Promise<TestResult>> = {
        // Google APIs (7)
        'google-places': () => runTest('Google Places', () =>
            google.searchNearbyPlaces({ latitude: TEST_LAT, longitude: TEST_LNG, radius: 1000, type: 'grocery_store' })
        ),
        'google-routes': () => runTest('Google Routes', () =>
            google.computeRoute({ originLat: TEST_LAT, originLng: TEST_LNG, destLat: 37.7749, destLng: -122.4194 })
        ),
        'google-elevation': () => runTest('Google Elevation', () =>
            google.getElevation(TEST_LAT, TEST_LNG)
        ),
        'google-geocoding': () => runTest('Google Geocoding', () =>
            google.geocodeAddress(TEST_ADDRESS)
        ),
        'google-airquality': () => runTest('Google Air Quality', () =>
            google.getCurrentAirQuality(TEST_LAT, TEST_LNG)
        ),
        'google-pollen': () => runTest('Google Pollen', () =>
            google.getPollenForecast(TEST_LAT, TEST_LNG)
        ),
        'google-solar': () => runTest('Google Solar', () =>
            google.getBuildingInsights(TEST_LAT, TEST_LNG)
        ),

        // Property APIs (5)
        'simplyrets': () => runTest('SimplyRETS', () =>
            property.searchListings({ cities: ['Danville'], limit: 5 })
        ),
        'estated': () => runTest('Estated', () =>
            property.getPropertyData(TEST_ADDRESS)
        ),
        'rentcast': () => runTest('Rentcast', () =>
            property.getRentEstimate({ address: TEST_ADDRESS })
        ),
        'mashvisor': () => runTest('Mashvisor', () =>
            property.getInvestmentAnalysis(TEST_ADDRESS)
        ),
        'regrid': () => runTest('Regrid', () =>
            property.getParcelByAddress(TEST_ADDRESS)
        ),

        // Neighborhood APIs (5)
        'neighborhoodscout': () => runTest('NeighborhoodScout', () =>
            neighborhood.getNeighborhoodData(TEST_ADDRESS)
        ),
        'greatschools': () => runTest('GreatSchools', () =>
            neighborhood.getNearbySchools(TEST_LAT, TEST_LNG)
        ),
        'census': () => runTest('Census', () =>
            neighborhood.getDemographicsByZip('94526')
        ),
        'spotcrime': () => runTest('SpotCrime', () =>
            neighborhood.getCrimeIncidents(TEST_LAT, TEST_LNG)
        ),
        'fbi-ucr': () => runTest('FBI UCR', () =>
            neighborhood.getCrimeStatsByState('CA')
        ),

        // Environmental APIs (8)
        'fema': () => runTest('FEMA', () =>
            environmental.getFloodZone(TEST_LAT, TEST_LNG)
        ),
        'howloud': () => runTest('HowLoud', () =>
            environmental.getNoiseScore(TEST_ADDRESS)
        ),
        'airnow': () => runTest('AirNow', () =>
            environmental.getCurrentAQI(TEST_LAT, TEST_LNG)
        ),
        'usgs': () => runTest('USGS', () =>
            environmental.getRecentEarthquakes(TEST_LAT, TEST_LNG)
        ),
        'epa': () => runTest('EPA', () =>
            environmental.getSuperfundSites('94526')
        ),
        'wildfire': () => runTest('Wildfire', () =>
            environmental.getWildfireRisk(TEST_LAT, TEST_LNG)
        ),
        'noaa': () => runTest('NOAA', () =>
            environmental.findNearestStation(TEST_LAT, TEST_LNG)
        ),
        'openweather': () => runTest('OpenWeather', () =>
            environmental.getCurrentWeather(TEST_LAT, TEST_LNG)
        ),

        // Financial APIs (3)
        'fred': () => runTest('FRED', () =>
            financial.getMortgageRates()
        ),
        'freddiemac': () => runTest('FreddieMac', () =>
            financial.getCurrentRates()
        ),
        'bls': () => runTest('BLS', () =>
            financial.getLocalUnemployment('06', '0001')
        ),

        // Utilities APIs (3)
        'broadband': () => runTest('Broadband', () =>
            utilities.getInternetProviders(TEST_LAT, TEST_LNG)
        ),
        'fcc': () => runTest('FCC', () =>
            utilities.getBroadbandCoverage('060130101001001')
        ),
        'energysage': () => runTest('EnergySage', () =>
            utilities.getSolarEstimate(TEST_ADDRESS, 150)
        ),

        // AI APIs (2)
        'perplexity': () => runTest('Perplexity', () =>
            ai.queryPerplexity('What is the weather like in San Francisco?')
        ),
        'gemini': () => runTest('Gemini', () =>
            ai.generateContent('Say hello in 10 words or less.')
        ),

        // Run all tests
        'all': async () => {
            const allTests = Object.entries(tests).filter(([key]) => key !== 'all')
            const results = await Promise.all(allTests.map(([, testFn]) => testFn()))
            return {
                api: 'all',
                status: 'success',
                data: results,
                responseTime: 0,
            } as TestResult
        },
    }

    if (!tests[apiName]) {
        return NextResponse.json({
            error: `Unknown API: ${apiName}`,
            availableTests: Object.keys(tests),
        }, { status: 400 })
    }

    const result = await tests[apiName]()

    return NextResponse.json(result)
}
