import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native'
import { CameraView, Camera } from 'expo-camera'
import client from '../api/client'
import useAuthStore from '../store/authStore'

export default function QRScanScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)
  const [scanning, setScanning] = useState(false)
  const login = useAuthStore((s) => s.login)

  // Анимация рамки сканера
  const scanLineAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    requestCameraPermission()
    startScanAnimation()
  }, [])

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync()
    setHasPermission(status === 'granted')
  }

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || scanning) return
    setScanned(true)
    setScanning(true)

    try {
      // data содержит card_id из QR-кода
      const res = await client.post('/auth/login/card', { card_id: data })
      const { access_token, user } = res.data

      await login(access_token, user)

      Alert.alert(
        '✅ Добро пожаловать!',
        `${user.full_name}\nРоль: ${getRoleLabel(user.role)}`,
        [{ text: 'OK' }]
      )
    } catch (e) {
      Alert.alert(
        '❌ Ошибка',
        e.response?.data?.detail || 'QR-код не распознан',
        [
          {
            text: 'Попробовать снова',
            onPress: () => {
              setScanned(false)
              setScanning(false)
            },
          },
        ]
      )
    } finally {
      setScanning(false)
    }
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Администратор',
      manager: 'Менеджер',
      waiter: 'Официант',
      cook: 'Повар',
      bartender: 'Бармен',
      cashier: 'Кассир',
    }
    return labels[role] || role
  }

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text>Запрашиваем доступ к камере...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>❌ Нет доступа к камере</Text>
        <Text style={styles.hintText}>
          Разрешите доступ к камере в настройках телефона
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📷 Сканирование бейджика</Text>
      <Text style={styles.subtitle}>
        Наведите камеру на QR-код сотрудника
      </Text>

      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Рамка сканера */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            {/* Углы рамки */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Анимированная линия сканирования */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY }] },
              ]}
            />
          </View>
        </View>

        {scanning && (
          <View style={styles.scanningOverlay}>
            <Text style={styles.scanningText}>⏳ Авторизация...</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Войти по паролю</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8c8c8c',
    marginBottom: 32,
    textAlign: 'center',
  },
  scannerContainer: {
    width: 300,
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#1677ff',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1677ff',
    opacity: 0.8,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4d4f',
    marginBottom: 8,
  },
  hintText: {
    color: '#8c8c8c',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginTop: 32,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1677ff',
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: '#1677ff',
    fontSize: 15,
    fontWeight: '500',
  },
})