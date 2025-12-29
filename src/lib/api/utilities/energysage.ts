import { mockEnergySage } from '@/lib/mock/utilities.mock'

export interface SolarIncentives {
    federal: number
    state: number
    local: number
}

export interface SolarEstimate {
    system_size_kw: number
    annual_production_kwh: number
    annual_savings: number
    payback_years: number
    incentives: SolarIncentives
}

export async function getSolarEstimate(address: string, monthlyBill: number) {
    // EnergySage requires partner access - return mock
    // address and monthlyBill would be used in real implementation
    console.log(`[EnergySage] Estimating for ${address} with $${monthlyBill}/month bill`)
    return { data: mockEnergySage.estimate, error: null, source: 'mock' as const }
}
