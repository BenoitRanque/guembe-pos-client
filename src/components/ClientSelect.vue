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
          @rowclick="(evt, row) => selected(row)"
        >
          <template v-slot:top-left>
            <q-input autofocus outlined dense debounce="300" v-model="filter" placeholder="Buscar">
              <template v-slot:prepend>
                <q-icon name="mdi-magnify" />
              </template>
            </q-input>
          </template>
        </q-table>
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

        const { business_partners: { count, items } } = await gql({
          query: /* GraphQL */`
            query ($limit: Int! $offset: Int! $search: String) {
              business_partners (limit: $limit offset: $offset search: $search) {
                count
                items {
                  CardCode
                  CardName
                  CardForeignName
                  FederalTaxID
                  PayTermsGrpCode
                  Affiliate
                  VatLiable
                  PriceListNum
                  PriceList {
                    PriceListNo
                    PriceListName
                  }
                }
              }
            }
          `,
          variables: {
            limit: pagination.rowsPerPage,
            offset: pagination.rowsPerPage * (pagination.page - 1),
            search: filter.length ? filter : null
          },
          role: 'anonymous'
        })

        table.pagination = {
          ...pagination,
          rowsNumber: count
        }

        table.data = items
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
