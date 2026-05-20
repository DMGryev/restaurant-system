import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_URL = 'https://restaurant-system-production-95b4.up.railway.app/api/v1'

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Ошибка', 'Введите логин и пароль')
      return
    }

    setLoading(true)

    try {
      // Используем чистый axios без interceptors для диагностики
      const res = await axios({
        method: 'POST',
        url: `${API_URL}/auth/login`,
        data: {
          username: username.trim(),
          password: password,
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
      })

      const { access_token, user } = res.data
      await login(access_token, user)

    } catch (e) {
      const status = e.response?.status
      const detail = e.response?.data?.detail
      const code = e.code
      const message = e.message

      Alert.alert(
        `Ошибка ${status || code || 'неизвестна'}`,
        `Сообщение: ${message}\n` +
        `Код: ${code}\n` +
        `Статус: ${status}\n` +
        `Детали: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`
      )
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      const res = await axios.get(`${API_URL}/health`, { timeout: 10000 })
      Alert.alert('✅ Соединение OK', JSON.stringify(res.data))
    } catch (e) {
      Alert.alert('❌ Нет соединения', `${e.message}\nКод: ${e.code}`)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.title}>RestaurantOS</Text>
        <Text style={styles.subtitle}>Система управления рестораном</Text>

        <TextInput
          style={styles.input}
          placeholder="Логин"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Войти</Text>
          )}
        </TouchableOpacity>

        {/* Кнопка теста соединения */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={testConnection}
        >
          <Text style={styles.testButtonText}>🔍 Тест соединения</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => navigation.navigate('QRScan')}
        >
          <Text style={styles.qrButtonText}>📷 Войти по QR-бейджику</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    width: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: { fontSize: 56 },
  title: { fontSize: 28, fontWeight: '700', color: '#1677ff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#8c8c8c', marginBottom: 32, marginTop: 4 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  button: {
    width: '100%',
    backgroundColor: '#1677ff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  testButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#52c41a',
    width: '100%',
    alignItems: 'center',
  },
  testButtonText: { color: '#52c41a', fontSize: 14 },
  qrButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1677ff',
    width: '100%',
    alignItems: 'center',
  },
  qrButtonText: { color: '#1677ff', fontSize: 15, fontWeight: '500' },
})