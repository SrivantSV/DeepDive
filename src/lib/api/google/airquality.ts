import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockGoogleAirQuality } from '@/lib/mock/google.mock'

const client = createApiClient({
    name: 'Google Air Quality',
    baseURL: 'https://airquality.googleapis.com/v1',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.google.apiKey,
    },
})

export interface AirQualityIndex {
    code: string
    displayName: string
    aqi: number
    aqiDisplay: string
    color: { red: number; green: number; blue: number }
    category: string
    dominantPollutant: string
}

export interface Pollutant {
    code: string
    displayName: string
    concentration: {
        value: number
        units: string
    }
}

export interface HealthRecommendations {
    generalPopulation: string
    elderly: string
    lungDiseasePopulation: string
    heartDiseasePopulation: string
    athletes: string
    pregnantWomen: string
    children: string
}

export interface AirQualityResponse {
    dateTime: string
    indexes: AirQualityIndex[]
    pollutants: Pollutant[]
    healthRecommendations: HealthRecommendations
}

export async function getCurrentAirQuality(lat: number, lng: number) {
    if (shouldUseMock('google')) {
        return { data: mockGoogleAirQuality.current, error: null, source: 'mock' as const }
    }

    return client.request<AirQualityResponse>(
        '/currentConditions:lookup',
        {
            method: 'POST',
            data: {
                location: { latitude: lat, longitude: lng },
                extraComputations: ['HEALTH_RECOMMENDATIONS', 'DOMINANT_POLLUTANT_CONCENTRATION'],
                languageCode: 'en',
            },
        },
        mockGoogleAirQuality.current
    )
}
