<template>
  <q-btn @click="showDialog = true" v-bind="$attrs">
    <slot/>
    <q-dialog v-model="showDialog" persistent>
      <q-card style="max-width: 90vw; width: 70vw; max-height: 90vh">
        <q-bar>
          Seleccionar Articulo
          <q-space></q-space>
          <q-btn flat dense icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <q-table
          class="q-px-sm"
          flat
          :data="data"
          :columns="columns"
          row-key="ItemCode"
          :pagination.sync="pagination"
          :filter="filter"
          hide-header
          grid
        >
          <template v-slot:top-left>
            <q-input class="col" autofocus outlined dense debounce="300" v-model="filter" placeholder="Buscar">
              <template v-slot:prepend>
                <q-icon name="mdi-magnify" />
              </template>
            </q-input>
          </template>
          <template v-slot:item="props">
            <q-card
              :key="props.row.ItemCode"
              @click="selected(props.row)"
              v-close-popup
              v-ripple
              class="q-ma-xs bg-blue-2 cursor-pointer"
            >
              <q-card-section>
                <div class="text-body2 text-weight-bold">
                  {{props.row.ItemName}}
                </div>
                <div class="text-caption row">
                  <span>{{props.row.ItemCode}}</span>
                  <q-space></q-space>
                  <span v-if="BusinessPartner && getPrimaryPrice(props.row.ItemPrices, BusinessPartner.PriceListNum)">
                    {{formatPrice(getPrimaryPrice(props.row.ItemPrices, BusinessPartner.PriceListNum).Price)}}
                  </span>
                </div>
              </q-card-section>
            </q-card>
          </template>
        </q-table>
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
                  {{formatPrice(SelectedItem.Price)}}
                </q-item-label>
              </q-item-section>
            </template>
            <q-list dark class="bg-secondary">
              <q-item v-if="SelectedItemPrimaryPrice" clickable @click="SelectedItem.Price = SelectedItemPrimaryPrice.Price">
                <q-item-section>
                  <q-item-label caption>{{SelectedItemPrimaryPrice.PriceListName}}</q-item-label>
                  <q-item-label>{{formatPrice(SelectedItemPrimaryPrice.Price)}}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="SelectedItemSecondaryPrice" clickable @click="SelectedItem.Price = SelectedItemSecondaryPrice.Price">
                <q-item-section>
                  <q-item-label caption>{{SelectedItemSecondaryPrice.PriceListName}}</q-item-label>
                  <q-item-label>{{formatPrice(SelectedItemSecondaryPrice.Price)}}</q-item-label>
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
          <q-btn @click="done" v-close-popup :disable="SelectedItem.Price === 0" class="q-mx-md q-mb-md" icon="mdi-check" color="primary" label="Aggregar"></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-btn>
</template>

<script>
import { ref, reactive, toRefs, computed } from '@vue/composition-api'
import store from 'src/store'
import { formatPrice, itemSubTotal, getPrimaryPrice, getSecondaryPrice } from 'src/utils'

export default {
  name: 'ItemSelect',
  props: {
    BusinessPartner: {
      type: Object,
      default: () => ({ PriceListNum: 1 })
    }
  },
  setup (props, { emit }) {
    const showDialog = ref(false)

    const table = reactive({
      columns: [
        { name: 'ItemCode', field: 'ItemCode' },
        { name: 'ItemName', field: 'ItemName' },
        { name: 'Tags', field: Item => Item.Tags.join(' ') }
      ],
      filter: '',
      pagination: {
        page: 1,
        rowsPerPage: 20
      },
      loading: false
    })

    const data = computed(() => store.state.config.SalesPoint ? store.state.config.SalesPoint.Catalog : [])

    function getItemPrice (Item, priceList) {
      const price = Item.ItemPrices.find(list => list.PriceList === priceList)
      return price && price.Price !== 0 ? price.Price : null
    }

    const showSelectedItemDialog = ref(false)
    const SelectedItem = reactive({
      Item: null,
      Quantity: 1,
      Price: null
    })

    const SelectedItemPrimaryPrice = computed(() => {
      if (!SelectedItem.Item || !props.BusinessPartner) return null
      return getPrimaryPrice(SelectedItem.Item.ItemPrices, props.BusinessPartner.PriceListNum)
    })
    const SelectedItemSecondaryPrice = computed(() => {
      if (!SelectedItem.Item) return null
      return getSecondaryPrice(SelectedItem.Item.ItemPrices, SelectedItemPrimaryPrice.value)
    })

    function selected (Item) {
      table.filter = ''

      SelectedItem.Quantity = 1
      SelectedItem.Item = Item
      const PrimaryPrice = getPrimaryPrice(Item.ItemPrices, props.BusinessPartner.PriceListNum)
      SelectedItem.Price = PrimaryPrice ? PrimaryPrice.Price : 0

      showSelectedItemDialog.value = true
    }

    function done () {
      emit('selected', Object.assign({}, SelectedItem))
    }
    return {
      showDialog,
      getItemPrice,
      formatPrice,
      ...toRefs(table),
      itemSubTotal,
      data,
      selected,
      done,
      getPrimaryPrice,
      SelectedItem,
      SelectedItemPrimaryPrice,
      SelectedItemSecondaryPrice,
      showSelectedItemDialog
    }
  }
}
</script>
