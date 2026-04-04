import React, { useEffect } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { crmAPI } from '../../api/crm'

export default function CustomerModal({ open, customer, onClose, onSuccess }) {
  const [form] = Form.useForm()
  const isEdit = !!customer

  useEffect(() => {
    if (open) {
      if (customer) {
        form.setFieldsValue(customer)
      } else {
        form.resetFields()
      }
    }
  }, [open, customer])

  const onFinish = async (values) => {
    try {
      if (isEdit) {
        await crmAPI.updateCustomer(customer.id, values)
        message.success('Клиент обновлён')
      } else {
        await crmAPI.createCustomer(values)
        message.success('Клиент добавлен')
      }
      onClose()
      onSuccess()
    } catch (e) {
      message.error('Ошибка')
    }
  }

  return (
    <Modal
      title={isEdit ? 'Редактировать клиента' : 'Новый клиент'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Сохранить"
      cancelText="Отмена"
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="first_name" label="Имя" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="last_name" label="Фамилия">
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Телефон">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}