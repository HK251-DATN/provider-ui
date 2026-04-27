import axios, { type AxiosInstance } from 'axios'
import SERVICES from '@/config/services'

function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15_000 })

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    },
  )

  return client
}

export const identityApi       = createClient(SERVICES.identity)
export const backOfficeApi     = createClient(SERVICES.backOffice)
export const productStorageApi = createClient(SERVICES.productStorage)
export const ecommerceApi      = createClient(SERVICES.ecommerce)
