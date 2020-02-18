<template>
  <div class="q-pa-lg q-mb-md" style="font-size: 11px; line-height: 1.2; font-family: 'Arial';">
    <q-separator />
    <div class="text-center text-weight-bold">Comanda</div>
    <q-separator />
    <div class="row"><span class="text-weight-bold">Punto de venta:</span><q-space/><span>{{Order.U_GPOS_SalesPointCode}}</span></div>
    <div class="row"><span class="text-weight-bold">Numero de orden:</span><q-space/><span>{{Order.U_GPOS_Serial}}</span></div>
    <div class="row"><span class="text-weight-bold">Fecha:</span><q-space/><span>{{displayDate(Order.DocDate)}}</span></div>
    <q-separator />
    <table class="full-width" style="table-layout: fixed;">
      <thead style="font-weight: 300">
        <tr>
          <th width="auto" class="text-left text-weight-bold">Cant.</th>
          <th width="60%" class="text-left text-weight-bold">Descripción</th>
        </tr>
        <tr>
          <th class="q-pa-none" colspan="4">
            <q-separator />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in Order.Items" :key="index">
          <td style="vertical-align: top" class="text-left">{{item.Quantity}}</td>
          <td style="vertical-align: middle" class="text-left">{{item.ItemName}}</td>
        </tr>
      </tbody>
    </table>
    <q-separator />
    <div class="row"><span class="text-weight-bold">Impresión:</span><q-space/><span>{{formatDate(new Date(), 'HH:mm - DD/MM/YYYY')}}</span></div>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api'
import print from 'src/print'
import { displayDate } from 'src/utils'
import { date } from 'quasar'
const { formatDate } = date

export default {
  name: 'OrderPrintTemplate',
  setup (props, ctx) {
    const job = computed(() => print.state.job)

    const Order = computed(() => job.value.data)

    return {
      job,
      Order,
      displayDate,
      formatDate
    }
  }
}
</script>
