import React, { useState } from 'react'
import { Modal, Button, message, QRCode, Typography, Spin } from 'antd'
import { QrcodeOutlined, DownloadOutlined } from '@ant-design/icons'
import client from '../../api/client'

const { Text } = Typography

export default function UserQrModal({ user, children }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)

  const generateQR = async () => {
    setLoading(true)
    try {
      // Получаем данные для QR-кода
      const response = await client.get(`/users/${user.id}/qr`)
      setQrData(response.data.qr_data)
    } catch (error) {
      message.error('Ошибка генерации QR-кода')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setModalOpen(true)
    generateQR()
  }

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas')
    if (canvas) {
      const link = document.createElement('a')
      link.download = `qr_${user.username}.png`
      link.href = canvas.toDataURL()
      link.click()
      message.success('QR-код сохранён')
    }
  }

  return (
    <>
      <Button 
        icon={<QrcodeOutlined />} 
        onClick={handleOpen}
        size="small"
        type="link"
      >
        QR-код
      </Button>

      <Modal
        title={`QR-код для ${user.full_name}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={downloadQR}>
            Скачать
          </Button>,
          <Button key="close" onClick={() => setModalOpen(false)}>
            Закрыть
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {loading ? (
            <Spin tip="Генерация QR-кода..." />
          ) : qrData ? (
            <>
              <QRCode
                id="qr-canvas"
                value={qrData}
                size={200}
                level="H"
                includeMargin={true}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  Сотрудник может войти в мобильное приложение,<br />
                  отсканировав этот QR-код камерой планшета
                </Text>
              </div>
            </>
          ) : (
            <Text type="danger">Ошибка загрузки QR-кода</Text>
          )}
        </div>
      </Modal>
    </>
  )
}