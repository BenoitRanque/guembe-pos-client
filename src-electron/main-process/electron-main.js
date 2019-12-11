import { app, BrowserWindow, ipcMain } from 'electron'

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    show: false,
    // kiosk: true,
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
    // if (printWindow) {
    //   printWindow.webContents.send('CLOSE_ASAP')
    // }
    mainWindow = null
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // initPrintWindow()

  // printWindow.once('ready-to-show', () => {
  //   printWindow.show()
  // })
}

// function initPrintWindow () {
//   printWindow = new BrowserWindow({
//     width: 400,
//     height: 600,
//     useContentSize: true,
//     show: false,
//     webPreferences: {
//       // keep in sync with /quasar.conf.js > electron > nodeIntegration
//       // (where its default value is "true")
//       // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
//       nodeIntegration: true
//     }
//   })

//   printWindow.loadURL(`${process.env.APP_URL}#print`)

//   printWindow.on('closed', () => {
//     printWindow = null
//   })
// }

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

ipcMain.on('PRINT', (event, jobs) => handlePrintJobs(jobs))

// ipcMain.on('CLOSE', (event) => {
//   BrowserWindow.fromWebContents(event.sender).close()
// })

// ipcMain.on('QUEUE_PRINT_JOB', (event, job) => {
//   if (!printWindow) {
//     // throw new Error(`Printing window not available`)
//     initPrintWindow()
//     printWindow.once('ready-to-show', () => {
//       printWindow.show()
//       setImmediate(() => {
//         printWindow.webContents.send('QUEUE_PRINT_JOB', job)
//       })
//     })
//   } else {
//     printWindow.webContents.send('QUEUE_PRINT_JOB', job)
//   }
// })

// ipcMain.on('PRINT_JOB_READY', (event, content) => {
//   event.webContents.print(content.printOptions, (success, failureReason) => {
//     console.log('print job success:', success)
//     if (success) {
//       event.reply('PRINT_JOB_SUCCESS', content)
//     } else {
//       event.reply('PRINT_JOB_FAILURE', Object.assign(content, { failureReason }))
//     }
//   })
// })

// function PRINT (job) {
//   const printWindow = new BrowserWindow({
//     width: 400,
//     height: 600,
//     useContentSize: true,
//     show: false,
//     webPreferences: {
//       // keep in sync with /quasar.conf.js > electron > nodeIntegration
//       // (where its default value is "true")
//       // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
//       nodeIntegration: false
//     }
//   })

//   printWindow.loadURL(`${process.env.APP_URL}#print/${job.template}`)

//   printWindow.once('ready-to-show', () => {
//     printWindow.webContents.print(job.printOptions, (success, failureReason) => {
//       console.log('print job success:', success, failureReason)
//       printWindow.close()
//     })
//   })
// }

function createPrintWindow () {
  return new Promise((resolve, reject) => {
    const printWindow = new BrowserWindow({
      width: 400,
      height: 600,
      useContentSize: true,
      show: false,
      webPreferences: {
        // keep in sync with /quasar.conf.js > electron > nodeIntegration
        // (where its default value is "true")
        // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
        nodeIntegration: false
      }
    })

    printWindow.loadURL(`${process.env.APP_URL}#print/`)

    printWindow.once('ready-to-show', () => resolve(printWindow))
  })
}

function print (printWindow, job) {
  return new Promise((resolve, reject) => {
    printWindow.send('PRINT_JOB', job)

    ipcMain.on('PRINT_JOB_READY', (event, content) => {
      // ignore messaje from other windows
      if (BrowserWindow.fromWebContents(event.sender).id === printWindow.id) {
        event.webContents.print(content.printOptions, (success, failureReason) => {
          if (success) {
            resolve(job)
          } else {
            reject(Object.assign(job, { failed: true, failureReason }))
          }
        })
      }
    })
  })
}

async function handlePrintJobs (jobs) {
  const printWindow = await createPrintWindow()

  if (!Array.isArray(jobs)) {
    jobs = [jobs]
  }

  for (const job of jobs) {
    await print(printWindow, job)
  }

  printWindow.close()
}
