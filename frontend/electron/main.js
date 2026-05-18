const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // ← ОТКЛЮЧАЕМ для работы с внешним API
      allowRunningInsecureContent: false,
    },
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    show: false,
    title: 'RestaurantOS',
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // Production — правильная загрузка с file://
    const indexPath = path.join(__dirname, '../dist/index.html')
    
    console.log('📂 Loading from:', indexPath)
    
    // ВАЖНО: используем loadURL вместо loadFile
    mainWindow.loadURL(`file://${indexPath}`)
    
    // Временно включаем DevTools
    mainWindow.webContents.openDevTools()
  }

  Menu.setApplicationMenu(null)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })

  // Обработка ошибок загрузки
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load:', {
      errorCode,
      errorDescription,
      validatedURL,
    })
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully')
  })

  // Логирование консоли из renderer процесса
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`)
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
})