import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockEstated } from '@/lib/mock/property.mock'

const client = createApiClient({
    name: 'Estated',
    baseURL: 'https://api.estated.com',
    headers: {
        'Authorization': `Bearer ${env.estated.apiToken}`,
    },
})

export interface PropertyAddress {
    street_address: string
    city: string
    state: string
    zip_code: string
    formatted_street_address: string
}

export interface PropertyParcel {
    apn_original: string
    apn_unformatted: string
    county: string
    fips_code: string
}

export interface PropertyStructure {
    year_built: number
    effective_year_built: number
    bedrooms: number
    bathrooms: number
    total_area_sq_ft: number
    building_area_sq_ft: number
    stories: number
    units: number
    construction_type: string
    roof_type: string
    foundation_type: string
    heating_type: string
    cooling_type: string
    pool: boolean
    garage_spaces: number
}

export interface PropertyLot {
    lot_size_sq_ft: number
    lot_size_acres: number
    zoning: string
    land_use: string
}

export interface PropertyValuation {
    value: number
    value_low: number
    value_high: number
    date: string
}

export interface PropertyOwner {
    name: string
    mailing_address: {
        street_address: string
        city: string
        state: string
        zip_code: string
    }
    owner_occupied: boolean
}

export interface PropertyTaxes {
    year: number
    amount: number
    exemptions: string[]
}

export interface Deed {
    document_type: string
    recording_date: string
    sale_price: number
    buyer_names: string[]
    seller_names: string[]
}

export interface Mortgage {
    lender_name: string
    amount: number
    date: string
    loan_type: string
    interest_rate: number
    term_years: number
}

export interface PropertyData {
    property: {
        address: PropertyAddress
        parcel: PropertyParcel
        structure: PropertyStructure
        lot: PropertyLot
    }
    valuation: PropertyValuation
    owner: PropertyOwner
    taxes: PropertyTaxes
    deeds: Deed[]
    mortgages: Mortgage[]
}

export async function getPropertyData(address: string) {
    if (shouldUseMock('estated')) {
        return { data: mockEstated.property, error: null, source: 'mock' as const }
    }

    return client.request<PropertyData>(
        `/v4/property?address=${encodeURIComponent(address)}`,
        { method: 'GET' },
        mockEstated.property
    )
}

export async function getPropertyByAPN(apn: string, fips: string) {
    if (shouldUseMock('estated')) {
        return { data: mockEstated.property, error: null, source: 'mock' as const }
    }

    return client.request<PropertyData>(
        `/v4/property?apn=${encodeURIComponent(apn)}&fips=${fips}`,
        { method: 'GET' },
        mockEstated.property
    )
}
