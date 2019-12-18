import Vue from 'vue'
import { ipcRenderer } from 'electron'
import { dom } from 'quasar'
const { ready } = dom

ready(() => {
  console.log('Dom Ready')
  ipcRenderer.invoke('READY')
})

const state = Vue.observable({
  ready: false,
  onReady: null,
  job: null
})

function doubleRequestAnimationFrame () {
  return new Promise(resolve => {
    setTimeout(resolve, 50)
    // setImmediate(() => {
    //   Vue.nextTick(() => {
    //     requestAnimationFrame(() => {
    //       requestAnimationFrame(() => {
    //         resolve()
    //       })
    //     })
    //   })
    // })
  })
}

export default ({ router, app }) => {
  app.mounted = function mounted () {
    console.log('app mounted')
    // state.ready = true
    // if (state.onReady !== null) {
    //   state.onReady()
    // }
  }
  app.updated = function updated () {
    console.log('app updated')
    // state.ready = true
    // if (state.onReady !== null) {
    //   state.onReady()
    // }
  }

  function navigate (path) {
    return new Promise(resolve => router.push(path, resolve, resolve))
  }

  router.onReady(() => {
    console.log('Router Ready')
  })

  ipcRenderer.on('PRINT_JOB', async (event, job) => {
    state.job = job

    await navigate(`/print/${job.template}`, () => {
      state.ready = false
    }, onReady)

    async function onReady () {
      state.ready = true
      await doubleRequestAnimationFrame()
      console.log('PRINT_JOB_READY')
      event.sender.send('PRINT_JOB_READY', job)
    }

    if (state.ready) {
      onReady()
    } else {
      state.onReady = onReady
    }
  })

  ipcRenderer.on('PRINT_JOB_PREVIEW', async (event, job) => {
    state.job = job

    const path = `/print/${job.template}`

    await navigate(path)

    await Vue.nextTick()

    await doubleRequestAnimationFrame()

    Vue.nextTick(() => {
      event.sender.send('PRINT_JOB_PREVIEW_READY', job)
    })
  })
}

export {
  state
}
