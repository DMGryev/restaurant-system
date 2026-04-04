import React, { useState, useEffect } from 'react'
import { Table, Card, Typography, Spin, message, DatePicker, Tag, Avatar } from 'antd'
import { TrophyOutlined, CrownOutlined } from '@ant-design/icons'
import { gamificationAPI } from '../../api/gamification'
import dayjs from 'dayjs'

const { Title } = Typography

export default function LeaderboardPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await gamificationAPI.getLeaderboard(
        selectedDate ? selectedDate.format('YYYY-MM-DD') : null
      )
      setData(res.data)
    } catch (e) {
      message.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const columns = [
    {
      title: 'Место',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => (
        <span style={{ fontSize: rank <= 3 ? 24 : 16 }}>
          {getRankIcon(rank)}
        </span>
      ),
    },
    {
      title: 'Сотрудник',
      key: 'name',
      render: (_, record) => (
        <span style={{ fontWeight: record.rank <= 3 ? 700 : 400, fontSize: record.rank <= 3 ? 16 : 14 }}>
          {record.full_name || record.username}
        </span>
      ),
    },
    {
      title: 'Баллы',
      dataIndex: 'total_points',
      key: 'total_points',
      render: (points, record) => (
        <span style={{ fontWeight: 700, fontSize: record.rank <= 3 ? 20 : 16, color: '#faad14' }}>
          {points} ⭐
        </span>
      ),
      sorter: (a, b) => a.total_points - b.total_points,
    },
    {
      title: 'Заказов',
      dataIndex: 'orders_count',
      key: 'orders_count',
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>🏆 Таблица лидеров</Title>
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder="Выберите дату"
          allowClear
        />
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="user_id"
          loading={loading}
          pagination={false}
          rowClassName={(record) =>
            record.rank === 1 ? 'leaderboard-rank-1' :
            record.rank === 2 ? 'leaderboard-rank-2' :
            record.rank === 3 ? 'leaderboard-rank-3' : ''
          }
        />
      </Card>
    </div>
  )
}