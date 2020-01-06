<template>
  <div>
    <div class="q-py-xs q-px-sm row">
      <q-btn size="sm" @click="showDialog = true" flat dense >Division de venta</q-btn>
      <q-space></q-space>
    </div>
    <q-dialog v-model="showDialog" persistent>
      <q-card style="max-width: 90vw">
        <q-bar>
          Division de venta
          <q-space></q-space>
          <q-btn dense flat icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <q-card-section>
          <sale-invoice-item-split></sale-invoice-item-split>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-actions align="center">
          <q-btn flat v-close-popup>Ok</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <div class="q-px-md q-py-xm">
      <sale-invoice :invoice="invoice"></sale-invoice>
    </div>
    <div class="text-right q-pa-md">
      <q-btn size="lg" rounded color="primary" icon-right="mdi-arrow-right-bold" @click="showFinalizeDialog = true">Checkout</q-btn>
    </div>
    <q-dialog v-model="showFinalizeDialog" persistent>
      <q-card>
        <q-bar>
          Finalizar venta
          <q-space></q-space>
          <q-btn flat dense icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <sale-payment @done="showFinalizeDialog = false, finalizeSale()"></sale-payment>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { computed, ref } from '@vue/composition-api'
import store from 'src/store'
import SaleInvoice from 'components/sales/SaleInvoice'
import SaleInvoiceItemSplit from 'components/sales/SaleInvoiceItemSplit'
import SalePayment from 'components/sales/SalePayment'
import { Loading } from 'quasar'
import gql from 'src/gql'
export default {
  name: 'Checkout',
  components: { SaleInvoice, SalePayment, SaleInvoiceItemSplit },
  setup () {
    const invoice = computed(() => store.getters['sales/quickSale'].Invoice)

    const showDialog = ref(false)
    const showFinalizeDialog = ref(false)

    const count = computed(() => store.getters['sales/quickSale'].Items.reduce((total, { quantity }) => total + quantity, 0))
    const total = computed(() => store.getters['sales/saleTotal'])

    const formatPrice = store.getters['sales/formatPrice']

    async function finalizeSale () {
      try {
        Loading.show()

        const response = await store.dispatch('sales/FINALIZE')
        console.log(response)
      } catch (error) {
        gql.handleError(error)
      } finally {
        Loading.hide()
      }
    }

    return {
      finalizeSale,
      formatPrice,
      count,
      total,
      showDialog,
      showFinalizeDialog,
      invoice
    }
  }
}
</script>
