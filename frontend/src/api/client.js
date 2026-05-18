import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://restaurant-system-production-95b4.up.railway.app/api/v1'

console.log('🔗 API URL:', API_URL)

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 секунд таймаут
})

// Добавляем токен к каждому запросу
client.interceptors.request.use(
  (config) => {
    console.log('📤 Request:', config.method.toUpperCase(), config.url) // ← ДОБАВЬ
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error) // ← ДОБАВЬ
    return Promise.reject(error)
  }
)

// Обработка ошибок
client.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.config.url, response.status) // ← ДОБАВЬ
    return response
  },
  (error) => {
    console.error('❌ Response Error:', error.message) // ← ДОБАВЬ
    console.error('Error details:', error.response?.data) // ← ДОБАВЬ
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client