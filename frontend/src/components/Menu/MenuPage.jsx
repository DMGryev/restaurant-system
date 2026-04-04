import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Typography, Spin, message, Space, Switch, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons'
import { menuAPI } from '../../api/menu'
import MenuItemModal from './MenuItemModal'
import useAuthStore from '../../store/authStore'

const { Title } = Typography

export default function MenuPage() {
  const user = useAuthStore((s) => s.user)
  const isManager = ['admin', 'manager'].includes(user?.role)
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [catRes, itemsRes] = await Promise.all([
        menuAPI.getCategories(),
        menuAPI.getItems({ available_only: false }),
      ])
      setCategories(catRes.data)
      setItems(itemsRes.data)
    } catch (e) {
      message.error('Ошибка загрузки меню')
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (item) => {
    try {
      await menuAPI.updateItem(item.id, { is_available: !item.is_available })
      message.success('Обновлено')
      loadData()
    } catch (e) {
      message.error('Ошибка')
    }
  }

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span style={{ fontWeight: 500 }}>
          {text}
          {!record.is_available && <Tag color="red" style={{ marginLeft: 8 }}>Нет</Tag>}
        </span>
      ),
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span style={{ fontWeight: 600 }}>{price} ₽</span>,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Время (мин)',
      dataIndex: 'preparation_time',
      key: 'preparation_time',
    },
    {
      title: 'Вес (г)',
      dataIndex: 'weight',
      key: 'weight',
      render: (w) => w || '—',
    },
    {
      title: 'Ккал',
      dataIndex: 'calories',
      key: 'calories',
      render: (c) => c || '—',
    },
    ...(isManager
      ? [
          {
            title: 'Доступно',
            key: 'available',
            render: (_, record) => (
              <Switch
                checked={record.is_available}
                onChange={() => toggleAvailability(record)}
              />
            ),
          },
          {
            title: 'Действия',
            key: 'actions',
            render: (_, record) => (
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => {
                  setEditingItem(record)
                  setModalOpen(true)
                }}
              />
            ),
          },
        ]
      : []),
  ]

  const tabItems = categories.map((cat) => ({
    key: String(cat.id),
    label: `${cat.name}`,
    children: (
      <Table
        dataSource={items.filter((i) => i.category_id === cat.id)}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="middle"
      />
    ),
  }))

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>📋 Меню</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>Обновить</Button>
          {isManager && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditingItem(null); setModalOpen(true) }}
            >
              Добавить блюдо
            </Button>
          )}
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Tabs items={tabItems} />
      </Card>

      <MenuItemModal
        open={modalOpen}
        item={editingItem}
        categories={categories}
        onClose={() => { setModalOpen(false); setEditingItem(null) }}
        onSuccess={loadData}
      />
    </div>
  )
}