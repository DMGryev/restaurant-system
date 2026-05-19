// mobile/src/screens/KitchenScreen.js
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import client from '../api/client'
import useAuthStore from '../store/authStore'

export default function KitchenScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    try {
      const res = await client.get('/orders/', {
        params: { status: 'preparing', limit: 50 },
      })
      setOrders(res.data)
    } catch (e) {
      if (e.response?.status === 401) logout()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const markReady = async (orderId) => {
    try {
      await client.patch(`/orders/${orderId}`, { status: 'ready' })
      loadOrders()
    } catch {
      Alert.alert('Ошибка', 'Не удалось обновить статус')
    }
  }

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNum}>#{item.order_number}</Text>
        <Text style={styles.time}>
          {new Date(item.created_at).toLocaleTimeString('ru')}
        </Text>
      </View>

      {item.items?.map((i, idx) => (
        <Text key={idx} style={styles.item}>
          • {i.quantity}x {i.menu_item?.name || 'Блюдо'}
          {i.notes ? `  (${i.notes})` : ''}
        </Text>
      ))}

      <TouchableOpacity
        style={styles.readyBtn}
        onPress={() =>
          Alert.alert('Готово?', `Заказ #${item.order_number} готов?`, [
            { text: 'Нет', style: 'cancel' },
            { text: '✅ Готово', onPress: () => markReady(item.id) },
          ])
        }
      >
        <Text style={styles.readyBtnText}>✅ Готово</Text>
      </TouchableOpacity>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fa8c16" />
        <Text style={{ marginTop: 12, color: '#8c8c8c' }}>
          Загружаем заказы...
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Кухня</Text>
        <Text style={styles.count}>{orders.length} заказов</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrder}
        numColumns={2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadOrders() }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyText}>Все заказы выполнены!</Text>
          </View>
        }
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ gap: 12 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#262626',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', flex: 1 },
  count: {
    fontSize: 14,
    color: '#fa8c16',
    backgroundColor: '#2d1a00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff4d4f',
  },
  logoutText: { color: '#ff4d4f', fontSize: 13 },
  card: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fa8c16',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderNum: { fontSize: 18, fontWeight: '700', color: '#fff' },
  time: { fontSize: 13, color: '#8c8c8c' },
  item: { color: '#d9d9d9', fontSize: 14, marginBottom: 4 },
  readyBtn: {
    marginTop: 16,
    backgroundColor: '#52c41a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  readyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { color: '#8c8c8c', fontSize: 18 },
})