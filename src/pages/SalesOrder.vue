<template>
  <q-page>
    <q-layout container view="hhr lpr fff" style="height: calc(100vh - 50px)">
      <q-header>
        <q-toolbar>
          <client-select
            v-if="!DocEntry"
            @selected="setBusinessPartner"
            icon="mdi-pencil"
            :label="BusinessPartner ? '' : 'Seleccionar Cliente'"
            flat
            dense
          >
            <q-tooltip>Cambiar Cliente</q-tooltip>
          </client-select>
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

      <checkout-input
        v-model="showCheckoutDrawer"
        v-if="BusinessPartner"
        :business-partner="BusinessPartner"
        :total-due="TotalDue"
        @checkout="handleCheckout"
      ></checkout-input>

      <q-page-container>
        <q-page>
          <q-banner v-if="!SalesPointCode" class="bg-negative text-white q-ma-md rounded-borders">
            Para realizar venta primero configure el punto de venta
            <template v-slot:action v-if="isAuthorized('administrador')">
              <q-btn flat @click="$router.push('/settings')">Ir a configuracion</q-btn>
            </template>
          </q-banner>
          <sales-order-lines
            v-if="SalesPointCode && BusinessPartner"
            :show-sales-person="!!DocEntry"
            :business-partner="BusinessPartner"
            :readonly-lines="SalesOrder ? SalesOrder.DocumentLines : []"
            :editable-lines.sync="EditableDocumentLines"
          >
            <template v-if="SalesOrder" v-slot:footer-left>Empleado: {{SalesOrder.SalesPerson.SalesPersonName}}</template>
          </sales-order-lines>
          <q-toolbar>
            <item-select
              v-if="SalesPointCode && BusinessPartner && allowedOperations.includes('ADD_TO_CART')"
              :business-partner="BusinessPartner"
              :sales-point-code="SalesPointCode"
              @selected="newItemSelected" size="md"
              icon="mdi-plus"
              color="accent"
            >
              Aggregar Articulo
            </item-select>
            <q-space></q-space>
            <q-btn class="q-ml-lg" color="negative" v-if="allowedOperations.includes('TABLE_CANCEL')" label="Anular Mesa" @click="cancelTable"/>
            <q-btn class="q-ml-lg" color="positive" v-if="allowedOperations.includes('TABLE_CREATE')" label="Crear Mesa" @click="createTable"/>
            <q-btn class="q-ml-lg" color="positive" v-if="allowedOperations.includes('TABLE_UPDATE')" label="Guardar Cambios" @click="updateTable" />
            <q-btn class="q-ml-lg" color="info" v-if="allowedOperations.includes('QUICKSALE') && !showCheckoutDrawer" label="Venta Rapida"  @click="showCheckoutDrawer = true"/>
            <q-btn class="q-ml-lg" color="warning" v-if="allowedOperations.includes('TABLE_CLOSE')" label="Cerrar Mesa" @click="closeTable"/>
            <q-btn class="q-ml-lg" color="positive" v-if="allowedOperations.includes('TABLE_REOPEN')" label="Reabrir Mesa" @click="reopenTable" />
            <q-btn class="q-ml-lg" color="info" v-if="allowedOperations.includes('TABLE_INVOICE') && !showCheckoutDrawer" label="Facturar Mesa" @click="showCheckoutDrawer = true"/>
          </q-toolbar>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-page>
</template>

<script>
import { computed, onMounted, ref } from '@vue/composition-api'
import SalesOrderLines from 'components/SalesOrderLines'
import ItemSelect from 'components/ItemSelect'
import ClientSelect from 'components/ClientSelect'
import CheckoutInput from 'components/CheckoutInput'
import router from 'src/router'
import store from 'src/store'
import gql from 'src/gql'
import { Dialog, Notify, Loading } from 'quasar'
import { handleSalePrint } from 'src/utils'

