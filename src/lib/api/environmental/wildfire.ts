import { createApiClient } from '@/lib/utils/api-client'
import { mockWildfire } from '@/lib/mock/environmental.mock'

const client = createApiClient({
    name: 'Wildfire',
    baseURL: 'https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_Wildfire',
})

export interface WildfireRisk {
    risk_index: number
    risk_category: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High'
    burn_probability: number
    flame_length_class: number
    historical_fires_nearby: number
}

export async function getWildfireRisk(lat: number, lng: number) {
    const geometry = JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } })
    return client.request<WildfireRisk>(
        `/WildfireHazardPotential/MapServer/0/query?geometry=${encodeURIComponent(geometry)}&geometryType=esriGeometryPoint&inSR=4326&outFields=*&returnGeometry=false&f=json`,
        { method: 'GET' },
        mockWildfire.risk
    )
}
