<template>
  <tr class="cursor-pointer" @click="edit">
    <td class="text-right">{{value.Quantity}}</td>
    <td class="text-left">{{value.Item.ItemName}}</td>
    <td class="text-right">{{formatPrice(value.Price)}}</td>
    <td class="text-right">{{formatPrice(itemSubTotal(value.Price, value.Quantity))}}</td>
    <q-dialog v-model="showDialog">
      <q-card>
        <q-bar>
          Articulo en Carrito
          <q-space></q-space>
          <q-btn dense flat icon="mdi-close" v-close-popup></q-btn>
        </q-bar>
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label caption>Articulo</q-item-label>
              <q-item-label>{{value.Item.ItemName}}</q-item-label>
            </q-item-section>
          </q-item>
          <q-expansion-item>
            <template v-slot:header>
              <q-item-section>
                <q-item-label caption>Precio Unitario (Click para opciones)</q-item-label>
                <q-item-label>
                  {{formatPrice(value.Price)}}
                </q-item-label>
              </q-item-section>
            </template>
            <q-list dark class="bg-secondary">
              <q-item v-if="PrimaryPrice" clickable @click="ItemUpdate.Price = PrimaryPrice.Price">
                <q-item-section>
                  <q-item-label caption>{{PrimaryPrice.PriceListName}}</q-item-label>
                  <q-item-label>{{formatPrice(PrimaryPrice.Price)}}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="SecondaryPrice" clickable @click="ItemUpdate.Price = SecondaryPrice.Price">
                <q-item-section>
                  <q-item-label caption>{{SecondaryPrice.PriceListName}}</q-item-label>
                  <q-item-label>{{formatPrice(SecondaryPrice.Price)}}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="value.Item.AllowManualPrice" clickable>
                <q-item-section>
                  <q-item-label caption>Precio Manual</q-item-label>
                  <q-item-label>
                    <q-input
                      suffix="BS"
                      dark
                      dense
                      outlined
                      type="number"
                      min="0"
                      step="0.01"
                      :value="ItemUpdate.Price"
                      @input="ItemUpdate.Price = Number($event)"
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
                {{ItemUpdate.Quantity}}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn :disable="ItemUpdate.Quantity < 2" @click="ItemUpdate.Quantity -= 1" round dense color="primary" icon="mdi-minus"></q-btn>
            </q-item-section>
            <q-item-section side>
              <q-btn @click="ItemUpdate.Quantity += 1" round dense color="primary" icon="mdi-plus"></q-btn>
            </q-item-section>
          </q-item>
          <hr>
          <q-item>
            <q-item-section>
              <q-item-label caption>
                Subtotal
              </q-item-label>
              <q-item-label>{{formatPrice(itemSubTotal(ItemUpdate.Price, ItemUpdate.Quantity))}}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="around">
          <q-btn @click="remove" color="negative">Quitar</q-btn>
          <q-btn @click="update" color="positive" :disable="!canUpdate">Guardar Cambios</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </tr>
</template>

<script>
import { Dialog } from 'quasar'
import { ref, reactive, computed } from '@vue/composition-api'
import { formatPrice, itemSubTotal, getPrimaryPrice, getSecondaryPrice } from 'src/utils'
export default {
  name: 'CartItem',
  props: {
    value: {
      type: Object,
      required: true
    },
    BusinessPartner: {
      type: Object,
      required: true
    }
  },
  setup (props, { emit }) {
    const showDialog = ref(false)

    const ItemUpdate = reactive({
      Quantity: 0,
      Price: 0
    })

    function edit () {
      ItemUpdate.Quantity = props.value.Quantity
      ItemUpdate.Price = props.value.Price

      showDialog.value = true
    }

    const PrimaryPrice = computed(() => {
      return getPrimaryPrice(props.value.Item.ItemPrices, props.BusinessPartner.PriceListNum)
    })
    const SecondaryPrice = computed(() => {
      return getSecondaryPrice(props.value.Item.ItemPrices, PrimaryPrice.value)
    })

    const canUpdate = computed(() => {
      if (ItemUpdate.Quantity !== props.value.Quantity) return true
      if (ItemUpdate.Price !== props.value.Price) return true
      return false
    })

    function update () {
      emit('update', Object.assign(props.value, ItemUpdate))
      showDialog.value = false
    }

    function remove () {
      Dialog.create({
        title: 'Quitar Articulo',
        message: 'Confirmar',
        cancel: true
      }).onOk(() => {
        emit('remove')
        showDialog.value = false
      })
    }

    return {
      formatPrice,
      itemSubTotal,
      PrimaryPrice,
      SecondaryPrice,
      ItemUpdate,
      showDialog,
      edit,
      canUpdate,
      update,
      remove
    }
  }
}
</script>
