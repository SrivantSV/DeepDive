import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockGemini } from '@/lib/mock/ai.mock'

const client = createApiClient({
    name: 'Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    timeout: 60000,
})

export interface GeminiPart {
    text?: string
    inlineData?: {
        mimeType: string
        data: string // base64
    }
}

export interface GeminiContent {
    role: 'user' | 'model'
    parts: GeminiPart[]
}

export interface GeminiCandidate {
    content: {
        parts: GeminiPart[]
        role: string
    }
    finishReason: string
    safetyRatings: Array<{
        category: string
        probability: string
    }>
}

export interface GeminiResponse {
    candidates: GeminiCandidate[]
    usageMetadata: {
        promptTokenCount: number
        candidatesTokenCount: number
        totalTokenCount: number
    }
}

export interface GeminiConfig {
    model?: 'gemini-1.5-flash' | 'gemini-1.5-pro'
    temperature?: number
    maxOutputTokens?: number
}

const DEFAULT_CONFIG: GeminiConfig = {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxOutputTokens: 2048,
}

export async function generateContent(
    prompt: string,
    config: GeminiConfig = {}
) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }

    if (shouldUseMock('gemini')) {
        return { data: mockGemini.response, error: null, source: 'mock' as const }
    }

    return client.request<GeminiResponse>(
        `/models/${mergedConfig.model}:generateContent?key=${env.gemini.apiKey}`,
        {
            method: 'POST',
            data: {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: mergedConfig.temperature,
                    maxOutputTokens: mergedConfig.maxOutputTokens,
                },
            },
        },
        mockGemini.response
    )
}

export async function analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    config: GeminiConfig = {}
) {
    const mergedConfig = { ...DEFAULT_CONFIG, model: 'gemini-1.5-flash', ...config }

    if (shouldUseMock('gemini')) {
        return { data: mockGemini.visionResponse, error: null, source: 'mock' as const }
    }

    return client.request<GeminiResponse>(
        `/models/${mergedConfig.model}:generateContent?key=${env.gemini.apiKey}`,
        {
            method: 'POST',
            data: {
                contents: [{
                    parts: [
                        { inlineData: { mimeType, data: imageBase64 } },
                        { text: prompt },
                    ],
                }],
                generationConfig: {
                    temperature: mergedConfig.temperature,
                    maxOutputTokens: mergedConfig.maxOutputTokens,
                },
            },
        },
        mockGemini.visionResponse
    )
}

// Helper to extract text from response
export function extractText(response: GeminiResponse | null): string {
    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return ''
    }
    return response.candidates[0].content.parts[0].text
}

// ============================================
// PRE-BUILT VISION PROMPTS
// ============================================

export const VisionPrompts = {
    garageSize: `
    Analyze this garage image. Estimate:
    1. Garage type (1-car, 2-car, 3-car, tandem)
    2. Estimated width in feet
    3. Estimated depth in feet
    4. Estimated ceiling height in feet
    5. Any obstructions or storage that reduces usable space
    
    Return as JSON: { type, widthFt, depthFt, heightFt, usableWidthFt, notes }
  `,

    kitchenCondition: `
    Analyze this kitchen image. Assess:
    1. Overall condition (excellent, good, fair, needs updating)
    2. Cabinet style and apparent age
    3. Countertop material
    4. Appliance quality (high-end, standard, dated)
    5. Any visible issues or needed repairs
    
    Return as JSON: { condition, cabinetStyle, countertopMaterial, applianceQuality, issues, estimatedAge }
  `,

    naturalLight: `
    Analyze this room image for natural light:
    1. Number of windows visible
    2. Window size (small, medium, large)
    3. Light quality (bright, moderate, dim)
    4. Direction windows likely face (based on light)
    5. Any obstructions to light
    
    Return as JSON: { windowCount, windowSize, lightQuality, estimatedDirection, obstructions }
  `,

    backyardPrivacy: `
    Analyze this backyard/yard image:
    1. Privacy level (high, medium, low)
    2. Fencing present (type, height estimate)
    3. Natural screening (trees, hedges)
    4. Neighbor visibility
    5. Usable space estimate
    
    Return as JSON: { privacyLevel, fencing, naturalScreening, neighborVisibility, usableAreaSqFt }
  `,

    overallCondition: `
    Analyze this property image for overall condition:
    1. Condition rating (1-10)
    2. Visible issues or repairs needed
    3. Quality of finishes
    4. Age estimate of finishes
    5. Cleanliness/staging quality
    
    Return as JSON: { rating, issues, finishQuality, estimatedFinishAge, stagingQuality }
  `,

    roomIdentification: `
    Identify this room:
    1. Room type (bedroom, bathroom, kitchen, living room, etc.)
    2. Approximate square footage
    3. Key features
    4. Condition
    
    Return as JSON: { roomType, estimatedSqFt, features, condition }
  `,
}

export async function analyzePropertyImage(
    imageBase64: string,
    mimeType: string,
    analysisType: keyof typeof VisionPrompts
) {
    const prompt = VisionPrompts[analysisType]
    const response = await analyzeImage(imageBase64, mimeType, prompt)

    const text = extractText(response.data)

    // Try to parse JSON from response
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return {
                ...response,
                parsed: JSON.parse(jsonMatch[0]),
            }
        }
    } catch {
        // If JSON parsing fails, return raw text
    }

    return {
        ...response,
        parsed: null,
    }
}
