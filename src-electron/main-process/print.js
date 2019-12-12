import { BrowserWindow, ipcMain } from 'electron'

let printWindow = null
let shouldCloseAsap = false, isWorking = false
const queue = []

export function closePrintWindowAsap () {
  if (!isWorking) {
    if (printWindow) {
      printWindow.close()
    }
  } else {
    shouldCloseAsap = true
  }
}

export async function handlePrintJobs (...jobs) {
  queue.push(...jobs)

  if (!isWorking) {
    isWorking = true

    while (queue.length > 0) {
      const job = queue.shift()

      if (!printWindow) {
        console.log('creating window...')
        await createPrintWindow()
      }

      await print(job)
    }

    if (shouldCloseAsap) {
      printWindow.close()
    }

    isWorking = false
  }
}

async function createPrintWindow () {
  printWindow = new BrowserWindow({
    width: 400,
    height: 600,
    useContentSize: true,
    show: false,
    webPreferences: {
      // keep in sync with /quasar.conf.js > electron > nodeIntegration
      // (where its default value is "true")
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: true
    }
  })

  printWindow.on('closed', () => {
    printWindow = null
  })

  await printWindow.loadURL(`${process.env.APP_URL}#print/`)

  return printWindow
}

function print (job) {
  return new Promise((resolve, reject) => {
    printWindow.webContents.send('PRINT_JOB', job)

    ipcMain.once('PRINT_JOB_READY', (event, content) => {
      event.sender.print(content.printOptions, (success, failureReason) => {
        if (success) {
          resolve(job)
        } else {
          resolve(Object.assign(job, { failed: true, failureReason }))
        }
      })
    })
  })
}
