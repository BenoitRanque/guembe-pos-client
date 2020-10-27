<template>
  <q-page>
    <q-layout container view="hhh lpr fff" style="height: calc(100vh - 50px)">
      <q-header>
        <q-toolbar>
          <template v-if="BusinessPartner">
            <q-toolbar-title>
              {{BusinessPartner.CardCode}}
              -
              {{BusinessPartner.CardName}}
            </q-toolbar-title>
          </template>
          <q-inner-loading :showing="BusinessPartnerLoading">
            <q-spinner></q-spinner>
          </q-inner-loading>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-page>
          <q-banner v-if="!SalesPointCode" class="bg-negative text-white q-ma-md rounded-borders">
            Para realizar venta primero configure el punto de venta
            <template v-slot:action v-if="isAuthorized('administrador')">
              <q-btn flat @click="$router.push('/settings')">Ir a configuracion</q-btn>
            </template>
          </q-banner>
          <sales-order
            v-if="SalesPointCode && BusinessPartner"
            show-sales-person
            :business-partner="BusinessPartner"
            :readonly-lines="Table.DocumentLines"
            :editable-lines.sync="CartItems"
          >
            <template v-slot:footer-left>Empleado: {{Table.SalesPerson.SalesPersonName}}</template>
          </sales-order>
          <q-toolbar>
            <item-select
              v-if="SalesPointCode && BusinessPartner"
              :business-partner="BusinessPartner"
              :sales-point-code="SalesPointCode"
              @selected="itemSelected" size="md"
              icon="mdi-plus"
              color="accent"
            >
              Aggregar Articulo
            </item-select>
            <q-space></q-space>
            <template v-if="CartItems.length">
              <q-btn class="q-ml-lg" color="positive">
                Guardar
              </q-btn>
            </template>
            <template v-else>
              <q-btn class="q-ml-lg" color="negative">
                Anular
              </q-btn>
              <q-btn class="q-ml-lg" color="warning">
                Cerrar
              </q-btn>
              <q-btn class="q-ml-lg" color="positive">
                ReAbrir
              </q-btn>
              <q-btn class="q-ml-lg" color="info">
                Facturar
              </q-btn>
            </template>
          </q-toolbar>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-page>
</template>

<script>
import gql from 'src/gql'
import { computed, ref } from '@vue/composition-api'
import store from 'src/store'
import { mapGetters } from 'vuex'
import { formatPrice, itemSubTotal } from 'src/utils'
import SalesOrder from 'components/SalesOrder'
import ItemSelect from 'components/ItemSelect'
export default {
  name: 'TableOpen',
  components: { SalesOrder, ItemSelect },
  props: {
    DocEntry: {
      type: String,
      required: true
    }
  },
  computed: mapGetters('auth', ['isAuthorized']),
  setup (props, ctx) {
    const BusinessPartner = ref(null)
    const BusinessPartnerLoading = ref(false)

    const Table = ref(null)
    const TableLoading = ref(false)

    const SalesPointCode = computed(() => store.state.config.SalesPointCode)

    const CartItems = ref([])

    function itemSelected (Item) {
      CartItems.value.push(Item)
    }

    async function loadBusinessPartner (CardCode) {
      try {
        BusinessPartnerLoading.value = true

        const { client } = await gql({
          query: /* GraphQL */`
            query ($CardCode: String!) {
              client: business_partner (Code: $CardCode CodeType: CardCode) {
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
          `,
          variables: {
            CardCode
          }
        })

        BusinessPartner.value = client
      } catch (error) {
        gql.handleError(error)
      } finally {
        BusinessPartnerLoading.value = false
      }
    }

    async function loadTable () {
      try {
        TableLoading.value = true

        const { sales_order: salesOrder } = await gql({
          query: /* GraphQL */`
            query ($DocEntry: Int!) {
              sales_order(DocEntry: $DocEntry) {
                Type
                DocEntry
                DocNum
                DocDate
                DocTime
                CardCode
                CardName
                DocTotal
                Comments
                JournalMemo
                SalesPoint {
                  Name
                }
                SalesPerson {
                  SalesPersonName
                }
                U_GPOS_Serial
                DocumentLines {
                  ItemCode
                  ItemDescription
                  Quantity
                  Price
                  SalesPerson {
                    SalesPersonName
                  }
                }
              }
            }
        `,
          variables: {
            DocEntry: Number(props.DocEntry)
          }
        })

        Table.value = salesOrder

        await loadBusinessPartner(salesOrder.CardCode)
      } catch (error) {
        gql.handleError(error)
      } finally {
        TableLoading.value = false
      }
    }

    loadTable()

    return {
      formatPrice,
      itemSubTotal,
      BusinessPartner,
      BusinessPartnerLoading,
      SalesPointCode,
      Table,
      TableLoading,
      CartItems,
      log: console.log,
      itemSelected
    }
  }
}
</script>
