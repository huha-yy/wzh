import { create } from 'zustand'
import http from '../api/http'

interface UserProfile {
  id: number
  username: string
  realName: string
  phone: string
  status: number
  roles: string[]
}

type State = { 
  token: string | null; 
  userProfile: UserProfile | null;
  login: (u: string, p: string) => Promise<void>; 
  register: (u: string, p: string, r: string, ph?: string) => Promise<void>; 
  logout: () => void;
  fetchUserProfile: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<State>((set, get) => ({
  token: localStorage.getItem('authToken') || null,
  userProfile: null,
  async login(username, password) {
    const res = await http.post('/auth/login', { username, password })
    if (!res.data || res.data.code !== 0) {
      throw new Error(res.data?.message || '登录失败')
    }
    const token = res.data.data
    set({ token })
    localStorage.setItem('authToken', token)
    await get().fetchUserProfile()
  },
  async register(username, password, realName, phone) {
    await http.post('/auth/register', { username, password, realName, phone })
  },
  logout() {
    set({ token: null, userProfile: null })
    localStorage.removeItem('authToken')
  },
  async fetchUserProfile() {
    try {
      const res = await http.get('/user/profile')
      set({ userProfile: res.data.data })
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  },
  hasRole(role: string) {
    const { userProfile } = get()
    return userProfile?.roles.includes(role) || false
  },
  hasAnyRole(roles: string[]) {
    const { userProfile } = get()
    if (!userProfile) return false
    return roles.some(role => userProfile.roles.includes(role))
  }
}))

