import Vue from 'vue'
import { ipcRenderer } from 'electron'

const state = Vue.observable({
  job: null
})

// function doubleRequestAnimationFrame () {
//   return new Promise(resolve => {
//     Vue.nextTick(() => {
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => {
//           resolve()
//         })
//       })
//     })
//   })
// }

export default ({ router }) => {
  function navigate (path) {
    return new Promise(resolve => router.push(path, resolve, resolve))
  }

  ipcRenderer.on('PRINT_JOB', async (event, job) => {
    state.job = job

    await navigate(`/print/${job.template}`)

    await Vue.nextTick()

    event.sender.send('PRINT_JOB_READY', job)
  })

  ipcRenderer.on('PRINT_JOB_PREVIEW', async (event, job) => {
    state.job = job

    await navigate(`/print/${job.template}`)

    await Vue.nextTick()

    event.sender.send('PRINT_JOB_PREVIEW_READY', job)
  })
}

export {
  state
}
