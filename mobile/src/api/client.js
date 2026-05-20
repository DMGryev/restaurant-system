import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'https://restaurant-system-production-95b4.up.railway.app/api/v1'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
  // Явно разрешаем все соединения
  validateStatus: (status) => status < 500,
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
    console.log('Request error:', error.message)
    console.log('Error code:', error.code)
    console.log('Error config URL:', error.config?.url)
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token')
      await AsyncStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export default client