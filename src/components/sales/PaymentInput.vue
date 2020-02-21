<template>
  <q-form @reset="reset" @submit="submit">
    <q-expansion-item v-model="value.CashEnabled">
      <template v-slot:header>
        <q-item-section>
          <q-checkbox class="text-bold" v-model="value.CashEnabled">
            Effectivo
            <q-icon name="mdi-cash-multiple"></q-icon>
          </q-checkbox>
        </q-item-section>
      </template>
      <div class="q-pa-md">
        <div class="row q-col-gutter-sm">
          <div class="col-12">
            <q-input
              :disable="!value.CashEnabled"
              :value="value.CashBS"
              @input="update('CashBS', /\d+(\.\d\d?)?/.test($event) ? Number($event) : value.CashBS)"
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
              :disable="!value.CashEnabled"
              :value="value.CashUSD"
              @input="update('CashUSD', /\d+(\.\d\d?)?/.test($event) ? Number($event) : value.CashUSD)"
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
        </div>
      </div>
    </q-expansion-item>
    <q-expansion-item v-model="value.CardEnabled">
      <template v-slot:header>
        <q-item-section>
          <q-checkbox class="text-bold" v-model="value.CardEnabled">
            Tarjeta
            <q-icon name="mdi-credit-card-outline"></q-icon>
          </q-checkbox>
        </q-item-section>
      </template>
      <div class="q-pa-md">
        <div class="row q-col-gutter-sm">
          <div class="col-12">
            <!-- CreditSum -->
            <q-input
              :disable="!value.CardEnabled"
              :required="!value.CardEnabled"
              :value="value.CreditSum"
              @input="update('CreditSum', /\d+(\.\d\d?)?/.test($event) ? Number($event) : value.CreditSum)"
              dense
              outlined
              suffix="BS"
              label="Importe"
              type="number"
              step="0.01"
              pattern="^\d+(\.\d\d?)?$"
              :rules="[
                val => !value.CardEnabled || val ? true : 'Campo requerido',
                val => !value.CardEnabled || Number(val) <= totalDue ? true : 'Total tarjeta execede total a pagar'
              ]"
            ></q-input>
          </div>
          <div class="col-6">
            <!-- CreditCard -->
            <q-select
              :disable="!value.CardEnabled"
              :required="!value.CardEnabled"
              :value="value.CreditCard"
              @input="update('CreditCard', $event)"
              :options="CardOptions"
              dense
              outlined
              label="Nombre de tarjeta"
              map-options
              emit-value
              :rules="[ val => !value.CardEnabled || val ? true : 'Campo requerido' ]"
            ></q-select>
          </div>
          <div class="col-6">
            <!-- CreditCardNumber -->
            <q-input
              :disable="!value.CardEnabled"
              :required="!value.CardEnabled"
              :value="value.CreditCardNumber"
              @input="update('CreditCardNumber', $event)"
              dense
              outlined
              label="Numero de tarjeta"
              unmasked-value
              placeholder="0000"
              pattern="\d+"
              :rules="[ val => !value.CardEnabled || val ? true : 'Campo requerido' ]"
            ></q-input>
          </div>
          <div class="col-6">
            <!-- CardValidUntil -->
            <q-input
              :disable="!value.CardEnabled"
              :required="!value.CardEnabled"
              :value="toCardDate(value.CardValidUntil)"
              @input="update('CardValidUntil', fromCardDate($event))"
              dense
              outlined
              label="Valido hasta"
              mask="##/##"
              placeholder="Mes/Año"
              pattern="[0-1]\d/\d\d"
              :rules="[ val => !value.CardEnabled || val ? true : 'Campo requerido' ]"
            ></q-input>
          </div>
          <div class="col-6">
            <!-- VoucherNum -->
            <q-input
              :disable="!value.CardEnabled"
              :required="!value.CardEnabled"
              :value="value.VoucherNum"
              @input="update('VoucherNum', $event)"
              dense
              outlined
              label="Tipo Tarjeta"
              placeholder="Numero voucher"
              :rules="[ val => !value.CardEnabled || val ? true : 'Campo requerido' ]"
            ></q-input>
            <!-- TODO: determine if these fields are needed -->
            <!-- OwnerIdNum -->
            <!-- <q-input dense outlined label="NIT"></q-input> -->
            <!-- OwnerPhone -->
            <!-- <q-input dense outlined label="Telefono"></q-input> -->
          </div>
        </div>
      </div>
    </q-expansion-item>
    <q-separator></q-separator>
    <payment-details :total-due="totalDue" :value="value"></payment-details>
    <q-separator></q-separator>
    <div class="q-pa-md row justify-around">
      <q-btn class="q-mx-md q-mb-md" type="reset" flat>reset</q-btn>
      <q-btn class="q-mx-md q-mb-md" type="submit" color="primary">Continuar</q-btn>
    </div>
  </q-form>
