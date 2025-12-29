import { createApiClient } from '@/lib/utils/api-client'
import { mockEpa } from '@/lib/mock/environmental.mock'

const client = createApiClient({
    name: 'EPA',
    baseURL: 'https://enviro.epa.gov/enviro/efservice',
})

export interface ToxicSite {
    name: string
    address: string
    city: string
    state: string
    zip: string
    type: 'Superfund' | 'TRI' | 'Brownfield' | 'Hazardous Waste'
    distance_miles: number
    status: string
}

export async function getSuperfundSites(zipCode: string) {
    return client.request<ToxicSite[]>(
        `/SEMS_ACTIVE_SITES/POSTAL_CODE/${zipCode}/JSON`,
        { method: 'GET' },
        mockEpa.superfund
    )
}

export async function getTRIFacilities(zipCode: string) {
    return client.request<ToxicSite[]>(
        `/TRI_FACILITY/ZIP_CODE/${zipCode}/JSON`,
        { method: 'GET' },
        mockEpa.tri
    )
}
