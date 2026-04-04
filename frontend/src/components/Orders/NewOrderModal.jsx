import React, { useState, useEffect } from 'react'
import { Modal, Form, Select, InputNumber, Button, message, Space, Card, Typography, Input, AutoComplete, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined, UserOutlined, StarFilled } from '@ant-design/icons'
import { menuAPI } from '../../api/menu'
import { tablesAPI } from '../../api/tables'
import { ordersAPI } from '../../api/orders'
import { crmAPI } from '../../api/crm'

const { Text } = Typography

export default function NewOrderModal({ open, onClose, onSuccess }) {
  const [form] = Form.useForm()
  const [tables, setTables] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [orderItems, setOrderItems] = useState([{ menu_item_id: null, quantity: 1, notes: '' }])
  const [loading, setLoading] = useState(false)
  
  // ← НОВОЕ: Поиск клиентов
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerOptions, setCustomerOptions] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
      setOrderItems([{ menu_item_id: null, quantity: 1, notes: '' }])
      setSelectedCustomer(null)
      setCustomerSearch('')
      form.resetFields()
    }
  }, [open])

  const loadData = async () => {
    const [tablesRes, itemsRes] = await Promise.all([
      tablesAPI.getTables(),
      menuAPI.getItems(),
    ])
    setTables(tablesRes.data.filter((t) => t.status === 'free'))
    setMenuItems(itemsRes.data)
  }

  // ← НОВОЕ: Поиск клиентов
  const handleCustomerSearch = async (value) => {
    setCustomerSearch(value)
    
    if (value.length < 3) {
      setCustomerOptions([])
      return
    }

    setSearchingCustomer(true)
    try {
      const res = await crmAPI.searchCustomers(value)
      setCustomerOptions(
        res.data.map((customer) => ({
          value: customer.id,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {customer.first_name} {customer.last_name || ''} 
                {customer.phone && <Text type="secondary"> • {customer.phone}</Text>}
              </span>
              <Space>
                {customer.is_vip && <StarFilled style={{ color: '#faad14' }} />}
                {customer.discount_percent > 0 && (
                  <Tag color="green">-{customer.discount_percent}%</Tag>
                )}
              </Space>
            </div>
          ),
          customer: customer,
        }))
      )
    } catch (e) {
      console.error(e)
    } finally {
      setSearchingCustomer(false)
    }
  }

  const handleCustomerSelect = (value) => {
    const option = customerOptions.find((o) => o.value === value)
    if (option) {
      setSelectedCustomer(option.customer)
      message.success(
        `Клиент ${option.customer.first_name} выбран` +
        (option.customer.discount_percent > 0 ? ` • Скидка ${option.customer.discount_percent}%` : '')
      )
    }
  }

  const addItem = () => {
    setOrderItems([...orderItems, { menu_item_id: null, quantity: 1, notes: '' }])
  }

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const updated = [...orderItems]
    updated[index][field] = value
    setOrderItems(updated)
  }

  const getTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => {
      const menuItem = menuItems.find((m) => m.id === item.menu_item_id)
      return sum + (menuItem?.price || 0) * item.quantity
    }, 0)
    
    // Применяем скидку клиента
    const discount = selectedCustomer ? (subtotal * selectedCustomer.discount_percent / 100) : 0
    
    return { subtotal, discount, total: subtotal - discount }
  }

  const onSubmit = async () => {
    try {
      const values = await form.validateFields()
      const items = orderItems.filter((i) => i.menu_item_id)
      if (items.length === 0) {
        message.error('Добавьте хотя бы одну позицию')
        return
      }

      setLoading(true)
      await ordersAPI.createOrder({
        table_id: values.table_id || null,
        customer_id: selectedCustomer?.id || null,
        notes: values.notes || '',
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          notes: i.notes || null,
        })),
      })
      
      message.success(
        selectedCustomer 
          ? `Заказ создан! Скидка ${selectedCustomer.discount_percent}% применена`
          : 'Заказ создан!'
      )
      onClose()
      onSuccess()
    } catch (e) {
      message.error(e.response?.data?.detail || 'Ошибка создания заказа')
    } finally {
      setLoading(false)
    }
  }

  const amounts = getTotal()

  return (
    <Modal
      title="🛎️ Новый заказ"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={loading}
      okText="Создать заказ"
      cancelText="Отмена"
      width={750}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="table_id" label="Стол">
          <Select
            placeholder="Выберите стол"
            allowClear
            options={tables.map((t) => ({
              value: t.id,
              label: `Стол ${t.number} (${t.seats} мест) — ${t.zone || 'Зал'}`,
            }))}
          />
        </Form.Item>

        {/* ← НОВОЕ: Поиск клиента */}
        <Form.Item label="Клиент (необязательно)">
          <AutoComplete
            value={customerSearch}
            options={customerOptions}
            onSearch={handleCustomerSearch}
            onSelect={handleCustomerSelect}
            placeholder="Введите телефон, email или имя (минимум 3 символа)"
            notFoundContent={searchingCustomer ? 'Поиск...' : 'Клиент не найден'}
            style={{ width: '100%' }}
          >
            <Input 
              prefix={<UserOutlined />}
              suffix={
                selectedCustomer && (
                  <Tag color="green" style={{ margin: 0 }}>
                    {selectedCustomer.first_name} • -{selectedCustomer.discount_percent}%
                  </Tag>
                )
              }
            />
          </AutoComplete>
          {!selectedCustomer && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Если клиент не найден — можно создать карту лояльности в разделе "Клиенты"
            </Text>
          )}
        </Form.Item>

        <Form.Item name="notes" label="Заметки к заказу">
          <Input.TextArea rows={2} placeholder="Особые пожелания..." />
        </Form.Item>
      </Form>

      <div style={{ marginBottom: 8 }}>
        <Text strong>Позиции заказа:</Text>
      </div>

      {orderItems.map((item, index) => (
        <Card size="small" key={index} style={{ marginBottom: 8, borderRadius: 8 }}>
          <Space align="start" style={{ width: '100%' }} wrap>
            <Select
              placeholder="Выберите блюдо"
              style={{ width: 280 }}
              value={item.menu_item_id}
              onChange={(val) => updateItem(index, 'menu_item_id', val)}
              showSearch
              optionFilterProp="label"
              options={menuItems.map((m) => ({
                value: m.id,
                label: `${m.name} — ${m.price}₽`,
              }))}
            />
            <InputNumber
              min={1}
              max={50}
              value={item.quantity}
              onChange={(val) => updateItem(index, 'quantity', val)}
              style={{ width: 80 }}
            />
            <Input
              placeholder="Заметка"
              value={item.notes}
              onChange={(e) => updateItem(index, 'notes', e.target.value)}
              style={{ width: 170 }}
            />
            {orderItems.length > 1 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeItem(index)}
              />
            )}
          </Space>
        </Card>
      ))}

      <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem} style={{ marginBottom: 16 }}>
        Добавить позицию
      </Button>

      <div style={{ 
        padding: '12px 16px', 
        background: '#fafafa', 
        borderRadius: 8,
        border: '1px solid #e8e8e8'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text>Сумма:</Text>
          <Text strong>{amounts.subtotal.toFixed(2)} ₽</Text>
        </div>
        
        {selectedCustomer && selectedCustomer.discount_percent > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#52c41a' }}>
            <Text type="success">
              Скидка ({selectedCustomer.discount_percent}%):
            </Text>
            <Text type="success" strong>
              -{amounts.discount.toFixed(2)} ₽
            </Text>
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          borderTop: '1px solid #e8e8e8',
          paddingTop: 8,
          marginTop: 8
        }}>
          <Text style={{ fontSize: 18 }}>Итого:</Text>
          <Text strong style={{ fontSize: 20, color: '#1677ff' }}>
            {amounts.total.toFixed(2)} ₽
          </Text>
        </div>
      </div>
    </Modal>
  )
}