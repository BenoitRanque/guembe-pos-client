<template>
  <q-toolbar class="bg-grey-3">
    <client-select
      @selected="client = $event"
      icon="mdi-pencil"
      color="primary"
      :label="client ? '' : 'Selecionar Cliente'"
      flat
      dense
    >
      <q-tooltip>Cambiar Cliente</q-tooltip>
    </client-select>
    <template v-if="client">
      <q-toolbar-title shrink>
        {{client.CardCode}}
        -
        {{client.CardName}}
        <!-- Cliente: -->
      </q-toolbar-title>
    </template>
    <q-space/>
    <q-tabs>
      <q-route-tab
        icon="mdi-cart"
        to="/mails"
        exact
      />
      <q-route-tab
        icon="mdi-cash-register"
        to="/alarms"
        exact
      />
      <!-- <q-route-tab
        icon="mdi-cash-multiple"
        to="/alarms"
        exact
      />
      <q-route-tab
        icon="mdi-credit-card-outline"
        to="/alarms"
        exact
      /> -->
    </q-tabs>
  </q-toolbar>
</template>

<script>
import ClientSelect from 'components/sales/ClientSelect'
import { computed } from '@vue/composition-api'
import store from 'src/store'
export default {
  name: 'Client',
  components: { ClientSelect },
  setup (props, ctx) {
    const client = computed({
      get: () => store.getters['sales/quickSale'].Client,
      set (client) {
        store.dispatch('sales/SET_CLIENT', client)
      }
    })

    return {
      client
    }
  }
}
</script>
