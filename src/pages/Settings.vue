<template>
  <q-page padding>
    <div class="text-h4">Configuracion</div>
    <sales-point-select label="Punto de Venta" v-model="SalesPointCode"></sales-point-select>
  </q-page>
</template>

<script>
import SalesPointSelect from 'components/SalesPointSelect'
import store from 'src/store'
// import gql from 'src/gql'
import { computed, watch } from '@vue/composition-api'
// import { Loading } from 'quasar'
export default {
  name: 'Settings',
  components: { SalesPointSelect },
  setup () {
    const SalesPointCode = computed({
      get () {
        return store.state.config.SalesPointCode
      },
      set (value) {
        store.commit('config/SALESPOINTCODE', value)
      }
    })

    watch(SalesPointCode, () => {
      store.dispatch('config/loadSalesPointConfig')
    })

    store.dispatch('config/loadLocalConfig')

    return {
      dev: computed(() => process.env.DEV),
      // saveConfig,
      // loadConfig,
      SalesPointCode
    }
  }
}
</script>
