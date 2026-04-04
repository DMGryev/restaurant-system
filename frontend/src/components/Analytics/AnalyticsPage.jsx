import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Spin, message, Table, DatePicker } from 'antd'
import { DollarOutlined, ShoppingCartOutlined, RiseOutlined } from '@ant-design/icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { analyticsAPI } from '../../api/analytics'

const { Title } = Typography
const { RangePicker } = DatePicker

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState(null)
  const [topItems, setTopItems] = useState([])
  const [waiterPerf, setWaiterPerf] = useState([])
  const [hourlySales, setHourlySales] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [salesRes, topRes, waiterRes, hourlyRes] = await Promise.all([
        analyticsAPI.getSalesSummary(),
        analyticsAPI.getTopItems(),
        analyticsAPI.getWaiterPerformance(),
        analyticsAPI.getHourlySales(),
      ])
      setSales(salesRes.data)
      setTopItems(topRes.data)
      setWaiterPerf(waiterRes.data)
      setHourlySales(hourlyRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3}>📊 Аналитика</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="dashboard-card">
            <Statistic
              title="Выручка"
              value={sales?.total_revenue || 0}
              prefix={<DollarOutlined />}
              suffix="₽"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="dashboard-card">
            <Statistic
              title="Заказов"
              value={sales?.total_orders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="dashboard-card">
            <Statistic
              title="Средний чек"
              value={sales?.avg_order_amount || 0}
              prefix={<RiseOutlined />}
              suffix="₽"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="🍕 Топ блюд" style={{ borderRadius: 12 }}>
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_sold" fill="#1677ff" name="Продано" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>Нет данных</div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="⏰ Продажи по часам" style={{ borderRadius: 12 }}>
            {hourlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                  <YAxis />
                  <Tooltip labelFormatter={(h) => `${h}:00`} />
                  <Line type="monotone" dataKey="revenue" stroke="#52c41a" name="Выручка" strokeWidth={2} />
                  <Line type="monotone" dataKey="orders_count" stroke="#1677ff" name="Заказов" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>Нет данных</div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="👨‍🍳 Производительность официантов" style={{ marginTop: 16, borderRadius: 12 }}>
        <Table
          dataSource={waiterPerf}
          rowKey="waiter"
          pagination={false}
          columns={[
            {
              title: 'Официант',
              dataIndex: 'waiter',
              key: 'waiter',
              render: (name) => <span style={{ fontWeight: 500 }}>{name}</span>,
            },
            {
              title: 'Заказов',
              dataIndex: 'orders_count',
              key: 'orders_count',
              sorter: (a, b) => a.orders_count - b.orders_count,
            },
            {
              title: 'Выручка',
              dataIndex: 'revenue',
              key: 'revenue',
              render: (r) => <span style={{ fontWeight: 600 }}>{r} ₽</span>,
              sorter: (a, b) => a.revenue - b.revenue,
            },
          ]}
        />
      </Card>
    </div>
  )
}