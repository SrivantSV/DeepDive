import { createApiClient } from '@/lib/utils/api-client'
import { mockFcc } from '@/lib/mock/utilities.mock'

const client = createApiClient({
    name: 'FCC',
    baseURL: 'https://opendata.fcc.gov/api',
})

export interface BroadbandCoverage {
    census_block: string
    has_broadband: boolean
    providers_count: number
    max_speed_down: number
    max_speed_up: number
}

export async function getBroadbandCoverage(censusBlock: string) {
    return client.request<BroadbandCoverage>(
        `/broadband?census_block=${censusBlock}`,
        { method: 'GET' },
        mockFcc.coverage
    )
}