export default {
  name: 'SalesOrders',
  components: { SalesOrderLines, ClientSelect, ItemSelect, CheckoutInput },
  props: {
    DocEntry: {
      type: String,
      default: null
    }
  },
  setup (props) {
    const showCheckoutDrawer = ref(false)

    const isAuthorized = store.getters['auth/isAuthorized']

    const SalesPointCode = computed(() => store.state.config.SalesPointCode)

    const EditableDocumentLines = ref([])
    function newItemSelected (item) {
      EditableDocumentLines.value.push(item)
    }

    const { BusinessPartner, BusinessPartnerLoading, loadBusinessPartner, setBusinessPartner } = useBusinessPartner({ EditableDocumentLines, SalesPointCode })

    const { SalesOrder, SalesOrderLoading, loadSalesOrder } = userSalesOrder()

    const TotalDue = computed(() => {
      let cents = 0

      if (EditableDocumentLines.value && EditableDocumentLines.value.length) {
        cents += EditableDocumentLines.value.reduce((total, { Quantity, Price }) => total + ((Price * 100) * Quantity), 0)
      }
      if (SalesOrder.value && SalesOrder.value.DocumentLines.length) {
        cents += SalesOrder.value.DocumentLines.reduce((total, { Quantity, Price }) => total + ((Price * 100) * Quantity), 0)
      }
      return cents / 100
    })

    const allowedOperations = computed(() => {
      const allowedOperations = []

      const tableStatusNew = !props.DocEntry
      const tableStatusOpen = SalesOrder.value && SalesOrder.value.Type === 'TABLE_OPEN'
      const tableStatusClosed = SalesOrder.value && SalesOrder.value.Type === 'TABLE_CLOSED'
      const ItemsInCart = EditableDocumentLines.value.length > 0
      const userIsWaiter = isAuthorized('meseros')
      const userIsCashier = isAuthorized('cajeros')
      const userIsAdmin = isAuthorized('administrador')

      if (tableStatusNew) {
        allowedOperations.push('ADD_TO_CART')
        if (ItemsInCart) {
          if (userIsWaiter) {
            allowedOperations.push('TABLE_CREATE')
          }
          if (userIsCashier) {
            allowedOperations.push('QUICKSALE')
          }
        }
      } else {
        if (tableStatusOpen && userIsWaiter) {
          allowedOperations.push('ADD_TO_CART')
          if (ItemsInCart) {
            allowedOperations.push('TABLE_UPDATE')
          } else {
            allowedOperations.push('TABLE_CLOSE')
          }
        }
        if (tableStatusClosed && userIsCashier) {
          allowedOperations.push('TABLE_REOPEN')
          allowedOperations.push('TABLE_INVOICE')
        }

        if ((tableStatusOpen || tableStatusClosed) && userIsAdmin) {
          allowedOperations.push('TABLE_CANCEL')
        }
      }

      return allowedOperations
    })

    function createTable () {
      Dialog.create({
        title: 'Confirmar',
        message: 'Crear Mesa?',
        options: {
          type: 'checkbox',
          model: [],
          inline: true,
          items: [
            { label: 'Prueba', value: 'TEST', color: 'secondary' },
            { label: 'Cerrar', value: 'CLOSE' }
          ]
        },
        persistent: true,
        ok: { color: 'primary' },
        cancel: true
      }).onOk(async result => {
        const Test = result.includes('TEST')
        const Close = result.includes('CLOSE')

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
                  }
                }
              }
            `,
            variables: {
              Test,
              Data: {
                Close: Close,
                SalesPointCode: SalesPointCode.value,
                CardCode: BusinessPartner.value.CardCode,
                Items: EditableDocumentLines.value.map(({ Item: { ItemCode }, Quantity, Price }) => ({ ItemCode, Quantity, Price }))
              }
            }
          })

          Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Mesa Creada Exitosamente' })

          handleSalePrint(sale.Print, sale.Test)

          router.push('/salesorders')
        } catch (error) {
          gql.handleError(error)
        } finally {
          Loading.hide()
        }
      })
    }
    function updateTable () {
      Dialog.create({
        title: 'Confirmar',
        message: 'Actualizar Mesa?',
        options: {
          type: 'checkbox',
          model: [],
          inline: true,
          items: [
            { label: 'Prueba', value: 'TEST', color: 'secondary' },
            { label: 'Cerrar', value: 'CLOSE' }
          ]
        },
        persistent: true,
        ok: { color: 'primary' },
        cancel: true
      }).onOk(async result => {
        const Test = result.includes('TEST')
        const Close = result.includes('CLOSE')

        try {
          Loading.show({ message: 'Actualizando Mesa' })

          const { sale } = await gql({
            query: /* GraphQL */`
              mutation ($Test: Boolean! $Data: TableUpdateInput!) {
                sale: table_update (Test: $Test Data: $Data) {
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
                  }
                }
              }
            `,
            variables: {
              Test,
              Data: {
                Close: Close,
                SalesPointCode: SalesPointCode.value,
                CardCode: BusinessPartner.value.CardCode,
                PurchaseOrderDocEntry: Number(props.DocEntry),
                Items: EditableDocumentLines.value.map(({ Item: { ItemCode }, Quantity, Price }) => ({ ItemCode, Quantity, Price }))
              }
            }
          })

          Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Mesa Actualizada Exitosamente' })

          handleSalePrint(sale.Print, sale.Test)
        } catch (error) {
          gql.handleError(error)
        } finally {
          Loading.hide()
          router.push('/salesorders')
        }
      })
    }
    function closeTable () {
      Dialog.create({
        title: 'Confirmar',
        message: 'Cerrar Mesa?',
        options: {
          type: 'checkbox',
          model: [],
          inline: true,
          items: [
            { label: 'Prueba', value: 'TEST', color: 'secondary' }
          ]
        },
        persistent: true,
        ok: { color: 'primary' },
        cancel: true
      }).onOk(async result => {
        const Test = result.includes('TEST')

        try {
          Loading.show({ message: 'Cerrando Mesa' })

          await gql({
            query: /* GraphQL */`
              mutation ($Test: Boolean! $Data: TableCloseInput!) {
                sale: table_close (Test: $Test Data: $Data) {
                  Test
                }
              }
            `,
            variables: {
              Test,
              Data: {
                SalesPointCode: SalesPointCode.value,
                CardCode: BusinessPartner.value.CardCode,
                PurchaseOrderDocEntry: Number(props.DocEntry)
              }
            }
          })

          Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Mesa Cerrada Exitosamente' })
        } catch (error) {
          gql.handleError(error)
        } finally {
          Loading.hide()
          router.push('/salesorders')
        }
      })
    }
    function reopenTable () {
      Dialog.create({
        title: 'Confirmar',
        message: 'Reabrir Mesa?',
        options: {
          type: 'checkbox',
          model: [],
          inline: true,
          items: [
            { label: 'Prueba', value: 'TEST', color: 'secondary' }
          ]
        },
        persistent: true,
        ok: { color: 'primary' },
        cancel: true
      }).onOk(async result => {
        const Test = result.includes('TEST')

        try {
          Loading.show({ message: 'Reabriendo Mesa' })

          await gql({
            query: /* GraphQL */`
              mutation ($Test: Boolean! $Data: TableReopenInput!) {
                sale: table_reopen (Test: $Test Data: $Data) {
                  Test
                }
              }
            `,
            variables: {
              Test,
              Data: {
                SalesPointCode: SalesPointCode.value,
                CardCode: BusinessPartner.value.CardCode,
                PurchaseOrderDocEntry: Number(props.DocEntry)
              }
            }
          })

          Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Mesa Reabierta Exitosamente' })
        } catch (error) {
          gql.handleError(error)
        } finally {
          Loading.hide()
          router.push('/salesorders')
        }
      })
    }
    function cancelTable () {
      Dialog.create({
        title: 'Confirmar',
        message: 'Anular Mesa?',
        options: {
          type: 'checkbox',
          model: [],
          inline: true,
          items: [
            { label: 'Prueba', value: 'TEST', color: 'secondary' }
          ]
        },
        persistent: true,
        ok: { color: 'primary' },
        cancel: true
      }).onOk(async result => {
        const Test = result.includes('TEST')

        try {
          Loading.show({ message: 'Anulando Mesa' })

          await gql({
            query: /* GraphQL */`
              mutation ($Test: Boolean! $Data: TableCancelInput!) {
                sale: table_cancel (Test: $Test Data: $Data) {
                  Test
                }
              }
            `,
            variables: {
              Test,
              Data: {
                SalesPointCode: SalesPointCode.value,
                CardCode: BusinessPartner.value.CardCode,
                PurchaseOrderDocEntry: Number(props.DocEntry)
              }
            }
          })

          Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Mesa Anulada Exitosamente' })
        } catch (error) {
          gql.handleError(error)
        } finally {
          Loading.hide()
          router.push('/salesorders')
        }
      })
    }
    function handleCheckout (Invoice) {
      console.log('handling checkout...')
      if (props.DocEntry) {
        handleTableCheckout(Invoice)
      } else {
        handleQuicksaleCheckout(Invoice)
      }
    }
    function handleTableCheckout (Invoice) {
      Dialog.create({
        title: 'Confirmar',
        message: 'Facturar Mesa?',
        options: {
          type: 'checkbox',
          model: [],
          inline: true,
          items: [
            { label: 'Prueba', value: 'TEST', color: 'secondary' }
          ]
        },
        persistent: true,
        ok: { color: 'primary' },
        cancel: true
      }).onOk(async result => {
        const Test = result.includes('TEST')
        try {
          Loading.show({ message: 'Facturando Mesa' })

          const { sale } = await gql({
            query: /* GraphQL */`
              mutation ($Test: Boolean! $Data: TableCheckoutInput!) {
                sale: table_checkout (Test: $Test Data: $Data) {
                  Test
                  Print {
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
              Test,
              Data: {
                SalesPointCode: SalesPointCode.value,
                CardCode: BusinessPartner.value.CardCode,
                Invoice: Invoice,
                PurchaseOrderDocEntry: Number(props.DocEntry)
              }
            }
          })

          Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Mesa Facturada Exitosamente' })

          handleSalePrint(sale.Print, sale.Test)
        } catch (error) {
          gql.handleError(error)
        } finally {
          Loading.hide()
          router.push('/salesorders')
        }
      })
    }
    function handleQuicksaleCheckout (Invoice) {
      Dialog.create({
        title: 'Confirmar',
        message: 'Facturar Venta Rapida?',
        options: {
          type: 'checkbox',
          model: [],
          inline: true,
          items: [
            { label: 'Prueba', value: 'TEST', color: 'secondary' }
          ]
        },
        persistent: true,
        ok: { color: 'primary' },
        cancel: true
      }).onOk(async result => {
        const Test = result.includes('TEST')

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
              Test,
              Data: {
                SalesPointCode: SalesPointCode.value,
                CardCode: BusinessPartner.value.CardCode,
                Invoice: Invoice,
                Items: EditableDocumentLines.value.map(({ Item: { ItemCode }, Quantity, Price }) => ({ ItemCode, Quantity, Price }))
              }
            }
          })

          Notify.create({ color: 'positive', icon: 'mdi-check', message: 'Venta Exitosa' })

          handleSalePrint(sale.Print, sale.Test)
        } catch (error) {
          gql.handleError(error)
        } finally {
          Loading.hide()
          router.push('/salesorders')
        }
      })
    }

    if (!store.state.config.SalesPointCode) {
      Notify.create({
        type: 'warning',
        message: 'Para buen uso del POS debe configurar el punto de venta'
      })
    } else {
      store.dispatch('config/loadSalesPointConfig')
    }

    onMounted(async () => {
      if (props.DocEntry) {
        await loadSalesOrder(props.DocEntry)
      }
      await loadBusinessPartner(SalesOrder.value ? SalesOrder.value.CardCode : 'CL000001')
    })

    return {
      TotalDue,
      showCheckoutDrawer,
      SalesPointCode,
      BusinessPartner,
      BusinessPartnerLoading,
      EditableDocumentLines,
      setBusinessPartner,
      SalesOrder,
      SalesOrderLoading,
      newItemSelected,
      allowedOperations,
      isAuthorized,
      createTable,
      updateTable,
      closeTable,
      reopenTable,
      cancelTable,
      handleCheckout
    }
  }
}

