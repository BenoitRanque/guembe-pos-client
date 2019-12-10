<template>
  <div>
    <q-toolbar class="print-hide">
      <q-toolbar-title>Cola de impresion</q-toolbar-title>
      <q-btn icon="mdi-print"></q-btn>
    </q-toolbar>
    <pre>{{page}}</pre>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'

export default {
  name: 'Printer',
  data () {
    return {
      queue: [],
      closeAsap: false,
      page: {
        hello: remote
      }
    }
  },
  methods: {
    printNextItem () {
      
    },
    queuePrintJob (event, content) {
      this.queue.push(content)
      this.startPrintQueue()
    },
    printJobSuccess (event, content) {
      this.queue.shift()
      this.printNextItem()
    },
    printJobFailure (event, content) {
      this.logPrintError({ item: this.queue[0], error: content })
      this.queue.shift()
      this.printNextItem()
    }
  },
  mounted () {
    ipcRenderer.on('QUEUE_PRINT_JOB', this.queuePrintJob)
    ipcRenderer.on('PRINT_JOB_SUCCESS', this.printJobSuccess)
    ipcRenderer.on('PRINT_JOB_FAILURE', this.printJobFailure)
  }
}
</script>
