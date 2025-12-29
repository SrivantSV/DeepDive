import { NextRequest, NextResponse } from 'next/server'
import { gatherPropertyDetails } from '@/lib/api/ai/perplexity-valuation'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('q')

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    try {
        const result = await gatherPropertyDetails(address)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Deep dive analysis failed:', error)
        return NextResponse.json(
            { error: 'Failed to analyze property' },
            { status: 500 }
        )
    }
}
