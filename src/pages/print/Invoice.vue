<template>
  <div class="q-pa-md">
    <div class="text-center">
      BIOCENTRO GUEMBE S.A
      <br>
      MARIPOSARION ORQUIDEARIO Y TURISMO DE SALUD
      <br>
      CASA MATRIZ - SFC 2
      <br>
      Tel: 3700700
      <br>
      SANTA CRUZ - BOLIVIA
    </div>
    <hr>
    <div class="text-center">FACTURA</div>
    <div class="text-center" v-if="job && job.copy">Copia: Contabilidad</div>
    <div class="text-center" v-else>Original: Cliente</div>
    <hr>
      <div class="text-center">
        NIT: 122103025
        <br>
        Nº° FACTURA: 123
        <br>
        Nº° AUTORIZACION: 123
      </div>
    <hr>
    <div class="text-center">Restaurantes</div>
    <div>Fecha: 31/12/2019</div>
    <div>NIT: 0</div>
    <div>Cliente: SIN NOMBRE</div>
    <hr>
    <table class="full-width">
      <thead>
        <tr>
          <th class="text-center">cantidad</th>
          <th class="text-left">detalle</th>
          <th class="text-right">p.unitario</th>
          <th class="text-right">subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">1</td>
          <td class="text-left">OMELETT CON NOMBRE MUY LARGO</td>
          <td class="text-right">12.00</td>
          <td class="text-right">12.00</td>
        </tr>
        <tr>
          <td class="text-center">2</td>
          <td class="text-left">COCA COLA</td>
          <td class="text-right">12.00</td>
          <td class="text-right">24.00</td>
        </tr>
        <tr>
          <td colspan="4">
            <hr>
          </td>
        </tr>
        <tr>
          <td colspan="3" class="text-right">Total Parcial Bs:</td>
          <td class="text-right">24.00</td>
        </tr>
        <tr>
          <td colspan="3" class="text-right">Descuento Bs:</td>
          <td class="text-right">0.00</td>
        </tr>
        <tr>
          <td colspan="3" class="text-right">Total Bs:</td>
          <td class="text-right">24.00</td>
        </tr>
      </tbody>
    </table>
    <hr>
    <div class="text-center">Son: {{num}}</div>
    <br>
    <div class="text-center">Codigo de control: 00-00-00-00</div>
    <div class="text-center">Fecha limite de emision: 31/12/2019</div>
    <div class="text-center q-pa-md">
      <qr-code style="font-size: 0" :value="code" :size="120" level="M"></qr-code>
    </div>
    <div>ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO DE ÉSTA SERÁ SANCIONADO DE ACUERDO A LEY</div>
    <hr>
    <div>Ley N 123: tienes derecho hacer pruebas de impresion de facturas</div>
    <br>
    <div class="text-center">31/12/2019 00:00</div>
  </div>
</template>

<script>
import QrCode from 'qrcode.vue'
import { state } from 'src/boot/print'
import NumberToWords from 'number2words/src/number2words'

export default {
  name: 'DefaultPrintTemplate',
  components: { QrCode },
  computed: {
    job () {
      return state.job
    },
    code () {
      return [
        '122103025', // Business NIT
        '1', // Invoice Number
        '132456789', // Authorization number
        '31/12/2019', // date
        '36', // total?
        '36', // total?
        '00-00-00-00', // control code
        '0', // ?
        '0', // ?
        '0', // ?
        '0', // ?
        '0' // ?
      ].join('|')
    },
    num () {
      const num = 36
      const number2words = new NumberToWords()

      const [ , wholes, cents ] = num.toFixed(2).match(/(\d+)\.(\d\d)/)

      return `${number2words.convert(wholes).toUpperCase()} ${cents}/100 Bs.`
    }
    // job () {
    //   return state.queue.length > 0 ? state.queue[0] : null
    // }
  }
}
</script>

<style>
  /* .print-as-page {
    page-break-after: always;
    page-break-before: always;
    page-break-inside: avoid;
  } */
</style>
