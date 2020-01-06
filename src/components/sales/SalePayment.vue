<template>
  <q-splitter v-model="split">
    <template v-slot:before>
      <q-tabs v-model="tab" dense>
        <q-tab
          icon="mdi-cash-multiple"
          label="Effectivo"
          name="cash"
          default
        />
        <q-tab
          icon="mdi-credit-card-outline"
          label="Tarjeta"
          name="card"
        />
      </q-tabs>
      <q-tab-panels v-model="tab">
        <q-tab-panel name="cash">
          <q-form class="row q-col-gutter-sm">
            <div class="col-12">
              <q-input
                v-model="cashBS"
                suffix="BS"
                autofocus
                dense
                label="Effectivo Bolivianos"
                outlined
                type="number"
                min="0"
                step="0.01"
                pattern="\d+(\.\d\d?)?"
              ></q-input>
            </div>
            <div class="col-12">
              <q-input
                v-model="cashUSD"
                suffix="US"
                dense
                label="Effectivo Dolares"
                outlined
                type="number"
                min="0"
                step="1"
                pattern="\d+"
              ></q-input>
            </div>
          </q-form>
        </q-tab-panel>
        <q-tab-panel name="card">
          <q-form class="row q-col-gutter-sm">
            <div class="col-12">
              <!-- CreditSum -->
              <q-input
                v-model="card.CreditSum"
                autofocus
                required
                dense
                outlined
                suffix="BS"
                label="Importe"
                type="number"
                step="0.01"
                pattern="^\d+(\.\d\d?)?$"
              ></q-input>
            </div>
            <div class="col-6">
              <!-- CreditCard -->
              <q-select
                v-model="card.CreditCard"
                :options="cardOptions"
                dense
                required
                outlined
                label="Nombre de tarjeta"
                map-options
                emit-value
              ></q-select>
            </div>
            <div class="col-6">
              <!-- CreditCardNumber -->
              <q-input
                v-model="card.CreditCardNumber"
                dense
                outlined
                required
                label="Numero de tarjeta"
                unmasked-value
                placeholder="0000"
                pattern="\d+"
              ></q-input>
            </div>
            <div class="col-6">
              <!-- CardValidUntil -->
              <q-input
                v-model="card.CardValidUntil"
                dense
                outlined
                required
                label="Valido hasta"
                mask="##/##"
                placeholder="Mes/Año"
                pattern="[0-1]\d/\d\d"
              ></q-input>
            </div>
            <div class="col-6">
              <!-- VoucherNum -->
              <q-input
                v-model="card.VoucherNum"
                dense
                outlined
                required
                label="Tipo Tarjeta"
                placeholder="Numero voucher"
              ></q-input>
            </div>
          </q-form>
          <!-- TODO: determine if these fields are needed -->
          <!-- OwnerIdNum -->
          <!-- <q-input dense outlined label="NIT"></q-input> -->
          <!-- OwnerPhone -->
          <!-- <q-input dense outlined label="Telefono"></q-input> -->
        </q-tab-panel>
      </q-tab-panels>
    </template>
    <template v-slot:after>
      <q-list dense>
        <q-item>
          <q-item-section><q-item-label caption>Total venta</q-item-label></q-item-section>
          <q-item-section side>{{formatPrice(saleTotal)}}</q-item-section>
        </q-item>
        <q-item>
          <q-item-section><q-item-label caption>Credito</q-item-label></q-item-section>
          <q-item-section side>{{formatPrice(creditTotal)}}</q-item-section>
        </q-item>
        <q-item>
          <q-item-section><q-item-label caption>Tarjeta</q-item-label></q-item-section>
          <q-item-section side>{{formatPrice(cardTotal)}}</q-item-section>
        </q-item>
        <q-item>
          <q-item-section><q-item-label caption>Effectivo</q-item-label></q-item-section>
          <q-item-section side>{{formatPrice(cashTotal)}}</q-item-section>
        </q-item>
        <q-separator color="black"></q-separator>
        <q-item>
          <q-item-section><q-item-label caption  class="text-black">Saldo</q-item-label></q-item-section>
          <q-item-section side  class="text-black">{{formatPrice(remainder)}}</q-item-section>
        </q-item>
        <q-item>
          <q-item-section><q-item-label caption>Cambio</q-item-label></q-item-section>
          <q-item-section side>{{formatPrice(change)}}</q-item-section>
        </q-item>
      </q-list>
      <div class="q-px-md q-py-sm text-right">
        <q-btn icon="mdi-check" rounded color="primary" @click="saveChanges">Finalizar</q-btn>
      </div>
    </template>
  </q-splitter>
