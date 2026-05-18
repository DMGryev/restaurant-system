import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  init: async () => {
    const token = await AsyncStorage.getItem('token')
    const userStr = await AsyncStorage.getItem('user')
    if (token && userStr) {
      set({
        token,
        user: JSON.parse(userStr),
        isAuthenticated: true,
      })
    }
  },

  login: async (token, user) => {
    await AsyncStorage.setItem('token', token)
    await AsyncStorage.setItem('user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  logout: async () => {
    await AsyncStorage.removeItem('token')
    await AsyncStorage.removeItem('user')
    set({ token: null, user: null, isAuthenticated: false })
  },
}))

export default useAuthStore