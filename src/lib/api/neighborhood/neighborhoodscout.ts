import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockNeighborhoodScout } from '@/lib/mock/neighborhood.mock'

const client = createApiClient({
    name: 'NeighborhoodScout',
    baseURL: 'https://api.neighborhoodscout.com/v1',
    headers: { 'Authorization': `Bearer ${env.neighborhoodscout.apiKey}` },
})

export interface CrimeData {
    overall_grade: string
    violent_crime_index: number
    property_crime_index: number
    crime_rate_per_100k: number
    comparison_to_national: string
}

export interface NeighborhoodData {
    name: string
    city: string
    state: string
    crime: CrimeData
    appreciation_forecast: number
    median_income: number
    diversity_index: number
    school_rating: number
}

export async function getNeighborhoodData(address: string) {
    if (shouldUseMock('neighborhoodscout')) {
        return { data: mockNeighborhoodScout.neighborhood, error: null, source: 'mock' as const }
    }
    return client.request<NeighborhoodData>(
        `/neighborhood?address=${encodeURIComponent(address)}`,
        { method: 'GET' },
        mockNeighborhoodScout.neighborhood
    )
}

export async function getCrimeData(address: string) {
    if (shouldUseMock('neighborhoodscout')) {
        return { data: mockNeighborhoodScout.crime, error: null, source: 'mock' as const }
    }
    return client.request<CrimeData>(
        `/crime?address=${encodeURIComponent(address)}`,
        { method: 'GET' },
        mockNeighborhoodScout.crime
    )
}
