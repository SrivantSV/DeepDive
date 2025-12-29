export const mockSimplyRETS = {
    listings: [
        {
            mlsId: 12345678,
            listPrice: 1250000,
            listDate: '2024-11-15',
            property: {
                type: 'Residential',
                subType: 'Single Family Residence',
                bedrooms: 4,
                bathsFull: 3,
                bathsHalf: 1,
                area: 2850,
                lotSize: '0.25 acres',
                yearBuilt: 2005,
                stories: 2,
                garageSpaces: 2,
                parking: { spaces: 2, description: '2 Car Attached' },
                pool: 'None',
                view: 'Mountain',
                subdivision: 'Greenbrook Estates',
            },
            address: {
                streetNumber: '1148',
                streetName: 'Greenbrook',
                streetSuffix: 'Drive',
                city: 'Danville',
                state: 'CA',
                postalCode: '94526',
                full: '1148 Greenbrook Drive, Danville, CA 94526',
            },
            geo: { lat: 37.8044, lng: -121.9523 },
            photos: [
                'https://d2bd5h5te3s67r.cloudfront.net/photo1.jpg',
                'https://d2bd5h5te3s67r.cloudfront.net/photo2.jpg',
                'https://d2bd5h5te3s67r.cloudfront.net/photo3.jpg',
            ],
            remarks: 'Beautiful single-family home in desirable Greenbrook Estates. Features include updated kitchen with granite countertops, hardwood floors, and spacious backyard.',
            agent: {
                firstName: 'Jane',
                lastName: 'Smith',
                contact: { office: '925-555-0100', cell: '925-555-0101', email: 'jane@example.com' },
            },
            office: {
                name: 'Coldwell Banker',
                contact: { office: '925-555-0100' },
            },
            mls: {
                status: 'Active',
                daysOnMarket: 45,
                originalEntryTimestamp: '2024-11-15T10:00:00Z',
                lastModifiedTimestamp: '2024-12-20T15:30:00Z',
            },
        },
    ],
    listing: {
        mlsId: 12345678,
        listPrice: 1250000,
        listDate: '2024-11-15',
        property: {
            type: 'Residential',
            subType: 'Single Family Residence',
            bedrooms: 4,
            bathsFull: 3,
            bathsHalf: 1,
            area: 2850,
            lotSize: '0.25 acres',
            yearBuilt: 2005,
            stories: 2,
            garageSpaces: 2,
            parking: { spaces: 2, description: '2 Car Attached' },
            pool: 'None',
            view: 'Mountain',
            subdivision: 'Greenbrook Estates',
        },
        address: {
            streetNumber: '1148',
            streetName: 'Greenbrook',
            streetSuffix: 'Drive',
            city: 'Danville',
            state: 'CA',
            postalCode: '94526',
            full: '1148 Greenbrook Drive, Danville, CA 94526',
        },
        geo: { lat: 37.8044, lng: -121.9523 },
        photos: [
            'https://d2bd5h5te3s67r.cloudfront.net/photo1.jpg',
            'https://d2bd5h5te3s67r.cloudfront.net/photo2.jpg',
        ],
        remarks: 'Beautiful single-family home in desirable Greenbrook Estates.',
        agent: {
            firstName: 'Jane',
            lastName: 'Smith',
            contact: { office: '925-555-0100', cell: '925-555-0101', email: 'jane@example.com' },
        },
        office: { name: 'Coldwell Banker', contact: { office: '925-555-0100' } },
        mls: { status: 'Active', daysOnMarket: 45, originalEntryTimestamp: '2024-11-15T10:00:00Z', lastModifiedTimestamp: '2024-12-20T15:30:00Z' },
    },
}

