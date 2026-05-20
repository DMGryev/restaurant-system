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
import client from '../api/client'
import useAuthStore from '../store/authStore'

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
      console.log('Попытка входа:', username)
      console.log('URL:', client.defaults.baseURL + '/auth/login')

      const res = await client.post('/auth/login', {
        username: username.trim(),
        password: password,
      })

      console.log('Ответ:', JSON.stringify(res.data))

      const { access_token, user } = res.data
      await login(access_token, user)

    } catch (e) {
      // Показываем максимум информации об ошибке
      const status = e.response?.status
      const detail = e.response?.data?.detail
      const data = e.response?.data
      const message = e.message

      Alert.alert(
        `Ошибка ${status || 'сети'}`,
        `URL: ${client.defaults.baseURL}/auth/login\n\n` +
        `Сообщение: ${message}\n\n` +
        `Ответ: ${JSON.stringify(data) || 'нет ответа'}`
      )
    } finally {
      setLoading(false)
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
          keyboardType="default"
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1677ff',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8c8c8c',
    marginBottom: 32,
    marginTop: 4,
  },
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1677ff',
    width: '100%',
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#1677ff',
    fontSize: 15,
    fontWeight: '500',
  },
})