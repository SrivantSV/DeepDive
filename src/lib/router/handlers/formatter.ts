import { FormattedResponse, HandlerResult, PropertyContext, QuestionCategory } from '../types'

export async function formatResponse(
    question: string,
    category: QuestionCategory,
    results: HandlerResult[],
    context: PropertyContext
): Promise<FormattedResponse> {
    // Combine all successful results
    const successfulResults = results.filter(r => r.success)
    const allData = successfulResults.reduce((acc, r) => ({ ...acc, ...r.data }), {} as Record<string, unknown>)

    // Determine confidence
    const hasLiveData = results.some(r => r.source === 'live')
    const allSuccess = results.every(r => r.success)
    const confidence: 'high' | 'medium' | 'low' =
        hasLiveData && allSuccess ? 'high' :
            allSuccess ? 'medium' : 'low'

    // Format answer based on category and data
    const answer = formatAnswer(category, question, allData, context)

    // Collect sources
    const sources = collectSources(results, allData)

    // Generate follow-up suggestions
    const followUpSuggestions = generateFollowUps(category)

    // Determine if "Ask Seller" button needed
    const askSellerButton = determineAskSeller(category, allData)

    return {
        answer,
        sources,
        confidence,
        followUpSuggestions,
        askSellerButton,
    }
}

