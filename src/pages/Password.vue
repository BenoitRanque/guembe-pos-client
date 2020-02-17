<template>
  <q-page>
    <q-tabs v-model="tab">
      <q-tab name="change">Cambiar Contraseña</q-tab>
      <q-tab name="reset">Restablecer Contraseña</q-tab>
    </q-tabs>
    <q-tab-panels v-model="tab">
      <q-tab-panel name="change">
        <q-form @submit="changePassword" @reset="resetForm">
          <div class="text-h4">Cambiar contraseña</div>
          <div class="text-body1">Permite al usuario que ya tenga contraseña establecida cambiar la misma. En caso de no tener establecida un contraseña (al ser un usuario nuevo), debera primer restablecer contraseña.</div>
          <employee-select
            required
            v-model="Credentials.EmployeeID"
            label="Empleado"
          ></employee-select>
          <q-input
            type="password"
            required
            v-model="Credentials.Password"
            label="Contraseña Actual"
          ></q-input>
          <q-input
            type="password"
            required
            v-model="NewPassword"
            label="Nueva contraseña"
          ></q-input>
          <q-input
            type="password"
            required
            v-model="NewPassword2"
            label="Nueva contraseña"
            :rules="[
              value => value === NewPassword || 'Contraseñas nuevas no coinciden'
            ]"
          ></q-input>
          <div class="flex justify-around">
            <q-btn flat type="reset" text-color="grey">Borrar Formulario</q-btn>
            <q-btn color="primary" type="submit">Cambiar Contraseña</q-btn>
          </div>
          <q-inner-loading :showing="Loading">
            <q-spinner></q-spinner>
          </q-inner-loading>
        </q-form>
      </q-tab-panel>
      <q-tab-panel name="reset">
        <q-form @submit="resetPassword" @reset="resetForm">
          <div class="text-h4">Restablecer contraseña</div>
          <div class="text-body1">Restablecer contraseña permite a un usuario de SAP restablecer la contraseña de un usuario de POS. Util par usuarios nuevos, o en caso el usuario se olvide su contraseña</div>
          <q-input
            required
            v-model="SAPB1Credentials.UserName"
            label="Usuario SAP"
          ></q-input>
          <q-input
            type="password"
            required
            v-model="SAPB1Credentials.Password"
            label="Contraseña SAP"
          ></q-input>
          <q-input
            type="number"
            required
            v-model="EmployeeID"
            label="Codigo de Empleado"
          ></q-input>
          <q-input
            type="password"
            required
            v-model="NewPassword"
            label="Nueva contraseña"
          ></q-input>
          <q-input
            type="password"
            required
            v-model="NewPassword2"
            label="Nueva contraseña"
            :rules="[
              value => value === NewPassword || 'Contraseñas nuevas no coinciden'
            ]"
          ></q-input>
          <div class="flex justify-around">
            <q-btn flat type="reset" text-color="grey">Borrar Formulario</q-btn>
            <q-btn color="primary" type="submit">Restablecer Contraseña</q-btn>
          </div>
          <q-inner-loading :showing="Loading">
            <q-spinner></q-spinner>
          </q-inner-loading>
        </q-form>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script>
import EmployeeSelect from 'components/auth/EmployeeSelect'
import { reactive, toRefs, ref, watch } from '@vue/composition-api'
import store from 'src/store'
import gql from 'src/gql'
import { Notify } from 'quasar'
export default {
  name: 'Password',
  components: { EmployeeSelect },
  setup () {
    const tab = ref('change')

    const state = reactive({
      Loading: false,
      Credentials: {
        EmployeeID: null,
        Password: ''
      },
      SAPB1Credentials: {
        UserName: '',
        Password: ''
      },
      EmployeeID: null,
      NewPassword: '',
      NewPassword2: ''
    })

    function resetForm () {
      state.Loading = false
      state.Credentials = { EmployeeID: null, Password: '' }
      state.SAPB1Credentials = { UserName: '', Password: '' }
      state.EmployeeID = null
      state.NewPassword = ''
      state.NewPassword2 = ''
    }

    watch(tab, () => resetForm())

    async function changePassword () {
      try {
        state.Loading = true

        await store.dispatch('auth/CHANGE_PASSWORD', {
          Credentials: {
            EmployeeID: Number(state.Credentials.EmployeeID),
            Password: state.Credentials.Password
          },
          NewPassword: state.NewPassword
        })

        resetForm()

        Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Contraseña cambiada exitosamente' })
      } catch (error) {
        gql.handleError(error)
      } finally {
        state.Loading = false
      }
    }

    async function resetPassword () {
      try {
        state.Loading = true

        await store.dispatch('auth/RESET_PASSWORD', {
          SAPB1Credentials: {
            UserName: state.SAPB1Credentials.UserName,
            Password: state.SAPB1Credentials.Password
          },
          EmployeeID: Number(state.EmployeeID),
          NewPassword: state.NewPassword
        })

        resetForm()

        Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Contraseña restablecida exitosamente' })
      } catch (error) {
        gql.handleError(error)
      } finally {
        state.Loading = false
      }
    }

    return {
      tab,
      resetForm,
      changePassword,
      resetPassword,
      ...toRefs(state)
    }
  }
}
</script>
