export const mockNeighborhoodScout = {
    neighborhood: {
        name: 'Greenbrook',
        city: 'Danville',
        state: 'CA',
        crime: {
            overall_grade: 'A',
            violent_crime_index: 12,
            property_crime_index: 18,
            crime_rate_per_100k: 1250,
            comparison_to_national: '65% lower than national average',
        },
        appreciation_forecast: 4.5,
        median_income: 185000,
        diversity_index: 0.45,
        school_rating: 9,
    },
    crime: {
        overall_grade: 'A',
        violent_crime_index: 12,
        property_crime_index: 18,
        crime_rate_per_100k: 1250,
        comparison_to_national: '65% lower than national average',
    },
}

export const mockGreatSchools = {
    schools: {
        schools: [
            { id: 'gs-1', name: 'Greenbrook Elementary', type: 'public' as const, gradeRange: 'K-5', rating: 9, address: '100 School Lane, Danville, CA 94526', phone: '925-555-0100', website: 'https://greenbrook.school', distance: 0.5, enrollment: 450, studentTeacherRatio: 22, testScores: { math: 85, reading: 88 } },
            { id: 'gs-2', name: 'Danville Middle School', type: 'public' as const, gradeRange: '6-8', rating: 8, address: '200 Education Blvd, Danville, CA 94526', phone: '925-555-0200', website: 'https://danvillemiddle.school', distance: 1.2, enrollment: 850, studentTeacherRatio: 24, testScores: { math: 82, reading: 85 } },
        ],
    },
    school: { id: 'gs-1', name: 'Greenbrook Elementary', type: 'public' as const, gradeRange: 'K-5', rating: 9, address: '100 School Lane, Danville, CA 94526', phone: '925-555-0100', website: 'https://greenbrook.school', distance: 0.5, enrollment: 450, studentTeacherRatio: 22, testScores: { math: 85, reading: 88 } },
}

export const mockCensus = {
    demographics: {
        total_population: 45000,
        median_age: 42,
        median_household_income: 175000,
        poverty_rate: 3.2,
        unemployment_rate: 2.8,
        education_bachelors_or_higher: 68,
        owner_occupied_percent: 82,
        median_home_value: 1350000,
        median_rent: 3200,
        average_household_size: 2.8,
        commute_time_average: 32,
    },
}

export const mockSpotCrime = {
    incidents: {
        crimes: [
            { id: 'sc-1', type: 'Theft' as const, date: '2024-12-15', time: '14:30', address: '500 Main St', lat: 37.8050, lng: -121.9520, description: 'Vehicle break-in reported' },
            { id: 'sc-2', type: 'Vandalism' as const, date: '2024-12-10', time: '22:15', address: '750 Oak Ave', lat: 37.8055, lng: -121.9510, description: 'Graffiti on fence' },
        ],
    },
}

export const mockFbiUcr = {
    stateStats: {
        results: [
            { year: 2023, population: 39500000, violent_crime_rate: 442, property_crime_rate: 2450, murder_rate: 5.2, robbery_rate: 113, aggravated_assault_rate: 281, burglary_rate: 348, larceny_rate: 1850, motor_vehicle_theft_rate: 252 }
        ]
    },
    agencyStats: {
        results: [
            { year: 2023, population: 45000, violent_crime_rate: 125, property_crime_rate: 1100, murder_rate: 0, robbery_rate: 15, aggravated_assault_rate: 85, burglary_rate: 180, larceny_rate: 850, motor_vehicle_theft_rate: 70 }
        ]
    },
}
