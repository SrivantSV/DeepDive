export const mockPerplexity = {
    response: {
        id: 'mock-response-123',
        model: 'sonar',
        choices: [
            {
                index: 0,
                message: {
                    role: 'assistant',
                    content: `Based on my research, here's what I found:

**Neighborhood Overview:**
The Greenbrook Estates neighborhood in Danville, CA is a well-established residential area known for its family-friendly atmosphere and excellent schools. Residents frequently praise the quiet streets, well-maintained homes, and strong sense of community.

**Key Points:**
- Highly rated schools in the San Ramon Valley Unified School District
- Low crime rates compared to state average
- Active HOA maintains community standards
- Easy access to I-680 for commuters
- Several parks and hiking trails nearby

**Resident Feedback:**
On local forums, residents mention the area is quiet and safe, though some note traffic can be heavy during school drop-off/pick-up times. The community is described as "friendly but not intrusive."`,
                },
                finish_reason: 'stop',
            },
        ],
        citations: [
            'https://www.reddit.com/r/bayarea/comments/example',
            'https://www.neighborhoodscout.com/ca/danville',
        ],
    },
}

export const mockGemini = {
    response: {
        candidates: [
            {
                content: {
                    parts: [{ text: 'This is a mock response from Gemini. The analysis would appear here based on the input provided.' }],
                    role: 'model',
                },
                finishReason: 'STOP',
                safetyRatings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', probability: 'NEGLIGIBLE' },
                ],
            },
        ],
        usageMetadata: {
            promptTokenCount: 100,
            candidatesTokenCount: 50,
            totalTokenCount: 150,
        },
    },
    visionResponse: {
        candidates: [
            {
                content: {
                    parts: [{
                        text: `{
  "type": "2-car",
  "widthFt": 18,
  "depthFt": 20,
  "heightFt": 9,
  "usableWidthFt": 16,
  "notes": "Standard 2-car garage with some storage along walls. Sufficient space for two mid-size vehicles."
}`,
                    }],
                    role: 'model',
                },
                finishReason: 'STOP',
                safetyRatings: [],
            },
        ],
        usageMetadata: {
            promptTokenCount: 500,
            candidatesTokenCount: 100,
            totalTokenCount: 600,
        },
    },
}
