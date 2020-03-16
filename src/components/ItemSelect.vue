<template>
  <q-btn @click="showDialog = true" v-bind="$attrs">
    <slot/>
    <q-dialog v-model="showDialog" persistent @hide="reset">
      <q-card style="max-width: 90vw; width: 70vw; max-height: 90vh">
        <q-bar>
          Seleccionar Articulo
          <q-space></q-space>
          <q-btn flat dense icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <q-table
          flat
          :data="data"
          :columns="columns"
          row-key="ItemCode"
          :pagination.sync="pagination"
          :filter="filter"
          :loading="loading"
          @request="onRequest"
          @row-click="(evt, row) => selected(row)"
          :rows-per-page-options="[3,5,7,10,15,25,50]"
        >
          <template v-slot:top-left>
            <q-input class="col" autofocus outlined dense debounce="300" v-model="filter" placeholder="Buscar">
              <template v-slot:prepend>
                <q-icon name="mdi-magnify" />
              </template>
              <template v-slot:after>
                <q-btn @click="showScanBarcodeDialog = true" class="col" flat dense icon="mdi-barcode-scan" color="primary">
                  <q-tooltip>Escanear codigo de barras</q-tooltip>
                </q-btn>
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
    <q-dialog v-model="showSelectedItemDialog">
      <q-card>
        <q-bar>
          Aggregar Item
          <q-space></q-space>
          <q-btn dense flat icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <q-list v-if="SelectedItem.Item">
          <q-item>
            <q-item-section>
              <q-item-label caption>Articulo</q-item-label>
              <q-item-label>{{SelectedItem.Item.ItemName}} ({{SelectedItem.Item.ItemCode}})</q-item-label>
            </q-item-section>
          </q-item>
          <q-expansion-item>
            <template v-slot:header>
              <q-item-section>
                <q-item-label caption>Precio Unitario (Click para opciones)</q-item-label>
                <q-item-label>
                  {{SelectedItem.Price ? formatPrice(SelectedItem.Price) : 'Estableszca precio'}}
                </q-item-label>
              </q-item-section>
            </template>
            <q-list dark class="bg-secondary">
              <q-item clickable v-if="SelectedItem.Item.PrimaryPrice" @click="SelectedItem.Price = SelectedItem.Item.PrimaryPrice">
                <q-item-section>
                  <q-item-label caption>{{BusinessPartner.PrimaryPriceListName}}</q-item-label>
                  <q-item-label>{{formatPrice(SelectedItem.Item.PrimaryPrice)}}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-if="SelectedItem.Item.SecondaryPrice && !BusinessPartner.Affiliate && BusinessPartner.SecondaryPriceList !== BusinessPartner.PrimaryPriceList" @click="SelectedItem.Price = SelectedItem.Item.SecondaryPrice">
                <q-item-section>
                  <q-item-label caption>{{BusinessPartner.SecondaryPriceListName}}</q-item-label>
                  <q-item-label>{{formatPrice(SelectedItem.Item.SecondaryPrice)}}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="SelectedItem.Item.AllowManualPrice" clickable>
                <q-item-section>
                  <q-item-label caption>Precio Manual</q-item-label>
                  <q-item-label>
                    <q-input
                      suffix="BS"
                      dark
                      dense
                      outlined
                      :value="SelectedItem.Price"
                      @input="SelectedItem.Price = /\d+(.\d\d?)?/.test($event) ? Number($event) : SelectedItem.Price"
                    ></q-input>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>Cantidad</q-item-label>
              <q-item-label>
                <q-input
                  :value="SelectedItem.Quantity"
                  @input="SelectedItem.Quantity = Number.isInteger(Number($event)) && Number($event) >= 1 ? Number($event) : SelectedItem.Quantity"
                  dense
                  borderless
                ></q-input>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn :disable="SelectedItem.Quantity < 2" @click="SelectedItem.Quantity -= 1" round dense color="primary" icon="mdi-minus"></q-btn>
            </q-item-section>
            <q-item-section side>
              <q-btn @click="SelectedItem.Quantity += 1" round dense color="primary" icon="mdi-plus"></q-btn>
            </q-item-section>
          </q-item>
          <hr>
          <q-item>
            <q-item-section>
              <q-item-label caption>
                Subtotal
              </q-item-label>
              <q-item-label>{{formatPrice(itemSubTotal(SelectedItem.Price, SelectedItem.Quantity))}}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="center">
          <q-btn @click="done" v-close-popup :disable="SelectedItem.Price <= 0" class="q-mx-md q-mb-md" icon="mdi-check" color="primary" label="Aggregar"></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showScanBarcodeDialog" :persistent="loadingScannedItem">
      <q-card>
        <q-bar>
          Escanear Codigo de Barras
          <q-space></q-space>
          <q-btn flat dense icon="mdi-close" v-close-popup :disable="loadingScannedItem"></q-btn>
        </q-bar>
        <q-card-section >
          <barcode-scan :active="showScanBarcodeDialog && !loadingScannedItem" @scanned="barcodeInput"></barcode-scan>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-actions align="center">
          <q-btn flat v-close-popup :disable="loadingScannedItem">Cerrar</q-btn>
        </q-card-actions>
        <q-inner-loading :showing="loadingScannedItem">
          <q-spinner></q-spinner>
        </q-inner-loading>
      </q-card>
    </q-dialog>
  </q-btn>
