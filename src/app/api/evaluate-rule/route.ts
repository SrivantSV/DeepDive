import { NextRequest, NextResponse } from 'next/server'
import { queryPerplexity } from '@/lib/api/ai/perplexity'

export interface RuleEvaluationRequest {
    rule: string
    propertyData: {
        address: string
        purchasePrice: number
        monthlyRent: number
        capRate: number
        onePercentRule: number
        dscr: number
        cashOnCash: number
        noi: number
        monthlyPayment: number
    }
}

export interface RuleEvaluationResponse {
    pass: boolean
    reason: string
    actualValue: string
    confidence: 'high' | 'medium' | 'low'
    explanation?: string
    error?: string
}

const SYSTEM_PROMPT = `You are a real estate investment analyst evaluating whether a property meets specific investment criteria.

You will be given:
1. A rule/criteria in natural language (e.g., "cap rate > 5%", "area cannot be low income", "good appreciation potential")
2. Property data including financial metrics

Your job is to:
1. Understand what the rule/criteria means
2. Evaluate the property against this criteria using the provided data
3. Return a clear PASS or FAIL verdict with explanation

IMPORTANT:
- Be definitive in your evaluation whenever possible
- Use the provided data to make your determination
- If data is insufficient, still make a best-effort evaluation and note the limitation
- Always respond in valid JSON format

Respond ONLY with this JSON structure (no other text):
{
  "pass": true or false,
  "reason": "Brief one-line explanation",
  "actualValue": "The relevant data point (e.g., '5.8%' or '$95,000 median income')",
  "confidence": "high", "medium", or "low",
  "explanation": "Optional longer explanation if needed"
}`

export async function POST(request: NextRequest) {
    try {
        const body: RuleEvaluationRequest = await request.json()
        const { rule, propertyData } = body

        if (!rule || !propertyData) {
            return NextResponse.json(
                { error: 'Missing rule or property data' },
                { status: 400 }
            )
        }

        // Build property summary for AI
        const propertySummary = `
PROPERTY: ${propertyData.address}

FINANCIAL METRICS:
- Purchase Price: $${propertyData.purchasePrice.toLocaleString()}
- Monthly Rent: $${propertyData.monthlyRent.toLocaleString()}
- Cap Rate: ${propertyData.capRate.toFixed(2)}%
- 1% Rule: ${propertyData.onePercentRule.toFixed(2)}%
- DSCR (Debt Service Coverage Ratio): ${propertyData.dscr.toFixed(2)}x
- Cash-on-Cash Return: ${propertyData.cashOnCash.toFixed(2)}%
- Annual NOI: $${propertyData.noi.toLocaleString()}
- Monthly NOI: $${Math.round(propertyData.noi / 12).toLocaleString()}
- Monthly Mortgage Payment: $${Math.round(propertyData.monthlyPayment).toLocaleString()}
- Annual Cash Flow: $${(propertyData.noi - propertyData.monthlyPayment * 12).toLocaleString()}

THRESHOLDS FOR REFERENCE:
- Good Cap Rate: > 6% (Green), 4-6% (Yellow), < 4% (Red)
- Good 1% Rule: > 1.0% (Green), 0.8-1.0% (Yellow), < 0.8% (Red)
- Good DSCR: > 1.25x (Green), 1.1-1.25x (Yellow), < 1.1x (Red)
- Good Cash-on-Cash: > 8% (Green), 5-8% (Yellow), < 5% (Red)
`

        const userQuery = `
Evaluate this investment rule for the property:

RULE: "${rule}"

${propertySummary}

Does this property PASS or FAIL the rule "${rule}"?
`

        // Call Perplexity
        const response = await queryPerplexity(userQuery, SYSTEM_PROMPT, {
            model: 'sonar',
            temperature: 0.1,
            maxTokens: 500,
        })

        if (response.error || !response.data?.choices?.[0]?.message?.content) {
            console.error('[Evaluate Rule] Perplexity error:', response.error)
            return NextResponse.json(
                { error: 'Failed to evaluate rule. Please try again.' },
                { status: 500 }
            )
        }

        const aiResponse = response.data.choices[0].message.content

        // Parse JSON from response
        try {
            // Find JSON in response (it might have extra text)
            const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/)?.[0]
            if (!jsonMatch) {
                throw new Error('No JSON found in response')
            }

            const evaluation = JSON.parse(jsonMatch) as RuleEvaluationResponse
            return NextResponse.json(evaluation)

        } catch (parseError) {
            console.error('[Evaluate Rule] Parse error:', parseError)
            console.log('[Evaluate Rule] Raw response:', aiResponse)

            // Fallback: try to extract pass/fail from response text
            const lowerResponse = aiResponse.toLowerCase()
            const pass = lowerResponse.includes('pass') && !lowerResponse.includes('fail')

            return NextResponse.json({
                pass,
                reason: 'AI evaluated the rule',
                actualValue: 'See explanation',
                confidence: 'low',
                explanation: aiResponse.slice(0, 200),
            })
        }

    } catch (error) {
        console.error('[Evaluate Rule] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
