import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockGooglePlaces } from '@/lib/mock/google.mock'

const client = createApiClient({
    name: 'Google Places',
    baseURL: 'https://places.googleapis.com/v1',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.google.apiKey,
    },
})

export interface Place {
    id: string
    displayName: { text: string }
    formattedAddress: string
    location: { latitude: number; longitude: number }
    rating?: number
    userRatingCount?: number
    priceLevel?: string
    types: string[]
    regularOpeningHours?: {
        openNow: boolean
        weekdayDescriptions: string[]
    }
    websiteUri?: string
    nationalPhoneNumber?: string
}

export interface NearbySearchParams {
    latitude: number
    longitude: number
    radius: number // meters
    type?: string // e.g., "restaurant", "school", "grocery_store"
    keyword?: string
    maxResults?: number
}

export interface NearbySearchResponse {
    places: Place[]
}

export async function searchNearbyPlaces(params: NearbySearchParams) {
    if (shouldUseMock('google')) {
        return { data: mockGooglePlaces.nearbySearch, error: null, source: 'mock' as const }
    }

    const body = {
        includedTypes: params.type ? [params.type] : undefined,
        maxResultCount: params.maxResults || 10,
        locationRestriction: {
            circle: {
                center: {
                    latitude: params.latitude,
                    longitude: params.longitude,
                },
                radius: params.radius,
            },
        },
    }

    return client.request<NearbySearchResponse>(
        '/places:searchNearby',
        {
            method: 'POST',
            data: body,
            headers: {
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.regularOpeningHours,places.websiteUri,places.nationalPhoneNumber',
            },
        },
        mockGooglePlaces.nearbySearch
    )
}

export async function getPlaceDetails(placeId: string) {
    if (shouldUseMock('google')) {
        return { data: mockGooglePlaces.placeDetails, error: null, source: 'mock' as const }
    }

    return client.request<Place>(
        `/places/${placeId}`,
        {
            method: 'GET',
            headers: {
                'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,types,regularOpeningHours,websiteUri,nationalPhoneNumber',
            },
        },
        mockGooglePlaces.placeDetails
    )
}

export async function textSearch(query: string, location?: { lat: number; lng: number }) {
    if (shouldUseMock('google')) {
        return { data: mockGooglePlaces.textSearch, error: null, source: 'mock' as const }
    }

    const body: Record<string, unknown> = {
        textQuery: query,
        maxResultCount: 10,
    }

    if (location) {
        body.locationBias = {
            circle: {
                center: { latitude: location.lat, longitude: location.lng },
                radius: 5000,
            },
        }
    }

    return client.request<NearbySearchResponse>(
        '/places:searchText',
        {
            method: 'POST',
            data: body,
            headers: {
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types',
            },
        },
        mockGooglePlaces.textSearch
    )
}
