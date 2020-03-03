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
    >
      <template v-slot:top>
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
        <q-space></q-space>
        <sales-point-select :readonly="!isAuthorized('administrador')" label="Punto de Venta" clearable dense outlined v-model="SalesPointCode"></sales-point-select>
        <div class="q-mx-xs"></div>
        <employee-select :readonly="!isAuthorized('administrador')" label="Vendedor" clearable dense outlined v-model="SalesPersonCode" sales-person></employee-select>
      </template>
    </q-table>
    <q-dialog v-model="showInvoice">
      <q-card style="max-width: 80vw; width: 800px;">
        <q-bar>
          Factura
          <q-space></q-space>
          <q-btn v-if="isAuthorized('administrador')" @click="rePrint(Invoice)" :loading="rePrintLoading" class="q-mr-sm" size="sm" icon="mdi-printer" unelevated color="blue" dense>
            <q-tooltip>Re-Imprimir</q-tooltip>
          </q-btn>
          <q-btn flat dense icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <template v-if="Invoice">
          <q-list dense class="row">
            <q-item class="col-6" v-for="(item, index) in columns" :key="index">
              <q-item-section>
                <q-item-label caption>{{item.label}}</q-item-label>
              </q-item-section>
              <q-item-section class="text-right">
                <q-item-label>{{displayColumnValue(Invoice, item.field, item.format)}}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item class="col-6">
              <q-item-section>
                <q-item-label caption>Numero de Documento</q-item-label>
              </q-item-section>
              <q-item-section class="text-right">
                <q-item-label>{{Invoice.DocNum}}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-markup-table flat>
            <thead>
              <tr>
                <th class="text-right" style="width: 10%">Cant.</th>
                <th class="text-left" style="width: 70%">Descripcion</th>
                <th class="text-right" style="width: 10%">Precio</th>
                <th class="text-right" style="width: 10%">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in Invoice.DocumentLines" :key="index">
                <td class="text-right">{{item.Quantity}}</td>
                <td class="text-left">{{item.ItemDescription}}</td>
                <td class="text-right">{{formatPrice(item.PriceAfterVAT)}}</td>
                <td class="text-right">{{formatPrice(itemSubTotal(item.PriceAfterVAT, item.Quantity))}}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th colspan="4" style="padding: 0">
                  <q-separator color="black"></q-separator>
                </th>
              </tr>
              <tr>
                <th colspan="3" class="text-right">Total</th>
                <th class="text-right">{{formatPrice(Invoice.DocumentLines.reduce((total, { Quantity, PriceAfterVAT }) => total + ((PriceAfterVAT * 100) * Quantity), 0) / 100)}}</th>
              </tr>
            </tfoot>
          </q-markup-table>
        </template>
      </q-card>
    </q-dialog>
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
import print from 'src/print'

const { formatDate, subtractFromDate, startOfDate } = date

const columns = [
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
    name: 'Cancelled',
    align: 'left',
    label: 'Factura Anulada',
    field: 'Cancelled',
    format: value => value === 'tYES' ? 'Si' : 'No'
  },
  {
    name: 'PaymentGroupCode',
    label: 'Condicion de Pago',
    field: 'PaymentGroupCode',
    format: value => value === -1 ? 'Contado' : 'Credito'
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
    name: 'SalesPerson',
    align: 'left',
    label: 'Vendedor',
    field: row => row.SalesPerson.SalesEmployeeName
  },
  {
    name: 'SalesPoint',
    align: 'left',
    label: 'Punto de Venta',
    field: 'U_GPOS_SalesPointCode'
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

    const isAdmin = store.getters['auth/isAuthorized']('administrador')

    const today = startOfDate(new Date(), 'day')
    const yesterday = subtractFromDate(today, { days: 1 })

    const FromDate = ref(formatDate(isAdmin ? today : yesterday, 'YYYY/MM/DD'))
    const ToDate = ref(formatDate(isAdmin ? today : yesterday, 'YYYY/MM/DD'))

    function validDate (date) {
      return /\d{4}\/\d{2}\/[0-1]\d/.test(date)
    }

    const SalesPersonCode = ref(isAdmin ? null : store.state.auth.session.SalesEmployeeCode)
    const SalesPointCode = ref(isAdmin ? null : store.state.config.SalesPointCode)

    async function onRequest ({ pagination, filter }) {
      // silent fail on invalid date
      if (!validDate(FromDate.value) || !validDate(ToDate.value)) return

      if (FromDate.value > ToDate.value) {
        return Notify.create({ icon: 'mdi-alert', color: 'negative', message: 'Fecha Desde debe ser menor o igual a Fecha Hasta' })
      }

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
          variables: {
            SalesPersonCode: SalesPersonCode.value,
            SalesPointCode: SalesPointCode.value,
            FromDate: FromDate.value.replace(/\//g, ''),
            ToDate: ToDate.value.replace(/\//g, '')
          }
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

    watch([FromDate, ToDate, SalesPointCode, SalesPersonCode], () => {
      onRequest({ pagination: table.pagination, filter: table.filter })
    })

    onRequest({ pagination: table.pagination, filter: table.filter })

    const Invoice = ref(null)
    const showInvoice = ref(false)

    function handleRowClick (evt, row) {
      Invoice.value = row
      showInvoice.value = true
    }

    function displayColumnValue (row, field, format = null) {
      const value = typeof field === 'string' ? row[field] : field(row)

      return format ? format(value) : value
    }

    const rePrintLoading = ref(false)

    async function rePrint ({ DocEntry }) {
      try {
        rePrintLoading.value = true

        const { Invoice } = await gql({
          query: /* GraphQL */`
            query ($DocEntry: Int!) {
              Invoice: print_invoice (DocEntry: $DocEntry) {
                DocDate
                DocTime
                DocTotal
                PaymentGroupCode
                U_GPOS_Type
                U_GPOS_Serial
                U_GPOS_SalesPointCode
                DocumentLines {
                  ItemCode
                  ItemDescription
                  Quantity
                  PriceAfterVAT
                }
                U_FECHALIM
                U_EXENTO
                U_ACTIVIDAD
                U_LEYENDA
                U_DIRECCION
                U_CIUDAD
                U_PAIS
                U_SUCURSAL
                U_NRO_FAC
                U_NROAUTOR
                U_CODCTRL
                U_NIT
                U_RAZSOC
              }
            }
          `,
          variables: { DocEntry }
        })

        print({
          template: 'invoice',
          preview: true,
          test: false,
          printOptions: {
            silent: true,
            deviceName: 'Facturas',
            printBackground: true,
            margins: {
              marginType: 'none'
            }
          },
          copy: false,
          data: Invoice
        })
        print({
          template: 'invoice',
          preview: true,
          test: false,
          printOptions: {
            silent: true,
            deviceName: 'Facturas',
            printBackground: true,
            margins: {
              marginType: 'none'
            }
          },
          copy: true,
          data: Invoice
        })
      } catch (error) {
        gql.handleError(error)
      } finally {
        rePrintLoading.value = false
      }
    }

    return {
      rePrintLoading,
      rePrint,
      displayColumnValue,
      formatPrice,
      itemSubTotal,
      handleRowClick,
      Invoice,
      showInvoice,
      onRequest,
      ...toRefs(table),
      SalesPersonCode,
      SalesPointCode,
      FromDate,
      ToDate,
      validDate
    }
  }
}
</script>
