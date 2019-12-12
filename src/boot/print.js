import Vue from 'vue'
import { ipcRenderer } from 'electron'

const state = Vue.observable({
  job: null
})

export default ({ router }) => {
  function navigate (path) {
    return new Promise((resolve, reject) => {
      if (router.currentRoute.fullPath === path) {
        resolve()
      } else {
        router.push(path, resolve, reject)
      }
    })
  }

  ipcRenderer.on('PRINT_JOB', async (event, job) => {
    state.job = job

    const path = `/print/${job.template}`

    await navigate(path)

    Vue.nextTick(() => {
      ipcRenderer.send('PRINT_JOB_READY', job)
    })
  })
}

export {
  state
}