function formatAnswer(
    category: QuestionCategory,
    question: string,
    data: Record<string, unknown>,
    context: PropertyContext
): string {
    switch (category) {
        case 'location_distance': {
            const routes = data.google_routes as { routes?: Array<{ duration?: string; distanceMeters?: number }> } | undefined
            if (routes?.routes?.[0]) {
                const route = routes.routes[0]
                const minutes = Math.round(parseInt((route.duration || '0').replace('s', '')) / 60)
                const miles = Math.round((route.distanceMeters || 0) / 1609.34 * 10) / 10
                return `It's about ${minutes} minutes (${miles} miles) from the property.`
            }
            const places = data.google_places as { places?: Array<{ displayName?: { text?: string }; formattedAddress?: string; rating?: number; types?: string[] }> } | undefined
            if (places?.places?.[0]) {
                const place = places.places[0]
                return `The nearest ${place.types?.[0] || 'location'} is ${place.displayName?.text} at ${place.formattedAddress}. It has a ${place.rating} star rating.`
            }
            return "I couldn't find specific distance information. Would you like me to search for a particular destination?"
        }

        case 'financial_investment': {
            const summary = data.summary as { verdict?: string; investmentScore?: number } | undefined
            const metrics = data.metrics as { capRate?: number; cashOnCash?: number; monthlyRent?: number; annualCashFlow?: number } | undefined
            const airbnb = data.airbnbPotential as { estimatedRent?: number; occupancy?: number; recommendation?: string } | undefined
            if (summary && metrics) {
                let response = `**Investment Analysis: ${summary.verdict}** (Score: ${summary.investmentScore}/100)\n\n` +
                    `• Cap Rate: ${metrics.capRate}%\n` +
                    `• Cash on Cash Return: ${metrics.cashOnCash}%\n` +
                    `• Estimated Monthly Rent: $${metrics.monthlyRent?.toLocaleString()}\n` +
                    `• Annual Cash Flow: $${metrics.annualCashFlow?.toLocaleString()}`
                if (airbnb) {
                    response += `\n\nAirbnb Potential: $${airbnb.estimatedRent}/month at ${airbnb.occupancy}% occupancy. Recommended: ${airbnb.recommendation}`
                }
                return response
            }
            return "I need more data to complete the investment analysis."
        }

        case 'financial_value': {
            const verdict = data.verdict as string | undefined
            const listPrice = data.listPrice as number | undefined
            const estimatedValue = data.estimatedValue as number | undefined
            const valueRange = data.valueRange as { low?: number; high?: number } | undefined
            const difference = data.difference as { amount?: number; percent?: number } | undefined
            const recommendation = data.recommendation as string | undefined

            if (verdict && listPrice && estimatedValue) {
                const icon = verdict === 'Fair Price' ? '✅' : verdict === 'Underpriced' ? '🎉' : '⚠️'
                let response = `${icon} **${verdict}**\n\n` +
                    `• List Price: $${listPrice.toLocaleString()}\n` +
                    `• Estimated Value: $${estimatedValue.toLocaleString()}\n`

                if (valueRange) {
                    response += `• Value Range: $${valueRange.low?.toLocaleString()} - $${valueRange.high?.toLocaleString()}\n`
                }

                if (difference) {
                    const diffIcon = (difference.amount || 0) < 0 ? '📉' : '📈'
                    response += `\n${diffIcon} Difference: $${Math.abs(difference.amount || 0).toLocaleString()} (${Math.abs(difference.percent || 0).toFixed(1)}%)\n`
                }

                if (recommendation) {
                    response += `\n**Recommendation:** ${recommendation}`
                }

                return response
            }
            return "I need property value data to determine if it's overpriced."
        }

        case 'financial_cost': {
            const totalMonthly = data.totalMonthly as number | undefined
            const breakdown = data.breakdown as { mortgage?: number; propertyTax?: number; insurance?: number; hoa?: number; maintenance?: number } | undefined
            const assumptions = data.assumptions as { downPaymentPercent?: number; interestRate?: number } | undefined
            const affordability = data.affordability as { requiredIncome?: number } | undefined
            if (totalMonthly && breakdown) {
                return `**True Monthly Cost: $${totalMonthly.toLocaleString()}**\n\n` +
                    `• Mortgage: $${breakdown.mortgage?.toLocaleString()}\n` +
                    `• Property Tax: $${breakdown.propertyTax?.toLocaleString()}\n` +
                    `• Insurance: $${breakdown.insurance?.toLocaleString()}\n` +
                    `• HOA: $${breakdown.hoa?.toLocaleString()}\n` +
                    `• Maintenance: $${breakdown.maintenance?.toLocaleString()}\n\n` +
                    `Based on ${assumptions?.downPaymentPercent}% down at ${assumptions?.interestRate}% interest.\n` +
                    `Required income: ~$${affordability?.requiredIncome?.toLocaleString()}/year`
            }
            return "I need the property price to calculate monthly costs."
        }

        case 'red_flags': {
            const flags = data.flags as Array<{ severity: string; issue: string; category: string; details: string }> | undefined
            const assessment = data.overallAssessment as string | undefined
            if (flags) {
                if (flags.length === 0) {
                    return "✅ **No significant red flags detected.**\n\nI checked flood zones, wildfire risk, earthquake activity, noise levels, and crime rates. Everything looks good!"
                }

                let response = `**Found ${flags.length} potential concerns:**\n\n`
                for (const flag of flags) {
                    const icon = flag.severity === 'high' ? '🔴' : flag.severity === 'medium' ? '🟡' : '🟢'
                    response += `${icon} **${flag.issue}** (${flag.category})\n${flag.details}\n\n`
                }
                response += `\n**Assessment:** ${assessment}`
                return response
            }
            return "Let me analyze the property for potential concerns..."
        }

        case 'neighborhood_safety': {
            const ns = data.neighborhoodscout as { crime?: { overall_grade?: string; comparison_to_national?: string; violent_crime_index?: number; property_crime_index?: number } } | undefined
            if (ns?.crime) {
                return `**Safety Grade: ${ns.crime.overall_grade}**\n\n` +
                    `This neighborhood has a crime rate that is ${ns.crime.comparison_to_national}.\n\n` +
                    `• Violent Crime Index: ${ns.crime.violent_crime_index}/100\n` +
                    `• Property Crime Index: ${ns.crime.property_crime_index}/100`
            }
            return "I'll check the crime statistics for this area..."
        }

        case 'schools': {
            const gs = data.greatschools as { schools?: Array<{ name?: string; gradeRange?: string; rating?: number; distance?: number }> } | undefined
            if (gs?.schools) {
                const schools = gs.schools.slice(0, 3)
                let response = "**Nearby Schools:**\n\n"
                for (const school of schools) {
                    response += `• **${school.name}** (${school.gradeRange})\n`
                    response += `  Rating: ${school.rating}/10 | ${school.distance} miles away\n\n`
                }
                return response
            }
            return "Let me look up the schools in this area..."
        }

        case 'location_amenities': {
            const places = data.google_places as { places?: Array<{ displayName?: { text?: string }; formattedAddress?: string; rating?: number; types?: string[] }> } | undefined
            if (places?.places && places.places.length > 0) {
                let response = `**Nearby Places:**\n\n`
                for (const place of places.places.slice(0, 5)) {
                    response += `• **${place.displayName?.text}** - ${place.rating ? `⭐ ${place.rating}` : 'No rating'}\n`
                    response += `  ${place.formattedAddress}\n\n`
                }
                return response
            }
            return "Let me search for nearby amenities..."
        }

        case 'location_commute': {
            const routes = data.google_routes as { routes?: Array<{ duration?: string; distanceMeters?: number; staticDuration?: string }> } | undefined
            if (routes?.routes?.[0]) {
                const route = routes.routes[0]
                const minutes = Math.round(parseInt((route.duration || '0').replace('s', '')) / 60)
                const miles = Math.round((route.distanceMeters || 0) / 1609.34 * 10) / 10
                return `**Commute Analysis:**\n\n` +
                    `• Drive Time: ${minutes} minutes\n` +
                    `• Distance: ${miles} miles\n\n` +
                    `*Note: Times may vary with traffic conditions.*`
            }
            return "Please specify a destination for commute calculation."
        }

        case 'environmental_risk': {
            const fema = data.fema as { floodZone?: string } | undefined
            const wildfire = data.wildfire as { riskLevel?: string } | undefined
            const usgs = data.usgs as { features?: Array<unknown> } | undefined

            let response = `**Environmental Risk Assessment:**\n\n`

            if (fema) {
                const isHighRisk = fema.floodZone !== 'X'
                response += `• Flood Zone: ${fema.floodZone} ${isHighRisk ? '⚠️' : '✅'}\n`
            }
            if (wildfire) {
                const isHighRisk = wildfire.riskLevel === 'high' || wildfire.riskLevel === 'very high'
                response += `• Wildfire Risk: ${wildfire.riskLevel} ${isHighRisk ? '🔥' : '✅'}\n`
            }
            if (usgs) {
                response += `• Recent Earthquakes: ${usgs.features?.length || 0} in past 30 days\n`
            }

            return response
        }

        case 'environmental_quality': {
            const noise = data.howloud as { score?: number; traffic?: number; airport?: number; local?: number } | undefined
            const airquality = data.airquality as { aqi?: number; category?: string } | undefined

            let response = `**Environmental Quality:**\n\n`

            if (noise) {
                const quietness = noise.score && noise.score > 70 ? 'Very Quiet 🤫' : noise.score && noise.score > 50 ? 'Moderate 🔉' : 'Noisy 🔊'
                response += `• Noise Level: ${quietness} (Score: ${noise.score}/100)\n`
                response += `  - Traffic: ${noise.traffic}/100, Airport: ${noise.airport}/100, Local: ${noise.local}/100\n`
            }
            if (airquality) {
                response += `• Air Quality: ${airquality.category} (AQI: ${airquality.aqi})\n`
            }

            return response
        }

        case 'utilities': {
            const broadband = data.broadband as { providers?: Array<{ name?: string; maxSpeed?: number }> } | undefined

            if (broadband?.providers && broadband.providers.length > 0) {
                let response = `**Internet Providers:**\n\n`
                for (const provider of broadband.providers.slice(0, 4)) {
                    response += `• **${provider.name}** - Up to ${provider.maxSpeed} Mbps\n`
                }
                return response
            }
            return "Let me check what internet providers are available..."
        }

        case 'financial_mortgage': {
            const rates = data.fred as { rate30yr?: number; rate15yr?: number } | undefined

            if (rates) {
                return `**Current Mortgage Rates:**\n\n` +
                    `• 30-Year Fixed: ${rates.rate30yr}%\n` +
                    `• 15-Year Fixed: ${rates.rate15yr}%\n\n` +
                    `*Rates updated from Federal Reserve data.*`
            }
            return "Let me get the current mortgage rates..."
        }

        case 'neighborhood_vibe': {
            // Try different data shapes from the new retry-based handler
            const sentimentData = data.sentiment as { raw?: string } | undefined
            const rawData = data.raw as string | undefined
            const queriesData = data.queries as Array<{ response?: string; content?: string }> | undefined
            const summaryData = data.summary as string | undefined

            // Check for new format with sentiment object
            if (sentimentData?.raw && sentimentData.raw.length > 100) {
                return `**What Residents Say About ${context.city}:**\n\n${sentimentData.raw}`
            }

            // Check for raw string
            if (rawData && rawData.length > 100 && !rawData.includes('Unable to find')) {
                return `**Neighborhood Insights for ${context.city}:**\n\n${rawData}`
            }

            // Check for summary from synthesized results
            if (summaryData && summaryData.length > 100) {
                return `**What People Say About ${context.city}:**\n\n${summaryData}`
            }

            // Check for old format with queries array
            if (queriesData && queriesData.length > 0) {
                const content = queriesData[0].response || queriesData[0].content
                if (content && content.length > 100) {
                    return `**Neighborhood Insights:**\n\n${content}`
                }
            }

            // Fallback with helpful suggestions
            return `I searched Reddit, community forums, and neighborhood guides but couldn't find detailed resident feedback for ${context.city}. This might be a smaller community with less online presence.\n\nYou might want to:\n• Check Nextdoor directly\n• Look at local Facebook groups\n• Ask your real estate agent for local insights`
        }

        case 'neighborhood_demographics': {
            // Try multiple paths to find the data - cast to any for flexible access
            const dataAny = data as Record<string, unknown>
            const censusData = dataAny?.census as Record<string, unknown> | undefined
            const demo = (censusData?.demographics || censusData || dataAny?.demographics || dataAny || {}) as Record<string, unknown>

            console.log(`[Formatter] Demographics data:`, demo)

            // Check if we have any actual data
            const hasData = demo.total_population || demo.median_household_income ||
                demo.median_age || demo.population || demo.median_income

            if (!hasData) {
                return `I'm retrieving demographics for ${context.city}. Please try again in a moment.`
            }

            // Helper function to format numbers with fallback
            const formatNum = (val: unknown): string => {
                if (val === null || val === undefined) return 'N/A'
                const num = Number(val)
                if (isNaN(num)) return String(val)
                return num.toLocaleString()
            }

            return `**Demographics for ${context.city}, ${context.zipCode}:**

**Population & Households**
• Total Population: ${formatNum(demo.total_population || demo.population)}
• Median Age: ${demo.median_age || 'N/A'} years
• Average Household Size: ${demo.average_household_size || 'N/A'}

**Income & Economy**
• Median Household Income: $${formatNum(demo.median_household_income || demo.median_income)}
• Poverty Rate: ${demo.poverty_rate || 'N/A'}%
• Unemployment Rate: ${demo.unemployment_rate || 'N/A'}%

**Housing**
• Median Home Value: $${formatNum(demo.median_home_value)}
• Median Rent: $${formatNum(demo.median_rent)}
• Owner-Occupied: ${demo.owner_occupied_percent || 'N/A'}%

**Education**
• Bachelor's Degree or Higher: ${demo.education_bachelors_or_higher || 'N/A'}%

**Commute**
• Average Commute Time: ${demo.commute_time_average || 'N/A'} minutes`
        }

        case 'property_features':
        case 'property_condition':
        case 'property_history':
        case 'property_legal': {
            const perplexity = data.queries as Array<{ content?: string }> | undefined

            if (perplexity && perplexity.length > 0) {
                return perplexity[0].content || "I need more specific information to answer this."
            }
            return "Let me search for that property information..."
        }

        default: {
            // First check for Perplexity response (summary or queries)
            const summary = data.summary as string | undefined
            const queries = data.queries as Array<{ response?: string }> | undefined

            if (summary && summary.length > 50) {
                return summary
            }

            if (queries && queries.length > 0 && queries[0].response) {
                return queries[0].response
            }

            // Try to format the data nicely even for unknown categories
            if (Object.keys(data).length > 0) {
                // Check for common patterns and format appropriately
                if (data.schools || data.raw) {
                    const schools = data.schools as Array<{ name?: string; rating?: number; type?: string }> | undefined
                    const raw = data.raw as string | undefined
                    if (schools && schools.length > 0) {
                        let response = `**School Information:**\n\n`
                        for (const school of schools.slice(0, 5)) {
                            if (school.name) {
                                response += `• **${school.name}** ${school.type ? `(${school.type})` : ''}\n`
                                if (school.rating) response += `  Rating: ${school.rating}/10\n`
                            }
                        }
                        return response
                    }
                    if (raw) return raw
                }

                if (data.crime || data.safety) {
                    const crime = data.crime as { grade?: string; violent?: number; property?: number } | undefined
                    if (crime) {
                        return `**Safety Information:**\n\n` +
                            `• Grade: ${crime.grade || 'N/A'}\n` +
                            `• Violent Crime Index: ${crime.violent || 'N/A'}\n` +
                            `• Property Crime Index: ${crime.property || 'N/A'}`
                    }
                }

                // Last resort: pretty print but truncate
                const jsonStr = JSON.stringify(data, null, 2)
                if (jsonStr.length < 300) {
                    return `Here's what I found:\n\n${jsonStr}`
                }
                return `Here's a summary of the data I found. The full details are available but quite detailed. Would you like me to focus on a specific aspect?`
            }
            return "I'm still gathering information. Could you be more specific about what you'd like to know?"
        }
    }
}

