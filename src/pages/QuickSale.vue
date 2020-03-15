<template>
  <q-page>
    <q-splitter style="height: calc(100vh - 50px)" v-model="split">
      <template v-slot:before>
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
        <div class="q-ma-md row items-center no-wrap">
          <q-space></q-space>
          <q-checkbox dense class="q-mx-sm" v-model="IsTest" label="Prueba" left-label></q-checkbox>
          <q-btn
            @click="() => startCheckout()"
            :disable="!canStartCheckout"
            icon="mdi-cash-register"
            size="lg"
            label="Checkout"
            color="accent"
          ></q-btn>
        </div>
      </template>
    </q-splitter>
    <q-dialog v-model="showPaymentDialog" persistent>
      <q-card style="width: 560px">
        <q-bar>
          Pago
          <q-space></q-space>
          <q-btn flat dense icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <payment-input
          :disable="Invoice.PaymentGroupCode !== PAYGROUP_NONE"
          :total-due="CartTotal"
          v-model="Payment"
          @payment="startCheckout"
          dense
          outline
          icon="mdi-credit-card-settings-outline"
          color="primary"
        ></payment-input>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showCheckoutDialog" persistent>
      <q-card>
        <q-bar>
          Checkout
          <q-space></q-space>
          <q-btn flat dense icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <q-scroll-area style="height: 40vh; width: 560px">
          <shopping-cart v-model="CartItems">
            <template v-slot:item="{ item, index }">
              <cart-item
                :key="index"
                :value="item"
                :business-partner="BusinessPartner"
                @update="CartItems.splice(index, 1, $event)"
                @remove="CartItems.splice(index, 1)"
              ></cart-item>
            </template>
          </shopping-cart>
        </q-scroll-area>
        <q-separator></q-separator>
        <payment-details
          :total-due="CartTotal"
          :total-credit="Invoice.PaymentGroupCode === PAYGROUP_NONE ? 0 : CartTotal"
          :value="Payment"
        ></payment-details>
        <q-separator></q-separator>
        <q-card-actions align="center">
          <q-btn class="q-mx-md q-mb-md" color="primary" @click="processCheckout">Finalizar Checkout</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showSaleDoneDialog" persistent>
      <q-card>
        <q-bar>
          Checkout Exitoso
          <q-space></q-space>
          <q-btn dense flat icon="mdi-close" v-close-popup @click="resetSale"></q-btn>
        </q-bar>
        <q-scroll-area style="height: 40vh; width: 560px">
          <shopping-cart v-model="CartItems">
            <template v-slot:item="{ item, index }">
              <cart-item
                :key="index"
                :value="item"
                :business-partner="BusinessPartner"
              ></cart-item>
            </template>
          </shopping-cart>
        </q-scroll-area>
        <q-separator></q-separator>
        <payment-details
          :total-due="CartTotal"
          :total-credit="Invoice.PaymentGroupCode === PAYGROUP_NONE ? 0 : CartTotal"
          :value="Payment"
        ></payment-details>
        <q-separator></q-separator>
        <q-card-actions align="center">
          <q-btn class="q-mx-md q-mb-md" flat v-close-popup @click="resetSale">Ok</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import gql from 'src/gql'
