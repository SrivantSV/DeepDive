import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockGoogleSolar } from '@/lib/mock/google.mock'

const client = createApiClient({
    name: 'Google Solar',
    baseURL: 'https://solar.googleapis.com/v1',
    headers: {
        'X-Goog-Api-Key': env.google.apiKey,
    },
})

export interface FinancialDetails {
    initialAcKwhPerYear: number
    remainingLifetimeUtilityBill: { currencyCode: string; units: string }
    federalIncentive: { currencyCode: string; units: string }
    costOfElectricityWithoutSolar: { currencyCode: string; units: string }
    netMeteringAllowed: boolean
    solarPercentage: number
    percentageExportedToGrid: number
}

export interface FinancialAnalysis {
    monthlyBill: { currencyCode: string; units: string }
    panelConfigIndex: number
    financialDetails: FinancialDetails
}

export interface SolarPotential {
    maxArrayPanelsCount: number
    maxArrayAreaMeters2: number
    maxSunshineHoursPerYear: number
    carbonOffsetFactorKgPerMwh: number
    panelCapacityWatts: number
    panelHeightMeters: number
    panelWidthMeters: number
    panelLifetimeYears: number
    financialAnalyses: FinancialAnalysis[]
}

export interface BuildingInsights {
    name: string
    center: { latitude: number; longitude: number }
    imageryDate: { year: number; month: number; day: number }
    postalCode: string
    administrativeArea: string
    statisticalArea: string
    regionCode: string
    solarPotential: SolarPotential
}

export async function getBuildingInsights(lat: number, lng: number) {
    if (shouldUseMock('google')) {
        return { data: mockGoogleSolar.buildingInsights, error: null, source: 'mock' as const }
    }

    return client.request<BuildingInsights>(
        `/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH`,
        { method: 'GET' },
        mockGoogleSolar.buildingInsights
    )
}
