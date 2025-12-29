import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockGoogleRoutes } from '@/lib/mock/google.mock'

const client = createApiClient({
    name: 'Google Routes',
    baseURL: 'https://routes.googleapis.com',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.google.apiKey,
    },
})

export interface RouteResponse {
    routes: Array<{
        duration: string // e.g., "1234s"
        distanceMeters: number
        staticDuration: string // without traffic
        polyline: { encodedPolyline: string }
        travelAdvisory?: {
            tollInfo?: { estimatedPrice: Array<{ currencyCode: string; units: string }> }
        }
    }>
}

export interface ComputeRouteParams {
    originLat: number
    originLng: number
    destLat: number
    destLng: number
    departureTime?: Date
    travelMode?: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT'
}

export async function computeRoute(params: ComputeRouteParams) {
    if (shouldUseMock('google')) {
        return { data: mockGoogleRoutes.computeRoute, error: null, source: 'mock' as const }
    }

    const body = {
        origin: {
            location: {
                latLng: { latitude: params.originLat, longitude: params.originLng },
            },
        },
        destination: {
            location: {
                latLng: { latitude: params.destLat, longitude: params.destLng },
            },
        },
        travelMode: params.travelMode || 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        departureTime: params.departureTime?.toISOString(),
        computeAlternativeRoutes: false,
    }

    return client.request<RouteResponse>(
        '/directions/v2:computeRoutes',
        {
            method: 'POST',
            data: body,
            headers: {
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.staticDuration,routes.polyline,routes.travelAdvisory',
            },
        },
        mockGoogleRoutes.computeRoute
    )
}

// Helper to compare rush hour vs off-peak
export async function getCommuteComparison(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
) {
    // Monday 8am
    const rushHour = new Date()
    rushHour.setDate(rushHour.getDate() + ((1 + 7 - rushHour.getDay()) % 7)) // Next Monday
    rushHour.setHours(8, 0, 0, 0)

    // Sunday 8am
    const offPeak = new Date()
    offPeak.setDate(offPeak.getDate() + ((0 + 7 - offPeak.getDay()) % 7)) // Next Sunday
    offPeak.setHours(8, 0, 0, 0)

    const [rushHourResult, offPeakResult] = await Promise.all([
        computeRoute({ originLat, originLng, destLat, destLng, departureTime: rushHour }),
        computeRoute({ originLat, originLng, destLat, destLng, departureTime: offPeak }),
    ])

    return {
        rushHour: rushHourResult,
        offPeak: offPeakResult,
        volatility: calculateVolatility(rushHourResult.data, offPeakResult.data),
    }
}

function calculateVolatility(rushHour: RouteResponse | null, offPeak: RouteResponse | null): number {
    if (!rushHour?.routes?.[0] || !offPeak?.routes?.[0]) return 0

    const rushSeconds = parseInt(rushHour.routes[0].duration.replace('s', ''))
    const offPeakSeconds = parseInt(offPeak.routes[0].duration.replace('s', ''))

    return Math.round(((rushSeconds - offPeakSeconds) / offPeakSeconds) * 100)
}
