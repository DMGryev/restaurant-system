import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { apiRequest } from '../api/client'
import useAuthStore from '../store/authStore'

const WORKER = 'https://curly-glade-0d00.perpleepel19.workers.dev/api/v1'

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const testConnection = async () => {
    try {
      const r = await fetch(WORKER + '/health')
      const t = await r.text()
      Alert.alert('Тест: ' + r.status, t)
    } catch (e) {
      Alert.alert('Ошибка', e.message)
    }
  }

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Ошибка', 'Введите логин и пароль')
      return
    }
    setLoading(true)
    try {
      const { ok, status, data } = await apiRequest(
        'POST',
        '/auth/login',
        { username: username.trim(), password }
      )

      if (ok && data.access_token) {
        await login(data.access_token, data.user)
      } else {
        Alert.alert(
          `Ошибка ${status}`,
          typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data)
        )
      }
    } catch (e) {
      Alert.alert('Ошибка сети', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.title}>RestaurantOS</Text>

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
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Войти</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testBtn}
          onPress={testConnection}
        >
          <Text style={styles.testText}>🔍 Тест соединения</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.qrBtn}
          onPress={() => navigation.navigate('QRScan')}
        >
          <Text style={styles.qrText}>📷 Войти по QR</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    width: 380,
    alignItems: 'center',
    elevation: 8,
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1677ff',
    marginBottom: 24,
    marginTop: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    width: '100%',
    backgroundColor: '#1677ff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  testBtn: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#52c41a',
    width: '100%',
    alignItems: 'center',
  },
  testText: { color: '#52c41a', fontSize: 13 },
  qrBtn: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1677ff',
    width: '100%',
    alignItems: 'center',
  },
  qrText: { color: '#1677ff', fontSize: 13 },
})