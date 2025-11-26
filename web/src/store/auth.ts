import { create } from 'zustand'
import http from '../api/http'

type State = { token: string | null; login: (u: string, p: string) => Promise<void>; register: (u: string, p: string) => Promise<void>; logout: () => void }

export const useAuthStore = create<State>(set => ({
  token: null,
  async login(username, password) {
    const res = await http.post('/auth/login', { username, password })
    set({ token: res.data.data })
  },
  async register(username, password) {
    await http.post('/auth/register', { username, password })
  },
  logout() {
    set({ token: null })
  }
}))

