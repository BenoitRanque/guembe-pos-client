<template>
  <q-page padding>
    <div class="text-h4">Configuracion</div>
    <q-input label="Codigo de punto de venta" v-model="SalesPointCode"></q-input>
    <div class="row q-my-md">
      <q-btn @click="saveConfig" icon="mdi-content-save">Actualizar Configuracion</q-btn>
      <q-space/>
      <q-btn v-if="dev" @click="loadConfig" icon="mdi-refresh">Cargar Configuracion Local</q-btn>
    </div>
  </q-page>
</template>

<script>
import store from 'src/store'
import gql from 'src/gql'
import { computed } from '@vue/composition-api'
import { Loading } from 'quasar'
export default {
  name: 'Settings',
  setup () {
    const SalesPointCode = computed({
      get () {
        return store.state.config.SalesPointCode
      },
      set (value) {
        store.commit('config/SALESPOINTCODE', value)
      }
    })

    async function saveConfig () {
      try {
        await store.dispatch('config/saveLocalConfig')
        try {
          Loading.show({ message: 'Cargando Configuracion' })
          await store.dispatch('config/loadSalesPointConfig')
        } catch (error) {
          gql.handleError(error)
        } finally {
          Loading.hide()
        }
      } catch (error) {
        gql.handleError(error)
      }
    }

    async function loadConfig () {
      store.dispatch('config/loadLocalConfig')
      try {
        Loading.show({ message: 'Cargando Configuracion' })
        await store.dispatch('config/loadSalesPointConfig')
      } catch (error) {
        gql.handleError(error)
      } finally {
        Loading.hide()
      }
    }

    store.dispatch('config/loadLocalConfig')

    return {
      dev: computed(() => process.env.DEV),
      saveConfig,
      loadConfig,
      SalesPointCode
    }
  }
}
</script>
