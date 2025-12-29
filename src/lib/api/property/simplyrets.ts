import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockSimplyRETS } from '@/lib/mock/property.mock'

const client = createApiClient({
    name: 'SimplyRETS',
    baseURL: 'https://api.simplyrets.com',
    headers: {
        'Authorization': `Basic ${Buffer.from(`${env.simplyrets.apiKey}:${env.simplyrets.apiSecret}`).toString('base64')}`,
    },
})

export interface Listing {
    mlsId: number
    listPrice: number
    listDate: string
    property: {
        type: string
        subType: string
        bedrooms: number
        bathsFull: number
        bathsHalf: number
        area: number // sqft
        lotSize: string
        yearBuilt: number
        stories: number
        garageSpaces: number
        parking: { spaces: number; description: string }
        pool: string
        view: string
        subdivision: string
    }
    address: {
        streetNumber: string
        streetName: string
        streetSuffix: string
        city: string
        state: string
        postalCode: string
        full: string
    }
    geo: {
        lat: number
        lng: number
    }
    photos: string[]
    remarks: string
    agent: {
        firstName: string
        lastName: string
        contact: { office: string; cell: string; email: string }
    }
    office: {
        name: string
        contact: { office: string }
    }
    mls: {
        status: string
        daysOnMarket: number
        originalEntryTimestamp: string
        lastModifiedTimestamp: string
    }
    virtualTourUrl?: string
}

export interface SearchParams {
    q?: string // address search
    cities?: string[]
    postalCodes?: string[]
    minPrice?: number
    maxPrice?: number
    minBeds?: number
    maxBeds?: number
    minBaths?: number
    type?: string // "residential", "rental", "multifamily", "land"
    status?: string // "Active", "Pending"
    limit?: number
    offset?: number
}

export async function searchListings(params: SearchParams) {
    if (shouldUseMock('simplyrets')) {
        return { data: mockSimplyRETS.listings, error: null, source: 'mock' as const }
    }

    const queryParams = new URLSearchParams()
    if (params.q) queryParams.append('q', params.q)
    if (params.cities) params.cities.forEach(c => queryParams.append('cities', c))
    if (params.postalCodes) params.postalCodes.forEach(p => queryParams.append('postalCodes', p))
    if (params.minPrice) queryParams.append('minprice', params.minPrice.toString())
    if (params.maxPrice) queryParams.append('maxprice', params.maxPrice.toString())
    if (params.minBeds) queryParams.append('minbeds', params.minBeds.toString())
    if (params.minBaths) queryParams.append('minbaths', params.minBaths.toString())
    if (params.type) queryParams.append('type', params.type)
    if (params.status) queryParams.append('status', params.status)
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())

    return client.request<Listing[]>(
        `/properties?${queryParams.toString()}`,
        { method: 'GET' },
        mockSimplyRETS.listings
    )
}

export async function getListing(mlsId: number) {
    if (shouldUseMock('simplyrets')) {
        return { data: mockSimplyRETS.listing, error: null, source: 'mock' as const }
    }

    return client.request<Listing>(
        `/properties/${mlsId}`,
        { method: 'GET' },
        mockSimplyRETS.listing
    )
}
