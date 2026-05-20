import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Cloudflare Worker решает проблему SSL на Android
const API_URL = 'https://curly-glade-0d00.perpleepel19.workers.dev/api/v1'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
})

client.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    console.log('AsyncStorage error:', e)
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token')
      await AsyncStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export default client