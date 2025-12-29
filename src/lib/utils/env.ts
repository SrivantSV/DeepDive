// Special values that indicate Perplexity should be used instead
const PERPLEXITY_REPLACEMENT_VALUES = [
  'gone',
  'Gone',
  'G0ne',
  'perplexity replaced',
  'Perplexityinferred',
  'perplexity',
]

function isPerplexityReplacement(value: string | undefined): boolean {
  if (!value) return false
  return PERPLEXITY_REPLACEMENT_VALUES.some(v =>
    value.toLowerCase().includes(v.toLowerCase())
  )
}

function hasValidKey(value: string | undefined): boolean {
  if (!value) return false
  if (isPerplexityReplacement(value)) return false
  return value.length > 10 // Real keys are longer than placeholder text
}

export const env = {
  // ==========================================
  // PAID APIS
  // ==========================================
  simplyrets: {
    apiKey: process.env.SIMPLYRETS_API_KEY || '',
    apiSecret: process.env.SIMPLYRETS_API_SECRET || '',
    // SimplyRETS works with demo credentials even without keys
    get isConfigured() { return true },
    get useDemo() { return !this.apiKey || !this.apiSecret }
  },
  estated: {
    apiToken: process.env.ESTATED_API_TOKEN || '',
    get isConfigured() { return hasValidKey(this.apiToken) },
    get usePerplexity() { return isPerplexityReplacement(process.env.ESTATED_API_TOKEN) }
  },
  rentcast: {
    apiKey: process.env.RENTCAST_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },
  mashvisor: {
    apiKey: process.env.MASHVISOR_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },
  regrid: {
    apiToken: process.env.REGRID_API_TOKEN || '',
    get isConfigured() { return hasValidKey(this.apiToken) }
  },

  // ==========================================
  // GOOGLE CLOUD (Single key for Maps + Gemini)
  // ==========================================
  google: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },
  gemini: {
    // Uses same key as Google Maps (Cloud API key)
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },

  // ==========================================
  // NEIGHBORHOOD APIS
  // ==========================================
  neighborhoodscout: {
    apiKey: process.env.NEIGHBORHOODSCOUT_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) },
    get usePerplexity() { return isPerplexityReplacement(process.env.NEIGHBORHOODSCOUT_API_KEY) || !hasValidKey(this.apiKey) }
  },
  greatschools: {
    apiKey: process.env.GREATSCHOOLS_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) },
    get usePerplexity() { return isPerplexityReplacement(process.env.GREATSCHOOLS_API_KEY) || !hasValidKey(this.apiKey) }
  },
  census: {
    apiKey: process.env.CENSUS_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },
  spotcrime: {
    apiKey: process.env.SPOTCRIME_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) },
    get usePerplexity() { return isPerplexityReplacement(process.env.SPOTCRIME_API_KEY) || !hasValidKey(this.apiKey) }
  },
  fbiUcr: {
    apiKey: process.env.FBI_UCR_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },

  // ==========================================
  // ENVIRONMENTAL APIS
  // ==========================================
  howloud: {
    apiKey: process.env.HOWLOUD_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) },
    get usePerplexity() { return isPerplexityReplacement(process.env.HOWLOUD_API_KEY) || !hasValidKey(this.apiKey) }
  },
  airnow: {
    apiKey: process.env.AIRNOW_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },
  noaa: {
    apiToken: process.env.NOAA_API_TOKEN || '',
    get isConfigured() { return hasValidKey(this.apiToken) }
  },
  openweather: {
    apiKey: process.env.OPENWEATHERMAP_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },

  // ==========================================
  // FINANCIAL APIS
  // ==========================================
  fred: {
    apiKey: process.env.FRED_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },
  bls: {
    apiKey: process.env.BLS_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },

  // ==========================================
  // AI APIS
  // ==========================================
  perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY || '',
    get isConfigured() { return hasValidKey(this.apiKey) }
  },

  // ==========================================
  // APP CONFIG
  // ==========================================
  mockMode: process.env.MOCK_MODE === 'true',
  logApiCalls: process.env.LOG_API_CALLS === 'true',
}

// Check if we should use mock for a given API
export function shouldUseMock(apiName: keyof typeof env): boolean {
  if (env.mockMode) return true
  const apiConfig = env[apiName]
  if (typeof apiConfig === 'object' && 'isConfigured' in apiConfig) {
    return !apiConfig.isConfigured
  }
  return false
}

// Check if we should use Perplexity as replacement
export function shouldUsePerplexity(apiName: string): boolean {
  const apiConfig = env[apiName as keyof typeof env]
  if (typeof apiConfig === 'object' && 'usePerplexity' in apiConfig) {
    return (apiConfig as { usePerplexity: boolean }).usePerplexity
  }
  return false
}

// Log API status on startup
export function logApiStatus(): void {
  console.log('\n========== API STATUS ==========')

  const statuses: Array<[string, string]> = [
    // Paid APIs
    ['SimplyRETS', env.simplyrets.useDemo ? '✅ DEMO' : '✅ LIVE'],
    ['Estated', env.estated.isConfigured ? '✅ LIVE' : env.estated.usePerplexity ? '🔄 PERPLEXITY' : '⚠️ MOCK'],
    ['Rentcast', env.rentcast.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
    ['Mashvisor', env.mashvisor.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
    ['Regrid', env.regrid.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],

    // Google
    ['Google Maps', env.google.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
    ['Gemini', env.gemini.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],

    // Neighborhood
    ['NeighborhoodScout', env.neighborhoodscout.isConfigured ? '✅ LIVE' : env.neighborhoodscout.usePerplexity ? '🔄 PERPLEXITY' : '⚠️ MOCK'],
    ['GreatSchools', env.greatschools.isConfigured ? '✅ LIVE' : env.greatschools.usePerplexity ? '🔄 PERPLEXITY' : '⚠️ MOCK'],
    ['Census', env.census.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
    ['SpotCrime', env.spotcrime.isConfigured ? '✅ LIVE' : env.spotcrime.usePerplexity ? '🔄 PERPLEXITY' : '⚠️ MOCK'],
    ['FBI UCR', env.fbiUcr.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],

    // Environmental
    ['HowLoud', env.howloud.isConfigured ? '✅ LIVE' : env.howloud.usePerplexity ? '🔄 PERPLEXITY' : '⚠️ MOCK'],
    ['AirNow', env.airnow.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
    ['NOAA', env.noaa.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
    ['OpenWeather', env.openweather.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
    ['FEMA', '✅ PUBLIC'],
    ['USGS', '✅ PUBLIC'],
    ['EPA', '✅ PUBLIC'],
    ['Wildfire', '✅ PUBLIC'],

    // Financial
    ['FRED', env.fred.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
    ['BLS', env.bls.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
    ['Freddie Mac', '✅ PUBLIC'],

    // Utilities
    ['Broadband', '✅ PUBLIC'],
    ['FCC', '✅ PUBLIC'],

    // AI
    ['Perplexity', env.perplexity.isConfigured ? '✅ LIVE' : '⚠️ MOCK'],
  ]

  statuses.forEach(([name, status]) => {
    console.log(`${status} - ${name}`)
  })

  console.log('================================\n')
}
