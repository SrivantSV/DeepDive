import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockGooglePollen } from '@/lib/mock/google.mock'

const client = createApiClient({
    name: 'Google Pollen',
    baseURL: 'https://pollen.googleapis.com/v1',
    headers: {
        'X-Goog-Api-Key': env.google.apiKey,
    },
})

export interface PollenTypeInfo {
    code: string
    displayName: string
    indexInfo: {
        code: string
        displayName: string
        value: number
        category: string
        indexDescription: string
        color: { red: number; green: number; blue: number }
    }
    healthRecommendations: string[]
}

export interface PollenForecast {
    date: { year: number; month: number; day: number }
    pollenTypeInfo: PollenTypeInfo[]
}

export interface PollenResponse {
    regionCode: string
    dailyInfo: PollenForecast[]
}

export async function getPollenForecast(lat: number, lng: number, days: number = 5) {
    if (shouldUseMock('google')) {
        return { data: mockGooglePollen.forecast, error: null, source: 'mock' as const }
    }

    return client.request<PollenResponse>(
        `/forecast:lookup?location.latitude=${lat}&location.longitude=${lng}&days=${days}`,
        { method: 'GET' },
        mockGooglePollen.forecast
    )
}
