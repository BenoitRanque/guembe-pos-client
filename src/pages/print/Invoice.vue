<template>
  <div class="q-pa-lg q-mb-md" style="font-size: 11px; line-height: 1.2; font-family: 'Arial';">
    <template v-if="InvoiceType === 201">
      <div class="text-center text-weight-bold">BIOCENTRO GUEMBE S.A.</div>
      <div class="text-center">MARIPOSARIO ORQUIDEARIO Y TURISMO DE SALUD</div>
      <div class="text-center">{{Invoice.TaxSerie.U_SUCURSAL}}</div>
      <div class="text-center">{{Invoice.TaxSerie.U_DIRECCION}}</div>
      <div class="text-center">Tel: 3700700</div>
      <div class="text-center">{{Invoice.TaxSerie.U_CIUDAD}} - {{Invoice.TaxSerie.U_PAIS}}</div>
      <q-separator />
      <div class="text-center text-weight-bold">FACTURA</div>
      <div class="text-center" v-if="Copy">Copia: Contabilidad</div>
      <div class="text-center" v-else>Original: Cliente</div>
      <q-separator />
      <div class="row"><span class="text-weight-bold">NIT:</span><q-space/><span>122103025</span></div>
      <div class="row"><span class="text-weight-bold">Nro. Factura:</span><q-space/><span>{{Invoice.U_NRO_FAC}}</span></div>
      <div class="row"><span class="text-weight-bold">Nro. Autorización:</span><q-space/><span>{{Invoice.U_NROAUTOR}}</span></div>
      <q-separator />
      <div class="text-center">{{Invoice.TaxSerie.U_ACTIVIDAD}}</div>
      <q-separator />
      <div class="row"><span class="text-weight-bold">Fecha:</span><q-space/><span>{{displayDate(Invoice.DocDate)}}</span></div>
      <div class="row"><span class="text-weight-bold">NIT/CI:</span><q-space/><span>{{Invoice.U_NIT}}</span></div>
      <div class="row"><span class="text-weight-bold">Razon Social:</span><q-space/><span>{{Invoice.U_RAZSOC}}</span></div>
    </template>
    <template v-else>
      <div class="text-center text-weight-bold" v-if="InvoiceType === 202">Nota de Entrega</div>
      <div class="text-center text-weight-bold" v-else>Consumo Afiliado</div>
      <div class="text-center">(No es factura)</div>
      <q-separator />
      <div class="text-center" v-if="Copy">Copia: Contabilidad</div>
      <div class="text-center" v-else>Original: Cliente</div>
    </template>
    <q-separator />
    <table class="full-width" style="table-layout: fixed;">
      <thead style="font-weight: 300">
        <tr>
          <th width="auto" class="text-left text-weight-bold">Cant.</th>
          <th width="50%" class="text-left text-weight-bold">Descripción</th>
          <th width="auto" class="text-right text-weight-bold">P/U</th>
          <th width="auto" class="text-right text-weight-bold">Subtotal</th>
        </tr>
        <tr>
          <th class="q-pa-none" colspan="4">
            <q-separator />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in Invoice.DocumentLines" :key="index">
          <td style="vertical-align: top" class="text-left">{{item.Quantity}}</td>
          <td style="vertical-align: middle" class="text-left">{{item.ItemDescription}}</td>
          <td style="vertical-align: bottom" class="text-right">{{formatPrice(item.PriceAfterVAT)}}</td>
          <td style="vertical-align: bottom" class="text-right">{{formatPrice(lineTotal(item.PriceAfterVAT, item.Quantity))}}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th class="q-pa-none" colspan="4">
            <q-separator />
          </th>
        </tr>
        <tr>
          <th colspan="3" class="text-right text-weight-bold">Total Bs:</th>
          <th class="text-right text-weight-bold">{{formatPrice(Invoice.DocTotal)}}</th>
        </tr>
      </tfoot>
    </table>
    <q-separator />
    <div>
      <span class="text-weight-bold">Son:</span>
      <span>{{TotalLiteral}}</span>
    </div>
    <template v-if="InvoiceType === 201">
      <q-separator />
      <div class="row"><span class="text-weight-bold">Codigo de Control:</span><q-space/><span>{{Invoice.U_CODCTRL}}</span></div>
      <q-separator />
      <div class="row"><span class="text-weight-bold">Fecha Limite de Emisión:</span><q-space/><span>{{displayDate(Invoice.U_FECHALIM)}}</span></div>
      <div class="text-center q-pa-md">
        <qr-code style="font-size: 0" :value="QRCode" :size="100" level="M"></qr-code>
      </div>
      <div class="text-weight-bold">“ESTE  DOCUMENTO  FISCAL CONTRIBUYE AL DESARROLLO DE NUESTRO PAÍS, EL USO ILÍCITO ES SANCIONADO PENALMENTE”</div>
      <div>{{Invoice.TaxSerie.U_LEYENDA}}</div>
    </template>
    <q-separator />
    <div class="row"><span class="text-weight-bold">Condicion de pago:</span><q-space/><span>{{Invoice.PaymentGroupCode === -1 ? 'Contado' : 'Credito'}}</span></div>
    <div class="row"><span class="text-weight-bold">Punto de venta:</span><q-space/><span>{{Invoice.U_GPOS_SalesPointCode}}</span></div>
    <div class="row"><span class="text-weight-bold">Numero de venta:</span><q-space/><span>{{Invoice.U_GPOS_Serial}}</span></div>
    <template v-if="InvoiceType !== 201">
      <div class="row"><span class="text-weight-bold">Fecha:</span><q-space/><span>{{displayDate(Invoice.DocDate)}}</span></div>
    </template>
    <q-separator />
    <div class="row"><span class="text-weight-bold">Impresión:</span><q-space/><span>{{formatDate(new Date(), 'HH:mm - DD/MM/YYYY')}}</span></div>
  </div>
