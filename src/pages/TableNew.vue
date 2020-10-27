<template>
  <q-page>
    <q-toolbar>
      <client-select
        @selected="setBusinessPartner"
        icon="mdi-pencil"
        :label="BusinessPartner ? '' : 'Seleccionar Cliente'"
        flat
        dense
      >
        <q-tooltip>Cambiar Cliente</q-tooltip>
      </client-select>
      <template v-if="BusinessPartner">
        <q-toolbar-title shrink>
          {{BusinessPartner.CardCode}}
          -
          {{BusinessPartner.CardName}}
        </q-toolbar-title>
      </template>
      <q-inner-loading :showing="BusinessPartnerLoading">
        <q-spinner></q-spinner>
      </q-inner-loading>
    </q-toolbar>
    <q-banner v-if="!SalesPointCode" class="bg-negative text-white q-ma-md rounded-borders">
      Para realizar venta primero configure el punto de venta
      <template v-slot:action v-if="isAuthorized('administrador')">
        <q-btn flat @click="$router.push('/settings')">Ir a configuracion</q-btn>
      </template>
    </q-banner>
    <shopping-cart v-model="CartItems">
      <template v-slot:item="{ item, index }">
        <cart-item
          editable
          :key="index"
          :value="item"
          :business-partner="BusinessPartner"
          @update="CartItems.splice(index, 1, $event)"
          @remove="CartItems.splice(index, 1)"
        ></cart-item>
      </template>
    </shopping-cart>
    <div class="text-center">
      <item-select
        v-if="SalesPointCode && BusinessPartner"
        :business-partner="BusinessPartner"
        :sales-point-code="SalesPointCode"
        @selected="itemSelected" size="lg"
        icon="mdi-plus"
        color="accent"
      >
        Aggregar Articulo
      </item-select>
    </div>

    <div class="text-center">
      <q-btn :disable="!canCreateTable" @click="createTable">Crear Mesa</q-btn>
    </div>
    <q-checkbox v-model="Close">Cerrar</q-checkbox>
    <q-checkbox v-model="IsTest">Es Prueba</q-checkbox>
  </q-page>
</template>

