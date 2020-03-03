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
          <template v-if="$store.state.config.SalesPoint">
          - {{$store.state.config.SalesPoint.Name}} ({{$store.state.config.SalesPoint.Code}})
          </template>
        </q-toolbar-title>
        <template v-if="isAuthenticated">
          <q-btn-dropdown flat>
            <template v-slot:label>
              <q-icon name="mdi-account-circle"></q-icon>
              {{SalesEmployeeName}}
            </template>
            <q-list>
              <q-item>
                <q-item-section side>
                  <q-icon name="mdi-account"></q-icon>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Roles</q-item-label>
                  <q-item-label>{{$store.state.auth.session.Roles.join(', ')}}</q-item-label>
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
        <q-item to="/" exact>
          <q-item-section>
            <q-item-label>
              Inicio
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item to="/settings" v-if="isAuthorized('administrador')">
          <q-item-section>
            <q-item-label>
              Configuracion
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
        <q-item to="/quicksale" v-if="isAuthorized(['administrador', 'cajeros'])">
          <q-item-section>
            <q-item-label>
              Venta Rapida
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item to="/report" v-if="isAuthorized(['administrador', 'cajeros'])">
          <q-item-section>
            <q-item-label>
              Reporte de Ventas
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
import gql from 'src/gql'
export default {
  name: 'MyLayout',
  data () {
    return {
      leftDrawerOpen: false
    }
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'isAuthorized', 'SalesEmployeeName'])
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
