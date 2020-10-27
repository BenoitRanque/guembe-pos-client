<template>
  <q-drawer
    v-model="showDrawer"
    false
    :width="500"
    side="right"
    :breakpoint="0"
    elevated
    content-class=""
  >
    <q-toolbar class="bg-primary text-white">
      <q-tabs shrink v-model="checkoutTab">
        <q-tab name="invoiceInput">Facturación</q-tab>
        <q-tab name="paymentInput" :disable="Invoice.PaymentGroupCode !== PAYGROUP_NONE">Pago</q-tab>
        <q-tab name="paymentReview" :disable="true">Revisar</q-tab>
      </q-tabs>
      <q-space></q-space>
      <q-btn
        flat
        dense
        round
        @click="showDrawer = !showDrawer"
        :icon="showDrawer ? 'mdi-close' : 'mdi-menu'"
        style="transition: transform 0.1s ease-in-out"
        :class="showDrawer ? 'rotate-180' : ''"
        aria-label="Menu"
      />
    </q-toolbar>
    <q-scroll-area style="height: calc(100% - 50px)">
      <q-tab-panels v-model="checkoutTab">
        <q-tab-panel name="invoiceInput">
          <q-input class="q-ma-md" v-model="Invoice.U_NIT" outlined label="NIT/CI"></q-input>
          <q-input class="q-ma-md" v-model="Invoice.U_RAZSOC" outlined label="RAZON SOCIAL"></q-input>
          <q-select class="q-ma-md" v-model="Invoice.PaymentGroupCode" outlined emit-value :options="PaymentTypeOptions" map-options></q-select>
          <q-separator></q-separator>
          <div class="q-pa-md row justify-around">
            <q-btn class="m-mx-md" color="primary" @click="proceedFromInvoice()">Proceder</q-btn>
          </div>
        </q-tab-panel>
        <q-tab-panel name="paymentInput">
          <payment-input
            :total-due="TotalDue"
            v-model="PaymentModel"
            @payment="proceedFromPayment"
            dense
            outline
            icon="mdi-credit-card-settings-outline"
            color="primary"
          >
          </payment-input>
        </q-tab-panel>
        <q-tab-panel name="paymentReview">
          <payment-details :total-due="TotalDue" :total-credit="Invoice.Payment ? 0 : TotalDue" :value="PaymentModel"></payment-details>
          <q-separator></q-separator>
          <div class="text-center q-pa-md">
            <q-btn
              @click="checkout()"
              icon="mdi-cash-register"
              size="lg"
              label="Checkout"
              color="accent"
            ></q-btn>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-scroll-area>
  </q-drawer>
</template>

<script>
import PaymentDetails from 'components/PaymentDetails'
import PaymentInput from 'components/PaymentInput'
import { computed, reactive, toRefs, watch, ref } from '@vue/composition-api'
const PAYGROUP_NONE = -1
export default {
  name: 'CheckoutInput',
  components: { PaymentInput, PaymentDetails },
  props: {
    value: {
      type: Boolean,
      required: true
    },
    BusinessPartner: {
      type: Object,
      required: true
    },
    TotalDue: {
      type: Number
    }
  },
  setup (props, { emit }) {
    const showDrawer = computed({
      get: () => props.value,
      set: value => emit('input', value)
    })
    const checkoutTab = ref('invoiceInput')
    const { TotalDue, BusinessPartner } = toRefs(props)

    const Invoice = reactive({
      PaymentGroupCode: PAYGROUP_NONE,
      Payment: null,
      U_NIT: '0',
      U_RAZSOC: 'SIN NOMBRE'
    })

    const PaymentModel = ref({
      CashEnabled: true,
      CashBS: 0,
      CashUSD: 0,
      CardEnabled: false,
      CreditSum: 0,
      CreditCard: null,
      CreditCardNumber: '',
      CardValidUntil: '',
      VoucherNum: ''
    })

    watch(() => PaymentModel.value.CashEnabled, Enabled => {
      if (!PaymentModel.value.CardEnabled) {
        PaymentModel.value.CashBS = Enabled ? TotalDue.value : 0
        if (!Enabled) {
          PaymentModel.value.CashUSD = 0
        }
      }
    })

    watch(() => PaymentModel.value.CardEnabled, Enabled => {
      if (!PaymentModel.value.CashEnabled) {
        PaymentModel.value.CreditSum = Enabled ? TotalDue.value : 0
      }
    })
    watch(() => Invoice.PaymentGroupCode, PaymentGroupCode => {
      PaymentModel.value.CashEnabled = false
      PaymentModel.value.CashBS = 0
      PaymentModel.value.CashUSD = 0
      PaymentModel.value.CardEnabled = false
      PaymentModel.value.CreditSum = 0
      PaymentModel.value.CreditCard = null
      PaymentModel.value.CreditCardNumber = ''
      PaymentModel.value.CardValidUntil = ''
      PaymentModel.value.VoucherNum = ''
    })

    const PaymentTypeOptions = computed(() => {
      const PaymentTypes = []

      if (!BusinessPartner.value || !BusinessPartner.value.Affiliate) {
        PaymentTypes.push({
          label: 'CONTADO',
          value: PAYGROUP_NONE
        })
      }

      if (BusinessPartner.value && BusinessPartner.value.PayTermsGrpCode !== PAYGROUP_NONE) {
        PaymentTypes.push({
          label: 'CREDITO',
          value: BusinessPartner.value.PayTermsGrpCode
        })
      }

      return PaymentTypes
    })

    watch(BusinessPartner, (BusinessPartner) => {
      if (BusinessPartner) {
        Invoice.U_NIT = BusinessPartner.FederalTaxID
        Invoice.U_RAZSOC = BusinessPartner.CardForeignName
        if (BusinessPartner.Affiliate) {
          Invoice.PaymentGroupCode = BusinessPartner.PayTermsGrpCode
        } else {
          Invoice.PaymentGroupCode = PAYGROUP_NONE
        }
      }
    })

    function proceedFromInvoice () {
      if (Invoice.PaymentGroupCode !== PAYGROUP_NONE) {
        Invoice.Payment = null
        checkoutTab.value = 'paymentReview'
      } else {
        checkoutTab.value = 'paymentInput'
      }
    }
    function proceedFromPayment (payment) {
      Invoice.Payment = payment
      checkoutTab.value = 'paymentReview'
    }

    function checkout () {
      emit('checkout', { ...Invoice, Payment: Invoice.Payment ? { ...Invoice.Payment } : null })
    }

    return {
      showDrawer,
      checkoutTab,
      PAYGROUP_NONE,
      PaymentTypeOptions,
      Invoice,
      PaymentModel,
      proceedFromInvoice,
      proceedFromPayment,
      checkout
    }
  }
}
</script>