import print from 'src/print'
import ClientSelect from 'components/ClientSelect'
import ItemSelect from 'components/ItemSelect'
import CartItem from 'components/CartItem'
import ShoppingCart from 'components/ShoppingCart'
import PaymentInput from 'components/PaymentInput'
import PaymentDetails from 'components/PaymentDetails'
import { ref, computed, reactive, watch } from '@vue/composition-api'
import { formatPrice, itemSubTotal } from 'src/utils'
import { Notify, Loading } from 'quasar'
import store from 'src/store'
import { mapGetters } from 'vuex'
const PAYGROUP_NONE = -1
export default {
  name: 'QuickSale',
  components: {
    ClientSelect,
    ItemSelect,
    PaymentInput,
    PaymentDetails,
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

    const Invoice = reactive({
      PaymentGroupCode: PAYGROUP_NONE,
      Payment: null,
      U_NIT: '0',
      U_RAZSOC: 'SIN NOMBRE'
    })

    const PaymentTypeOptions = computed(() => {
      const PaymentTypes = []

      if (!BusinessPartner.value || !BusinessPartner.value.Affiliate) {
        PaymentTypes.push({
          label: 'CONTADO',
          value: PAYGROUP_NONE
        })
      }

      if (BusinessPartner.value && BusinessPartner.value.PayTermsGrpCode !== PAYGROUP_NONE) {
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

    watch(BusinessPartner, (BusinessPartner) => {
      if (BusinessPartner) {
        Invoice.U_NIT = BusinessPartner.FederalTaxID
        Invoice.U_RAZSOC = BusinessPartner.CardForeignName
        if (BusinessPartner.Affiliate) {
          Invoice.PaymentGroupCode = BusinessPartner.PayTermsGrpCode
        } else {
          Invoice.PaymentGroupCode = PAYGROUP_NONE
        }
      }
    })

    const showPaymentDialog = ref(false)
    const showCheckoutDialog = ref(false)

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
    watch(() => Payment.value.CashEnabled, Enabled => {
      if (!Payment.value.CardEnabled) {
        Payment.value.CashBS = Enabled ? CartTotal.value : 0
        if (!Enabled) {
          Payment.value.CashUSD = 0
        }
      }
    })

    watch(() => Payment.value.CardEnabled, Enabled => {
      if (!Payment.value.CashEnabled) {
        Payment.value.CreditSum = Enabled ? CartTotal.value : 0
      }
    })
    watch(() => Invoice.PaymentGroupCode, PaymentGroupCode => {
      Payment.value.CashEnabled = false
      Payment.value.CashBS = 0
      Payment.value.CashUSD = 0
      Payment.value.CardEnabled = false
      Payment.value.CreditSum = 0
      Payment.value.CreditCard = null
      Payment.value.CreditCardNumber = ''
      Payment.value.CardValidUntil = ''
      Payment.value.VoucherNum = ''
    })

    const canStartCheckout = computed(() => {
      if (!CartItems.value.length) return false
      return true
    })

    function startCheckout (IncomingPayment = null) {
      if (IncomingPayment && Invoice.PaymentGroupCode !== PAYGROUP_NONE) {
        throw new Error(`Inconsistent state. Should not happen. Payment present when not required`)
      } else if (!IncomingPayment && Invoice.PaymentGroupCode === PAYGROUP_NONE) {
        Invoice.Payment = null

        Payment.value = {
          CashEnabled: false,
          CashBS: 0,
          CashUSD: 0,
          CardEnabled: false,
          CreditSum: 0,
          CreditCard: null,
          CreditCardNumber: '',
          CardValidUntil: '',
          VoucherNum: ''
        }

        showPaymentDialog.value = true
      } else {
        Invoice.Payment = IncomingPayment

        showPaymentDialog.value = false
        showCheckoutDialog.value = true
      }
    }

    const IsTest = ref(false)

    const showSaleDoneDialog = ref(false)

    async function processCheckout () {
      try {
        Loading.show({ message: 'Processando Checkout' })

        const { sale } = await gql({
          query: /* GraphQL */`
            mutation ($Test: Boolean! $Data: QuickSaleInput!) {
              sale: quick_sale (Test: $Test Data: $Data) {
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
                      PriceAfterVAT
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
              SalesPointCode: store.state.config.SalesPointCode,
              CardCode: BusinessPartner.value.CardCode,
              Invoice: Invoice,
              Items: CartItems.value.map(({ Item: { ItemCode }, Quantity, Price: PriceAfterVAT }) => ({ ItemCode, Quantity, PriceAfterVAT }))
            }
          }
        })

        Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Venta Exitosa' })

        handleSalePrint(sale.Print, sale.Test)

        showCheckoutDialog.value = false
        showSaleDoneDialog.value = true
      } catch (error) {
        gql.handleError(error)
      } finally {
        Loading.hide()
      }
    }

    function handleSalePrint (Print, Test) {
      if (Print) {
        if (Print.Orders) {
          Print.Orders.forEach(Order => {
            print({
              template: 'order',
              preview: Test,
              test: Test,
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
        if (Print.Invoices) {
          Print.Invoices.forEach(Invoice => {
            print({
              template: 'invoice',
              preview: Test,
              test: Test,
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
              preview: Test,
              test: Test,
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
    }

    function resetSale () {
      CartItems.value = []
      Invoice.PaymentGroupCode = PAYGROUP_NONE
      Invoice.Payment = null
      Invoice.U_NIT = '0'
      Invoice.U_RAZSOC = 'SIN NOMBRE'
      Payment.value = {
        CashEnabled: true,
        CashBS: 0,
        CashUSD: 0,
        CardEnabled: false,
        CreditSum: 0,
        CreditCard: null,
        CreditCardNumber: '',
        CardValidUntil: '',
        VoucherNum: ''
      }
      loadBusinessPartner('CL000001')
    }

    if (!store.state.config.SalesPointCode) {
      Notify.create({
        type: 'warning',
        message: 'Para buen uso del POS debe configurar el punto de venta'
      })
    } else {
      store.dispatch('config/loadLocalConfig')
      store.dispatch('config/loadSalesPointConfig')
    }

    return {
      PAYGROUP_NONE,
      SalesPointCode,
      showPaymentDialog,
      showCheckoutDialog,
      startCheckout,
      processCheckout,
      tab,
      split,
      BusinessPartner,
      BusinessPartnerLoading,
      setBusinessPartner,
      formatPrice,
      itemSubTotal,
      CartItems,
      CartTotal,
      Payment,
      Invoice,
      itemSelected,
      PaymentTypeOptions,
      IsTest,
      canStartCheckout,
      showSaleDoneDialog,
      resetSale
    }
  }
}
</script>
