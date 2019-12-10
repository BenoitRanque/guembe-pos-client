import { app, BrowserWindow, ipcMain } from 'electron'

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

let mainWindow, printWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    // kiosk: true,
    webPreferences: {
      // keep in sync with /quasar.conf.js > electron > nodeIntegration
      // (where its default value is "true")
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: true
    }
  })

  printWindow = new BrowserWindow({
    width: 400,
    height: 600,
    useContentSize: true,
    // show: false,
    webPreferences: {
      // keep in sync with /quasar.conf.js > electron > nodeIntegration
      // (where its default value is "true")
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  mainWindow.on('closed', () => {
    // when main window closes, instruct print window to close asap (once printing is done)
    printWindow.webContents.send('CLOSE_ASAP')
    mainWindow = null
  })

  printWindow.loadURL(`${process.env.APP_URL}#print`)

  printWindow.on('closed', () => {
    printWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('QUEUE_PRINT_JOB', (event, content) => {
  printWindow.webContents.send('QUEUE_PRINT_JOB', content)
})

ipcMain.on('PRINT_JOB_READY', (event, content) => {
  printWindow.webContents.print(content, (success, failureReason) => {
    if (success) {
      printWindow.webContents.send('PRINT_JOB_SUCCESS')
    } else {
      printWindow.webContents.send('PRINT_JOB_FAILURE', failureReason)
    }
  })
})
