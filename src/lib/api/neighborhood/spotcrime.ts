import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockSpotCrime } from '@/lib/mock/neighborhood.mock'

const client = createApiClient({
    name: 'SpotCrime',
    baseURL: 'https://api.spotcrime.com/v1',
})

export interface CrimeIncident {
    id: string
    type: 'Theft' | 'Assault' | 'Burglary' | 'Robbery' | 'Vandalism' | 'Arrest' | 'Shooting' | 'Other'
    date: string
    time: string
    address: string
    lat: number
    lng: number
    description: string
}

export interface CrimeIncidentsResponse {
    crimes: CrimeIncident[]
}

export async function getCrimeIncidents(lat: number, lng: number, radius: number = 0.5) {
    if (shouldUseMock('spotcrime')) {
        return { data: mockSpotCrime.incidents, error: null, source: 'mock' as const }
    }
    return client.request<CrimeIncidentsResponse>(
        `/crimes?lat=${lat}&lon=${lng}&radius=${radius}&key=${env.spotcrime.apiKey}`,
        { method: 'GET' },
        mockSpotCrime.incidents
    )
}
