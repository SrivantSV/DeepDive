export const mockGooglePlaces = {
    nearbySearch: {
        places: [
            {
                id: 'mock-place-1',
                displayName: { text: 'Whole Foods Market' },
                formattedAddress: '123 Main St, San Francisco, CA 94102',
                location: { latitude: 37.7849, longitude: -122.4094 },
                rating: 4.3,
                userRatingCount: 1250,
                priceLevel: 'PRICE_LEVEL_MODERATE',
                types: ['grocery_store', 'supermarket'],
                regularOpeningHours: {
                    openNow: true,
                    weekdayDescriptions: ['Monday: 8:00 AM – 10:00 PM'],
                },
            },
            {
                id: 'mock-place-2',
                displayName: { text: "Trader Joe's" },
                formattedAddress: '456 Market St, San Francisco, CA 94102',
                location: { latitude: 37.7851, longitude: -122.4084 },
                rating: 4.5,
                userRatingCount: 2100,
                priceLevel: 'PRICE_LEVEL_INEXPENSIVE',
                types: ['grocery_store', 'supermarket'],
            },
        ],
    },
    placeDetails: {
        id: 'mock-place-1',
        displayName: { text: 'Whole Foods Market' },
        formattedAddress: '123 Main St, San Francisco, CA 94102',
        location: { latitude: 37.7849, longitude: -122.4094 },
        rating: 4.3,
        userRatingCount: 1250,
        priceLevel: 'PRICE_LEVEL_MODERATE',
        types: ['grocery_store', 'supermarket'],
        websiteUri: 'https://www.wholefoodsmarket.com',
        nationalPhoneNumber: '(415) 555-0123',
        regularOpeningHours: {
            openNow: true,
            weekdayDescriptions: [
                'Monday: 8:00 AM – 10:00 PM',
                'Tuesday: 8:00 AM – 10:00 PM',
                'Wednesday: 8:00 AM – 10:00 PM',
                'Thursday: 8:00 AM – 10:00 PM',
                'Friday: 8:00 AM – 10:00 PM',
                'Saturday: 8:00 AM – 10:00 PM',
                'Sunday: 9:00 AM – 9:00 PM',
            ],
        },
    },
    textSearch: {
        places: [
            {
                id: 'mock-school-1',
                displayName: { text: 'Lincoln Elementary School' },
                formattedAddress: '789 Education Ave, San Francisco, CA 94102',
                location: { latitude: 37.7855, longitude: -122.4070 },
                rating: 4.2,
                types: ['school', 'primary_school'],
            },
        ],
    },
}

export const mockGoogleRoutes = {
    computeRoute: {
        routes: [
            {
                duration: '1845s', // ~31 minutes
                distanceMeters: 15200,
                staticDuration: '1200s', // ~20 minutes without traffic
                polyline: { encodedPolyline: 'mock_encoded_polyline' },
                travelAdvisory: {
                    tollInfo: {
                        estimatedPrice: [{ currencyCode: 'USD', units: '7' }],
                    },
                },
            },
        ],
    },
}

export const mockGoogleElevation = {
    point: {
        results: [
            {
                elevation: 52.3,
                location: { lat: 37.7849, lng: -122.4094 },
                resolution: 4.771975994110107,
            },
        ],
        status: 'OK',
    },
    path: {
        results: [
            { elevation: 52.3, location: { lat: 37.7849, lng: -122.4094 }, resolution: 4.77 },
            { elevation: 54.1, location: { lat: 37.7850, lng: -122.4093 }, resolution: 4.77 },
        ],
        status: 'OK',
    },
}

export const mockGoogleGeocoding = {
    geocode: {
        results: [
            {
                formatted_address: '1148 Greenbrook Drive, Danville, CA 94526, USA',
                geometry: {
                    location: { lat: 37.8044, lng: -121.9523 },
                    location_type: 'ROOFTOP',
                },
                address_components: [
                    { long_name: '1148', short_name: '1148', types: ['street_number'] },
                    { long_name: 'Greenbrook Drive', short_name: 'Greenbrook Dr', types: ['route'] },
                    { long_name: 'Danville', short_name: 'Danville', types: ['locality'] },
                    { long_name: 'Contra Costa County', short_name: 'Contra Costa County', types: ['administrative_area_level_2'] },
                    { long_name: 'California', short_name: 'CA', types: ['administrative_area_level_1'] },
                    { long_name: 'United States', short_name: 'US', types: ['country'] },
                    { long_name: '94526', short_name: '94526', types: ['postal_code'] },
                ],
                place_id: 'mock_place_id_123',
            },
        ],
        status: 'OK',
    },
    reverse: {
        results: [
            {
                formatted_address: '1148 Greenbrook Drive, Danville, CA 94526, USA',
                geometry: {
                    location: { lat: 37.8044, lng: -121.9523 },
                    location_type: 'ROOFTOP',
                },
                address_components: [],
                place_id: 'mock_place_id_123',
            },
        ],
        status: 'OK',
    },
}

