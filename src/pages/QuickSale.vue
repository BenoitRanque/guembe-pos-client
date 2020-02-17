<template>
  <q-page>
    <q-splitter style="height: calc(100vh - 50px)" v-model="split">
      <template v-slot:before>
        <q-markup-table flat>
          <thead>
            <tr>
              <th class="text-right" style="width: 10%">Cant.</th>
              <th class="text-left" style="width: 70%">Desc.</th>
              <th class="text-right" style="width: 10%">Precio</th>
              <th class="text-right" style="width: 10%">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="!CartItems.length">
              <tr>
                <td colspan="4">
                  No existen articulos en carrito
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                is="cart-item"
                v-for="(item, index) in CartItems"
                :key="index"
                :business-partner="BusinessPartner"
                :value="item"
                @update="CartItems.splice(index, 1, $event)"
                @remove="CartItems.splice(index, 1)"
              ></tr>
            </template>
          </tbody>
          <tfoot>
            <tr>
              <th colspan="4" style="padding: 0">
                <q-separator color="black"></q-separator>
              </th>
            </tr>
            <tr>
              <th colspan="3" class="text-right">Total</th>
              <th class="text-right">{{formatPrice(CartTotal)}}</th>
            </tr>
          </tfoot>
        </q-markup-table>
        <hr>
        <div class="text-center">
          <item-select :business-partner="BusinessPartner" @selected="itemSelected" size="lg" icon="mdi-plus" color="primary">
            Aggregar Articulo
          </item-select>
        </div>
      </template>
      <template v-slot:after>
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
              <!-- Cliente: -->
            </q-toolbar-title>
          </template>
          <q-inner-loading :showing="BusinessPartnerLoading">
            <q-spinner></q-spinner>
          </q-inner-loading>
        </q-toolbar>
        <q-input class="q-ma-md" v-model="Invoice.U_NIT" outlined label="NIT/CI"></q-input>
        <q-input class="q-ma-md" v-model="Invoice.U_RAZSOC" outlined label="RAZON SOCIAL"></q-input>
        <q-select class="q-ma-md" v-model="Invoice.PaymentGroupCode" outlined emit-value :options="PaymentTypeOptions" map-options></q-select>
        <div class="q-ma-md row items-center">
          <payment
            :disable="Invoice.PaymentGroupCode !== -1"
            :total-due="CartTotal"
            :value="Payment"
            @input="Payment = $event"
            @payment="Invoice.Payment = $event"
            dense
            outline
            icon="mdi-credit-card-settings-outline"
            color="primary"
          >
            <q-tooltip>
              Detalles de forma de pago
            </q-tooltip>
          </payment>
          <q-space></q-space>
          <q-btn :disable="!canCheckout" @click="checkout" :loading="checkoutLoading" icon="mdi-cash-register" size="lg" label="Checkout" color="primary"></q-btn>
        </div>
        <div class="q-ma-sm" v-if="isAuthorized(['administrador'])">
          <q-checkbox v-model="IsTest" label="Prueba"></q-checkbox>
          <q-checkbox v-model="ShowPrintPreview" :disable="!IsTest" label="Previsualizar"></q-checkbox>
        </div>
      </template>
    </q-splitter>
    <q-inner-loading :showing="checkoutLoading">
      <q-spinner></q-spinner>
    </q-inner-loading>
  </q-page>
</template>