function collectSources(results: HandlerResult[], data: Record<string, unknown>): string[] {
    const sources: string[] = []

    for (const result of results) {
        if (result.source === 'live' || result.source === 'mock') {
            if (data.google_places) sources.push('Google Places')
            if (data.google_routes) sources.push('Google Maps')
            if (data.estated) sources.push('Estated')
            if (data.neighborhoodscout) sources.push('NeighborhoodScout')
            if (data.greatschools) sources.push('GreatSchools')
            if (data.fema) sources.push('FEMA')
            if (data.queries) sources.push('Web Search')
            if (data.metrics) sources.push('Investment Analysis')
            if (data.flags) sources.push('Risk Assessment')
        }
    }

    return [...new Set(sources)]
}

function generateFollowUps(category: QuestionCategory): string[] {
    const followUps: Record<QuestionCategory, string[]> = {
        location_distance: ['What about public transit options?', 'How is traffic during rush hour?'],
        location_amenities: ['Are there any parks nearby?', 'What about grocery stores?'],
        location_commute: ['What about the reverse commute?', 'Is there a train station nearby?'],
        financial_value: ['What did similar homes sell for?', 'What\'s the price per square foot?'],
        financial_investment: ['What\'s the Airbnb potential?', 'What are the comparable rents?'],
        financial_cost: ['What if I put 10% down?', 'What about closing costs?'],
        financial_mortgage: ['What are 15-year rates?', 'Should I consider an ARM?'],
        environmental_risk: ['What about earthquake insurance?', 'Is the home retrofitted?'],
        environmental_quality: ['How is the air quality year-round?', 'Is it on a flight path?'],
        neighborhood_safety: ['Are there any sex offenders nearby?', 'What types of crime are most common?'],
        neighborhood_vibe: ['Is it family-friendly?', 'What do residents say about noise?'],
        neighborhood_demographics: ['What\'s the average age?', 'Is it a growing area?'],
        schools: ['What about private schools?', 'How are the test scores trending?'],
        property_features: ['Does it have a pool?', 'How big is the garage?'],
        property_condition: ['When was the roof replaced?', 'How old is the HVAC?'],
        property_history: ['Any unpermitted work?', 'How many times has it sold?'],
        property_legal: ['Can I build an ADU?', 'What are the setback requirements?'],
        utilities: ['Is fiber available?', 'What are typical utility costs?'],
        comparison: ['Which has better schools?', 'Which is a better investment?'],
        red_flags: ['Tell me more about the flood risk', 'What about the crime rate?'],
        general: ['What else would you like to know?'],
    }

    return followUps[category] || followUps.general
}

function determineAskSeller(
    category: QuestionCategory,
    data: Record<string, unknown>
): { show: boolean; questions: string[] } {
    const sellerCategories: QuestionCategory[] = [
        'property_features',
        'property_condition',
        'property_history',
    ]

    if (!sellerCategories.includes(category)) {
        return { show: false, questions: [] }
    }

    const hasIncompleteData = !data || Object.keys(data).length === 0

    if (hasIncompleteData) {
        return {
            show: true,
            questions: [
                'When was the roof last replaced?',
                'Are there any known issues with the property?',
                'Have there been any unpermitted modifications?',
            ],
        }
    }

    return { show: false, questions: [] }
}
