<template>
  <div>
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
        <template v-if="!items.length">
          <tr>
            <td colspan="4">
              No existen articulos aggregados
            </td>
          </tr>
        </template>
        <template v-else>
          <tr is="cart-item" v-for="(item, index) in items" :key="index" :item="item" :index="index"></tr>
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
          <th class="text-right">{{formatPrice(total)}}</th>
        </tr>
      </tfoot>
    </q-markup-table>
  </div>
</template>

<script>
import CartItem from 'components/sales/CartItem'
import store from 'src/store'
import { computed } from '@vue/composition-api'
export default {
  name: 'Cart',
  components: { CartItem },
  setup () {
    const items = computed(() => store.getters['sales/quickSale'].Items)

    // function getPrice (priceList, ItemPrices) {
    //   const price = ItemPrices.find(list => list.PriceList === priceList)
    //   return price && price.Price !== 0 ? price.Price : 0
    // }

    // const total = computed(() => items.value.reduce((total, { item, priceList, quantity }) => {
    //   return total + (getPrice(priceList, item.ItemPrices) * quantity)
    // }, 0))
    const total = computed(() => store.getters['sales/saleTotal'])
    const cart = computed(() => store.getters['sales/quickSale'])

    const formatPrice = store.getters['sales/formatPrice']

    return {
      items,
      total,
      formatPrice,
      cart
    }
  }
}
</script>
