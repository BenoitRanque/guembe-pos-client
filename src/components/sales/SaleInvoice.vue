<template>
  <q-card flat>
    <q-card-section class="row items-center">
      <div class="col text-h6">
        Factura 1
      </div>
      <div class="col-auto">
        <q-checkbox
          :disable="$store.getters['sales/saleClientInternal']"
          label="Exenta de IVA"
          left-label
          :value="invoice.VATExempt"
          @input="$event => update('VATExempt', $event)"
        ></q-checkbox>
      </div>
    </q-card-section>
    <q-card-section>
      <div class="row q-col-gutter-sm">
        <div class="col-4">
          <q-input
            outlined
            label="NIT"
            :value="invoice.U_NIT"
            @input="$event => update('U_NIT', $event)"
            ></q-input>
        </div>
        <div class="col-8">
          <q-input
            outlined
            label="RAZON SOCIAL"
            :value="invoice.U_RAZSOC"
            @input="$event => update('U_RAZSOC', $event)"
          ></q-input>
        </div>
        <div class="col-12">
          <q-select
            outlined
            label="Terminos de Pago"
            :disable="$store.getters['sales/salePayTermsOptions'].length === 1"
            :options="$store.getters['sales/salePayTermsOptions']"
            :value="invoice.PaymentGroupCode"
            @input="$event => update('PaymentGroupCode', $event)"
            map-options
            emit-value
          ></q-select>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import store from 'src/store'
export default {
  name: 'SaleInvoice',
  props: {
    invoice: {
      type: Object,
      required: true
    }
  },
  setup (props, ctx) {
    function update (field, value) {
      store.commit('sales/INVOICE', {
        ...props.invoice,
        [field]: value
      })
    }

    return {
      update
    }
  }
}
</script>
