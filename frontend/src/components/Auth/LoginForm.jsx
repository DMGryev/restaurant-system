import React, { useState, useRef } from 'react'
import { Card, Form, Input, Button, message, Typography, Divider, Modal } from 'antd'
import { UserOutlined, LockOutlined, CreditCardOutlined, QrcodeOutlined } from '@ant-design/icons'
import { authAPI } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { Html5QrcodeScanner } from 'html5-qrcode'

const { Title, Text } = Typography

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [cardMode, setCardMode] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const scannerRef = useRef(null)
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

  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    )

    scanner.render(onScanSuccess, onScanError)
    scannerRef.current = scanner
  }

  const onScanSuccess = async (decodedText, decodedResult) => {
    if (qrLoading) return
    
    setQrLoading(true)
    try {
      // Останавливаем сканер
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
      
      // Отправляем QR-токен на бэкенд
      const response = await authAPI.loginByQr(decodedText)
      const { access_token, user } = response.data
      login(access_token, user)
      message.success(`Добро пожаловать, ${user.full_name}!`)
      setQrModalOpen(false)
    } catch (error) {
      message.error(
        error.response?.data?.detail || 'Ошибка авторизации по QR-коду'
      )
      // Перезапускаем сканер при ошибке
      startScanner()
    } finally {
      setQrLoading(false)
    }
  }

  const onScanError = (error) => {
    console.error('QR Scan error:', error)
    // Не показываем ошибку пользователю при каждом неудачном сканировании
  }

  const handleQrModalOpen = () => {
    setQrModalOpen(true)
    setTimeout(() => {
      startScanner()
    }, 500)
  }

  const handleQrModalClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
    }
    setQrModalOpen(false)
    setQrLoading(false)
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button
            type="link"
            block
            icon={cardMode ? <UserOutlined /> : <CreditCardOutlined />}
            onClick={() => setCardMode(!cardMode)}
          >
            {cardMode ? 'Войти по логину/паролю' : 'Войти по магнитной карте'}
          </Button>

          <Button
            type="link"
            block
            icon={<QrcodeOutlined />}
            onClick={handleQrModalOpen}
          >
            Войти по QR-коду
          </Button>
        </div>
      </Card>

      <Modal
        title="Сканируйте QR-код"
        open={qrModalOpen}
        onCancel={handleQrModalClose}
        footer={null}
        width={450}
        destroyOnClose
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Наведите камеру на QR-код на бейджике сотрудника
            </Text>
          </div>
          <div 
            id="qr-reader" 
            style={{ 
              width: '100%', 
              overflow: 'hidden', 
              borderRadius: 12,
              minHeight: 300 
            }}
          />
          {qrLoading && (
            <div style={{ marginTop: 16 }}>
              <Text>Авторизация...</Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}