<template>
  <div class="q-pa-lg q-mb-md" style="font-size: 11px; line-height: 1.2; font-family: 'Arial';">
    <q-separator />
    <div class="text-center text-weight-bold">Cuenta</div>
    <q-separator />
    <div class="row"><span class="text-weight-bold">Punto de venta:</span><q-space/><span>{{Receipt.U_GPOS_SalesPointCode}}</span></div>
    <div class="row"><span class="text-weight-bold">Numero de orden:</span><q-space/><span>{{Receipt.U_GPOS_Serial}}</span></div>
    <div class="row"><span class="text-weight-bold">Fecha:</span><q-space/><span>{{displayDate(Receipt.DocDate)}}</span></div>
    <q-separator />
    <table class="full-width" style="table-layout: fixed;">
      <thead style="font-weight: 300">
        <tr>
          <th class="text-right" style="width: 10%">Cant.</th>
          <th class="text-left" style="">Descripcion</th>
          <th class="text-right" style="width: 15%">Precio</th>
          <th class="text-right" style="width: 15%">Subtotal</th>
        </tr>
        <tr>
          <th class="q-pa-none" colspan="4">
            <q-separator />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="({ Quantity, ItemDescription, Price }, index) in Receipt.DocumentLines" :key="`readonly_line_${index}`">
          <td class="text-right">{{Quantity}}</td>
          <td class="text-left">{{ItemDescription}}</td>
          <td class="text-right">{{formatPrice(Price)}}</td>
          <td class="text-right">{{formatPrice(itemSubTotal(Price, Quantity))}}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th colspan="4" style="padding: 0">
            <q-separator color="black"></q-separator>
          </th>
        </tr>
        <tr>
          <th colspan="3">
            <div class="row">
              <slot name="footer-left"></slot>
              <q-space></q-space>
              Total
            </div>
          </th>
          <th class="text-right">
            {{formatPrice(Receipt.DocTotal)}}
          </th>
        </tr>
      </tfoot>
    </table>
    <q-separator />
    <div class="row"><span class="text-weight-bold">Impresión:</span><q-space/><span>{{formatDate(new Date(), 'HH:mm - DD/MM/YYYY')}}</span></div>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import print from 'src/print'
import { displayDate, formatPrice, itemSubTotal } from 'src/utils'
import { date } from 'quasar'
const { formatDate } = date

export default {
  name: 'ReceiptPrintTemplate',
  setup (props, ctx) {
    const job = computed(() => print.state.job)

    const Receipt = computed(() => job.value.data)

    return {
      job,
      Receipt,
      displayDate,
      formatDate,
      formatPrice,
      itemSubTotal
    }
  }
}
</script>
