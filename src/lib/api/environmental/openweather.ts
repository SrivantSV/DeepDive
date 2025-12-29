import { createApiClient } from '@/lib/utils/api-client'
import { env, shouldUseMock } from '@/lib/utils/env'
import { mockOpenWeather } from '@/lib/mock/environmental.mock'

const client = createApiClient({
    name: 'OpenWeather',
    baseURL: 'https://api.openweathermap.org/data/2.5',
})

export interface CurrentWeather {
    temp: number
    feels_like: number
    humidity: number
    wind_speed: number
    description: string
    uvi: number
}

export interface WeatherForecast {
    daily: Array<{
        date: string
        temp_high: number
        temp_low: number
        description: string
        precipitation_chance: number
    }>
}

export async function getCurrentWeather(lat: number, lng: number) {
    if (shouldUseMock('openweather')) {
        return { data: mockOpenWeather.current, error: null, source: 'mock' as const }
    }
    return client.request<CurrentWeather>(
        `/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${env.openweather.apiKey}`,
        { method: 'GET' },
        mockOpenWeather.current
    )
}

export async function getWeatherForecast(lat: number, lng: number) {
    if (shouldUseMock('openweather')) {
        return { data: mockOpenWeather.forecast, error: null, source: 'mock' as const }
    }
    return client.request<WeatherForecast>(
        `/onecall?lat=${lat}&lon=${lng}&units=imperial&exclude=minutely,hourly&appid=${env.openweather.apiKey}`,
        { method: 'GET' },
        mockOpenWeather.forecast
    )
}
