import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Text } from 'react-native'

import useAuthStore from './src/store/authStore'
import LoginScreen from './src/screens/LoginScreen'
import QRScanScreen from './src/screens/QRScanScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import OrdersScreen from './src/screens/OrdersScreen'
import KitchenScreen from './src/screens/KitchenScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// Вкладки для официанта
function WaiterTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1677ff',
        tabBarInactiveTintColor: '#8c8c8c',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Дашборд"
        component={DashboardScreen}
        options={{ tabBarIcon: () => <Text>🏠</Text> }}
      />
      <Tab.Screen
        name="Заказы"
        component={OrdersScreen}
        options={{ tabBarIcon: () => <Text>📝</Text> }}
      />
    </Tab.Navigator>
  )
}

// Вкладки для повара
function CookTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#fa8c16',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Кухня"
        component={KitchenScreen}
        options={{ tabBarIcon: () => <Text>🔥</Text> }}
      />
    </Tab.Navigator>
  )
}

// Выбор интерфейса по роли
function MainApp() {
  const user = useAuthStore((s) => s.user)

  if (!user) return null

  const cookRoles = ['cook', 'bartender']
  if (cookRoles.includes(user.role)) {
    return <CookTabs />
  }

  return <WaiterTabs />
}

export default function App() {
  const { isAuthenticated, init } = useAuthStore()

  useEffect(() => {
    init()
  }, [])

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="QRScan" component={QRScanScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainApp} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}