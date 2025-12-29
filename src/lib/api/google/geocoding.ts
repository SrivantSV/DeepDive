import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockGoogleGeocoding } from '@/lib/mock/google.mock'

const client = createApiClient({
    name: 'Google Geocoding',
    baseURL: 'https://maps.googleapis.com/maps/api/geocode',
})

export interface AddressComponent {
    long_name: string
    short_name: string
    types: string[]
}

export interface GeocodingResult {
    formatted_address: string
    geometry: {
        location: { lat: number; lng: number }
        location_type: string
    }
    address_components: AddressComponent[]
    place_id: string
}

export interface GeocodingResponse {
    results: GeocodingResult[]
    status: string
}

export async function geocodeAddress(address: string) {
    if (shouldUseMock('google')) {
        return { data: mockGoogleGeocoding.geocode, error: null, source: 'mock' as const }
    }

    return client.request<GeocodingResponse>(
        `/json?address=${encodeURIComponent(address)}&key=${env.google.apiKey}`,
        { method: 'GET' },
        mockGoogleGeocoding.geocode
    )
}

export async function reverseGeocode(lat: number, lng: number) {
    if (shouldUseMock('google')) {
        return { data: mockGoogleGeocoding.reverse, error: null, source: 'mock' as const }
    }

    return client.request<GeocodingResponse>(
        `/json?latlng=${lat},${lng}&key=${env.google.apiKey}`,
        { method: 'GET' },
        mockGoogleGeocoding.reverse
    )
}

// Extract useful components from geocoding result
export function parseAddressComponents(result: GeocodingResult) {
    const components = result.address_components

    const find = (type: string) =>
        components.find(c => c.types.includes(type))?.long_name || null

    return {
        streetNumber: find('street_number'),
        street: find('route'),
        city: find('locality') || find('sublocality'),
        county: find('administrative_area_level_2'),
        state: find('administrative_area_level_1'),
        stateShort: components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || null,
        zip: find('postal_code'),
        country: find('country'),
        neighborhood: find('neighborhood'),
    }
}
