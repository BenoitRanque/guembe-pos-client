import Vue from 'vue'
import { ipcRenderer } from 'electron'

const state = Vue.observable({
  shouldCloseAsap: false,
  printing: false,
  queue: []
})

export default ({ router, route }) => {
  ipcRenderer.on('CLOSE_ASAP', closeAsap)
  ipcRenderer.on('QUEUE_PRINT_JOB', queuePrintJob)
  ipcRenderer.on('PRINT_JOB_SUCCESS', printJobSucccess)
  ipcRenderer.on('PRINT_JOB_FAILURE', printJobFailure)

  function queuePrintJob (event, job) {
    console.log('queued print job')

    if (Array.isArray(job)) {
      state.queue.push(...job)

      if (state.queue.length === job.length) {
        printNextJob()
      }
    } else {
      state.queue.push(job)

      if (state.queue.length === 1) {
        printNextJob()
      }
    }
  }

  function printNextJob () {
    console.log('printing next job...', state.queue[0])
    const job = state.queue[0]

    const path = `/print/${job.template}`

    if (router.currentRoute.fullpath !== path) {
      router.push(`/print/${job.template}`, () => {
        Vue.nextTick(() => {
          ipcRenderer.send('PRINT_JOB_READY', job)
        })
      })
    } else {
      Vue.nextTick(() => {
        ipcRenderer.send('PRINT_JOB_READY', job)
      })
    }
  }

  function continuePrinting () {
    state.queue.shift()
    console.log('printing next item...', state.queue.length)
    if (state.queue.length !== 0) {
      printNextJob()
    } else if (state.shouldCloseAsap) {
      close()
    }
  }

  function closeAsap () {
    if (state.queue.length === 0) {
      close()
    } else {
      state.shouldCloseAsap = true
    }
  }

  function close () {
    ipcRenderer.send('CLOSE')
  }

  function printJobSucccess (event, job) {
    console.log('success!')
    continuePrinting()
  }

  function printJobFailure (event, job) {
    console.error(job)
    continuePrinting()
  }
}

export {
  state
}