export const mockGoogleAirQuality = {
    current: {
        dateTime: new Date().toISOString(),
        indexes: [
            {
                code: 'uaqi',
                displayName: 'Universal AQI',
                aqi: 42,
                aqiDisplay: '42',
                color: { red: 0.2, green: 0.8, blue: 0.2 },
                category: 'Good',
                dominantPollutant: 'pm25',
            },
        ],
        pollutants: [
            { code: 'pm25', displayName: 'PM2.5', concentration: { value: 8.5, units: 'MICROGRAMS_PER_CUBIC_METER' } },
            { code: 'pm10', displayName: 'PM10', concentration: { value: 15.2, units: 'MICROGRAMS_PER_CUBIC_METER' } },
            { code: 'o3', displayName: 'Ozone', concentration: { value: 45, units: 'PARTS_PER_BILLION' } },
        ],
        healthRecommendations: {
            generalPopulation: 'Air quality is satisfactory. No health impacts expected.',
            elderly: 'Air quality is good. Enjoy outdoor activities.',
            lungDiseasePopulation: 'Air quality is acceptable.',
            heartDiseasePopulation: 'Air quality is acceptable.',
            athletes: 'Great conditions for outdoor exercise.',
            pregnantWomen: 'Air quality is good.',
            children: 'Air quality is good for outdoor play.',
        },
    },
}

export const mockGooglePollen = {
    forecast: {
        regionCode: 'US',
        dailyInfo: [
            {
                date: { year: 2024, month: 12, day: 28 },
                pollenTypeInfo: [
                    {
                        code: 'TREE',
                        displayName: 'Tree',
                        indexInfo: {
                            code: 'UPI',
                            displayName: 'Universal Pollen Index',
                            value: 2,
                            category: 'Low',
                            indexDescription: 'Low pollen levels',
                            color: { red: 0.2, green: 0.8, blue: 0.2 },
                        },
                        healthRecommendations: ['Pollen levels are low today.'],
                    },
                    {
                        code: 'GRASS',
                        displayName: 'Grass',
                        indexInfo: {
                            code: 'UPI',
                            displayName: 'Universal Pollen Index',
                            value: 1,
                            category: 'Very Low',
                            indexDescription: 'Very low pollen levels',
                            color: { red: 0.1, green: 0.9, blue: 0.1 },
                        },
                        healthRecommendations: ['Great day for outdoor activities.'],
                    },
                ],
            },
        ],
    },
}

export const mockGoogleSolar = {
    buildingInsights: {
        name: 'buildings/mock_building_123',
        center: { latitude: 37.8044, longitude: -121.9523 },
        imageryDate: { year: 2023, month: 6, day: 15 },
        postalCode: '94526',
        administrativeArea: 'CA',
        statisticalArea: 'San Francisco-Oakland-Hayward, CA',
        regionCode: 'US',
        solarPotential: {
            maxArrayPanelsCount: 32,
            maxArrayAreaMeters2: 52.5,
            maxSunshineHoursPerYear: 1825,
            carbonOffsetFactorKgPerMwh: 428.9,
            panelCapacityWatts: 400,
            panelHeightMeters: 1.65,
            panelWidthMeters: 0.992,
            panelLifetimeYears: 25,
            financialAnalyses: [
                {
                    monthlyBill: { currencyCode: 'USD', units: '150' },
                    panelConfigIndex: 0,
                    financialDetails: {
                        initialAcKwhPerYear: 11680,
                        remainingLifetimeUtilityBill: { currencyCode: 'USD', units: '8500' },
                        federalIncentive: { currencyCode: 'USD', units: '7800' },
                        costOfElectricityWithoutSolar: { currencyCode: 'USD', units: '45000' },
                        netMeteringAllowed: true,
                        solarPercentage: 95,
                        percentageExportedToGrid: 25,
                    },
                },
            ],
        },
    },
}
