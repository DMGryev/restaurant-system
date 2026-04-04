import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Typography, Badge } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  CoffeeOutlined,
  FireOutlined,
  TableOutlined,
  TeamOutlined,
  TrophyOutlined,
  StarOutlined,
  UserOutlined,
  BarChartOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import useAuthStore from '../../store/authStore'

const { Header, Sider, Content } = Layout
const { Text } = Typography

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager' || isAdmin
  const isCook = user?.role === 'cook' || user?.role === 'bartender'

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Дашборд',
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: 'Заказы',
    },
    ...(isCook
      ? [
          {
            key: '/kitchen',
            icon: <FireOutlined />,
            label: 'Кухня',
          },
        ]
      : []),
    {
      key: '/tables',
      icon: <TableOutlined />,
      label: 'Столики',
    },
    {
      key: '/menu',
      icon: <CoffeeOutlined />,
      label: 'Меню',
    },
    {
      key: '/customers',
      icon: <TeamOutlined />,
      label: 'Клиенты',
    },
    {
      type: 'divider',
    },
    {
      key: '/leaderboard',
      icon: <TrophyOutlined />,
      label: 'Лидерборд',
    },
    {
      key: '/my-stats',
      icon: <StarOutlined />,
      label: 'Мои баллы',
    },
    ...(isManager
      ? [
          { type: 'divider' },
          {
            key: '/analytics',
            icon: <BarChartOutlined />,
            label: 'Аналитика',
          },
          {
            key: '/users',
            icon: <UserOutlined />,
            label: 'Сотрудники',
          },
        ]
      : []),
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.full_name}`,
      disabled: true,
    },
    {
      key: 'role',
      icon: <SettingOutlined />,
      label: `Роль: ${user?.role}`,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      danger: true,
    },
  ]

  const roleColors = {
    admin: '#f5222d',
    manager: '#722ed1',
    waiter: '#1677ff',
    cook: '#fa8c16',
    bartender: '#13c2c2',
    cashier: '#52c41a',
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span style={{ fontSize: 28 }}>🍽️</span>
          <span
            style={{ fontSize: 16, fontWeight: 700, marginLeft: 8, color: '#1677ff' }}
          >
            RestaurantOS
          </span>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', padding: '8px 0' }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => {
                if (key === 'logout') {
                  logout()
                  navigate('/login')
                }
              },
            }}
            placement="bottomRight"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: 10,
              }}
            >
              <Badge
                dot
                color={roleColors[user?.role] || '#1677ff'}
                offset={[-4, 4]}
              >
                <Avatar
                  style={{ backgroundColor: roleColors[user?.role] || '#1677ff' }}
                  icon={<UserOutlined />}
                />
              </Badge>
              <div>
                <Text strong style={{ display: 'block', lineHeight: 1.2 }}>
                  {user?.full_name}
                </Text>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', lineHeight: 1.2 }}
                >
                  {user?.role}
                </Text>
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}