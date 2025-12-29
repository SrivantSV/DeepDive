import { NextRequest, NextResponse } from 'next/server'
import { routeQuestion, routeQuestionStreaming } from '@/lib/router'

export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic' // remove if causing build issues, but good for streaming

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

        console.log(`[Chat API] Processing question: "${input.question}"`)

        // Check if client wants streaming (checking via specific header or assumption)
        // For now, we assume all POSTs to this endpoint want streaming if they can handle it.
        // But to be safe and compatible with previous code, let's use the new streaming route.

        const encoder = new TextEncoder()

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Stream callback
                    const onChunk = (chunk: string) => {
                        const data = JSON.stringify({ type: 'chunk', content: chunk })
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                    }

                    const onMetadata = (metadata: any) => {
                        const data = JSON.stringify({ type: 'metadata', ...metadata })
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                    }

                    // Run the router with streaming
                    const result = await routeQuestionStreaming(
                        input,
                        onChunk,
                        onMetadata
                    )

                    // Send final result
                    const finalData = JSON.stringify({ type: 'done', ...result })
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))

                } catch (error) {
                    console.error('[Chat API] Streaming Error:', error)
                    const errorData = JSON.stringify({
                        type: 'error',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    })
                    controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
                } finally {
                    controller.close()
                }
            },
        })

        return new Response(stream, {
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

// Keep non-streaming endpoint for simple testing via Browser GET
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
        },
    }

    const response = await routeQuestion(input)

    return NextResponse.json(response)
}
