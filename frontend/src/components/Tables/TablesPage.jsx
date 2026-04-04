import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Tag, Typography, Spin, Button, message, Modal, Select } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { tablesAPI } from '../../api/tables'

const { Title, Text } = Typography

export default function TablesPage() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      setLoading(true)
      const res = await tablesAPI.getTables()
      setTables(res.data)
    } catch (e) {
      message.error('Ошибка загрузки столов')
    } finally {
      setLoading(false)
    }
  }

  const changeStatus = async (tableId, status) => {
    try {
      await tablesAPI.updateTable(tableId, { status })
      message.success('Статус обновлён')
      loadTables()
    } catch (e) {
      message.error('Ошибка')
    }
  }

  const statusConfig = {
    free: { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', text: 'Свободен' },
    occupied: { color: '#ff4d4f', bg: '#fff2f0', border: '#ffa39e', text: 'Занят' },
    reserved: { color: '#faad14', bg: '#fffbe6', border: '#ffe58f', text: 'Бронь' },
    needs_cleaning: { color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9', text: 'Уборка' },
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>🪑 Столики</Title>
        <Button icon={<ReloadOutlined />} onClick={loadTables}>Обновить</Button>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {Object.entries(statusConfig).map(([key, val]) => (
          <Col key={key}>
            <Tag color={val.color}>{val.text}</Tag>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {tables.map((table) => {
          const cfg = statusConfig[table.status] || statusConfig.free
          return (
            <Col xs={12} sm={8} md={6} lg={4} key={table.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  border: `2px solid ${cfg.border}`,
                  background: cfg.bg,
                  textAlign: 'center',
                  minHeight: 140,
                }}
                bodyStyle={{ padding: 16 }}
                onClick={() => {
                  Modal.confirm({
                    title: `Стол ${table.number}`,
                    content: (
                      <div>
                        <p>Мест: {table.seats}</p>
                        <p>Зона: {table.zone || '—'}</p>
                        <p>Статус: {cfg.text}</p>
                        <Select
                          id="newStatus"
                          defaultValue={table.status}
                          style={{ width: '100%', marginTop: 8 }}
                          options={Object.entries(statusConfig).map(([k, v]) => ({
                            value: k,
                            label: v.text,
                          }))}
                          onChange={(val) => {
                            changeStatus(table.id, val)
                            Modal.destroyAll()
                          }}
                        />
                      </div>
                    ),
                    footer: null,
                  })
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700, color: cfg.color }}>
                  {table.number}
                </div>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 4 }}>
                  {table.seats} мест
                </div>
                <Tag color={cfg.color} style={{ marginTop: 8 }}>
                  {cfg.text}
                </Tag>
                {table.zone && (
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    {table.zone}
                  </div>
                )}
              </Card>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}