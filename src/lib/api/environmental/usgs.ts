import { createApiClient } from '@/lib/utils/api-client'
import { mockUsgs } from '@/lib/mock/environmental.mock'

const client = createApiClient({
    name: 'USGS',
    baseURL: 'https://earthquake.usgs.gov/fdsnws/event/1',
})

export interface Earthquake {
    properties: {
        mag: number
        place: string
        time: number
    }
    geometry: {
        coordinates: [number, number, number] // lng, lat, depth
    }
}

export interface EarthquakesResponse {
    features: Earthquake[]
}

export async function getRecentEarthquakes(lat: number, lng: number, radiusKm: number = 100, days: number = 365) {
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - days)
    return client.request<EarthquakesResponse>(
        `/query?format=geojson&latitude=${lat}&longitude=${lng}&maxradiuskm=${radiusKm}&starttime=${startTime.toISOString()}&minmagnitude=2.5`,
        { method: 'GET' },
        mockUsgs.earthquakes
    )
}