</template>

<script>
import store from 'src/store'
import { ref, computed, reactive } from '@vue/composition-api'
import { date } from 'quasar'
const { formatDate, endOfDate } = date
export default {
  name: 'Payment',
  setup (props, { emit }) {
    const tab = ref('cash')
    const split = ref(60)

    const formatPrice = store.getters['sales/formatPrice']

    const saleTotal = computed(() => store.getters['sales/saleTotal'])
    // TODO: fix this
    const creditTotal = computed(() => store.getters['sales/quickSale'].Invoice.PaymentGroupCode === -1 ? 0 : saleTotal.value)

    const cashUSD = ref('')
    const cashBS = ref('')

    const cashUSDinBSCents = computed(() => !cashUSD.value ? 0 : ((Number(cashUSD.value) * 100) * (store.state.config.ExchangeRate * 100)) / 100)
    const cashBSinCents = computed(() => Number(cashBS.value) * 100)

    const cashTotal = computed(() => cashUSDinBSCents.value || cashBSinCents.value ? ((cashUSDinBSCents.value + cashBSinCents.value) / 100) : 0)

    const card = reactive({
      CreditSum: 0,
      CreditCard: null,
      CreditCardNumber: '',
      CardValidUntil: '',
      VoucherNum: ''
      // not sure about these two fields
      // OwnerIdNum: '',
      // OwnerPhone: ''
    })

    const cardBSinCents = computed(() => Number(card.CreditSum) * 100)

    const cardTotal = computed(() => cardBSinCents.value ? cardBSinCents.value / 100 : 0)

    const incomeTotalInCents = computed(() => cashUSDinBSCents.value + cashBSinCents.value + cardBSinCents.value)

    const incomeTotal = computed(() => incomeTotalInCents.value ? incomeTotalInCents.value / 100 : 0)

    const totalToPay = computed(() => (saleTotal.value * 100) - (creditTotal.value * 100))

    const differenceInCents = computed(() => totalToPay.value - incomeTotalInCents.value)

    const remainder = computed(() => differenceInCents.value > 0 ? differenceInCents.value / 100 : 0)
    const change = computed(() => differenceInCents.value < 0 ? 0 - (differenceInCents.value / 100) : 0)

    const cardOptions = computed(() => store.state.sales.creditcards)

    function formatCardDate (date) {
      const test = /^([0-1]\d)\/(\d\d)$/
      if (!test.test(date)) return null
      const [ , month, year ] = date.match(test)
      return formatDate(endOfDate(new Date(Number(`20${year}`), Number(month) - 1), 'month'), 'YYYYMMDD')
    }

    function saveChanges () {
      // validate and commit input
      const payment = {
        CashSum: ((cashTotal.value * 100) - (change.value * 100)) / 100,
        PaymentCreditCards: []
      }

      if (cardTotal.value > 0) {
        payment.PaymentCreditCards.push({
          ...card,
          CreditSum: cardTotal.value,
          CardValidUntil: formatCardDate(card.CardValidUntil) // map date here
        })
      }

      store.commit('sales/PAYMENT', payment)

      emit('done')
    }

    return {
      saveChanges,
      cardOptions,
      cashBS,
      cashUSD,
      cashTotal,
      card,
      cardTotal,
      incomeTotal,
      remainder,
      change,
      formatPrice,
      saleTotal,
      creditTotal,
      tab,
      split
    }
  }
}
</script>
