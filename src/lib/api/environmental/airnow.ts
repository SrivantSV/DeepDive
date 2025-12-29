import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockAirNow } from '@/lib/mock/environmental.mock'

const client = createApiClient({
    name: 'AirNow',
    baseURL: 'https://www.airnowapi.org',
})

export interface AirQualityObservation {
    DateObserved: string
    HourObserved: number
    LocalTimeZone: string
    ReportingArea: string
    StateCode: string
    Latitude: number
    Longitude: number
    ParameterName: string
    AQI: number
    Category: { Number: number; Name: string }
}

export async function getCurrentAQI(lat: number, lng: number) {
    if (shouldUseMock('airnow')) {
        return { data: mockAirNow.current, error: null, source: 'mock' as const }
    }
    return client.request<AirQualityObservation[]>(
        `/aq/observation/latLong/current?format=application/json&latitude=${lat}&longitude=${lng}&distance=25&API_KEY=${env.airnow.apiKey}`,
        { method: 'GET' },
        mockAirNow.current
    )
}

export async function getAQIForecast(lat: number, lng: number) {
    if (shouldUseMock('airnow')) {
        return { data: mockAirNow.forecast, error: null, source: 'mock' as const }
    }
    return client.request<AirQualityObservation[]>(
        `/aq/forecast/latLong?format=application/json&latitude=${lat}&longitude=${lng}&distance=25&API_KEY=${env.airnow.apiKey}`,
        { method: 'GET' },
        mockAirNow.forecast
    )
}
