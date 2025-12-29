import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockHowLoud } from '@/lib/mock/environmental.mock'

const client = createApiClient({
    name: 'HowLoud',
    baseURL: 'https://api.howloud.com/v1',
})

export interface NoiseScore {
    soundscore: number
    traffic_score: number
    airport_score: number
    local_score: number
    category: 'Quiet' | 'Moderate' | 'Noisy' | 'Very Noisy'
}

export async function getNoiseScore(address: string) {
    if (shouldUseMock('howloud')) {
        return { data: mockHowLoud.score, error: null, source: 'mock' as const }
    }
    return client.request<NoiseScore>(
        `/score?address=${encodeURIComponent(address)}&key=${env.howloud.apiKey}`,
        { method: 'GET' },
        mockHowLoud.score
    )
}
