import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockRentcast } from '@/lib/mock/property.mock'

const client = createApiClient({
    name: 'Rentcast',
    baseURL: 'https://api.rentcast.io/v1',
    headers: {
        'X-Api-Key': env.rentcast.apiKey,
    },
})

export interface Comparable {
    address: string
    rent: number
    bedrooms: number
    bathrooms: number
    squareFootage: number
    distance: number
    daysOld: number
}

export interface RentEstimate {
    rent: number
    rentRangeLow: number
    rentRangeHigh: number
    latitude: number
    longitude: number
    comparables: Comparable[]
}

export interface MarketStatistics {
    zipCode: string
    medianRent: number
    averageRent: number
    rentGrowth1Year: number
    vacancyRate: number
}

export interface RentEstimateParams {
    address: string
    bedrooms?: number
    bathrooms?: number
    squareFootage?: number
    propertyType?: 'Single Family' | 'Apartment' | 'Condo' | 'Townhouse'
}

export async function getRentEstimate(params: RentEstimateParams) {
    if (shouldUseMock('rentcast')) {
        return { data: mockRentcast.estimate, error: null, source: 'mock' as const }
    }

    const queryParams = new URLSearchParams()
    queryParams.append('address', params.address)
    if (params.bedrooms) queryParams.append('bedrooms', params.bedrooms.toString())
    if (params.bathrooms) queryParams.append('bathrooms', params.bathrooms.toString())
    if (params.squareFootage) queryParams.append('squareFootage', params.squareFootage.toString())
    if (params.propertyType) queryParams.append('propertyType', params.propertyType)

    return client.request<RentEstimate>(
        `/avm/rent/long-term?${queryParams.toString()}`,
        { method: 'GET' },
        mockRentcast.estimate
    )
}

export async function getMarketStatistics(zipCode: string) {
    if (shouldUseMock('rentcast')) {
        return { data: mockRentcast.market, error: null, source: 'mock' as const }
    }

    return client.request<MarketStatistics>(
        `/markets?zipCode=${zipCode}`,
        { method: 'GET' },
        mockRentcast.market
    )
}
