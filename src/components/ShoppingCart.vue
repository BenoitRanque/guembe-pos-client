<template>
  <q-markup-table flat>
    <thead>
      <tr>
        <th class="text-right" style="width: 10%">Cant.</th>
        <th class="text-left" style="width: 70%">Descripcion</th>
        <th class="text-right" style="width: 10%">Precio</th>
        <th class="text-right" style="width: 10%">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <template v-if="!value.length">
        <tr>
          <td colspan="4">
            No existen articulos en carrito
          </td>
        </tr>
      </template>
      <template v-else>
        <slot v-for="(item, index) in value" name="item" :item="item" :index="index"></slot>
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
</template>

<script>
import { computed } from '@vue/composition-api'
import { formatPrice } from 'src/utils'
export default {
  name: 'ShoppingCart',
  props: {
    value: {
      type: Array,
      required: true
    }
  },
  setup (props, { emit }) {
    const CartTotal = computed(() => props.value.reduce((total, { Quantity, Price }) => total + ((Price * 100) * Quantity), 0) / 100)

    return {
      formatPrice,
      CartTotal
    }
  }
}
</script>
