import { NextRequest, NextResponse } from 'next/server'
import { getListing } from '@/lib/api/property/simplyrets'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const mlsId = parseInt(id)

    if (isNaN(mlsId)) {
        return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 })
    }

    try {
        const result = await getListing(mlsId)

        if (!result.data) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
        }

        return NextResponse.json(result.data)
    } catch (error) {
        console.error('Failed to fetch listing:', error)
        return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
    }
}
