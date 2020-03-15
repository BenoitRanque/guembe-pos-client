<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          :icon="leftDrawerOpen ? 'mdi-close' : 'mdi-menu'"
          style="transition: transform 0.1s ease-in-out"
          :class="leftDrawerOpen ? 'rotate-180' : ''"
          aria-label="Menu"
        />

        <q-toolbar-title>
          Guembe POS
          <template v-if="$store.state.config.SalesPoint">
          - {{$store.state.config.SalesPoint.Name}} ({{$store.state.config.SalesPoint.Code}})
          </template>
        </q-toolbar-title>
        <template v-if="isAuthenticated">
          <q-btn-dropdown flat icon-right="mdi-account-circle" :label="SalesPersonName">
            <q-list>
              <q-item>
                <q-item-section side>
                  <q-icon name="mdi-account"></q-icon>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Roles</q-item-label>
                  <q-item-label>{{$store.state.auth.Employee.Roles.join(', ')}}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator></q-separator>
              <q-item clickable @click="logout">
                <q-item-section side>
                  <q-icon name="mdi-logout"></q-icon>
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    Cerrar Session
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </template>
        <q-btn round flat icon="mdi-home" to="/"></q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      :breakpoint="0"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-secondary text-weight-medium"
    >
      <q-list>
        <q-expansion-item dark label="Ventas" icon="mdi-store" group="MainMenu">
          <q-list class="bg-white shadow-6">
            <q-item to="/quicksale" :disable="!isAuthorized(['administrador', 'cajeros'])">
              <q-item-section>
                <q-item-label>
                  Venta Rapida
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
        <q-expansion-item dark label="Reportes" icon="mdi-poll-box" group="MainMenu">
          <q-list class="bg-white shadow-6">
            <q-item to="/report" :disable="!isAuthorized(['administrador', 'cajeros'])">
              <q-item-section>
                <q-item-label>
                  Reporte de Ventas
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
        <q-expansion-item dark label="Configuracion" icon="mdi-wrench" group="MainMenu">
          <q-list class="bg-white shadow-6">
            <q-item to="/settings" :disable="!isAuthorized('administrador')">
              <q-item-section>
                <q-item-label>
                  Punto de venta
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item to="/password">
              <q-item-section>
                <q-item-label>
                  Contraseña
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import gql from 'src/gql'
export default {
  name: 'MyLayout',
  data () {
    return {
      leftDrawerOpen: false
    }
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'isAuthorized', 'SalesPersonName'])
  },
  methods: {
    async logout () {
      try {
        await this.$store.dispatch('auth/LOGOUT')
        if (this.$route.fullPath !== '/') {
          this.$router.push('/')
        }
      } catch (error) {
        gql.handleError(error)
      }
    }
  }
}
</script>
