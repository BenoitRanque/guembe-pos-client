<template>
  <q-page>
    <q-table
      flat
      :data="data"
      :columns="columns"
      row-key="DocEntry"
      :pagination.sync="pagination"
      :loading="loading"
      :filter="filter"
      @request="onRequest"
    >
      <template v-slot:top-right>
        <q-input autofocus outlined dense debounce="300" v-model="filter" placeholder="Buscar">
          <template v-slot:prepend>
            <q-icon name="mdi-magnify" />
          </template>
        </q-input>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { reactive, toRefs } from '@vue/composition-api'
import gql from 'src/gql'
import { mapGetters } from 'vuex'
import store from 'src/store'

const columns = [
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
    name: 'SalesPoint',
    align: 'left',
    label: 'Punto de Venta',
    field: 'U_GPOS_SalesPointCode'
  },
  {
    name: 'SalesPerson',
    align: 'left',
    label: 'Vendedor',
    field: row => row.SalesPerson.SalesEmployeeName
  },
  {
    name: 'U_NROAUTOR',
    align: 'left',
    label: 'Numero Autorizacion',
    field: 'U_NROAUTOR'
  },
  {
    name: 'U_NRO_FAC',
    align: 'left',
    label: 'Numero Factura',
    field: 'U_NRO_FAC'
  },
  {
    name: 'U_NIT',
    align: 'left',
    label: 'NIT/CI',
    field: 'U_NIT'
  },
  {
    name: 'U_RAZSOC',
    align: 'left',
    label: 'Razon Social',
    field: 'U_RAZSOC'
  },
  {
    name: 'DocTotal',
    label: 'Total Documento',
    field: 'DocTotal',
    format: value => value.toFixed(2)
  }
]

export default {
  name: 'Report',
  computed: mapGetters('auth', ['isAuthorized']),
  setup () {
    const table = reactive({
      columns,
      filter: '',
      pagination: {
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 0
      },
      loading: false,
      data: []
    })

    const selection = reactive({
      // FromDate: null,
      // ToDate: null,
      FromDate: '20200201',
      ToDate: '20200229',
      SalesPersonCode: store.state.auth.session.SalesEmployeeCode,
      SalesPointCode: store.state.config.SalesPointCode
    })

    async function onRequest ({ pagination, filter }) {
      try {
        table.loading = true

        const { invoices: { count, items } } = await gql({
          query: /* GraphQL */`
            query ($FromDate: Date! $ToDate: Date! $SalesPersonCode: Int $SalesPointCode: String) {
              invoices (FromDate: $FromDate ToDate: $ToDate SalesPersonCode: $SalesPersonCode SalesPointCode: $SalesPointCode) {
                count
                items {
                  DocEntry
                  DocNum
                  DocDate
                  CardCode
                  CardName
                  NumAtCard
                  DocTotal
                  Comments
                  JournalMemo
                  PaymentGroupCode
                  DocTime
                  SalesPersonCode
                  SalesPerson {
                    SalesEmployeeCode
                    SalesEmployeeName
                    EmployeeID
                  }
                  Cancelled
                  U_TIPODOC
                  U_NIT
                  U_RAZSOC
                  U_CCFACANU
                  U_CODCTRL
                  U_NROAUTOR
                  U_ESTADOFC
                  U_NRO_FAC
                  U_GPOS_SalesPointCode
                  U_GPOS_Serial
                  U_GPOS_Type
                  DocumentLines {
                    ItemCode
                    ItemDescription
                    Quantity
                    PriceAfterVAT
                  }
                }
              }
            }
          `,
          variables: selection
        })

        table.data = items
        table.pagination = {
          ...pagination,
          rowsNumber: count
        }
      } catch (error) {
        gql.handleError(error)
      } finally {
        table.loading = false
      }
    }

    onRequest({ pagination: table.pagination, filter: table.filter })

    return {
      onRequest,
      ...toRefs(table),
      ...toRefs(selection)
    }
  }
}
</script>
