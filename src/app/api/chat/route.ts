import { NextRequest, NextResponse } from 'next/server'
import { routeQuestion, routeQuestionStreaming } from '@/lib/router'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const input = {
            question: body.question,
            propertyContext: body.propertyContext || {
                address: '1148 Greenbrook Drive, Danville, CA 94526',
                lat: 37.8044,
                lng: -121.9523,
                zipCode: '94526',
                city: 'Danville',
                state: 'CA',
            },
        }

        console.log(`[Chat API] Processing question (streaming): "${input.question}"`)

        const encoder = new TextEncoder()
        const stream = new TransformStream()
        const writer = stream.writable.getWriter()

        // Start processing in the background
        const process = async () => {
            try {
                const onChunk = async (chunk: string) => {
                    const data = JSON.stringify({ type: 'chunk', content: chunk })
                    await writer.write(encoder.encode(`data: ${data}\n\n`))
                }

                const onMetadata = async (metadata: any) => {
                    const data = JSON.stringify({ type: 'metadata', ...metadata })
                    await writer.write(encoder.encode(`data: ${data}\n\n`))
                }

                await routeQuestionStreaming(
                    input,
                    onChunk,
                    onMetadata
                )

                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
            } catch (error) {
                console.error('[Chat API] Streaming error:', error)
                const errorData = JSON.stringify({
                    type: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
                await writer.write(encoder.encode(`data: ${errorData}\n\n`))
            } finally {
                await writer.close()
            }
        }

        process()

        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

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

    const input = {
        question,
        propertyContext: {
            address: '1148 Greenbrook Drive, Danville, CA 94526',
            lat: 37.8044,
            lng: -121.9523,
            zipCode: '94526',
            city: 'Danville',
            state: 'CA',
            price: 1200000,
            bedrooms: 4,
            bathrooms: 2,
            sqft: 2000,
            yearBuilt: 1980,
        },
    }

    const response = await routeQuestion(input)

    return NextResponse.json(response)
}
