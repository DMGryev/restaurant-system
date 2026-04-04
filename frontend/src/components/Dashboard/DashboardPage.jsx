import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Spin, Tag, List } from 'antd'
import {
  ShoppingCartOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from '@ant-design/icons'
import { analyticsAPI } from '../../api/analytics'
import { ordersAPI } from '../../api/orders'
import { gamificationAPI } from '../../api/gamification'
import useAuthStore from '../../store/authStore'

const { Title } = Typography

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState(null)
  const [activeOrders, setActiveOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  const isManager = ['admin', 'manager'].includes(user?.role)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const ordersRes = await ordersAPI.getActiveOrders()
      setActiveOrders(ordersRes.data)

      const statsRes = await gamificationAPI.getMyStats()
      setStats(statsRes.data)

      try {
        const lbRes = await gamificationAPI.getLeaderboard()
        setLeaderboard(lbRes.data.slice(0, 5))
      } catch (e) {}

      if (isManager) {
        try {
          const salesRes = await analyticsAPI.getSalesSummary()
          setSales(salesRes.data)
        } catch (e) {}
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  const statusColors = {
    new: 'blue',
    confirmed: 'purple',
    preparing: 'orange',
    ready: 'green',
    served: 'cyan',
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3}>👋 Привет, {user?.full_name}!</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Активные заказы"
              value={activeOrders.length}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>

        {isManager && sales && (
          <>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="Выручка сегодня"
                  value={sales.total_revenue}
                  prefix={<DollarOutlined />}
                  suffix="₽"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="dashboard-card">
                <Statistic
                  title="Заказов сегодня"
                  value={sales.total_orders}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </>
        )}

        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Мои баллы сегодня"
              value={stats?.today_points || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Всего баллов"
              value={stats?.total_points || 0}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title="🔥 Активные заказы"
            className="dashboard-card"
            bodyStyle={{ maxHeight: 400, overflow: 'auto' }}
          >
            <List
              dataSource={activeOrders}
              locale={{ emptyText: 'Нет активных заказов' }}
              renderItem={(order) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <span>
                        #{order.order_number}
                        {order.table_id && ` — Стол ${order.table_id}`}
                      </span>
                    }
                    description={`${order.items?.length || 0} позиций • ${order.final_amount}₽`}
                  />
                  <Tag color={statusColors[order.status]}>{order.status}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="🏆 Топ-5 сегодня"
            className="dashboard-card"
            bodyStyle={{ maxHeight: 400, overflow: 'auto' }}
          >
            <List
              dataSource={leaderboard}
              locale={{ emptyText: 'Нет данных' }}
              renderItem={(entry, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <span
                        style={{
                          fontSize: index < 3 ? 24 : 16,
                          width: 32,
                          textAlign: 'center',
                          display: 'inline-block',
                        }}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </span>
                    }
                    title={entry.full_name || entry.username}
                    description={`Заказов: ${entry.orders_count}`}
                  />
                  <span style={{ fontWeight: 700, color: '#faad14', fontSize: 18 }}>
                    {entry.total_points} ⭐
                  </span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}