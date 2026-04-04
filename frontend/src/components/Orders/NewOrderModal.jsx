import React, { useState, useEffect } from 'react'
import { Modal, Form, Select, InputNumber, Button, message, Space, Card, Typography, Input } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { menuAPI } from '../../api/menu'
import { tablesAPI } from '../../api/tables'
import { ordersAPI } from '../../api/orders'

const { Text } = Typography

export default function NewOrderModal({ open, onClose, onSuccess }) {
  const [form] = Form.useForm()
  const [tables, setTables] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [orderItems, setOrderItems] = useState([{ menu_item_id: null, quantity: 1, notes: '' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
      setOrderItems([{ menu_item_id: null, quantity: 1, notes: '' }])
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
    return orderItems.reduce((sum, item) => {
      const menuItem = menuItems.find((m) => m.id === item.menu_item_id)
      return sum + (menuItem?.price || 0) * item.quantity
    }, 0)
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
        customer_id: values.customer_id || null,
        notes: values.notes || '',
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          notes: i.notes || null,
        })),
      })
      message.success('Заказ создан!')
      onClose()
      onSuccess()
    } catch (e) {
      message.error(e.response?.data?.detail || 'Ошибка создания заказа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="🛎️ Новый заказ"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={loading}
      okText="Создать заказ"
      cancelText="Отмена"
      width={650}
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
              style={{ width: 250 }}
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
              style={{ width: 150 }}
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

      <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 700 }}>
        Итого: {getTotal()} ₽
      </div>
    </Modal>
  )
}