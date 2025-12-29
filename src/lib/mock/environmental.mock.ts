export const mockFema = {
    floodZone: {
        flood_zone: 'X',
        flood_zone_description: 'Area of minimal flood hazard',
        base_flood_elevation: null,
        in_floodway: false,
        panel_number: '06013C0100J',
        community_id: '060025'
    },
}

export const mockHowLoud = {
    score: {
        soundscore: 78,
        traffic_score: 72,
        airport_score: 95,
        local_score: 80,
        category: 'Quiet' as const
    },
}

export const mockAirNow = {
    current: [
        {
            DateObserved: '2024-12-28',
            HourObserved: 14,
            LocalTimeZone: 'PST',
            ReportingArea: 'San Francisco Bay Area',
            StateCode: 'CA',
            Latitude: 37.8044,
            Longitude: -121.9523,
            ParameterName: 'PM2.5',
            AQI: 42,
            Category: { Number: 1, Name: 'Good' }
        }
    ],
    forecast: [
        {
            DateObserved: '2024-12-29',
            HourObserved: 0,
            LocalTimeZone: 'PST',
            ReportingArea: 'San Francisco Bay Area',
            StateCode: 'CA',
            Latitude: 37.8044,
            Longitude: -121.9523,
            ParameterName: 'PM2.5',
            AQI: 38,
            Category: { Number: 1, Name: 'Good' }
        }
    ],
}

export const mockUsgs = {
    earthquakes: {
        features: [
            {
                properties: { mag: 2.8, place: '5km NW of Danville, CA', time: Date.now() - 86400000 * 30 },
                geometry: { coordinates: [-122.0, 37.82, 8.5] as [number, number, number] }
            },
            {
                properties: { mag: 3.2, place: '10km E of Livermore, CA', time: Date.now() - 86400000 * 60 },
                geometry: { coordinates: [-121.7, 37.68, 10.2] as [number, number, number] }
            }
        ]
    },
}

export const mockEpa = {
    superfund: [],
    tri: [
        {
            name: 'Industrial Facility XYZ',
            address: '1000 Industrial Way',
            city: 'Danville',
            state: 'CA',
            zip: '94526',
            type: 'TRI' as const,
            distance_miles: 3.5,
            status: 'Active'
        }
    ],
}

export const mockWildfire = {
    risk: {
        risk_index: 2,
        risk_category: 'Low' as const,
        burn_probability: 0.02,
        flame_length_class: 1,
        historical_fires_nearby: 0
    },
}

export const mockNoaa = {
    climate: {
        avg_temp_annual: 58,
        avg_temp_jan: 48,
        avg_temp_jul: 72,
        avg_precip_annual: 22,
        avg_snowfall_annual: 0,
        sunshine_days: 260
    },
    station: {
        id: 'GHCND:USW00023272',
        name: 'LIVERMORE MUNICIPAL AIRPORT'
    },
}

export const mockOpenWeather = {
    current: {
        temp: 62,
        feels_like: 60,
        humidity: 55,
        wind_speed: 8,
        description: 'Partly cloudy',
        uvi: 3
    },
    forecast: {
        daily: [
            { date: '2024-12-29', temp_high: 65, temp_low: 48, description: 'Sunny', precipitation_chance: 0 }
        ]
    },
}
