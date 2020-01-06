import Vue from 'vue'
import { Platform, Notify } from 'quasar'

const state = Vue.observable({
  job: null
})

function print (jobs) {
  // if not on electron, return immediately
  if (!Platform.is.electron) {
    Notify.create({ color: 'negative', icon: 'mdi-warning', message: 'Printing not available on this platform' })
    return
  }
  const { ipcRenderer } = require('electron')
  // if current window is a print preview window, print method prints current content.
  // else, print method sends a print job to the main thread
  if (state.job && state.job.preview) {
    ipcRenderer.send('PRINT_JOB_PREVIEW_PRINT')
  } else {
    ipcRenderer.send('PRINT', jobs)
  }
}

print.state = state

function printSetup (router) {
  if (!Platform.is.electron) {
    return
  }

  const { ipcRenderer } = require('electron')

  ipcRenderer.on('PRINT_JOB', handleJob('PRINT_JOB_READY'))
  ipcRenderer.on('PRINT_JOB_PREVIEW', handleJob('PRINT_JOB_PREVIEW_READY'))

  function handleJob (readyEvent) {
    return async (event, job) => {
      state.job = job

      await navigate(`/print/${job.template}`)

      await Vue.nextTick()

      event.sender.send(readyEvent, job)
    }
  }
  function navigate (path) {
    return new Promise(resolve => router.push(path, resolve, resolve))
  }
}

export {
  print,
  state,
  printSetup
}

export default print
