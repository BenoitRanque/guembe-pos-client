<template>
  <q-card>
    <q-form>
      <q-card-section>
        <div class="text-h6 text-center">
          Bienvenido
        </div>
        <div class="text-subtitle2 text-center">
          Por favor inicia sesion
        </div>
      </q-card-section>
      <q-card-section>
        <employee-select class="q-mb-sm" dense v-model="EmployeeID" outlined label="Usuario"></employee-select>
        <q-input dense v-model="Password" autocomplete="current-password" outlined label="Contraseña" type="password"></q-input>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-actions align="center">
        <q-btn flat color="accent" type="submit" icon="mdi-login" label="Iniciar Session" :disable="invalidInput" @click="login"></q-btn>
      </q-card-actions>
      <q-inner-loading :showing="loading">
        <q-spinner></q-spinner>
      </q-inner-loading>
    </q-form>
  </q-card>
</template>

<script>
import EmployeeSelect from 'components/auth/EmployeeSelect'
import { mapActions } from 'vuex'
export default {
  name: 'Login',
  components: { EmployeeSelect },
  data () {
    return {
      loading: false,
      EmployeeID: null,
      Password: ''
    }
  },
  computed: {
    invalidInput () {
      return this.EmployeeID === ''
    }
  },
  methods: {
    ...mapActions('auth', ['LOGIN']),
    async login () {
      try {
        this.loading = true
        await this.LOGIN({ EmployeeID: this.EmployeeID, Password: this.Password })
        this.$q.notify({ icon: 'mdi-check', color: 'positive', message: 'Session Iniciada' })
        this.$emit('success')
      } catch (error) {
        this.$gql.handleError(error)
        this.$emit('failure')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
