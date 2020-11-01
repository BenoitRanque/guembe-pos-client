<template>
  <q-page>
    <q-table
      flat
      :data="data"
      :columns="columns"
      row-key="DocEntry"
      :pagination.sync="pagination"
      :loading="loading"
      @request="onRequest"
      @row-click="handleRowClick"
      :rows-per-page-options="[3,5,7,10,15,25,50]"
    >
      <template v-slot:top>
        <q-btn-dropdown outline text-color="primary" label="Filtrar Por Estado">
          <q-list>
            <q-item tag="label" v-ripple :key="key" v-for="({ label, color }, key) in typeMap">
              <q-item-section side top>
                <q-checkbox :color="color" v-model="type" :val="key"></q-checkbox>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{label}}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-space></q-space>
        <employee-select :readonly="!isAuthorized('administrador')" label="Vendedor" clearable dense outlined v-model="SalesPersonCode" use-sales-person-code></employee-select>
        <div class="q-mx-xs"></div>
        <sales-point-select :readonly="!isAuthorized('administrador')" label="Punto de Venta" clearable dense outlined v-model="SalesPointCode"></sales-point-select>
        <div class="q-mx-xs"></div>
        <q-input label="Fecha Desde" hide-bottom-space dense outlined v-model="FromDate" mask="date" :error="!validDate(FromDate)">
          <template v-slot:append>
            <q-icon name="mdi-calendar" class="cursor-pointer">
              <q-popup-proxy ref="qFromDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="FromDate" @input="() => $refs.qFromDateProxy.hide()" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <div class="q-mx-xs"></div>
        <q-input label="Fecha Hasta" hide-bottom-space dense outlined v-model="ToDate" mask="date" :error="!validDate(ToDate)">
          <template v-slot:append>
            <q-icon name="mdi-calendar" class="cursor-pointer">
              <q-popup-proxy ref="qToDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="ToDate" @input="() => $refs.qToDateProxy.hide()" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </template>
      <template v-slot:body-cell-type="props">
        <q-td :props="props" class="text-bold" :class="`text-${typeMap[props.row.Type].color}`">
          {{typeMap[props.row.Type].label}}
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { formatPrice, itemSubTotal } from 'src/utils'
import EmployeeSelect from 'components/EmployeeSelect'
import SalesPointSelect from 'components/SalesPointSelect'
import { reactive, toRefs, ref, watch } from '@vue/composition-api'
import gql from 'src/gql'
import { mapGetters } from 'vuex'
import store from 'src/store'
import { date, Notify } from 'quasar'
import router from 'src/router'

const { formatDate, startOfDate } = date

const QUICKSALE = 'QUICKSALE'
const TABLE_OPEN = 'TABLE_OPEN'
const TABLE_CLOSED = 'TABLE_CLOSED'
const TABLE_INVOICED = 'TABLE_INVOICED'
const TABLE_CANCELLED = 'TABLE_CANCELLED'

const typeMap = {
  [QUICKSALE]: { label: 'Venta Rapida', color: 'info' },
  [TABLE_OPEN]: { label: 'Abierta', color: 'positive' },
  [TABLE_CLOSED]: { label: 'Cerrada', color: 'warning' },
  [TABLE_INVOICED]: { label: 'Facturada', color: 'info' },
  [TABLE_CANCELLED]: { label: 'Anulada', color: 'negative' }
}

const columns = [
  {
    name: 'type',
    align: 'left',
    label: 'Estado',
    field: 'Type'
  },
  {
    name: 'SalesPerson',
    align: 'left',
    label: 'Vendedor',
    field: 'SalesPerson',
    format: value => value.SalesPersonName
  },
  {
    name: 'SalesPoint',
    align: 'left',
    label: 'Punto de Venta',
    field: 'SalesPoint',
    format: value => value.Name
  },
  {
    name: 'Serial',
    align: 'left',
    label: 'Numero',
    field: 'U_GPOS_Serial'
  },
  {
    name: 'DocDate',
    align: 'left',
    label: 'Fecha',
    field: 'DocDate',
    format: value => value.replace(/-/g, '/')
  },
  {
    name: 'DocTime',
    align: 'left',
    label: 'Hora',
    field: 'DocTime',
    format: value => value.slice(0, 5)
  },
  {
    name: 'DocTotal',
    label: 'Total Documento',
    field: 'DocTotal',
    format: value => value.toFixed(2)
  }
]

