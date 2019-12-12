<template>
  <div>
    <q-toolbar class="print-hide bg-primary text-white shadow-6">
      <q-toolbar-title>Cola de impresion</q-toolbar-title>
      <q-btn icon="mdi-printer" flat dense round @click="print"></q-btn>
    </q-toolbar>
    <router-view />
  </div>
</template>

<script>
import { state } from 'src/boot/print'
import { ipcRenderer } from 'electron'
export default {
  name: 'Print',
  methods: {
    print () {
      ipcRenderer.send('PRINT_JOB_READY', state.job)
    }
  }
  // computed: {
  //   queue () {
  //     return state.queue
  //   }
  // }
}
</script>
