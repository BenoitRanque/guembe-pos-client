<template>
  <q-page class="flex flex-center">
    <q-btn @click="print">Print</q-btn>
    <img alt="Quasar logo" src="~assets/quasar-logo-full.svg">
  </q-page>
</template>

<script>
import { ipcRenderer } from 'electron'

export default {
  name: 'PageIndex',
  methods: {
    print () {
      ipcRenderer.send('PRINT', [
        {
          printOptions: {
            margins: {
              marginType: 'none'
            },
            deviceName: 'Facturas',
            silent: false
          },
          preview: false,
          template: 'invoice',
          copy: false,
          job: {
            message: 'original'
          }
        }
        // {
        //   printOptions: {
        //     margins: {
        //       marginType: 'none'
        //     },
        //     deviceName: 'Facturas',
        //     silent: false
        //   },
        //   template: 'invoice',
        //   preview: false,
        //   copy: true,
        //   job: {
        //     message: 'copy'
        //   }
        // }
      ])
    }
  }
}
</script>
