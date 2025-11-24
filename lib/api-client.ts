import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

export class ApiClient {
  private client: AxiosInstance

  constructor(baseURL: string, headers?: Record<string, string>) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 30000,
    })
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

export function createRateLimiter(requestsPerMinute: number) {
  const queue: Array<() => void> = []
  let requestCount = 0
  const interval = 60000 / requestsPerMinute

  setInterval(() => {
    requestCount = 0
  }, 60000)

  return async function<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        if (requestCount < requestsPerMinute) {
          requestCount++
          try {
            const result = await fn()
            resolve(result)
          } catch (error) {
            reject(error)
          }
        } else {
          setTimeout(execute, interval)
        }
      }
      execute()
    })
  }
}
