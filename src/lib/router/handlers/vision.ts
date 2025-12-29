import { HandlerResult, PropertyContext, VisionAnalysisConfig } from '../types'
import { VisionPrompts } from '@/lib/api/ai/gemini'

export async function handleVision(
    config: VisionAnalysisConfig,
    context: PropertyContext
): Promise<HandlerResult> {
    if (!context.photos || context.photos.length === 0) {
        return {
            success: false,
            data: null,
            source: 'mock',
            error: 'No photos available for analysis',
        }
    }

    const results: Array<{
        photoIndex: number
        analysis: Record<string, unknown>
    }> = []

    for (const index of config.photoIndices) {
        if (index >= context.photos.length) continue

        // In production, fetch the image and convert to base64
        // For now, return mock analysis based on prompt type
        const promptKey = config.prompt as keyof typeof VisionPrompts
        const mockAnalysis = getMockVisionAnalysis(promptKey)

        results.push({
            photoIndex: index,
            analysis: mockAnalysis,
        })
    }

    return {
        success: results.length > 0,
        data: {
            analyses: results,
            primaryAnalysis: results[0]?.analysis || null,
        },
        source: 'mock',
    }
}

function getMockVisionAnalysis(promptType: string): Record<string, unknown> {
    const mockResponses: Record<string, Record<string, unknown>> = {
        garageSize: {
            type: '2-car',
            widthFt: 18,
            depthFt: 20,
            heightFt: 9,
            usableWidthFt: 16,
            canFit: {
                'Tesla Model 3': { fits: true, clearance: '3.5 ft on each side' },
                'Tesla Model X': { fits: true, clearance: '2.8 ft on each side' },
                'Ford F-150': { fits: true, clearance: '2.2 ft on each side' },
            },
            notes: 'Standard 2-car garage with some storage along walls.',
        },
        kitchenCondition: {
            condition: 'good',
            cabinetStyle: 'Shaker',
            countertopMaterial: 'Granite',
            applianceQuality: 'standard',
            estimatedAge: '10-15 years',
            issues: ['Minor wear on cabinet hardware'],
            updateRecommendation: 'Cosmetic refresh would modernize the space',
        },
        naturalLight: {
            windowCount: 3,
            windowSize: 'large',
            lightQuality: 'bright',
            estimatedDirection: 'South-facing',
            obstructions: 'None visible',
            score: 85,
        },
        backyardPrivacy: {
            privacyLevel: 'high',
            fencing: '6ft wood fence on all sides',
            naturalScreening: 'Mature trees along back',
            neighborVisibility: 'Minimal - only upper floors visible',
            usableAreaSqFt: 3500,
        },
        overallCondition: {
            rating: 7.5,
            issues: ['Some wear on flooring', 'Paint touch-ups needed'],
            finishQuality: 'Mid-range',
            estimatedFinishAge: '10-15 years',
            stagingQuality: 'Well staged',
            recommendation: 'Move-in ready with cosmetic updates optional',
        },
        roomIdentification: {
            roomType: 'Living Room',
            estimatedSqFt: 350,
            features: ['Fireplace', 'Built-in shelving', 'Large windows'],
            condition: 'Good',
        },
    }

    return mockResponses[promptType] || mockResponses.overallCondition
}
