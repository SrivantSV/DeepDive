import axios, { AxiosRequestConfig, AxiosError } from 'axios'
import { env } from './env'

interface ApiResponse<T> {
    data: T | null
    error: string | null
    source: 'live' | 'mock'
}

interface ApiClientConfig {
    name: string
    baseURL: string
    headers?: Record<string, string>
    timeout?: number
}

export function createApiClient(config: ApiClientConfig) {
    const client = axios.create({
        baseURL: config.baseURL,
        headers: config.headers,
        timeout: config.timeout || 10000,
    })

    async function request<T>(
        endpoint: string,
        options: AxiosRequestConfig = {},
        mockData: T
    ): Promise<ApiResponse<T>> {
        // Log if enabled
        if (env.logApiCalls) {
            console.log(`[${config.name}] ${options.method || 'GET'} ${endpoint}`)
        }

        try {
            const response = await client.request<T>({
                url: endpoint,
                ...options,
            })

            return {
                data: response.data,
                error: null,
                source: 'live',
            }
        } catch (error) {
            const axiosError = error as AxiosError
            const errorMessage = axiosError.response?.data
                ? JSON.stringify(axiosError.response.data)
                : axiosError.message

            console.error(`[${config.name}] Error: ${errorMessage}`)

            // Return mock data on failure
            return {
                data: mockData,
                error: errorMessage,
                source: 'mock',
            }
        }
    }

    return { request, client }
}
