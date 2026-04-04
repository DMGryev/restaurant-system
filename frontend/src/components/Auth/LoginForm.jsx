import React, { useState } from 'react'
import { Card, Form, Input, Button, message, Typography, Divider } from 'antd'
import { UserOutlined, LockOutlined, CreditCardOutlined } from '@ant-design/icons'
import { authAPI } from '../../api/auth'
import useAuthStore from '../../store/authStore'

const { Title, Text } = Typography

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [cardMode, setCardMode] = useState(false)
  const login = useAuthStore((s) => s.login)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      let response
      if (cardMode) {
        response = await authAPI.loginByCard(values.card_id)
      } else {
        response = await authAPI.login(values.username, values.password)
      }
      const { access_token, user } = response.data
      login(access_token, user)
      message.success(`Добро пожаловать, ${user.full_name}!`)
    } catch (error) {
      message.error(
        error.response?.data?.detail || 'Ошибка авторизации'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: 48 }}>🍽️</div>
          <Title level={3} style={{ margin: '10px 0 0' }}>
            Restaurant System
          </Title>
          <Text type="secondary">Система управления рестораном</Text>
        </div>

        {!cardMode ? (
          <Form onFinish={onFinish} size="large" layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Введите логин' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Логин" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Введите пароль' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 45, fontSize: 16 }}
              >
                Войти
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form onFinish={onFinish} size="large" layout="vertical">
            <Form.Item
              name="card_id"
              rules={[{ required: true, message: 'Приложите карту' }]}
            >
              <Input
                prefix={<CreditCardOutlined />}
                placeholder="ID карты"
                autoFocus
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 45, fontSize: 16 }}
              >
                Войти по карте
              </Button>
            </Form.Item>
          </Form>
        )}

        <Divider />

        <Button
          type="link"
          block
          icon={cardMode ? <UserOutlined /> : <CreditCardOutlined />}
          onClick={() => setCardMode(!cardMode)}
        >
          {cardMode ? 'Войти по логину/паролю' : 'Войти по магнитной карте'}
        </Button>
      </Card>
    </div>
  )
}