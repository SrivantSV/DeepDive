import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockRegrid } from '@/lib/mock/property.mock'

const client = createApiClient({
    name: 'Regrid',
    baseURL: 'https://app.regrid.com/api/v1',
    headers: {
        'Authorization': `Bearer ${env.regrid.apiToken}`,
    },
})

export interface ParcelProperties {
    apn: string
    address: string
    owner: string
    zoning: string
    zoning_description: string
    land_use: string
    land_use_description: string
    lot_size_sqft: number
    lot_size_acres: number
    lot_width_ft: number
    lot_depth_ft: number
    legal_description: string
    subdivision: string
    census_tract: string
    fips: string
    county: string
    state: string
}

export interface ParcelData {
    type: 'Feature'
    geometry: {
        type: 'Polygon' | 'MultiPolygon'
        coordinates: number[][][]
    }
    properties: ParcelProperties
}

export async function getParcelByAddress(address: string) {
    if (shouldUseMock('regrid')) {
        return { data: mockRegrid.parcel, error: null, source: 'mock' as const }
    }

    return client.request<ParcelData>(
        `/parcel?query=${encodeURIComponent(address)}`,
        { method: 'GET' },
        mockRegrid.parcel
    )
}

export async function getParcelByLatLng(lat: number, lng: number) {
    if (shouldUseMock('regrid')) {
        return { data: mockRegrid.parcel, error: null, source: 'mock' as const }
    }

    return client.request<ParcelData>(
        `/parcel?lat=${lat}&lon=${lng}`,
        { method: 'GET' },
        mockRegrid.parcel
    )
}
