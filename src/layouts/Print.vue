<template>
  <div>
    <q-toolbar class="print-hide bg-primary text-white shadow-6">
      <q-toolbar-title>Cola de impresion: {{queue.length}}</q-toolbar-title>
      <q-btn icon="mdi-printer" flat dense round></q-btn>
    </q-toolbar>
    <router-view />
  </div>
</template>

<script>
import { state } from 'src/boot/print'
export default {
  name: 'Print',
  computed: {
    queue () {
      return state.queue
    }
  }
}
</script>
