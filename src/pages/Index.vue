<template>
  <q-page class="flex flex-center">
    {{$route.path}}
    <q-btn @click="print">Print</q-btn>
    <img alt="Quasar logo" src="~assets/quasar-logo-full.svg">
  </q-page>
</template>

<script>

let printWindow

export default {
  name: 'PageIndex',
  methods: {
    print () {
      const { BrowserWindow } = require('electron').remote

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

      printWindow.loadURL(`${process.env.APP_URL}#printer`, {
        extraHeaders: `X-WINDOW-TYPE: PRINTER`
      })

      printWindow.on('closed', () => {
        printWindow = null
      })
      // see here!
      // https://stackoverflow.com/questions/37627064/how-to-print-a-div-in-electronjs
    }
  }
}
</script>
