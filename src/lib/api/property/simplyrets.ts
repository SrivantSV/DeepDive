import { createApiClient } from '@/lib/utils/api-client'
import { env } from '@/lib/utils/env'
import { mockSimplyRETS } from '@/lib/mock/property.mock'

// SimplyRETS demo credentials (publicly documented)
const DEMO_KEY = 'simplyrets'
const DEMO_SECRET = 'simplyrets'

// Use actual keys if provided, otherwise demo
const apiKey = env.simplyrets.apiKey || DEMO_KEY
const apiSecret = env.simplyrets.apiSecret || DEMO_SECRET

const client = createApiClient({
    name: 'SimplyRETS',
    baseURL: 'https://api.simplyrets.com',
    headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
    },
})

// Use more flexible types to match both API and mock data
export interface Listing {
    mlsId: number
    listPrice: number
    listDate: string
    property: Record<string, unknown>
    address: Record<string, unknown>
    photos: string[]
    remarks: string
    geo: { lat: number; lng: number }
    agent?: Record<string, unknown>
    listingAgent?: Record<string, unknown>
    office?: Record<string, unknown>
    mls?: Record<string, unknown>
    virtualTourUrl?: string
}

export interface SearchParams {
    q?: string
    cities?: string[]
    postalCodes?: string[]
    minPrice?: number
    maxPrice?: number
    minBeds?: number
    maxBeds?: number
    minBaths?: number
    type?: 'residential' | 'rental' | 'multifamily' | 'land' | 'commercial'
    status?: 'active' | 'pending' | 'closed'
    limit?: number
    offset?: number
}

export async function searchListings(params: SearchParams) {
    // Always try live API (demo or real credentials)
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
    queryParams.append('limit', (params.limit || 10).toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())

    return client.request<Listing[]>(
        `/properties?${queryParams.toString()}`,
        { method: 'GET' },
        mockSimplyRETS.listings
    )
}

export async function getListing(mlsId: number) {
    return client.request<Listing>(
        `/properties/${mlsId}`,
        { method: 'GET' },
        mockSimplyRETS.listing
    )
}

