<template>
  <q-list dense>
    <q-item>
      <q-item-section>Total a cobrar</q-item-section>
      <q-item-section side>{{formatPrice(totalDue)}}</q-item-section>
    </q-item>
    <q-item v-if="totalCredit">
      <q-item-section>Credito</q-item-section>
      <q-item-section side>{{formatPrice(totalCredit)}}</q-item-section>
    </q-item>
    <q-item>
      <q-item-section>Saldo Pendiente</q-item-section>
      <q-item-section side>{{formatPrice(totalPending)}}</q-item-section>
    </q-item>
    <q-item v-if="value.CardEnabled">
      <q-item-section>Tarjeta</q-item-section>
      <q-item-section side>{{formatPrice(value.CreditSum)}}</q-item-section>
    </q-item>
    <q-item v-if="value.CashEnabled">
      <q-item-section>Efectivo</q-item-section>
      <q-item-section side>{{formatPrice(cashTotal)}}</q-item-section>
    </q-item>
    <q-item v-if="value.CashEnabled">
      <q-item-section>Cambio</q-item-section>
      <q-item-section side>{{formatPrice(cashChange)}}</q-item-section>
    </q-item>
  </q-list>
</template>

<script>
import { computed } from '@vue/composition-api'
import { formatPrice } from 'src/utils'
import store from 'src/store'
export default {
  name: 'PaymentDetails',
  props: {
    totalDue: {
      type: Number,
      required: true
    },
    totalCredit: {
      type: Number,
      required: false,
      default: null
    },
    value: {
      type: Object,
      required: true
    }
  },
  setup (props, ctx) {
    const cashUSDinBSCents = computed(() => !props.value.CashEnabled || !props.value.CashUSD ? 0 : ((props.value.CashUSD * 100) * (store.state.config.ExchangeRate * 100)) / 100)
    const cashBSinCents = computed(() => !props.value.CashEnabled ? 0 : props.value.CashBS * 100)
    const cashTotal = computed(() => cashUSDinBSCents.value || cashBSinCents.value ? ((cashUSDinBSCents.value + cashBSinCents.value) / 100) : 0)
    const cashIncomeCents = computed(() => cashUSDinBSCents.value + cashBSinCents.value)
    const cashDueCents = computed(() => (props.totalDue * 100) - (props.value.CardEnabled ? props.value.CreditSum * 100 : 0))
    const cashPaid = computed(() => cashIncomeCents.value > cashDueCents.value ? (cashIncomeCents.value - (cashIncomeCents.value - cashDueCents.value)) / 100 : (cashIncomeCents.value / 100))
    const cashChange = computed(() => {
      if (!props.totalDue) return cashTotal.value
      if (cashIncomeCents.value <= cashDueCents.value) return 0
      return (cashIncomeCents.value - cashDueCents.value) / 100
    })
    const totalPending = computed(() => {
      const totalDueCents = props.totalDue * 100
      const totalCreditCents = props.totalCredit ? props.totalCredit * 100 : 0

      const cardCents = props.value.CardEnabled ? props.value.CreditSum * 100 : 0
      const pendingCents = totalDueCents - (cardCents + cashIncomeCents.value + totalCreditCents)

      return pendingCents > 0 ? pendingCents / 100 : 0
    })

    return {
      totalPending,
      formatPrice,
      cashTotal,
      cashChange,
      cashPaid
    }
  }
}
</script>