<script>
import gql from 'src/gql'
import ClientSelect from 'components/ClientSelect'
import ItemSelect from 'components/ItemSelect'
import CartItem from 'components/CartItem'
import ShoppingCart from 'components/ShoppingCart'
import { ref, computed } from '@vue/composition-api'
import { formatPrice, itemSubTotal, handleSalePrint } from 'src/utils'
import { Notify, Loading } from 'quasar'
import store from 'src/store'
import { mapGetters } from 'vuex'
import router from 'src/router'
const PAYGROUP_NONE = -1
export default {
  name: 'TableSale',
  components: {
    ClientSelect,
    ItemSelect,
    ShoppingCart,
    CartItem
  },
  computed: mapGetters('auth', ['isAuthorized']),
  setup () {
    const tab = ref('catalog')
    const split = ref(60)

    const BusinessPartner = ref(null)

    const SalesPointCode = computed(() => store.state.config.SalesPointCode)

    const CartItems = ref([])
    const CartTotal = computed(() => CartItems.value.reduce((total, { Quantity, Price }) => total + ((Price * 100) * Quantity), 0) / 100)

    async function setBusinessPartner (NewBusinessPartner) {
      if (CartItems.value.length && NewBusinessPartner.PrimaryPriceList !== BusinessPartner.value.PrimaryPriceList) {
        const ItemCodes = CartItems.value.map(({ Item }) => Item.ItemCode)

        const queryParams = ItemCodes.map((code, index) => `$_${index}: String!`).join(' ')

        const queryBody = ItemCodes.map((code, index) => /* GraphQL */`
          _${index}: item (Code: $_${index} CodeType: ItemCode PrimaryPriceList: $PrimaryPriceList SecondaryPriceList: $SecondaryPriceList SalesPointCode: $SalesPointCode) {
            ItemCode
            ItemName
            AllowCredit
            AllowAffiliate
            AllowManualPrice
            PrimaryPrice
            SecondaryPrice
            Stock
          }
        `).join('\n')

        const variables = ItemCodes.reduce((variables, value, index) => {
          variables[`_${index}`] = value
          return variables
        }, {
          PrimaryPriceList: NewBusinessPartner.PrimaryPriceList,
          SecondaryPriceList: NewBusinessPartner.SecondaryPriceList,
          SalesPointCode: SalesPointCode.value
        })

        const query = /* GraphQL */`
          query ($PrimaryPriceList: Int! $SecondaryPriceList: Int! $SalesPointCode: String! ${queryParams}) {
            ${queryBody}
          }
        `
        let items = null
        try {
          BusinessPartnerLoading.value = true
          items = await gql({ query, variables })
        } catch (error) {
          gql.handleError(error)
        } finally {
          BusinessPartnerLoading.value = false
        }

        for (const key in items) {
          const item = items[key]

          if (!item.PrimaryPrice) {
            if (BusinessPartner.Affiliate || !item.SecondaryPrice) {
              if (!item.AllowManualPrice) {
                return Notify.create({
                  type: 'negative',
                  message: `Cliente '${NewBusinessPartner.CardName}' (${NewBusinessPartner.CardCode}) no tiene precio para articulo '${item.ItemName}' (${item.ItemCode}). Escoja otro cliente o quite el articulo`
                })
              }
            }
          }
        }

        for (const key in items) {
          const index = Number(key.slice(1))
          const Item = items[key]
          const Quantity = CartItems.value[index].Quantity

          // primary price if not zero
          // else secondary price if not zero
          // else previous price if manual price allowed
          // else error
          let Price = null

          if (Item.PrimaryPrice) {
            Price = Item.PrimaryPrice
          } else if (Item.SecondaryPrice && !BusinessPartner.Affiliate) {
            Price = Item.SecondaryPrice
          } else if (Item.AllowManualPrice) {
            Price = CartItems.value[index].Price
          }

          CartItems.value.splice(index, 1, {
            Item,
            Quantity,
            Price
          })
        }
      }

      BusinessPartner.value = NewBusinessPartner
    }

    function itemSelected (Item) {
      CartItems.value.push(Item)
    }

    const BusinessPartnerLoading = ref(false)

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

    // load default client
    loadBusinessPartner('CL000001')

    const canCreateTable = computed(() => {
      if (!CartItems.value.length) return false
      return true
    })

    const IsTest = ref(false)
    const Close = ref(false)

    async function createTable () {
      try {
        Loading.show({ message: 'Creando Mesa' })

        const { sale } = await gql({
          query: /* GraphQL */`
            mutation ($Test: Boolean! $Data: TableCreateInput!) {
              sale: table_create (Test: $Test Data: $Data) {
                Test
                Print {
                  Orders {
                    Printer
                    DocDate
                    SalesPersonCode
                    U_GPOS_Serial
                    U_GPOS_SalesPointCode
                    DocumentLines {
                      ItemCode
                      ItemDescription
                      Quantity
                    }
                  }
                  Invoices {
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
                      Price
                    }
                    TaxSerie {
                      U_ACTIVIDAD
                      U_LEYENDA
                      U_DIRECCION
                      U_CIUDAD
                      U_PAIS
                      U_SUCURSAL                      
                    }
                    U_FECHALIM
                    U_EXENTO
                    U_NRO_FAC
                    U_NROAUTOR
                    U_CODCTRL
                    U_NIT
                    U_RAZSOC
                  }
                }
              }
            }
          `,
          variables: {
            Test: IsTest.value,
            Data: {
              Close: Close.value,
              SalesPointCode: store.state.config.SalesPointCode,
              CardCode: BusinessPartner.value.CardCode,
              Items: CartItems.value.map(({ Item: { ItemCode }, Quantity, Price }) => ({ ItemCode, Quantity, Price }))
            }
          }
        })

        Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Mesa Creada Exitosamente' })

        handleSalePrint(sale.Print, sale.Test)

        router.push('/tables')
      } catch (error) {
        gql.handleError(error)
      } finally {
        Loading.hide()
      }
    }

    if (!store.state.config.SalesPointCode) {
      Notify.create({
        type: 'warning',
        message: 'Para buen uso del POS debe configurar el punto de venta'
      })
    } else {
      store.dispatch('config/loadSalesPointConfig')
    }

    return {
      PAYGROUP_NONE,
      SalesPointCode,
      tab,
      split,
      BusinessPartner,
      BusinessPartnerLoading,
      setBusinessPartner,
      formatPrice,
      itemSubTotal,
      CartItems,
      CartTotal,
      itemSelected,
      IsTest,
      Close,
      canCreateTable,
      createTable
    }
  }
}
</script>
