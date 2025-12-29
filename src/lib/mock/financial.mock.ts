export const mockFred = {
    mortgageRates: {
        series_id: 'MORTGAGE30US',
        title: '30-Year Fixed Rate Mortgage Average in the United States',
        observations: [
            { date: '2024-12-26', value: '6.85' },
            { date: '2024-12-19', value: '6.72' }
        ]
    },
    homePriceIndex: {
        series_id: 'CSUSHPINSA',
        title: 'S&P/Case-Shiller U.S. National Home Price Index',
        observations: [
            { date: '2024-10-01', value: '315.2' }
        ]
    },
    inflation: {
        series_id: 'CPIAUCSL',
        title: 'Consumer Price Index',
        observations: [
            { date: '2024-11-01', value: '315.5' }
        ]
    },
}

export const mockFreddieMac = {
    rates: {
        date: '2024-12-26',
        rate_30yr: 6.85,
        points_30yr: 0.6,
        rate_15yr: 6.0,
        points_15yr: 0.6,
        rate_5yr_arm: 6.25
    },
}

export const mockBls = {
    unemployment: {
        Results: {
            series: [
                {
                    seriesID: 'LASST060000000000003',
                    data: [
                        { year: '2024', period: 'M11', value: '5.2' }
                    ]
                }
            ]
        }
    },
    costOfLiving: {
        value: 285.6,
        area: 'San Francisco-Oakland-Hayward'
    },
}
