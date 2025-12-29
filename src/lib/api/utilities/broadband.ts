import { createApiClient } from '@/lib/utils/api-client'
import { mockBroadband } from '@/lib/mock/utilities.mock'

const client = createApiClient({
    name: 'BroadbandMap',
    baseURL: 'https://broadbandmap.fcc.gov/api',
})

export interface InternetProvider {
    provider_name: string
    technology: 'Fiber' | 'Cable' | 'DSL' | 'Fixed Wireless' | 'Satellite'
    max_download_mbps: number
    max_upload_mbps: number
}

export interface ProvidersResponse {
    providers: InternetProvider[]
}

export async function getInternetProviders(lat: number, lng: number) {
    return client.request<ProvidersResponse>(
        `/location?latitude=${lat}&longitude=${lng}`,
        { method: 'GET' },
        mockBroadband.providers
    )
}
