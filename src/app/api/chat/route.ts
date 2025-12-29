import { NextRequest, NextResponse } from 'next/server'
import { routeQuestion, RouterInput } from '@/lib/router'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const input: RouterInput = {
            question: body.question,
            propertyContext: body.propertyContext || {
                address: '1148 Greenbrook Drive, Danville, CA 94526',
                lat: 37.8044,
                lng: -121.9523,
                zipCode: '94526',
                city: 'Danville',
                state: 'CA',
                photos: [],
            },
            conversationHistory: body.conversationHistory || [],
        }

        console.log(`[Chat API] Processing question: "${input.question}"`)

        const response = await routeQuestion(input)

        console.log(`[Chat API] Response confidence: ${response.confidence}`)

        return NextResponse.json(response)
    } catch (error) {
        console.error('[Chat API] Error:', error)
        return NextResponse.json(
            {
                error: 'Failed to process question',
                answer: "I'm sorry, I encountered an error processing your question. Please try again.",
                sources: [],
                confidence: 'low' as const,
            },
            { status: 500 }
        )
    }
}

// Also support GET for simple testing
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const question = searchParams.get('q')

    if (!question) {
        return NextResponse.json({
            error: 'Missing question parameter',
            usage: 'GET /api/chat?q=How far is Whole Foods?',
            examples: [
                '/api/chat?q=Is this a good investment?',
                '/api/chat?q=Any red flags?',
                '/api/chat?q=How are the schools?',
                '/api/chat?q=What would my monthly cost be?',
            ],
        }, { status: 400 })
    }

    const input: RouterInput = {
        question,
        propertyContext: {
            address: '1148 Greenbrook Drive, Danville, CA 94526',
            lat: 37.8044,
            lng: -121.9523,
            zipCode: '94526',
            city: 'Danville',
            state: 'CA',
            photos: [],
        },
    }

    const response = await routeQuestion(input)

    return NextResponse.json(response)
}
