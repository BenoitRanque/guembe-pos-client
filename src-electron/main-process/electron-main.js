import { app, BrowserWindow } from 'electron'
import { initPrinting, closePrintWindowAsap } from './print'
/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

let mainWindow

function createWindow () {
  return new Promise(async resolve => {
    /**
     * Initial window options
     */
    const mainWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      useContentSize: true,
      show: false,
      autoHideMenuBar: true,
      // kiosk: true,
      webPreferences: {
        // keep in sync with /quasar.conf.js > electron > nodeIntegration
        // (where its default value is "true")
        // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
        nodeIntegration: true
      }
    })

    mainWindow.once('ready-to-show', (event) => {
      mainWindow.show()
    })

    await mainWindow.loadURL(process.env.APP_URL)

    resolve(mainWindow)
  })
}

async function init () {
  mainWindow = await createWindow()

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  await initPrinting()

  mainWindow.on('closed', () => {
    // when main window closes, instruct print window to close asap (once printing is done)
    closePrintWindowAsap()
  })
}

app.on('ready', init)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async () => {
  if (mainWindow === null) {
    init()
  }
})
