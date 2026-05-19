// mobile/src/screens/DashboardScreen.js
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import useAuthStore from '../store/authStore'

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍽️</Text>
      <Text style={styles.title}>RestaurantOS</Text>
      <Text style={styles.subtitle}>
        Добро пожаловать, {user?.full_name}!
      </Text>
      <Text style={styles.role}>Роль: {user?.role}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1677ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#262626',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#8c8c8c',
    marginBottom: 40,
  },
  logoutBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#ff4d4f',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})