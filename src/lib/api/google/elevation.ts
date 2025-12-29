import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockGoogleElevation } from '@/lib/mock/google.mock'

const client = createApiClient({
    name: 'Google Elevation',
    baseURL: 'https://maps.googleapis.com/maps/api/elevation',
})

export interface ElevationResult {
    elevation: number // meters
    location: { lat: number; lng: number }
    resolution: number
}

export interface ElevationResponse {
    results: ElevationResult[]
    status: string
}

export async function getElevation(lat: number, lng: number) {
    if (shouldUseMock('google')) {
        return { data: mockGoogleElevation.point, error: null, source: 'mock' as const }
    }

    return client.request<ElevationResponse>(
        `/json?locations=${lat},${lng}&key=${env.google.apiKey}`,
        { method: 'GET' },
        mockGoogleElevation.point
    )
}

export async function getElevationAlongPath(points: Array<{ lat: number; lng: number }>) {
    if (shouldUseMock('google')) {
        return { data: mockGoogleElevation.path, error: null, source: 'mock' as const }
    }

    const path = points.map(p => `${p.lat},${p.lng}`).join('|')

    return client.request<ElevationResponse>(
        `/json?path=${path}&samples=${points.length}&key=${env.google.apiKey}`,
        { method: 'GET' },
        mockGoogleElevation.path
    )
}

// Calculate driveway grade
export async function getDrivewayGrade(
    streetLat: number,
    streetLng: number,
    garageLat: number,
    garageLng: number
) {
    const [streetElev, garageElev] = await Promise.all([
        getElevation(streetLat, streetLng),
        getElevation(garageLat, garageLng),
    ])

    if (!streetElev.data?.results?.[0] || !garageElev.data?.results?.[0]) {
        return { grade: null, risk: 'unknown' }
    }

    const rise = garageElev.data.results[0].elevation - streetElev.data.results[0].elevation
    const run = calculateDistance(streetLat, streetLng, garageLat, garageLng)
    const gradePercent = (rise / run) * 100

    return {
        grade: Math.round(gradePercent * 10) / 10,
        rise: Math.round(rise * 10) / 10,
        run: Math.round(run * 10) / 10,
        risk: gradePercent > 15 ? 'steep' : gradePercent > 10 ? 'moderate' : 'normal',
        sportsCarWarning: gradePercent > 12,
    }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}