</template>

<script>
import BarcodeScan from 'components/BarcodeScan'
import { ref, reactive, toRefs } from '@vue/composition-api'
import { formatPrice, itemSubTotal } from 'src/utils'
import { Notify } from 'quasar'
import gql from 'src/gql'
export default {
  name: 'ItemSelect',
  components: { BarcodeScan },
  props: {
    SalesPointCode: {
      type: String,
      required: true
    },
    BusinessPartner: {
      type: Object,
      default: () => ({ PrimaryPriceList: 1, SecondaryPriceList: 1 })
    }
  },
  setup (props, { emit }) {
    const showScanBarcodeDialog = ref(false)
    const loadingScannedItem = ref(false)

    async function barcodeInput (Code) {
      try {
        loadingScannedItem.value = true

        const { item } = await gql({
          query: /* GraphQL */`
            query ($Code: String! $SalesPointCode: String! $PrimaryPriceList: Int! $SecondaryPriceList: Int!) {
              item (Code: $Code CodeType: BarCode SalesPointCode:  $SalesPointCode PrimaryPriceList: $PrimaryPriceList SecondaryPriceList: $SecondaryPriceList) {
                ItemCode
                ItemName
                AllowCredit
                AllowAffiliate
                AllowManualPrice
                PrimaryPrice
                SecondaryPrice
                Stock
              }
            }
          `,
          variables: {
            Code: Code,
            SalesPointCode: props.SalesPointCode,
            PrimaryPriceList: props.BusinessPartner.PrimaryPriceList,
            SecondaryPriceList: props.BusinessPartner.SecondaryPriceList
          }
        })

        if (!item) {
          Notify.create({
            type: 'warning',
            message: `No se pudo encontrar el articulo con codigo de barras '${Code}'`
          })
        } else {
          selected(item)
        }
      } catch (error) {
        gql.handleError(error)
      } finally {
        loadingScannedItem.value = false
      }
    }

    const showDialog = ref(false)

    const table = reactive({
      columns: [
        {
          name: 'ItemCode',
          label: 'Codigo',
          field: 'ItemCode',
          align: 'left'
        },
        {
          name: 'ItemName',
          label: 'Nombre',
          field: 'ItemName',
          align: 'left'
        },
        {
          name: 'PrimaryPrice',
          label: 'Precio',
          field: 'PrimaryPrice',
          align: 'center'
        },
        {
          name: 'Stock',
          label: 'Stock',
          field: 'Stock',
          align: 'center'
        }
      ],
      filter: '',
      pagination: {
        page: 1,
        rowsPerPage: 7,
        rowsNumber: 0
      },
      loading: false,
      data: []
    })

    async function onRequest ({ pagination, filter } = { pagination: table.pagination, filter: table.filter }) {
      try {
        table.loading = true

        const { items } = await gql({
          query: /* GraphQL */`
            query ($limit: Int! $offset: Int! $filter: String $SalesPointCode: String! $PrimaryPriceList: Int! $SecondaryPriceList: Int!) {
              items (limit: $limit offset: $offset filter: $filter SalesPointCode:  $SalesPointCode PrimaryPriceList: $PrimaryPriceList SecondaryPriceList: $SecondaryPriceList) {
                totalItems
                pageItems {
                  ItemCode
                  ItemName
                  AllowCredit
                  AllowAffiliate
                  AllowManualPrice
                  PrimaryPrice
                  SecondaryPrice
                  Stock
                }
              }
            }
          `,
          variables: {
            limit: pagination.rowsPerPage,
            offset: pagination.rowsPerPage * (pagination.page - 1),
            filter: filter.length ? filter : null,
            SalesPointCode: props.SalesPointCode,
            PrimaryPriceList: props.BusinessPartner.PrimaryPriceList,
            SecondaryPriceList: props.BusinessPartner.SecondaryPriceList
          }
        })

        table.pagination = {
          ...pagination,
          rowsNumber: items.totalItems
        }

        table.data = items.pageItems
      } catch (error) {
        gql.handleError(error)
      } finally {
        table.loading = false
      }
    }

    const showSelectedItemDialog = ref(false)
    const SelectedItem = reactive({
      Item: null,
      Quantity: 1,
      Price: null
    })

    function selected (Item) {
      table.filter = ''

      SelectedItem.Quantity = 1
      SelectedItem.Item = Item
      SelectedItem.Price = Item.PrimaryPrice ? Item.PrimaryPrice : Item.SecondaryPrice
      // const PrimaryPrice = getPrimaryPrice(Item.ItemPrices, props.BusinessPartner.PriceListNum)
      // SelectedItem.Price = PrimaryPrice ? PrimaryPrice.Price : 0

      showSelectedItemDialog.value = true
    }

    function done () {
      emit('selected', Object.assign({}, SelectedItem))
    }

    function reset () {
      table.filter = ''
      onRequest()
    }

    onRequest()

    return {
      reset,
      showScanBarcodeDialog,
      loadingScannedItem,
      barcodeInput,
      showDialog,
      formatPrice,
      onRequest,
      ...toRefs(table),
      itemSubTotal,
      selected,
      done,
      SelectedItem,
      showSelectedItemDialog
    }
  }
}
</script>
