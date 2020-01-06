<template>
  <div>
    <item-select @selected="selected"></item-select>
    <q-dialog v-model="showDialog">
      <q-card v-if="item">
        <q-bar>
          Aggregar articulo
          <q-space></q-space>
          <q-btn flat dense icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <q-markup-table>
          <tbody>
            <tr>
              <td colspan="2">{{item.ItemName}}</td>
            </tr>
            <tr>
              <td>Precio Unitario</td>
              <td class="text-right">
                <item-price editable v-model="priceList" :item-prices="item.ItemPrices"></item-price>
              </td>
            </tr>
            <tr>
              <td>Cantidad</td>
              <td class="text-right justify-end row items-center q-gutter-x-sm">
                <q-btn-group rounded outline>
                  <q-btn icon="mdi-minus" color="primary" outline dense round @click="quantity -= 1" :disable="quantity < 2"></q-btn>
                  <q-btn icon="mdi-plus" color="primary" outline dense round @click="quantity += 1"></q-btn>
                </q-btn-group>
                <div class="text-weight-bold">
                  {{quantity}}
                </div>
              </td>
            </tr>
            <tr>
              <td>Subtotal</td>
              <td class="text-right">
                {{formatPrice(subtotal)}}
              </td>
            </tr>
          </tbody>
        </q-markup-table>
        <q-separator></q-separator>
        <q-card-actions align="around">
          <q-btn flat v-close-popup>cancelar</q-btn>
          <q-btn flat v-close-popup @click="add">aggregar</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import store from 'src/store'
import { ref, computed } from '@vue/composition-api'
import ItemSelect from 'components/sales/ItemSelect'
import ItemPrice from 'components/sales/ItemPrice'
import { Notify } from 'quasar'
export default {
  name: 'Catalog',
  components: { ItemSelect, ItemPrice },
  setup (props, ctx) {
    const formatPrice = store.getters['sales/formatPrice']
    const itemPrice = store.getters['sales/itemPrice']
    const itemSubtotal = store.getters['sales/itemSubtotal']

    const showDialog = ref(false)
    const priceList = ref(store.getters['sales/defaultPriceList'])
    const item = ref(null)
    const quantity = ref(1)

    function selected (selectedItem) {
      priceList.value = selectedItem.priceList
      item.value = selectedItem.item
      quantity.value = 1
      showDialog.value = true
    }

    const price = computed(() => item.value ? itemPrice(item.value.ItemPrices, priceList.value) : null)
    const subtotal = computed(() => itemSubtotal(price.value, quantity.value))

    function add () {
      if (!price.value) {
        Notify.create({
          message: `${item.value.ItemCode}: ${item.value.ItemName} no tiene precio`,
          color: 'negative',
          icon: 'mdi-alert-octagon'
        })
      } else {
        store.commit('sales/ADD_ITEM', {
          item: {
            item: item.value,
            quantity: quantity.value,
            priceList: priceList.value
          }
        })
      }
    }

    return {
      formatPrice,
      item,
      priceList,
      quantity,
      subtotal,
      showDialog,
      selected,
      add
    }
  }
}
</script>
