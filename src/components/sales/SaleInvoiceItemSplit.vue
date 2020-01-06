<template>
  <div>
    TODO
    <br>
    Split items and create invoices here
    <q-input type="number" v-model="invoiceCount" min="1"></q-input>
  </div>
</template>

<script>
import { ref } from '@vue/composition-api'
export default {
  name: 'SaleInvoice',
  setup (props, ctx) {
    const invoiceCount = ref(1)
    return {
      invoiceCount
    }
  }
}
</script>