export default {
  name: 'SalesOrders',
  components: { EmployeeSelect, SalesPointSelect },
  computed: mapGetters('auth', ['isAuthorized']),
  setup () {
    const table = reactive({
      columns,
      pagination: {
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 0
      },
      loading: false,
      data: []
    })

    const SalesPersonCode = ref(null)
    const SalesPointCode = ref(null)

    const type = ref([])

    if (store.getters['auth/isAuthorized']('administrador')) {
      type.value.push(QUICKSALE, TABLE_OPEN, TABLE_CLOSED, TABLE_INVOICED, TABLE_CANCELLED)
    } else {
      SalesPointCode.value = store.state.config.SalesPointCode

      if (store.getters['auth/isAuthorized']('meseros')) {
        type.value.push(TABLE_OPEN)
        SalesPersonCode.value = store.state.config.SalesPersonCode
      }

      if (store.getters['auth/isAuthorized']('cajeros')) {
        type.value.push(TABLE_CLOSED)
      }
    }

    const today = startOfDate(new Date(), 'day')

    const FromDate = ref(formatDate(today, 'YYYY/MM/DD'))
    const ToDate = ref(formatDate(today, 'YYYY/MM/DD'))

    function validDate (date) {
      return /\d{4}\/[0-1]\d\/\d{2}/.test(date)
    }

    async function onRequest ({ pagination }) {
      // silent fail on invalid date
      if (!validDate(FromDate.value) || !validDate(ToDate.value)) return

      if (FromDate.value > ToDate.value) {
        return Notify.create({ tyep: 'warning', message: 'Fecha Desde debe ser menor o igual a Fecha Hasta' })
      }

      try {
        table.loading = true

        const { sales_orders: { totalItems, pageItems } } = await gql({
          query: /* GraphQL */`
            query ($Type: [SalesOrderTypeEnum!] $FromDate: Date! $ToDate: Date! $SalesPersonCode: Int $SalesPointCode: String $limit: Int $offset: Int) {
              sales_orders (Type: $Type FromDate: $FromDate ToDate: $ToDate SalesPersonCode: $SalesPersonCode SalesPointCode: $SalesPointCode limit: $limit offset: $offset) {
                totalItems
                pageItems {
                  DocEntry
                  DocNum
                  DocDate
                  CardCode
                  CardName
                  DocTotal
                  Comments
                  JournalMemo
                  DocTime
                  U_GPOS_Serial
                  Type
                  SalesPerson {
                    SalesPersonCode
                    SalesPersonName
                  }
                  SalesPoint {
                    Name
                  }
                }
              }
            }
          `,
          variables: {
            Type: type.value.length ? type.value : [QUICKSALE, TABLE_OPEN, TABLE_CLOSED, TABLE_INVOICED, TABLE_CANCELLED],
            SalesPersonCode: SalesPersonCode.value,
            SalesPointCode: SalesPointCode.value,
            FromDate: FromDate.value.replace(/\//g, ''),
            ToDate: ToDate.value.replace(/\//g, ''),
            limit: pagination.rowsPerPage,
            offset: pagination.rowsPerPage * (pagination.page - 1)
          }
        })

        table.data = pageItems
        table.pagination = {
          ...pagination,
          rowsNumber: totalItems
        }
      } catch (error) {
        gql.handleError(error)
      } finally {
        table.loading = false
      }
    }

    watch([FromDate, ToDate, SalesPointCode, SalesPersonCode, type], () => {
      onRequest({ pagination: table.pagination, filter: table.filter })
    })

    onRequest({ pagination: table.pagination })

    function handleRowClick (evt, row) {
      router.push(`/salesorder/${row.DocEntry}`)
    }

    function displayColumnValue (row, field, format = null) {
      const value = typeof field === 'string' ? row[field] : field(row)

      return format ? format(value) : value
    }

    return {
      displayColumnValue,
      formatPrice,
      itemSubTotal,
      handleRowClick,
      onRequest,
      ...toRefs(table),
      type,
      typeMap,
      SalesPersonCode,
      SalesPointCode,
      FromDate,
      ToDate,
      validDate
    }
  }
}
</script>
