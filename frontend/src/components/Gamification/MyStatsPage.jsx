import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Spin, message, Table, Tag, List } from 'antd'
import { StarOutlined, TrophyOutlined, ThunderboltOutlined, CalendarOutlined } from '@ant-design/icons'
import { gamificationAPI } from '../../api/gamification'

const { Title } = Typography

export default function MyStatsPage() {
  const [stats, setStats] = useState(null)
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsRes, scoresRes] = await Promise.all([
        gamificationAPI.getMyStats(),
        gamificationAPI.getMyScores(30),
      ])
      setStats(statsRes.data)
      setScores(scoresRes.data)
    } catch (e) {
      message.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const bonusColors = {
    speed: 'blue',
    quality: 'green',
    upsell: 'purple',
    attendance: 'cyan',
    customer_rating: 'gold',
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3}>⭐ Мои достижения</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Всего баллов"
              value={stats?.total_points || 0}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Сегодня"
              value={stats?.today_points || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="dashboard-card">
            <Statistic
              title="За неделю"
              value={stats?.week_points || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="dashboard-card">
            <Statistic
              title="Всего заказов"
              value={stats?.total_orders || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {stats?.achievements?.length > 0 && (
        <Card title="🏅 Достижения" style={{ marginTop: 16, borderRadius: 12 }}>
          <Row gutter={[12, 12]}>
            {stats.achievements.map((a) => (
              <Col key={a.id}>
                <Tag
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    borderRadius: 20,
                    background: a.badge_color === '#gold' ? '#fffbe6' :
                                a.badge_color === '#silver' ? '#fafafa' :
                                a.badge_color === '#bronze' ? '#fff7e6' : '#f0f5ff',
                  }}
                >
                  {a.icon === 'star' ? '⭐' :
                   a.icon === 'medal' ? '🏅' :
                   a.icon === 'trophy' ? '🏆' :
                   a.icon === 'crown' ? '👑' :
                   a.icon === 'lightning' ? '⚡' : '🎖️'}
                  {' '}{a.name}
                </Tag>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card title="📊 История баллов" style={{ marginTop: 16, borderRadius: 12 }}>
        <Table
          dataSource={scores}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Дата',
              dataIndex: 'earned_at',
              key: 'earned_at',
              render: (dt) => new Date(dt).toLocaleString('ru'),
            },
            {
              title: 'Баллы',
              dataIndex: 'points',
              key: 'points',
              render: (p) => <span style={{ fontWeight: 700, color: '#faad14' }}>+{p} ⭐</span>,
            },
            {
              title: 'Тип',
              dataIndex: 'bonus_type',
              key: 'bonus_type',
              render: (type) => <Tag color={bonusColors[type]}>{type}</Tag>,
            },
            {
              title: 'Описание',
              dataIndex: 'description',
              key: 'description',
            },
          ]}
        />
      </Card>
    </div>
  )
}