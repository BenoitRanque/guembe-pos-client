<template>
  <q-btn @click="showDialog = true" v-bind="$attrs">
    <slot/>
    <q-dialog v-model="showDialog" persistent>
      <q-card style="max-width: 90vw; width: 70vw;">
        <q-bar>
          Seleccionar Cliente
          <q-space></q-space>
          <q-btn flat dense icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <q-table
          :data="data"
          :columns="columns"
          row-key="CardCode"
          :pagination.sync="pagination"
          :loading="loading"
          :filter="filter"
          @request="onRequest"
          @row-click="(evt, row) => selected(row)"
        >
          <template v-slot:top-left>
            <q-input autofocus outlined dense debounce="300" v-model="filter" placeholder="Buscar">
              <template v-slot:prepend>
                <q-icon name="mdi-magnify" />
              </template>
            </q-input>
          </template>
        </q-table>
        <q-separator></q-separator>
        <q-card-actions align="center">
          <q-btn flat v-close-popup>Cerrar</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-btn>
</template>

<script>
import { reactive, onMounted, ref, toRefs } from '@vue/composition-api'
import gql from 'src/gql'

const columns = [
  {
    name: 'CardCode',
    label: 'Codigo Cliente',
    field: 'CardCode',
    align: 'left'
  },
  {
    name: 'CardName',
    label: 'Nombre Cliente',
    field: 'CardName',
    align: 'left'
  },
  {
    name: 'CardForeignName',
    label: 'Razon Social',
    field: 'CardForeignName',
    align: 'left'
  },
  {
    name: 'FederalTaxID',
    label: 'NIT',
    field: 'FederalTaxID',
    align: 'left'
  },
  {
    name: 'action',
    align: 'right'
  }
]

export default {
  name: 'clientSelect',
  setup (props, { emit }) {
    const showDialog = ref(false)

    const table = reactive({
      columns,
      filter: '',
      pagination: {
        page: 1,
        rowsPerPage: 7,
        rowsNumber: 0
      },
      loading: false,
      data: []
    })

    async function onRequest ({ pagination, filter }) {
      try {
        table.loading = true

        const { business_partners: { totalItems, pageItems } } = await gql({
          query: /* GraphQL */`
            query ($limit: Int! $offset: Int! $filter: String) {
              business_partners (limit: $limit offset: $offset filter: $filter) {
                totalItems
                pageItems {
                  CardCode
                  CardName
                  CardForeignName
                  FederalTaxID
                  PayTermsGrpCode
                  Affiliate
                  VatLiable
                  PrimaryPriceList
                  PrimaryPriceListName
                  SecondaryPriceList
                  SecondaryPriceListName
                }
              }
            }
          `,
          variables: {
            limit: pagination.rowsPerPage,
            offset: pagination.rowsPerPage * (pagination.page - 1),
            filter: filter.length ? filter : null
          }
        })

        table.pagination = {
          ...pagination,
          rowsNumber: totalItems
        }

        table.data = pageItems
      } catch (error) {
        gql.handleError(error)
      } finally {
        table.loading = false
      }
    }

    onMounted(() => {
      onRequest({ pagination: table.pagination, filter: table.filter })
    })

    function selected (BusinessPartner) {
      emit('selected', BusinessPartner)
      table.filter = ''
      showDialog.value = false
    }

    return {
      showDialog,
      ...toRefs(table),
      onRequest,
      selected
    }
  }
}
</script>
