import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../../shared/api/api'

export interface User { id: number; username: string; full_name: string; email: string; role: 'user' | 'admin'; disabled: boolean }
interface AuthState {
  user: User | null
  checking: boolean
  checkSession: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clear: () => void
}

export const useAuth = create<AuthState>()(persist((set) => ({
  user: null, checking: true,
  checkSession: async () => {
    set({ checking: true })
    try { set({ user: (await api.get<User>('/auth/me')).data }) }
    catch { set({ user: null }) }
    finally { set({ checking: false }) }
  },
  login: async (username, password) => {
    await api.post('/auth/token', new URLSearchParams({ username, password }))
    set({ user: (await api.get<User>('/auth/me')).data })
  },
  logout: async () => { try { await api.post('/auth/logout') } finally { set({ user: null }) } },
  clear: () => set({ user: null, checking: false }),
}), { name: 'food-store-session', partialize: (state) => ({ user: state.user }) }))

api.interceptors.response.use((response) => response, (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response as { status?: number; data?: { detail?: string } } | undefined
    const url = (error as { config?: { url?: string } }).config?.url ?? ''
    if ((response?.status === 401 && !['/auth/token', '/auth/me'].includes(url)) ||
        (response?.status === 400 && response.data?.detail === 'Cuenta de usuario desactivada')) useAuth.getState().clear()
  }
  return Promise.reject(error)
})
