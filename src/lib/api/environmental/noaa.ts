import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockNoaa } from '@/lib/mock/environmental.mock'

const client = createApiClient({
    name: 'NOAA',
    baseURL: 'https://www.ncdc.noaa.gov/cdo-web/api/v2',
    headers: { 'token': env.noaa.apiToken },
})

export interface ClimateNormals {
    avg_temp_annual: number
    avg_temp_jan: number
    avg_temp_jul: number
    avg_precip_annual: number
    avg_snowfall_annual: number
    sunshine_days: number
}

export interface Station {
    id: string
    name: string
}

export async function getClimateNormals(stationId: string) {
    if (shouldUseMock('noaa')) {
        return { data: mockNoaa.climate, error: null, source: 'mock' as const }
    }
    return client.request<ClimateNormals>(
        `/data?datasetid=NORMAL_MLY&stationid=${stationId}&startdate=2020-01-01&enddate=2020-12-31&limit=1000`,
        { method: 'GET' },
        mockNoaa.climate
    )
}

export async function findNearestStation(lat: number, lng: number) {
    if (shouldUseMock('noaa')) {
        return { data: mockNoaa.station, error: null, source: 'mock' as const }
    }
    return client.request<Station>(
        `/stations?extent=${lat - 0.5},${lng - 0.5},${lat + 0.5},${lng + 0.5}&limit=1`,
        { method: 'GET' },
        mockNoaa.station
    )
}