<script>
import gql from 'src/gql'
import print from 'src/print'
import ClientSelect from 'components/sales/ClientSelect'
import ItemSelect from 'components/sales/ItemSelect'
import CartItem from 'components/sales/CartItem'
import Payment from 'components/sales/Payment'
import { ref, computed, reactive, watch } from '@vue/composition-api'
import { formatPrice, getPrimaryPrice } from 'src/utils'
import { Notify } from 'quasar'
import store from 'src/store'
import { mapGetters } from 'vuex'
export default {
  name: 'QuickSale',
  components: { ClientSelect, ItemSelect, CartItem, Payment },
  computed: mapGetters('auth', ['isAuthorized']),
  setup () {
    const tab = ref('catalog')
    const split = ref(60)

    const BusinessPartner = ref(null)

    const CartItems = ref([])
    const CartTotal = computed(() => CartItems.value.reduce((total, { Quantity, Price }) => total + ((Price * 100) * Quantity), 0) / 100)

    async function setBusinessPartner (BP) {
      for (let CartItem of CartItems.value) {
        let ItemPrice = getPrimaryPrice(CartItem.Item.ItemPrices, BP.PriceListNum)

        if (!ItemPrice) {
          if (!CartItem.Item.AllowManualPrice) {
            return Notify.create({
              color: 'negative',
              icon: 'mdi-alert',
              message: `Cliente '${BP.CardName}' (${BP.CardCode}) no tiene precio para articulo '${CartItem.Item.ItemName}' (${CartItem.Item.ItemCode}). Escoja otro cliente o quite el articulo`
            })
          }
        } else {
          CartItem.Price = ItemPrice.Price
        }
      }

      BusinessPartner.value = BP
    }

    function itemSelected (Item) {
      CartItems.value.push(Item)
    }

    const Invoice = reactive({
      PaymentGroupCode: -1,
      Payment: null,
      U_NIT: '0',
      U_RAZSOC: 'SIN NOMBRE'
    })

    watch(() => Invoice.PaymentGroupCode, PaymentGroupCode => {
      if (PaymentGroupCode === -1) {
        Invoice.Payment = null
      }
    })

    const PaymentTypeOptions = computed(() => {
      const PaymentTypes = []

      if (!BusinessPartner.value || !BusinessPartner.value.Affiliate) {
        PaymentTypes.push({
          label: 'CONTADO',
          value: -1
        })
      }

      if (BusinessPartner.value && BusinessPartner.value.PayTermsGrpCode !== -1) {
        PaymentTypes.push({
          label: 'CREDITO',
          value: BusinessPartner.value.PayTermsGrpCode
        })
      }

      return PaymentTypes
    })

    const BusinessPartnerLoading = ref(false)

    async function loadBusinessPartner (CardCode) {
      try {
        BusinessPartnerLoading.value = true

        const { client } = await gql({
          query: /* GraphQL */`
            query ($CardCode: String!) {
              client: business_partner (CardCode: $CardCode) {
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

    watch(BusinessPartner, (BusinessPartner) => {
      if (BusinessPartner) {
        Invoice.U_NIT = BusinessPartner.FederalTaxID
        Invoice.U_RAZSOC = BusinessPartner.CardForeignName
        Invoice.PaymentGroupCode = BusinessPartner.PayTermsGrpCode
      }
    })

    const Payment = ref({
      CashEnabled: true,
      CashBS: 0,
      CashUSD: 0,
      CardEnabled: false,
      CreditSum: 0,
      CreditCard: null,
      CreditCardNumber: '',
      CardValidUntil: '',
      VoucherNum: ''
    })

    const canCheckout = computed(() => {
      if (!CartItems.value.length) return false
      if (Invoice.PaymentGroupCode === -1 && !Invoice.Payment) return false
      if (Invoice.PaymentGroupCode !== -1 && Invoice.Payment) return false
      return true
    })

    const IsTest = ref(false)
    const ShowPrintPreview = ref(false)
    watch(IsTest, () => {
      ShowPrintPreview.value = false
    })

    const checkoutLoading = ref(false)

    async function checkout () {
      try {
        checkoutLoading.value = true

        const { sale } = await gql({
          query: /* GraphQL */`
            mutation ($Test: Boolean! $Data: QuickSaleInput!) {
              sale: quick_sale (Test: $Test Data: $Data)
            }
          `,
          variables: {
            Test: IsTest.value,
            Data: {
              SalesPointCode: store.state.config.SalesPointCode,
              CardCode: BusinessPartner.value.CardCode,
              Invoice: Invoice,
              Items: CartItems.value.map(({ Item: { ItemCode }, Quantity, Price: PriceAfterVAT }) => ({ ItemCode, Quantity, PriceAfterVAT }))
            }
          }
        })

        Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Venta Exitosa' })

        if (sale.Print) {
          if (sale.Print.Orders) {
            sale.Print.Orders.forEach(Order => {
              print({
                template: 'order',
                preview: ShowPrintPreview.value,
                test: sale.Test,
                printOptions: {
                  silent: true,
                  deviceName: Order.Printer,
                  printBackground: true,
                  margins: {
                    marginType: 'none'
                  }
                },
                data: Order
              })
            })
          }
          if (sale.Print.Invoices) {
            sale.Print.Invoices.forEach(Invoice => {
              print({
                template: 'invoice',
                preview: ShowPrintPreview.value,
                test: sale.Test,
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
                preview: ShowPrintPreview.value,
                test: sale.Test,
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
            })
          }
        }
      } catch (error) {
        gql.handleError(error)
      } finally {
        checkoutLoading.value = false
      }
    }

    return {
      tab,
      split,
      BusinessPartner,
      BusinessPartnerLoading,
      setBusinessPartner,
      formatPrice,
      CartItems,
      CartTotal,
      Payment,
      Invoice,
      itemSelected,
      PaymentTypeOptions,
      IsTest,
      ShowPrintPreview,
      canCheckout,
      checkoutLoading,
      checkout
    }
  }
}
</script>