</template>

<script>
import PaymentDetails from 'components/sales/PaymentDetails'
import store from 'src/store'
import { formatPrice } from 'src/utils'
import { computed } from '@vue/composition-api'
import { date, Notify } from 'quasar'
const { formatDate, endOfDate } = date
export default {
  name: 'PaymentInput',
  components: { PaymentDetails },
  props: {
    totalDue: {
      type: Number,
      required: true
    },
    value: {
      type: Object,
      required: true
    }
  },
  setup (props, { emit, refs }) {
    function update (key, value) {
      emit('input', Object.assign({}, props.value, { [key]: value }))
    }

    const CardOptions = computed(() => {
      return store.state.config.CreditCards.map(({ CreditCardCode: value, CreditCardName: label }) => ({ value, label }))
    })

    function reset () {
      emit('input', {
        CashEnabled: true,
        CashBS: props.totalDue,
        CashUSD: 0,
        CardEnabled: false,
        CreditSum: 0,
        CreditCard: null,
        CreditCardNumber: '',
        CardValidUntil: '',
        VoucherNum: ''
      })
    }

    function toCardDate (date) {
      const pattern = /(\d\d)(\d\d)(\d\d)(\d\d)/
      if (!pattern.test(date)) return null
      const [ , , year, month ] = date.match(pattern)
      return `${month}/${year}`
    }

    function fromCardDate (date) {
      const pattern = /^([0-1]\d)\/(\d\d)$/
      if (!pattern.test(date)) return null
      const [ , month, year ] = date.match(pattern)
      return formatDate(endOfDate(new Date(Number(`20${year}`), Number(month) - 1), 'month'), 'YYYYMMDD')
    }

    const cashUSDinBSCents = computed(() => props.value.CashEnabled || !props.value.CashUSD ? 0 : ((props.value.CashUSD.value * 100) * (store.state.config.ExchangeRate * 100)) / 100)
    const cashBSinCents = computed(() => !props.value.CashEnabled ? 0 : props.value.CashBS * 100)
    const cashIncomeCents = computed(() => cashUSDinBSCents.value + cashBSinCents.value)
    const cashDueCents = computed(() => (props.totalDue * 100) - (props.value.CardEnabled ? props.value.CreditSum * 100 : 0))
    const cashPaid = computed(() => cashIncomeCents.value > cashDueCents.value ? (cashIncomeCents.value - (cashIncomeCents.value - cashDueCents.value)) / 100 : (cashIncomeCents.value / 100))

    function submit () {
      if (((cashPaid.value * 100) + (props.value.CreditSum * 100) / 100) < props.totalDue) {
        return Notify.create({
          color: 'negative',
          icon: 'mdi-alert',
          message: `Saldo no cubierto`
        })
      }

      const payment = {
        CashSum: props.value.CashEnabled ? cashPaid.value : 0,
        PaymentCreditCards: []
      }

      if (props.value.CardEnabled) {
        payment.PaymentCreditCards.push({
          CreditSum: props.value.CreditSum,
          CreditCard: props.value.CreditCard,
          CreditCardNumber: props.value.CreditCardNumber,
          CardValidUntil: props.value.CardValidUntil,
          VoucherNum: props.value.VoucherNum
        })
      }
      emit('payment', payment)
    }

    return {
      update,
      formatPrice,
      toCardDate,
      fromCardDate,
      reset,
      submit,
      CardOptions
    }
  }
}
</script>
