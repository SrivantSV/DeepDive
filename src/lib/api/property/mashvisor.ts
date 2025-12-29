import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockMashvisor } from '@/lib/mock/property.mock'

const client = createApiClient({
    name: 'Mashvisor',
    baseURL: 'https://api.mashvisor.com/v1.1',
})

export interface InvestmentAnalysis {
    property: {
        address: string
        city: string
        state: string
        zip: string
    }
    rental_data: {
        traditional_rent: number
        airbnb_rent: number
        airbnb_occupancy: number
    }
    investment_data: {
        cash_on_cash: number
        cap_rate: number
        roi: number
        payback_years: number
    }
    neighborhood: {
        investment_score: number
        rental_demand: string
        optimal_strategy: 'Traditional' | 'Airbnb'
    }
}

export interface NeighborhoodAnalysis {
    name: string
    city: string
    investment_score: number
    median_price: number
    price_appreciation: number
    rental_yield: number
}

export async function getInvestmentAnalysis(address: string) {
    if (shouldUseMock('mashvisor')) {
        return { data: mockMashvisor.analysis, error: null, source: 'mock' as const }
    }

    return client.request<InvestmentAnalysis>(
        `/property?address=${encodeURIComponent(address)}&api_key=${env.mashvisor.apiKey}`,
        { method: 'GET' },
        mockMashvisor.analysis
    )
}

export async function getNeighborhoodAnalysis(city: string, state: string, neighborhood: string) {
    if (shouldUseMock('mashvisor')) {
        return { data: mockMashvisor.neighborhood, error: null, source: 'mock' as const }
    }

    return client.request<NeighborhoodAnalysis>(
        `/neighborhood/${state}/${city}/${encodeURIComponent(neighborhood)}?api_key=${env.mashvisor.apiKey}`,
        { method: 'GET' },
        mockMashvisor.neighborhood
    )
}
