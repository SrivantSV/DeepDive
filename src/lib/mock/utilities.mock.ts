export const mockBroadband = {
    providers: {
        providers: [
            { provider_name: 'AT&T Fiber', technology: 'Fiber' as const, max_download_mbps: 5000, max_upload_mbps: 5000 },
            { provider_name: 'Xfinity', technology: 'Cable' as const, max_download_mbps: 1200, max_upload_mbps: 35 }
        ]
    },
}

export const mockFcc = {
    coverage: {
        census_block: '060130101001001',
        has_broadband: true,
        providers_count: 4,
        max_speed_down: 5000,
        max_speed_up: 5000
    },
}

export const mockEnergySage = {
    estimate: {
        system_size_kw: 8.5,
        annual_production_kwh: 12500,
        annual_savings: 2400,
        payback_years: 7.5,
        incentives: { federal: 6500, state: 1500, local: 500 }
    },
}
