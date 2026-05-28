import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Typography, message, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { authAPI } from '../../api/auth'
import client from '../../api/client'
import UserQrModal from './UserQrModal'  // ← ДОБАВИТЬ ИМПОРТ

const { Title } = Typography

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await client.get('/users/')
      setUsers(res.data)
    } catch (e) {
      message.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const roleColors = {
    admin: 'red',
    manager: 'purple',
    waiter: 'blue',
    cook: 'orange',
    bartender: 'cyan',
    cashier: 'green',
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: 'Имя',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (name) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    { title: 'Логин', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color={roleColors[role]}>{role}</Tag>,
    },
    {
      title: 'Карта',
      dataIndex: 'card_id',
      key: 'card_id',
      render: (card) => card || '—',
    },
    {
      title: 'Активен',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => active ? <Tag color="green">Да</Tag> : <Tag color="red">Нет</Tag>,
    },
    {
      title: 'QR-вход',  // ← НОВАЯ КОЛОНКА
      key: 'qr',
      render: (_, record) => <UserQrModal user={record} />,
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>👨💼 Сотрудники</Title>
        <Button icon={<ReloadOutlined />} onClick={loadUsers}>Обновить</Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  )
}