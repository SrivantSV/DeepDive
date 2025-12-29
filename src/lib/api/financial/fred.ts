import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockFred } from '@/lib/mock/financial.mock'

const client = createApiClient({
    name: 'FRED',
    baseURL: 'https://api.stlouisfed.org/fred',
})

export interface FredObservation {
    date: string
    value: string
}

export interface FredSeries {
    series_id: string
    title: string
    observations: FredObservation[]
}

export async function getMortgageRates() {
    if (shouldUseMock('fred')) {
        return { data: mockFred.mortgageRates, error: null, source: 'mock' as const }
    }
    return client.request<FredSeries>(
        `/series/observations?series_id=MORTGAGE30US&api_key=${env.fred.apiKey}&file_type=json&sort_order=desc&limit=10`,
        { method: 'GET' },
        mockFred.mortgageRates
    )
}

export async function getHomePriceIndex() {
    if (shouldUseMock('fred')) {
        return { data: mockFred.homePriceIndex, error: null, source: 'mock' as const }
    }
    return client.request<FredSeries>(
        `/series/observations?series_id=CSUSHPINSA&api_key=${env.fred.apiKey}&file_type=json&sort_order=desc&limit=12`,
        { method: 'GET' },
        mockFred.homePriceIndex
    )
}
