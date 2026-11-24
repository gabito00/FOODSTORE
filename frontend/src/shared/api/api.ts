import axios from 'axios'

const localApi = 'http://localhost:8000/api/v1'
const configuredApi = import.meta.env.VITE_API_URL
const useLocalProxy = import.meta.env.DEV && (!configuredApi || configuredApi === localApi)

export const api = axios.create({
  baseURL: useLocalProxy ? '/api/v1' : configuredApi ?? localApi,
  withCredentials: true,
})

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((entry: { msg?: string }) => entry.msg ?? 'Dato inválido').join(', ')
  }
  return 'No se pudo completar la operación.'
}