</template>

<script>
import QrCode from 'qrcode.vue'
import toBolivianosLitteral from 'src/LiteralDeMoneda'

import { computed } from '@vue/composition-api'
import print from 'src/print'
import { displayDate } from 'src/utils'
import { date } from 'quasar'
const { formatDate } = date
// Invoice types
// 201 fiscal invoice
// 202 non fiscal
// 203 affiliate
export default {
  name: 'InvoicePrintTemplate',
  components: { QrCode },
  setup (props, ctx) {
    const job = computed(() => print.state.job)

    const Copy = computed(() => job.value.copy)

    const Invoice = computed(() => job.value.data)
    const InvoiceType = computed(() => Invoice.value.U_GPOS_Type)
    const QRCode = computed(() => InvoiceType.value === 201 ? [
      122103025, // NIT emisor (Número de Identificación Tributaria)
      Invoice.value.U_NRO_FAC, // Número de Factura
      Invoice.value.U_NROAUTOR, // Número de Autorización
      displayDate(Invoice.value.DocDate), // Fecha de emisión
      Invoice.value.DocTotal, // Total
      ((Invoice.value.DocTotal * 100) - (Invoice.value.U_EXENTO * 100)) / 100, // Importe base para el Crédito Fiscal
      Invoice.value.U_CODCTRL, // Código de Control
      Invoice.value.U_NIT, // NIT / CI / CEX Comprador (Número de Identificación Tributaria o Documento de Identidad)
      0, // Importe ICE/IEHD/TASAS
      0, // Importe por ventas no Gravadas o Gravadas a Tasa Cero
      Number(Invoice.value.U_EXENTO), // Importe no Sujeto a Crédito Fiscal
      0 // Descuentos, Bonificaciones y Rebajas Obtenidas
    ].join('|') : null)

    function formatPrice (price) {
      return Number(price).toFixed(2)
    }

    function lineTotal (price, quantity) {
      return ((price * 100) * quantity) / 100
    }

    const TotalLiteral = computed(() => {
      if (!job.value) return ''

      return toBolivianosLitteral(Number(Invoice.value.DocTotal)).split(' ').map(word => `${word.slice(0, 1)}${word.slice(1).toLowerCase()}`).join(' ')
    })

    return {
      job,
      Invoice,
      InvoiceType,
      Copy,
      QRCode,
      TotalLiteral,
      formatPrice,
      lineTotal,
      displayDate,
      formatDate
    }
  }
}
</script>
