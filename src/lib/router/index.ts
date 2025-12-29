import {
    RouterInput,
    RouterDecision,
    HandlerResult,
    FormattedResponse,
    HandlerType,
    PropertyContext,
    QuestionCategory,
} from './types'
import {
    classifyQuestion,
    determineApis,
    needsExtrapolation,
    needsPerplexity,
    needsVision,
} from './classifier'
import { EXTRAPOLATION_RECIPES } from './api-index'
import { handleDirectApi } from './handlers/direct-api'
import { handleExtrapolation } from './handlers/extrapolator'
import { handlePerplexity } from './handlers/perplexity'
import { handleVision } from './handlers/vision'
import { formatResponse } from './handlers/formatter'

export async function routeQuestion(input: RouterInput): Promise<FormattedResponse> {
    const { question, propertyContext } = input

    // Step 1: Classify the question
    const category = classifyQuestion(question)
    console.log(`[Router] Question classified as: ${category}`)

    // Step 2: Determine which APIs are needed
    const apis = determineApis(category, question)
    console.log(`[Router] APIs needed: ${apis.join(', ')}`)

    // Step 3: Determine which handlers to use
    const handlers: HandlerType[] = []

    if (needsVision(question, (propertyContext.photos?.length ?? 0) > 0)) {
        handlers.push('VISION')
    }

    if (needsPerplexity(category, question)) {
        handlers.push('PERPLEXITY')
    }

    if (needsExtrapolation(category)) {
        handlers.push('EXTRAPOLATOR')
    } else if (apis.length > 0 && !handlers.includes('PERPLEXITY')) {
        handlers.push('DIRECT_API')
    }

    // Default to DIRECT_API if no handlers selected
    if (handlers.length === 0) {
        handlers.push('DIRECT_API')
    }

    console.log(`[Router] Using handlers: ${handlers.join(', ')}`)

    // Step 4: Build router decision
    const decision: RouterDecision = {
        questionCategory: category,
        handlers,
        parallel: handlers.length > 1,
        apiCalls: apis.map(api => ({
            api,
            method: 'default',
            params: buildParams(propertyContext),
        })),
    }

    // Add extrapolation config if needed
    if (handlers.includes('EXTRAPOLATOR')) {
        const recipe = getExtrapolationRecipe(category)
        if (recipe) {
            decision.extrapolation = {
                type: recipe.type,
                dataSources: recipe.dataSources,
                logic: recipe.logic,
            }
        }
    }

    // Add perplexity queries if needed
    if (handlers.includes('PERPLEXITY')) {
        decision.perplexityQueries = buildPerplexityQueries(category, question, propertyContext)
    }

    // Add vision config if needed
    if (handlers.includes('VISION')) {
        decision.visionAnalysis = {
            prompt: buildVisionPrompt(question),
            photoIndices: [0],
        }
    }

    // Step 5: Execute handlers
    const results: HandlerResult[] = []

    if (decision.parallel) {
        const promises = handlers.map(handler => executeHandler(handler, decision, propertyContext))
        const parallelResults = await Promise.allSettled(promises)

        for (const result of parallelResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value)
            } else {
                results.push({
                    success: false,
                    data: null,
                    source: 'mock',
                    error: result.reason?.message || 'Handler failed',
                })
            }
        }
    } else {
        for (const handler of handlers) {
            const result = await executeHandler(handler, decision, propertyContext)
            results.push(result)
        }
    }

    // Step 6: Format response
    const response = await formatResponse(question, category, results, propertyContext)

    return response
}

async function executeHandler(
    handler: HandlerType,
    decision: RouterDecision,
    context: PropertyContext
): Promise<HandlerResult> {
    switch (handler) {
        case 'DIRECT_API':
            return handleDirectApi(decision.apiCalls || [], context)
        case 'EXTRAPOLATOR':
            return handleExtrapolation(decision.extrapolation!, context)
        case 'PERPLEXITY':
            return handlePerplexity(decision.perplexityQueries || [], context)
        case 'VISION':
            return handleVision(decision.visionAnalysis!, context)
        default:
            return { success: false, data: null, source: 'mock', error: 'Unknown handler' }
    }
}

function buildParams(context: PropertyContext): Record<string, unknown> {
    return {
        address: context.address,
        lat: context.lat,
        lng: context.lng,
        zipCode: context.zipCode,
        city: context.city,
        state: context.state,
        mlsId: context.mlsId,
    }
}

function getExtrapolationRecipe(category: QuestionCategory): { type: string; dataSources: string[]; logic: string } | null {
    const recipeMap: Record<string, string> = {
        financial_investment: 'investment_analysis',
        financial_value: 'overpriced_check',
        financial_cost: 'true_monthly_cost',
        red_flags: 'red_flags',
    }

    const recipeKey = recipeMap[category]
    if (recipeKey && EXTRAPOLATION_RECIPES[recipeKey]) {
        return {
            type: recipeKey,
            ...EXTRAPOLATION_RECIPES[recipeKey],
        }
    }

    return null
}

function buildPerplexityQueries(
    category: QuestionCategory,
    question: string,
    context: PropertyContext
): Array<{ template: string; params: Record<string, string> }> {
    const queries: Array<{ template: string; params: Record<string, string> }> = []

    const lowerQuestion = question.toLowerCase()

    if (lowerQuestion.includes('neighbor') || lowerQuestion.includes('vibe') || lowerQuestion.includes('like to live')) {
        queries.push({
            template: 'neighborhoodSentiment',
            params: { neighborhood: context.city, city: context.city },
        })
    }

    if (lowerQuestion.includes('permit')) {
        queries.push({
            template: 'permitHistory',
            params: { address: context.address, city: context.city },
        })
    }

    if (lowerQuestion.includes('hoa')) {
        queries.push({
            template: 'hoaInfo',
            params: { address: context.address, neighborhood: context.city },
        })
    }

    if (lowerQuestion.includes('sex offender')) {
        queries.push({
            template: 'sexOffenders',
            params: { address: context.address, zipCode: context.zipCode },
        })
    }

    if (lowerQuestion.includes('development') || lowerQuestion.includes('construction')) {
        queries.push({
            template: 'upcomingDevelopment',
            params: { neighborhood: context.city, city: context.city },
        })
    }

    // Default to neighborhood sentiment
    if (queries.length === 0) {
        queries.push({
            template: 'neighborhoodSentiment',
            params: { neighborhood: context.city, city: context.city },
        })
    }

    return queries
}

function buildVisionPrompt(question: string): string {
    const lowerQuestion = question.toLowerCase()

    if (lowerQuestion.includes('garage') || lowerQuestion.includes('fit')) {
        return 'garageSize'
    }
    if (lowerQuestion.includes('kitchen')) {
        return 'kitchenCondition'
    }
    if (lowerQuestion.includes('light')) {
        return 'naturalLight'
    }
    if (lowerQuestion.includes('backyard') || lowerQuestion.includes('private')) {
        return 'backyardPrivacy'
    }

    return 'overallCondition'
}

export { classifyQuestion, determineApis }
export type { RouterInput, RouterDecision, FormattedResponse, PropertyContext }
