import { NextRequest, NextResponse } from 'next/server'
import { searchListings } from '@/lib/api/property/simplyrets'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams

    const params: {
        q?: string
        cities?: string[]
        postalCodes?: string[]
        minPrice?: number
        maxPrice?: number
        minBeds?: number
        minBaths?: number
        type?: 'residential' | 'rental'
        status?: 'active' | 'pending' | 'closed'
        limit?: number
    } = {
        type: (searchParams.get('type') as 'residential' | 'rental') || 'residential',
        status: 'active',
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 24,
    }

    const q = searchParams.get('q')

    // If query is a city name (no comma, not a ZIP)
    if (q && !q.includes(',') && !q.match(/^\d{5}$/)) {
        params.cities = [q]
    }

    // If query is a ZIP code
    if (q?.match(/^\d{5}$/)) {
        params.postalCodes = [q]
    }

    // If query includes state (e.g., "Danville, CA")
    if (q?.includes(',')) {
        const city = q.split(',')[0].trim()
        params.cities = [city]
    }

    if (searchParams.get('minprice')) params.minPrice = parseInt(searchParams.get('minprice')!)
    if (searchParams.get('maxprice')) params.maxPrice = parseInt(searchParams.get('maxprice')!)
    if (searchParams.get('minbeds')) params.minBeds = parseInt(searchParams.get('minbeds')!)
    if (searchParams.get('minbaths')) params.minBaths = parseInt(searchParams.get('minbaths')!)

    try {
        const result = await searchListings(params)

        return NextResponse.json({
            listings: result.data,
            source: result.source,
        })
    } catch (error) {
        console.error('Failed to fetch listings:', error)
        return NextResponse.json({
            listings: [],
            error: 'Failed to fetch listings',
        }, { status: 500 })
    }
}