export const mockEstated = {
    property: {
        property: {
            address: {
                street_address: '1148 Greenbrook Drive',
                city: 'Danville',
                state: 'CA',
                zip_code: '94526',
                formatted_street_address: '1148 Greenbrook Dr',
            },
            parcel: {
                apn_original: '123-456-789',
                apn_unformatted: '123456789',
                county: 'Contra Costa',
                fips_code: '06013',
            },
            structure: {
                year_built: 2005,
                effective_year_built: 2010,
                bedrooms: 4,
                bathrooms: 3.5,
                total_area_sq_ft: 2850,
                building_area_sq_ft: 2850,
                stories: 2,
                units: 1,
                construction_type: 'Wood Frame',
                roof_type: 'Tile',
                foundation_type: 'Concrete Slab',
                heating_type: 'Forced Air',
                cooling_type: 'Central',
                pool: false,
                garage_spaces: 2,
            },
            lot: {
                lot_size_sq_ft: 10890,
                lot_size_acres: 0.25,
                zoning: 'R-1',
                land_use: 'Single Family Residential',
            },
        },
        valuation: {
            value: 1285000,
            value_low: 1200000,
            value_high: 1370000,
            date: '2024-12-01',
        },
        owner: {
            name: 'John Doe',
            mailing_address: {
                street_address: '1148 Greenbrook Drive',
                city: 'Danville',
                state: 'CA',
                zip_code: '94526',
            },
            owner_occupied: true,
        },
        taxes: {
            year: 2024,
            amount: 14500,
            exemptions: ['Homeowner'],
        },
        deeds: [
            {
                document_type: 'Grant Deed',
                recording_date: '2018-05-15',
                sale_price: 985000,
                buyer_names: ['John Doe', 'Jane Doe'],
                seller_names: ['Robert Smith'],
            },
        ],
        mortgages: [
            {
                lender_name: 'Wells Fargo',
                amount: 788000,
                date: '2018-05-15',
                loan_type: 'Conventional',
                interest_rate: 4.25,
                term_years: 30,
            },
        ],
    },
}

export const mockRentcast = {
    estimate: {
        rent: 4200,
        rentRangeLow: 3800,
        rentRangeHigh: 4600,
        latitude: 37.8044,
        longitude: -121.9523,
        comparables: [
            { address: '1150 Greenbrook Dr', rent: 4100, bedrooms: 4, bathrooms: 3, squareFootage: 2700, distance: 0.1, daysOld: 15 },
            { address: '1122 Greenbrook Dr', rent: 4300, bedrooms: 4, bathrooms: 3, squareFootage: 2900, distance: 0.2, daysOld: 30 },
        ],
    },
    market: {
        zipCode: '94526',
        medianRent: 3800,
        averageRent: 3950,
        rentGrowth1Year: 5.2,
        vacancyRate: 3.5,
    },
}

export const mockMashvisor = {
    analysis: {
        property: { address: '1148 Greenbrook Drive', city: 'Danville', state: 'CA', zip: '94526' },
        rental_data: { traditional_rent: 4200, airbnb_rent: 6500, airbnb_occupancy: 72 },
        investment_data: { cash_on_cash: 5.8, cap_rate: 4.2, roi: 12.5, payback_years: 8.5 },
        neighborhood: { investment_score: 78, rental_demand: 'High', optimal_strategy: 'Traditional' as const },
    },
    neighborhood: {
        name: 'Greenbrook',
        city: 'Danville',
        investment_score: 78,
        median_price: 1350000,
        price_appreciation: 8.5,
        rental_yield: 3.8,
    },
}

export const mockRegrid = {
    parcel: {
        type: 'Feature' as const,
        geometry: {
            type: 'Polygon' as const,
            coordinates: [[[-121.9530, 37.8040], [-121.9520, 37.8040], [-121.9520, 37.8050], [-121.9530, 37.8050], [-121.9530, 37.8040]]],
        },
        properties: {
            apn: '123-456-789',
            address: '1148 Greenbrook Drive',
            owner: 'John Doe',
            zoning: 'R-1-10',
            zoning_description: 'Single Family Residential - 10,000 sqft minimum',
            land_use: 'SFR',
            land_use_description: 'Single Family Residential',
            lot_size_sqft: 10890,
            lot_size_acres: 0.25,
            lot_width_ft: 75,
            lot_depth_ft: 145,
            legal_description: 'LOT 25 BLK 3 GREENBROOK ESTATES',
            subdivision: 'Greenbrook Estates',
            census_tract: '3150.01',
            fips: '06013',
            county: 'Contra Costa',
            state: 'CA',
        },
    },
}
