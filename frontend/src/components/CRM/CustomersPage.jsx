import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Typography, Input, message, Space } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined, StarFilled } from '@ant-design/icons'
import { crmAPI } from '../../api/crm'
import CustomerModal from './CustomerModal'

const { Title } = Typography

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async (searchQuery = '') => {
    try {
      setLoading(true)
      const params = {}
      if (searchQuery) params.search = searchQuery
      const res = await crmAPI.getCustomers(params)
      setCustomers(res.data)
    } catch (e) {
      message.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Имя',
      key: 'name',
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>
          {record.first_name} {record.last_name || ''}
          {record.is_vip && <StarFilled style={{ color: '#faad14', marginLeft: 6 }} />}
        </span>
      ),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email || '—',
    },
    {
      title: 'Визиты',
      dataIndex: 'visit_count',
      key: 'visit_count',
      sorter: (a, b) => a.visit_count - b.visit_count,
    },
    {
      title: 'Потрачено',
      dataIndex: 'total_spent',
      key: 'total_spent',
      render: (amount) => <span style={{ fontWeight: 600 }}>{amount} ₽</span>,
      sorter: (a, b) => a.total_spent - b.total_spent,
    },
    {
      title: 'Баллы',
      dataIndex: 'loyalty_points',
      key: 'loyalty_points',
      render: (points) => <Tag color="gold">{points} ⭐</Tag>,
    },
    {
      title: 'Скидка',
      dataIndex: 'discount_percent',
      key: 'discount_percent',
      render: (d) => d > 0 ? <Tag color="green">{d}%</Tag> : '—',
    },
    {
      title: 'Статус',
      key: 'vip',
      render: (_, record) => record.is_vip ? <Tag color="gold">VIP</Tag> : <Tag>Обычный</Tag>,
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>👥 Клиенты</Title>
        <Space>
          <Input.Search
            placeholder="Поиск..."
            style={{ width: 250 }}
            onSearch={(val) => loadCustomers(val)}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadCustomers()}>Обновить</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCustomer(null); setModalOpen(true) }}>
            Новый клиент
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={customers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <CustomerModal
        open={modalOpen}
        customer={editingCustomer}
        onClose={() => { setModalOpen(false); setEditingCustomer(null) }}
        onSuccess={() => loadCustomers()}
      />
    </div>
  )
}