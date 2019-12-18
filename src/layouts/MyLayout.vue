<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          icon="mdi-menu"
          aria-label="Menu"
        />

        <q-toolbar-title>
          Guembe POS
        </q-toolbar-title>

        <template v-if="isAuthenticated">
          Session Iniciada: {{SalesEmployeeName}}
        </template>
        <template v-else>
          Session No iniciada
        </template>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-2"
    >
      <q-list>
        <q-item-label header>Essential Links</q-item-label>
        <q-item to="/auth/login">
          <q-item-section>
            <q-item-label>
              Login
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item to="/sales/rapid">
          <q-item-section>
            <q-item-label>
              Venta Rapida
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'MyLayout',
  data () {
    return {
      leftDrawerOpen: false
    }
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'SalesEmployeeName'])
  }
}
</script>
