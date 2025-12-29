import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockFbiUcr } from '@/lib/mock/neighborhood.mock'

const client = createApiClient({
    name: 'FBI UCR',
    baseURL: 'https://api.usa.gov/crime/fbi/cde',
})

export interface CrimeStatistics {
    year: number
    population: number
    violent_crime_rate: number
    property_crime_rate: number
    murder_rate: number
    robbery_rate: number
    aggravated_assault_rate: number
    burglary_rate: number
    larceny_rate: number
    motor_vehicle_theft_rate: number
}

export interface CrimeStatsResponse {
    results: CrimeStatistics[]
}

export async function getCrimeStatsByState(stateAbbr: string) {
    if (shouldUseMock('fbiUcr')) {
        return { data: mockFbiUcr.stateStats, error: null, source: 'mock' as const }
    }
    return client.request<CrimeStatsResponse>(
        `/summarized/state/${stateAbbr}/all/2019/2023?api_key=${env.fbiUcr.apiKey}`,
        { method: 'GET' },
        mockFbiUcr.stateStats
    )
}
