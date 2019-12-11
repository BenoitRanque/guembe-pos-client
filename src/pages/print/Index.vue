<template>
  <div>
    <q-btn class="print-hide" @click="print">print</q-btn>
    <div class="print-as-page">1</div>
    <div>2</div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
export default {
  name: 'DefaultPrintTemplate',
  methods: {
    print () {
      ipcRenderer.send('PRINT_JOB_READY', {
        printOptions: {
          silent: true,
          deviceName: 'Facturas'
        }
      })
    }
  }
}
</script>

<style>
  .print-as-page {
    page-break-after: always;
    page-break-before: always;
    page-break-inside: avoid;
  }
</style>
