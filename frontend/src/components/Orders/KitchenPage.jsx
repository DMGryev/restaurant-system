import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Tag, Typography, Spin, message, Badge, Space } from 'antd'
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { ordersAPI } from '../../api/orders'

const { Title, Text } = Typography

export default function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 15000) // каждые 15 сек
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    try {
      const res = await ordersAPI.getActiveOrders()
      setOrders(res.data)
    } catch (e) {
      message.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const updateItemStatus = async (orderId, itemId, status) => {
    try {
      await ordersAPI.updateItemStatus(orderId, itemId, { status })
      message.success(status === 'ready' ? '✅ Блюдо готово!' : '🔥 Начинаю готовить')
      loadOrders()
    } catch (e) {
      message.error('Ошибка')
    }
  }

  const statusColors = {
    pending: 'blue',
    preparing: 'orange',
    ready: 'green',
    served: 'default',
  }

  const statusLabels = {
    pending: 'Ожидает',
    preparing: 'Готовится',
    ready: 'Готово',
    served: 'Подано',
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>🔥 Кухня</Title>
        <Button icon={<ReloadOutlined />} onClick={loadOrders}>Обновить</Button>
      </div>

      <Row gutter={[16, 16]}>
        {orders.map((order) => {
          const pendingItems = order.items?.filter((i) => ['pending', 'preparing'].includes(i.status)) || []
          if (pendingItems.length === 0) return null

          const minutesAgo = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
          const isUrgent = minutesAgo > 15

          return (
            <Col xs={24} sm={12} lg={8} key={order.id}>
              <Card
                title={
                  <Space>
                    <span style={{ fontWeight: 700 }}>#{order.order_number}</span>
                    {order.table_id && <Tag>Стол {order.table_id}</Tag>}
                    <Badge
                      count={`${minutesAgo} мин`}
                      style={{ backgroundColor: isUrgent ? '#ff4d4f' : '#faad14' }}
                    />
                  </Space>
                }
                className={`kitchen-card ${isUrgent ? 'urgent' : 'normal'}`}
                style={{
                  borderLeft: `4px solid ${isUrgent ? '#ff4d4f' : '#faad14'}`,
                  borderRadius: 12,
                }}
              >
                {order.items?.map((item) => {
                  if (['served', 'cancelled'].includes(item.status)) return null
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <div>
                        <Text strong>Позиция #{item.menu_item_id}</Text>
                        <Text type="secondary"> × {item.quantity}</Text>
                        <br />
                        <Tag color={statusColors[item.status]}>
                          {statusLabels[item.status]}
                        </Tag>
                        {item.notes && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {' '}{item.notes}
                          </Text>
                        )}
                      </div>
                      <div>
                        {item.status === 'pending' && (
                          <Button
                            type="primary"
                            size="small"
                            style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                            onClick={() => updateItemStatus(order.id, item.id, 'preparing')}
                          >
                            Готовить
                          </Button>
                        )}
                        {item.status === 'preparing' && (
                          <Button
                            type="primary"
                            size="small"
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                            onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                          >
                            Готово ✓
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {order.notes && (
                  <div style={{ marginTop: 8, padding: 8, background: '#fffbe6', borderRadius: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>📝 {order.notes}</Text>
                  </div>
                )}
              </Card>
            </Col>
          )
        })}

        {orders.filter((o) => o.items?.some((i) => ['pending', 'preparing'].includes(i.status))).length === 0 && (
          <Col span={24}>
            <Card style={{ textAlign: 'center', padding: 40, borderRadius: 12 }}>
              <div style={{ fontSize: 48 }}>✅</div>
              <Title level={4} style={{ color: '#52c41a' }}>Все заказы выполнены!</Title>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}