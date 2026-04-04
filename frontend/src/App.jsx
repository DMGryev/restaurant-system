import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import AppLayout from './components/Layout/AppLayout'
import LoginForm from './components/Auth/LoginForm'
import DashboardPage from './components/Dashboard/DashboardPage'
import MenuPage from './components/Menu/MenuPage'
import OrdersPage from './components/Orders/OrdersPage'
import KitchenPage from './components/Orders/KitchenPage'
import TablesPage from './components/Tables/TablesPage'
import CustomersPage from './components/CRM/CustomersPage'
import LeaderboardPage from './components/Gamification/LeaderboardPage'
import MyStatsPage from './components/Gamification/MyStatsPage'
import UsersPage from './components/Users/UsersPage'
import AnalyticsPage from './components/Analytics/AnalyticsPage'

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <LoginForm />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="kitchen" element={<KitchenPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="my-stats" element={<MyStatsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}