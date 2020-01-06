<template>
  <tr class="cursor-pointer" @click="edit">
    <td class="text-right">{{item.quantity}}</td>
    <td class="text-left">{{item.item.ItemName}}</td>
    <td class="text-right">{{formatPrice(price)}}</td>
    <td class="text-right">{{formatPrice(subtotal)}}</td>
    <q-dialog v-model="showDialog">
      <q-card>
        <q-bar>
          Editar articulo
          <q-space></q-space>
          <q-btn flat dense icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <q-markup-table>
          <tbody>
            <tr>
              <td colspan="2">{{item.item.ItemName}}</td>
            </tr>
            <tr>
              <td>Precio Unitario</td>
              <td class="text-right">
                <item-price editable v-model="itemUpdate.priceList" :item-prices="item.item.ItemPrices"></item-price>
              </td>
            </tr>
            <tr>
              <td>Cantidad</td>
              <td>
                <div class="text-right justify-end row items-center q-gutter-x-sm">
                  <q-btn-group rounded outline>
                    <q-btn icon="mdi-minus" color="primary" outline dense round @click="itemUpdate.quantity -= 1" :disable="itemUpdate.quantity < 2"></q-btn>
                    <q-btn icon="mdi-plus" color="primary" outline dense round @click="itemUpdate.quantity += 1"></q-btn>
                  </q-btn-group>
                  <div class="text-weight-bold">
                    {{itemUpdate.quantity}}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td>Subtotal</td>
              <td class="text-right">
                {{formatPrice(updateSubtotal)}}
              </td>
            </tr>
          </tbody>
        </q-markup-table>
        <q-separator></q-separator>
        <q-card-actions align="around">
          <q-btn v-close-popup flat color="negative" @click="remove">quitar</q-btn>
          <q-btn v-close-popup flat @click="update">guardar</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </tr>
</template>

<script>
import ItemPrice from 'components/sales/ItemPrice'
import { computed, ref, reactive } from '@vue/composition-api'
import store from 'src/store'
import { Dialog } from 'quasar'
export default {
  name: 'CartItem',
  components: { ItemPrice },
  props: {
    index: {
      type: Number,
      required: true
    },
    item: {
      type: Object,
      required: true
    }
  },
  setup (props) {
    const formatPrice = store.getters['sales/formatPrice']
    const itemPrice = store.getters['sales/itemPrice']
    const itemSubtotal = store.getters['sales/itemSubtotal']

    const price = computed(() => itemPrice(props.item.item.ItemPrices, props.item.priceList))
    const subtotal = computed(() => itemSubtotal(price.value, props.item.quantity))

    const showDialog = ref(false)

    const itemUpdate = reactive({
      priceList: null,
      quantity: 0
    })

    function edit () {
      itemUpdate.priceList = props.item.priceList
      itemUpdate.quantity = props.item.quantity

      showDialog.value = true
    }

    const updatePrice = computed(() => itemPrice(props.item.item.ItemPrices, itemUpdate.priceList))
    const updateSubtotal = computed(() => itemSubtotal(updatePrice.value, itemUpdate.quantity))

    const canUpdate = computed(() => {
      if (itemUpdate.priceList !== props.item.priceList) return true
      if (itemUpdate.quantity !== props.item.quantity) return true
      return false
    })

    function update () {
      const update = {}

      if (itemUpdate.priceList !== props.item.priceList) {
        update.priceList = itemUpdate.priceList
      }
      if (itemUpdate.quantity !== props.item.quantity) {
        update.quantity = itemUpdate.quantity
      }

      store.commit('sales/UPDATE_ITEM', { item: update, index: props.index })
    }

    function remove () {
      Dialog.create({
        title: 'Quitar Articulo',
        message: 'Confirmar',
        cancel: true
      }).onOk(() => {
        store.commit('sales/REMOVE_ITEM', { index: props.index })
      })
    }

    return {
      price,
      subtotal,
      formatPrice,
      showDialog,
      edit,
      itemUpdate,
      updatePrice,
      updateSubtotal,
      canUpdate,
      update,
      remove
    }
  }
}
</script>
