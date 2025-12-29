import { mockFreddieMac } from '@/lib/mock/financial.mock'

export interface MortgageRate {
    date: string
    rate_30yr: number
    points_30yr: number
    rate_15yr: number
    points_15yr: number
    rate_5yr_arm: number
}

export async function getCurrentRates() {
    // Freddie Mac has no public API - use FRED or mock
    return { data: mockFreddieMac.rates, error: null, source: 'mock' as const }
}
