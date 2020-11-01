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

export async function initPrinting () {
  // handle printing with preview
  ipcMain.on('PRINT_JOB_PREVIEW_READY', (event) => {
    BrowserWindow.fromWebContents(event.sender).show()
  })

  ipcMain.on('PRINT_JOB_PREVIEW_PRINT', (event, content) => {
    event.sender.print(content.printOptions, (success, failureReason) => {
      BrowserWindow.fromWebContents(event.sender).close()
    })
  })

  printWindow = await createPrintWindow()

  printWindow.on('closed', () => {
    printWindow = null
  })

  await new Promise(resolve => setTimeout(resolve, 3000))

  ipcMain.on('PRINT', (event, jobs) => Array.isArray(jobs) ? handlePrintJobs(...jobs) : handlePrintJobs(jobs))
}

export async function handlePrintJobs (...jobs) {
  queue.push(...jobs)

  if (!isWorking) {
    isWorking = true

    while (queue.length > 0) {
      const job = queue.shift()

      if (job.preview) {
        const printWindow = await createPrintWindow()
        // WAIT 3 SECONDS BEFORE PROCEEDING. THIS IS A DIRTY HACK!!!
        await new Promise(resolve => setTimeout(resolve, 3000))
        printWindow.webContents.send('PRINT_JOB_PREVIEW', Object.assign(job, {
          printers: printWindow.webContents.getPrinters()
        }))
      } else {
        if (!printWindow) {
          printWindow = await createPrintWindow()

          printWindow.on('closed', () => {
            printWindow = null
          })

          // WAIT 3 SECONDS BEFORE PROCEEDING. THIS IS A DIRTY HACK!!!
          await new Promise(resolve => setTimeout(resolve, 3000))
        }

        await print(printWindow, job)
      }
    }

    if (shouldCloseAsap) {
      printWindow.close()
    }

    isWorking = false
  }
}

function createPrintWindow () {
  return new Promise(async resolve => {
    const printWindow = new BrowserWindow({
      width: 400,
      height: 600,
      useContentSize: true,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        // keep in sync with /quasar.conf.js > electron > nodeIntegration
        // (where its default value is "true")
        // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
        nodeIntegration: true
      }
    })

    printWindow.once('ready-to-show', () => resolve(printWindow))

    printWindow.loadURL(`${process.env.APP_URL}#print/`)
  })
}

function print (printWindow, job) {
  return new Promise((resolve, reject) => {
    printWindow.webContents.send('PRINT_JOB', job)

    ipcMain.on('PRINT_JOB_READY', function listener (event, content) {
      if (BrowserWindow.fromWebContents(event.sender).id === printWindow.id) {
        ipcMain.removeListener('PRINT_JOB_READY', listener)

        event.sender.print(content.printOptions, (success, failureReason) => {
          if (success) {
            resolve(job)
          } else {
            resolve(Object.assign(job, { failed: true, failureReason }))
          }
        })
      }
    })
  })
}
