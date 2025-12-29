import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockBls } from '@/lib/mock/financial.mock'

const client = createApiClient({
    name: 'BLS',
    baseURL: 'https://api.bls.gov/publicAPI/v2',
})

export interface BlsSeriesData {
    year: string
    period: string
    value: string
}

export interface BlsResponse {
    Results: {
        series: Array<{
            seriesID: string
            data: BlsSeriesData[]
        }>
    }
}

export async function getLocalUnemployment(stateCode: string, areaCode: string) {
    if (shouldUseMock('bls')) {
        return { data: mockBls.unemployment, error: null, source: 'mock' as const }
    }
    const seriesId = `LASST${stateCode}0000000000003`
    return client.request<BlsResponse>(
        '/timeseries/data/',
        {
            method: 'POST',
            data: {
                seriesid: [seriesId],
                registrationkey: env.bls.apiKey,
                startyear: '2023',
                endyear: '2024',
            },
        },
        mockBls.unemployment
    )
}
