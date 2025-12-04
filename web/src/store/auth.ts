import { create } from 'zustand'
import http from '../api/http'

type State = { token: string | null; login: (u: string, p: string) => Promise<void>; register: (u: string, p: string, r: string, ph?: string) => Promise<void>; logout: () => void }

export const useAuthStore = create<State>(set => ({
  token: localStorage.getItem('authToken') || null,
  async login(username, password) {
    const res = await http.post('/auth/login', { username, password })
    const token = res.data.data
    set({ token })
    localStorage.setItem('authToken', token)
  },
  async register(username, password, realName, phone) {
    await http.post('/auth/register', { username, password, realName, phone })
  },
  logout() {
    set({ token: null })
    localStorage.removeItem('authToken')
  }
}))

