<template>
  <q-page>
    <q-layout container style="height: calc(100vh - 50px)">
      <q-header>
        <q-toolbar class="bg-secondary">
          <client-select
            @selected="setClient"
            icon="mdi-pencil"
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
              to="/sales/rapid/catalog"
              exact
            >
              <q-tooltip>Catalogo</q-tooltip>
            </q-route-tab>
            <q-route-tab
              icon="mdi-cash-register"
              to="/sales/rapid/checkout"
              exact
            >
              <q-tooltip>Checkout</q-tooltip>
            </q-route-tab>
          </q-tabs>
          <q-inner-loading :showing="loading">
            <q-spinner></q-spinner>
          </q-inner-loading>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-page>
          <q-splitter v-model="split" style="height: calc(100vh - 100px)">
            <template v-slot:before>
              <router-view name="left"></router-view>
              <div class="text-left q-pa-md" v-if="$route.path.endsWith('checkout')">
                <q-btn size="lg" rounded color="primary" icon="mdi-arrow-left-bold" @click="$router.push('/sales/rapid/catalog')">Catalogo</q-btn>
              </div>
            </template>
            <template v-slot:after>
              <router-view name="right"></router-view>
              <div class="text-right q-pa-md" v-if="!$route.path.endsWith('checkout')">
                <q-btn size="lg" :disable="!$store.getters['sales/quickSale'].Items.length" rounded color="primary" icon-right="mdi-arrow-right-bold" @click="$router.push('/sales/rapid/checkout')">Checkout</q-btn>
              </div>
            </template>
          </q-splitter>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-page>
</template>

<script>
import ClientSelect from 'components/sales/ClientSelect'
import { computed, ref } from '@vue/composition-api'
import store from 'src/store'
import gql from 'src/gql'
export default {
  name: 'RapidSales',
  components: { ClientSelect },
  setup (props, ctx) {
    const loading = ref(false)

    const client = computed(() => store.getters['sales/quickSale'].Client)

    async function setClient (client) {
      try {
        loading.value = true

        await store.dispatch('sales/SET_CLIENT', client)
      } catch (error) {
        gql.handleError(error)
      } finally {
        loading.value = false
      }
    }

    const split = ref(50)

    return {
      loading,
      split,
      setClient,
      client
    }
  }
}
</script>
