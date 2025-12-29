import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockCensus } from '@/lib/mock/neighborhood.mock'

const client = createApiClient({
    name: 'Census',
    baseURL: 'https://api.census.gov/data',
})

export interface DemographicData {
    total_population: number
    median_age: number
    median_household_income: number
    poverty_rate: number
    unemployment_rate: number
    education_bachelors_or_higher: number
    owner_occupied_percent: number
    median_home_value: number
    median_rent: number
    average_household_size: number
    commute_time_average: number
}

export async function getDemographics(state: string, county: string, tract?: string) {
    if (shouldUseMock('census')) {
        return { data: mockCensus.demographics, error: null, source: 'mock' as const }
    }
    const variables = 'B01003_001E,B01002_001E,B19013_001E,B17001_002E,B23025_005E'
    const geo = tract
        ? `for=tract:${tract}&in=state:${state}&in=county:${county}`
        : `for=county:${county}&in=state:${state}`
    return client.request<DemographicData>(
        `/2022/acs/acs5?get=${variables}&${geo}&key=${env.census.apiKey}`,
        { method: 'GET' },
        mockCensus.demographics
    )
}

export async function getDemographicsByZip(zipCode: string) {
    if (shouldUseMock('census')) {
        return { data: mockCensus.demographics, error: null, source: 'mock' as const }
    }
    return client.request<DemographicData>(
        `/2022/acs/acs5?get=B01003_001E,B19013_001E,B25077_001E&for=zip%20code%20tabulation%20area:${zipCode}&key=${env.census.apiKey}`,
        { method: 'GET' },
        mockCensus.demographics
    )
}
