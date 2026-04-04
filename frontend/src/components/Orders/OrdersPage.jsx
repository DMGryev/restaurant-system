import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Typography, Spin, message, Space, Select, Modal } from 'antd'
import { PlusOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { ordersAPI } from '../../api/orders'
import NewOrderModal from './NewOrderModal'

const { Title } = Typography

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter) params.status = statusFilter
      const res = await ordersAPI.getOrders(params)
      setOrders(res.data)
    } catch (e) {
      message.error('Ошибка загрузки заказов')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId, status) => {
  try {
    console.log('🔄 Updating order', orderId, 'to status', status)  // ← ДОБАВЬ
    
    await ordersAPI.updateOrder(orderId, { status })
    
    console.log('✅ Status updated successfully')  // ← ДОБАВЬ
    
    message.success(`Статус обновлён: ${statusLabels[status]}`)
    loadOrders()
  } catch (e) {
    console.error('❌ Update error:', e)  // ← ДОБАВЬ
    console.error('Response:', e.response?.data)  // ← ДОБАВЬ
    
    message.error('Ошибка обновления статуса')
  }
}

  const statusColors = {
    new: 'blue',
    confirmed: 'purple',
    preparing: 'orange',
    ready: 'green',
    served: 'cyan',
    paid: 'default',
    cancelled: 'red',
  }

  const statusLabels = {
    new: 'Новый',
    confirmed: 'Подтверждён',
    preparing: 'Готовится',
    ready: 'Готов',
    served: 'Подан',
    paid: 'Оплачен',
    cancelled: 'Отменён',
  }

  const getNextActions = (order) => {
    const actions = []

    switch (order.status) {
      case 'new':
        actions.push(
          <Button key="confirm" size="small" type="primary"
            onClick={() => updateStatus(order.id, 'confirmed')}>
            Подтвердить
          </Button>
        )
        actions.push(
          <Button key="cancel" size="small" danger
            onClick={() => updateStatus(order.id, 'cancelled')}>
            Отменить
          </Button>
        )
        break

      case 'confirmed':
        actions.push(
          <Button key="preparing" size="small" type="primary"
            style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
            onClick={() => updateStatus(order.id, 'preparing')}>
            На кухню
          </Button>
        )
        actions.push(
          <Button key="cancel" size="small" danger
            onClick={() => updateStatus(order.id, 'cancelled')}>
            Отменить
          </Button>
        )
        break

      case 'preparing':
        actions.push(
          <Button key="ready" size="small" type="primary"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => updateStatus(order.id, 'ready')}>
            Готов
          </Button>
        )
        break

      case 'ready':
        actions.push(
          <Button key="served" size="small" type="primary"
            style={{ background: '#13c2c2', borderColor: '#13c2c2' }}
            onClick={() => updateStatus(order.id, 'served')}>
            Подано
          </Button>
        )
        break

      case 'served':
        actions.push(
          <Button key="paid" size="small" type="primary"
            onClick={() => updateStatus(order.id, 'paid')}>
            💰 Оплачено
          </Button>
        )
        break
    }

    return actions
  }

  const columns = [
    {
      title: '№',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text) => <span style={{ fontWeight: 600 }}>#{text}</span>,
    },
    {
      title: 'Стол',
      dataIndex: 'table_id',
      key: 'table_id',
      render: (id) => id ? `Стол ${id}` : '—',
    },
    {
      title: 'Позиций',
      key: 'items_count',
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: 'Сумма',
      dataIndex: 'final_amount',
      key: 'final_amount',
      render: (amount) => <span style={{ fontWeight: 600 }}>{amount} ₽</span>,
      sorter: (a, b) => a.final_amount - b.final_amount,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
      ),
    },
    {
      title: 'Время',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (dt) => new Date(dt).toLocaleTimeString('ru'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: `Заказ #${record.order_number}`,
                width: 500,
                content: (
                  <div>
                    <p><b>Стол:</b> {record.table_id || '—'}</p>
                    <p><b>Статус:</b> {statusLabels[record.status]}</p>
                    <p><b>Сумма:</b> {record.final_amount} ₽</p>
                    <p><b>Заметки:</b> {record.notes || '—'}</p>
                    <hr />
                    <p><b>Позиции:</b></p>
                    {record.items?.map((item, i) => (
                      <div key={i} style={{ marginBottom: 8, padding: '4px 0' }}>
                        <Tag color={statusColors[item.status]}>{statusLabels[item.status] || item.status}</Tag>
                        Позиция #{item.menu_item_id} × {item.quantity} — {item.price} ₽
                        {item.notes && <div style={{ color: '#8c8c8c', fontSize: 12 }}>📝 {item.notes}</div>}
                      </div>
                    ))}
                  </div>
                ),
              })
            }}
          >
            Детали
          </Button>
          {getNextActions(record)}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>📝 Заказы</Title>
        <Space>
          <Select
            placeholder="Фильтр по статусу"
            allowClear
            style={{ width: 180 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Button icon={<ReloadOutlined />} onClick={loadOrders}>Обновить</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Новый заказ
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <NewOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadOrders}
      />
    </div>
  )
}