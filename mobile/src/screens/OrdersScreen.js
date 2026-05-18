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

const STATUS_COLORS = {
  new: '#1677ff',
  confirmed: '#722ed1',
  preparing: '#fa8c16',
  ready: '#52c41a',
  served: '#13c2c2',
  paid: '#8c8c8c',
  cancelled: '#ff4d4f',
}

const STATUS_LABELS = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  preparing: 'Готовится',
  ready: 'Готов',
  served: 'Подан',
  paid: 'Оплачен',
  cancelled: 'Отменён',
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    loadOrders()
    // Автообновление каждые 30 секунд
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    try {
      const res = await client.get('/orders/', {
        params: { limit: 30 },
      })
      setOrders(res.data)
    } catch (e) {
      if (e.response?.status === 401) {
        logout()
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      await client.patch(`/orders/${orderId}`, { status })
      loadOrders()
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось обновить статус')
    }
  }

  const getNextButton = (order) => {
    switch (order.status) {
      case 'new':
        return {
          label: 'Подтвердить',
          nextStatus: 'confirmed',
          color: '#722ed1',
        }
      case 'confirmed':
        return {
          label: 'На кухню',
          nextStatus: 'preparing',
          color: '#fa8c16',
        }
      case 'ready':
        return {
          label: '✅ Подано',
          nextStatus: 'served',
          color: '#13c2c2',
        }
      case 'served':
        return {
          label: '💰 Оплачено',
          nextStatus: 'paid',
          color: '#52c41a',
        }
      default:
        return null
    }
  }

  const renderOrder = ({ item }) => {
    const nextAction = getNextButton(item)

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{item.order_number}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[item.status] },
            ]}
          >
            <Text style={styles.statusText}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>

        <Text style={styles.orderInfo}>
          {item.table_id ? `Стол ${item.table_id}` : 'Без стола'} •{' '}
          {item.items?.length || 0} позиций
        </Text>

        <Text style={styles.orderAmount}>
          {item.final_amount} ₽
          {item.discount > 0 && (
            <Text style={styles.discount}>
              {' '}(скидка {item.discount} ₽)
            </Text>
          )}
        </Text>

        <Text style={styles.orderTime}>
          {new Date(item.created_at).toLocaleTimeString('ru')}
        </Text>

        {nextAction && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: nextAction.color }]}
            onPress={() =>
              Alert.alert(
                'Подтверждение',
                `Перевести заказ в статус "${STATUS_LABELS[nextAction.nextStatus]}"?`,
                [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Да',
                    onPress: () => updateStatus(item.id, nextAction.nextStatus),
                  },
                ]
              )
            }
          >
            <Text style={styles.actionButtonText}>{nextAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1677ff" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 Мои заказы</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrder}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true)
            loadOrders()
          }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Нет активных заказов</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '700' },
  logoutBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff2f0',
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  logoutText: { color: '#ff4d4f', fontSize: 14 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: { fontSize: 16, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  orderInfo: { color: '#8c8c8c', fontSize: 13, marginBottom: 4 },
  orderAmount: { fontSize: 18, fontWeight: '700', color: '#1677ff' },
  discount: { fontSize: 13, color: '#52c41a', fontWeight: '400' },
  orderTime: { color: '#8c8c8c', fontSize: 12, marginTop: 4 },
  actionButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#8c8c8c', fontSize: 16 },
})