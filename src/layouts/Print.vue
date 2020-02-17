<template>
  <div>
    <!-- dummy toolbar for top padding -->
    <q-toolbar class="print-hide"></q-toolbar>
    <q-toolbar class="print-hide shadow-6 bg-white fixed-top">
      <div class="col">
        <q-select
          v-model="printer"
          :options="printerOptions"
          label="Impresora"
          borderless
          dense
        ></q-select>
      </div>
      <q-btn icon="mdi-printer" color="primary" dense @click="print" :disable="!printer">
        <q-tooltip content-class="print-hide">
          Imprimir
        </q-tooltip>
      </q-btn>
    </q-toolbar>
    <router-view :class="{ 'test-print-style': test }"/>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import print from 'src/print'
export default {
  name: 'PrintLayout',
  setup (props, ctx) {
    const job = computed(() => print.state.job)

    const printer = computed({
      get () {
        return job.value ? job.value.printOptions.deviceName : null
      },
      set (value) {
        if (job.value) {
          job.value.printOptions.deviceName = value
        }
      }
    })

    const printerOptions = computed(() => {
      return job.value && job.value.printers ? job.value.printers.map(({ name }) => name) : []
    })

    const test = computed(() => job.value && job.value.test)

    return {
      job,
      test,
      printer,
      printerOptions,
      print
    }
  }
}
</script>

<style>
  .test-print-style {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='200px' width='400px'><text opacity='0.4' x='80' y='60' width='240' height='100' transform='rotate(325 220 110)' fill='grey' font-family='monospace' font-size='60' font-weight='bold'>PRUEBA</text></svg>");
  }
</style>
