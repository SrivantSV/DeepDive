import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockGreatSchools } from '@/lib/mock/neighborhood.mock'

const client = createApiClient({
    name: 'GreatSchools',
    baseURL: 'https://gs-api.greatschools.org',
})

export interface School {
    id: string
    name: string
    type: 'public' | 'private' | 'charter'
    gradeRange: string
    rating: number
    address: string
    phone: string
    website: string
    distance: number
    enrollment: number
    studentTeacherRatio: number
    testScores: { math: number; reading: number }
}

export interface SchoolsResponse {
    schools: School[]
}

export async function getNearbySchools(lat: number, lng: number, radius: number = 5) {
    if (shouldUseMock('greatschools')) {
        return { data: mockGreatSchools.schools, error: null, source: 'mock' as const }
    }
    return client.request<SchoolsResponse>(
        `/schools/nearby?lat=${lat}&lon=${lng}&radius=${radius}&key=${env.greatschools.apiKey}`,
        { method: 'GET' },
        mockGreatSchools.schools
    )
}

export async function getSchoolDetails(schoolId: string) {
    if (shouldUseMock('greatschools')) {
        return { data: mockGreatSchools.school, error: null, source: 'mock' as const }
    }
    return client.request<School>(
        `/schools/${schoolId}?key=${env.greatschools.apiKey}`,
        { method: 'GET' },
        mockGreatSchools.school
    )
}
