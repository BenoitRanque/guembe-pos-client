<template>
  <div>
    <!-- dummy toolbar for top padding -->
    <q-toolbar class="print-hide"></q-toolbar>
    <q-toolbar class="print-hide shadow-6 bg-white fixed-top">
      <q-select
        v-model="printer"
        :options="printerOptions"
        label="Impresora"
        borderless
        dense
      ></q-select>
      <q-space></q-space>
      <q-btn icon="mdi-printer" color="primary" dense @click="print" :disable="!printer">
        <q-tooltip>
          Imprimir
        </q-tooltip>
      </q-btn>
    </q-toolbar>
    <router-view />
  </div>
</template>

<script>
import { state } from 'src/boot/print'
import { ipcRenderer } from 'electron'
export default {
  name: 'PrintLayout',
  computed: {
    job () {
      return state.job
    },
    printer: {
      get () {
        return state.job ? state.job.printOptions.deviceName : null
      },
      set (value) {
        if (state.job) {
          state.job.printOptions.deviceName = value
        }
      }
    },
    printerOptions () {
      return this.job && this.job.printers ? this.job.printers.map(({ name }) => name) : []
    }
  },
  methods: {
    print () {
      ipcRenderer.send('PRINT_JOB_PREVIEW_PRINT', this.job)
    }
  }
}
</script>
