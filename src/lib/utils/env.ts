// Environment variable helper with mock mode detection

export const env = {
  // Paid APIs
  simplyrets: {
    apiKey: process.env.SIMPLYRETS_API_KEY || '',
    apiSecret: process.env.SIMPLYRETS_API_SECRET || '',
    get isConfigured() { return !!this.apiKey && !!this.apiSecret }
  },
  estated: {
    apiToken: process.env.ESTATED_API_TOKEN || '',
    get isConfigured() { return !!this.apiToken }
  },
  rentcast: {
    apiKey: process.env.RENTCAST_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  mashvisor: {
    apiKey: process.env.MASHVISOR_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  regrid: {
    apiToken: process.env.REGRID_API_TOKEN || '',
    get isConfigured() { return !!this.apiToken }
  },
  neighborhoodscout: {
    apiKey: process.env.NEIGHBORHOODSCOUT_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },

  // Google
  google: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },

  // Free APIs
  greatschools: {
    apiKey: process.env.GREATSCHOOLS_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  census: {
    apiKey: process.env.CENSUS_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  howloud: {
    apiKey: process.env.HOWLOUD_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  airnow: {
    apiKey: process.env.AIRNOW_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  noaa: {
    apiToken: process.env.NOAA_API_TOKEN || '',
    get isConfigured() { return !!this.apiToken }
  },
  openweather: {
    apiKey: process.env.OPENWEATHERMAP_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  spotcrime: {
    apiKey: process.env.SPOTCRIME_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  fbiUcr: {
    apiKey: process.env.FBI_UCR_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  fred: {
    apiKey: process.env.FRED_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  bls: {
    apiKey: process.env.BLS_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },

  // AI
  perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    get isConfigured() { return !!this.apiKey }
  },

  // App config
  mockMode: process.env.MOCK_MODE === 'true',
  logApiCalls: process.env.LOG_API_CALLS === 'true',
}

// Helper to check if we should use mock
export function shouldUseMock(apiName: keyof typeof env): boolean {
  if (env.mockMode) return true
  const apiConfig = env[apiName]
  if (typeof apiConfig === 'object' && 'isConfigured' in apiConfig) {
    return !apiConfig.isConfigured
  }
  return false
}

// Log API status on startup
export function logApiStatus(): void {
  console.log('\n========== API STATUS ==========')
  const apis: [string, boolean][] = [
    ['SimplyRETS', env.simplyrets.isConfigured],
    ['Estated', env.estated.isConfigured],
    ['Rentcast', env.rentcast.isConfigured],
    ['Mashvisor', env.mashvisor.isConfigured],
    ['Regrid', env.regrid.isConfigured],
    ['NeighborhoodScout', env.neighborhoodscout.isConfigured],
    ['Google Maps', env.google.isConfigured],
    ['GreatSchools', env.greatschools.isConfigured],
    ['Census', env.census.isConfigured],
    ['HowLoud', env.howloud.isConfigured],
    ['AirNow', env.airnow.isConfigured],
    ['NOAA', env.noaa.isConfigured],
    ['OpenWeather', env.openweather.isConfigured],
    ['SpotCrime', env.spotcrime.isConfigured],
    ['FBI UCR', env.fbiUcr.isConfigured],
    ['FRED', env.fred.isConfigured],
    ['BLS', env.bls.isConfigured],
    ['Perplexity', env.perplexity.isConfigured],
    ['Gemini', env.gemini.isConfigured],
  ]
  
  apis.forEach(([name, configured]) => {
    const status = configured ? '✅ LIVE' : '⚠️  MOCK'
    console.log(`${status} - ${name}`)
  })
  console.log('================================\n')
}
