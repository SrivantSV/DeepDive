import { createApiClient } from '@/lib/utils/api-client'
import { mockFema } from '@/lib/mock/environmental.mock'

const client = createApiClient({
    name: 'FEMA',
    baseURL: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer',
})

export interface FloodZoneData {
    flood_zone: string
    flood_zone_description: string
    base_flood_elevation: number | null
    in_floodway: boolean
    panel_number: string
    community_id: string
}

export async function getFloodZone(lat: number, lng: number) {
    const geometry = JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } })
    return client.request<FloodZoneData>(
        `/28/query?geometry=${encodeURIComponent(geometry)}&geometryType=esriGeometryPoint&inSR=4326&outFields=*&returnGeometry=false&f=json`,
        { method: 'GET' },
        mockFema.floodZone
    )
}
