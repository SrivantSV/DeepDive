// Complete API capability index - the router's knowledge of what each API can do

export const API_INDEX = {
    // ==========================================
    // GOOGLE MAPS PLATFORM
    // ==========================================
    google_places: {
        capabilities: ['nearby_search', 'place_details', 'text_search'],
        returns: ['business_name', 'address', 'rating', 'reviews', 'hours', 'phone', 'website', 'distance'],
        useWhen: [
            'nearest',
            'what is nearby',
            'restaurants',
            'grocery',
            'parks',
            'distance to',
            'whole foods',
            'starbucks',
        ],
    },

    google_routes: {
        capabilities: ['compute_route', 'traffic_aware', 'commute_comparison'],
        returns: ['duration', 'duration_in_traffic', 'distance', 'toll_info'],
        useWhen: [
            'how long to',
            'commute',
            'drive to',
            'traffic',
            'rush hour',
            'route to',
        ],
    },

    google_elevation: {
        capabilities: ['point_elevation', 'path_elevation', 'driveway_grade'],
        returns: ['elevation_meters', 'grade_percent'],
        useWhen: [
            'elevation',
            'hill',
            'steep driveway',
            'sports car',
            'low clearance',
        ],
    },

    google_airquality: {
        capabilities: ['current_aqi', 'pollutants', 'health_recommendations'],
        returns: ['aqi', 'category', 'dominant_pollutant', 'recommendations'],
        useWhen: [
            'air quality',
            'pollution',
            'aqi',
            'smog',
        ],
    },

    google_pollen: {
        capabilities: ['pollen_forecast', 'allergen_levels'],
        returns: ['tree_pollen', 'grass_pollen', 'weed_pollen'],
        useWhen: [
            'pollen',
            'allergies',
            'allergens',
        ],
    },

    google_solar: {
        capabilities: ['solar_potential', 'roof_analysis', 'savings_estimate'],
        returns: ['panel_count', 'annual_kwh', 'savings', 'payback_period'],
        useWhen: [
            'solar panels',
            'solar potential',
            'roof solar',
        ],
    },

    // ==========================================
    // PROPERTY DATA
    // ==========================================
    simplyrets: {
        capabilities: ['search_listings', 'get_listing'],
        returns: ['price', 'beds', 'baths', 'sqft', 'photos', 'description', 'agent', 'days_on_market'],
        useWhen: [
            'listing',
            'asking price',
            'photos',
            'days on market',
        ],
    },

    estated: {
        capabilities: ['property_data', 'valuation', 'owner_info', 'tax_history'],
        returns: ['avm', 'owner_name', 'tax_amount', 'last_sale_price', 'mortgage_info'],
        useWhen: [
            'property value',
            'worth',
            'owner',
            'tax',
            'last sold',
        ],
    },

    rentcast: {
        capabilities: ['rent_estimate', 'rental_comps'],
        returns: ['rent_estimate', 'rent_range', 'comparable_rentals'],
        useWhen: [
            'rent',
            'rental income',
            'rental comps',
        ],
    },

    mashvisor: {
        capabilities: ['investment_analysis', 'airbnb_estimate'],
        returns: ['traditional_rent', 'airbnb_rent', 'occupancy', 'cap_rate', 'cash_on_cash'],
        useWhen: [
            'investment',
            'airbnb',
            'cap rate',
            'cash on cash',
        ],
    },

    regrid: {
        capabilities: ['parcel_data', 'zoning'],
        returns: ['parcel_boundary', 'zoning_code', 'lot_size', 'land_use'],
        useWhen: [
            'zoning',
            'parcel',
            'lot lines',
            'adu',
            'what can i build',
        ],
    },

    // ==========================================
    // NEIGHBORHOOD DATA
    // ==========================================
    neighborhoodscout: {
        capabilities: ['crime_grade', 'neighborhood_data'],
        returns: ['crime_grade', 'violent_crime_rate', 'property_crime_rate'],
        useWhen: [
            'crime rate',
            'safe',
            'crime',
        ],
    },

    greatschools: {
        capabilities: ['nearby_schools', 'school_ratings'],
        returns: ['schools', 'ratings', 'test_scores'],
        useWhen: [
            'school',
            'education',
            'district',
        ],
    },

    census: {
        capabilities: ['demographics', 'income'],
        returns: ['population', 'median_income', 'median_age'],
        useWhen: [
            'demographics',
            'who lives',
            'median income',
            'population',
        ],
    },

    spotcrime: {
        capabilities: ['recent_crimes'],
        returns: ['crime_incidents', 'crime_types'],
        useWhen: [
            'recent crimes',
            'crime incidents',
        ],
    },

    // ==========================================
    // ENVIRONMENTAL DATA
    // ==========================================
    fema: {
        capabilities: ['flood_zone'],
        returns: ['flood_zone', 'flood_zone_description', 'in_floodway'],
        useWhen: [
            'flood',
            'fema',
            'flood insurance',
        ],
    },

    howloud: {
        capabilities: ['noise_score'],
        returns: ['soundscore', 'traffic_noise', 'airport_noise'],
        useWhen: [
            'noise',
            'loud',
            'quiet',
            'traffic noise',
        ],
    },

    usgs: {
        capabilities: ['earthquake_history'],
        returns: ['recent_earthquakes', 'magnitudes'],
        useWhen: [
            'earthquake',
            'seismic',
            'fault',
        ],
    },

    wildfire: {
        capabilities: ['wildfire_risk'],
        returns: ['risk_index', 'risk_category'],
        useWhen: [
            'wildfire',
            'fire risk',
            'fire zone',
        ],
    },

    // ==========================================
    // FINANCIAL DATA
    // ==========================================
    fred: {
        capabilities: ['mortgage_rates'],
        returns: ['mortgage_30yr', 'mortgage_15yr'],
        useWhen: [
            'mortgage rate',
            'interest rate',
        ],
    },

    // ==========================================
    // UTILITIES
    // ==========================================
    broadband: {
        capabilities: ['internet_providers'],
        returns: ['providers', 'max_speeds'],
        useWhen: [
            'internet',
            'wifi',
            'fiber',
            'broadband',
        ],
    },

    // ==========================================
    // AI - PERPLEXITY
    // ==========================================
    perplexity: {
        capabilities: [
            'permit_history',
            'hoa_info',
            'neighborhood_sentiment',
            'upcoming_development',
        ],
        returns: ['web_search_results', 'citations'],
        useWhen: [
            'permit',
            'hoa',
            'neighbors say',
            'reddit',
            'nextdoor',
            'sex offender',
            'development',
            'what is it like',
        ],
    },

    // ==========================================
    // AI - GEMINI VISION
    // ==========================================
    gemini_vision: {
        capabilities: [
            'garage_size',
            'kitchen_condition',
            'natural_light',
            'backyard_privacy',
        ],
        returns: ['visual_analysis', 'measurements'],
        useWhen: [
            'will my car fit',
            'garage size',
            'kitchen updated',
            'natural light',
            'backyard private',
        ],
    },
}

// Extrapolation recipes for complex questions
export const EXTRAPOLATION_RECIPES: Record<string, { dataSources: string[]; logic: string }> = {
    investment_analysis: {
        dataSources: ['estated', 'rentcast', 'mashvisor', 'census', 'neighborhoodscout'],
        logic: 'Calculate ROI, cap rate, cash flow. Compare to market averages. Score 1-100.',
    },
    overpriced_check: {
        dataSources: ['estated', 'simplyrets'],
        logic: 'Compare list price to AVM. Calculate price/sqft vs neighborhood.',
    },
    true_monthly_cost: {
        dataSources: ['simplyrets', 'estated', 'fred'],
        logic: 'Mortgage + tax + insurance + HOA + maintenance.',
    },
    red_flags: {
        dataSources: ['fema', 'neighborhoodscout', 'usgs', 'wildfire', 'epa', 'howloud'],
        logic: 'Scan all sources for issues. Score severity. Return prioritized list.',
    },
}

export type ApiName = keyof typeof API_INDEX