function userSalesOrder () {
  const SalesOrder = ref(null)
  const SalesOrderLoading = ref(false)

  async function loadSalesOrder (DocEntry) {
    try {
      SalesOrderLoading.value = true

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
          DocEntry: Number(DocEntry)
        }
      })

      SalesOrder.value = salesOrder
    } catch (error) {
      gql.handleError(error)
    } finally {
      SalesOrderLoading.value = false
    }
  }

  return {
    SalesOrder,
    SalesOrderLoading,
    loadSalesOrder
  }
}

function useBusinessPartner ({ EditableDocumentLines, SalesPointCode }) {
  const BusinessPartner = ref(null)
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

  async function setBusinessPartner (NewBusinessPartner) {
    if (EditableDocumentLines.value.length && NewBusinessPartner.PrimaryPriceList !== BusinessPartner.value.PrimaryPriceList) {
      const ItemCodes = EditableDocumentLines.value.map(({ Item }) => Item.ItemCode)

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
        const Quantity = EditableDocumentLines.value[index].Quantity

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
          Price = EditableDocumentLines.value[index].Price
        }

        EditableDocumentLines.value.splice(index, 1, {
          Item,
          Quantity,
          Price
        })
      }
    }

    BusinessPartner.value = NewBusinessPartner
  }

  return {
    BusinessPartner,
    BusinessPartnerLoading,
    loadBusinessPartner,
    setBusinessPartner
  }
}

</script>
