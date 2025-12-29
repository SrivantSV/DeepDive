import { HandlerResult, PropertyContext } from '../types'
import { shouldUsePerplexity } from '@/lib/utils/env'
import * as google from '@/lib/api/google'
import * as property from '@/lib/api/property'
import * as neighborhood from '@/lib/api/neighborhood'
import * as environmental from '@/lib/api/environmental'
import * as financial from '@/lib/api/financial'
import * as utilities from '@/lib/api/utilities'
import {
    getSchoolsViaPerplexity,
    getCrimeDataViaPerplexity,
    getCrimeIncidentsViaPerplexity,
    getNoiseDataViaPerplexity,
    getPropertyDataViaPerplexity,
    getNeighborhoodSentimentViaPerplexity,
} from '@/lib/api/perplexity-replacements'

interface ApiCall {
    api: string
    method: string
    params: Record<string, unknown>
}

export async function handleDirectApi(
    apiCalls: ApiCall[],
    context: PropertyContext
): Promise<HandlerResult> {
    const results: Record<string, unknown> = {}
    const sources: string[] = []

    const promises = apiCalls.map(async (call) => {
        try {
            const result = await executeApiCall(call, context)
            results[call.api] = result.data
            sources.push(result.source)
            return { api: call.api, success: true, data: result.data }
        } catch (error) {
            console.error(`API call failed for ${call.api}:`, error)
            return { api: call.api, success: false, error }
        }
    })

    await Promise.allSettled(promises)

    const allMock = sources.every(s => s === 'mock')

    return {
        success: Object.keys(results).length > 0,
        data: results,
        source: allMock ? 'mock' : 'live',
    }
}

async function executeApiCall(
    call: ApiCall,
    context: PropertyContext
): Promise<{ data: unknown; source: 'live' | 'mock' }> {
    const { api } = call

    switch (api) {
        // Google APIs
        case 'google_places': {
            const result = await google.searchNearbyPlaces({
                latitude: context.lat,
                longitude: context.lng,
                radius: 1000,
                type: (call.params.type as string) || 'grocery_store',
            })
            return { data: result.data, source: result.source }
        }

        case 'google_routes': {
            const result = await google.computeRoute({
                originLat: context.lat,
                originLng: context.lng,
                destLat: (call.params.destLat as number) || 37.7749,
                destLng: (call.params.destLng as number) || -122.4194,
            })
            return { data: result.data, source: result.source }
        }

        case 'google_elevation': {
            const result = await google.getElevation(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        case 'google_airquality': {
            const result = await google.getCurrentAirQuality(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        case 'google_pollen': {
            const result = await google.getPollenForecast(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        case 'google_solar': {
            const result = await google.getBuildingInsights(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        // Property APIs
        case 'simplyrets': {
            if (context.mlsId) {
                const result = await property.getListing(parseInt(context.mlsId))
                return { data: result.data, source: result.source }
            }
            const result = await property.searchListings({ cities: [context.city], limit: 1 })
            return { data: result.data, source: result.source }
        }

        case 'estated': {
            // Check if we should use Perplexity replacement
            if (shouldUsePerplexity('estated')) {
                const result = await getPropertyDataViaPerplexity(context.address)
                return { data: result.data, source: result.source as 'live' | 'mock' }
            }
            const result = await property.getPropertyData(context.address)
            return { data: result.data, source: result.source }
        }

        case 'rentcast': {
            const result = await property.getRentEstimate({ address: context.address })
            return { data: result.data, source: result.source }
        }

        case 'mashvisor': {
            const result = await property.getInvestmentAnalysis(context.address)
            return { data: result.data, source: result.source }
        }

        case 'regrid': {
            const result = await property.getParcelByAddress(context.address)
            return { data: result.data, source: result.source }
        }

        // Neighborhood APIs
        case 'neighborhoodscout': {
            // Check if we should use Perplexity replacement
            if (shouldUsePerplexity('neighborhoodscout')) {
                const result = await getCrimeDataViaPerplexity(context.address, context.city)
                return { data: result.data, source: result.source as 'live' | 'mock' }
            }
            const result = await neighborhood.getNeighborhoodData(context.address)
            return { data: result.data, source: result.source }
        }

        case 'greatschools': {
            // Check if we should use Perplexity replacement
            if (shouldUsePerplexity('greatschools')) {
                const result = await getSchoolsViaPerplexity(context.lat, context.lng, context.city)
                return { data: result.data, source: result.source as 'live' | 'mock' }
            }
            const result = await neighborhood.getNearbySchools(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        case 'census': {
            const result = await neighborhood.getDemographicsByZip(context.zipCode)
            return { data: result.data, source: result.source }
        }

        case 'spotcrime': {
            // Check if we should use Perplexity replacement
            if (shouldUsePerplexity('spotcrime')) {
                const result = await getCrimeIncidentsViaPerplexity(context.lat, context.lng, context.city)
                return { data: result.data, source: result.source as 'live' | 'mock' }
            }
            const result = await neighborhood.getCrimeIncidents(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        // Environmental APIs
        case 'fema': {
            const result = await environmental.getFloodZone(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        case 'howloud': {
            // Check if we should use Perplexity replacement
            if (shouldUsePerplexity('howloud')) {
                const result = await getNoiseDataViaPerplexity(context.address, context.city)
                return { data: result.data, source: result.source as 'live' | 'mock' }
            }
            const result = await environmental.getNoiseScore(context.address)
            return { data: result.data, source: result.source }
        }

        case 'usgs': {
            const result = await environmental.getRecentEarthquakes(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        case 'wildfire': {
            const result = await environmental.getWildfireRisk(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        case 'openweather': {
            const result = await environmental.getCurrentWeather(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        // Financial APIs
        case 'fred': {
            const result = await financial.getMortgageRates()
            return { data: result.data, source: result.source }
        }

        // Utilities APIs
        case 'broadband': {
            const result = await utilities.getInternetProviders(context.lat, context.lng)
            return { data: result.data, source: result.source }
        }

        // Neighborhood Sentiment
        case 'neighborhood_sentiment':
        case 'neighborhoodSentiment': {
            const sentimentResult = await getNeighborhoodSentimentViaPerplexity(
                context.address,
                context.city,
                context.state
            )
            return { data: sentimentResult.data, source: sentimentResult.source as 'live' | 'mock' }
        }

        default:
            return { data: null, source: 'mock' }
    }
}
