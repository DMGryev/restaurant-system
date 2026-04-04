import React, { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, message } from 'antd'
import { menuAPI } from '../../api/menu'

export default function MenuItemModal({ open, item, categories, onClose, onSuccess }) {
  const [form] = Form.useForm()
  const isEdit = !!item

  useEffect(() => {
    if (open) {
      if (item) {
        form.setFieldsValue(item)
      } else {
        form.resetFields()
      }
    }
  }, [open, item])

  const onFinish = async (values) => {
    try {
      if (isEdit) {
        await menuAPI.updateItem(item.id, values)
        message.success('Блюдо обновлено')
      } else {
        await menuAPI.createItem(values)
        message.success('Блюдо добавлено')
      }
      onClose()
      onSuccess()
    } catch (e) {
      message.error('Ошибка сохранения')
    }
  }

  return (
    <Modal
      title={isEdit ? 'Редактировать блюдо' : 'Новое блюдо'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Сохранить"
      cancelText="Отмена"
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="Название" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="category_id" label="Категория" rules={[{ required: true }]}>
          <Select
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="price" label="Цена (₽)" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="preparation_time" label="Время приготовления (мин)">
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="weight" label="Вес (г)">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="calories" label="Калории">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}