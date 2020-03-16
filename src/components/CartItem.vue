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
              <q-item-label>{{value.Item.ItemName}} ({{value.Item.ItemCode}})</q-item-label>
            </q-item-section>
          </q-item>
          <q-expansion-item>
            <template v-slot:header>
              <q-item-section>
                <q-item-label caption>Precio Unitario (Click para opciones)</q-item-label>
                <q-item-label>
                  {{value.Price ? formatPrice(value.Price) : 'Estableszca precio'}}
                </q-item-label>
              </q-item-section>
            </template>
            <q-list dark class="bg-secondary">
              <q-item v-if="value.Item.PrimaryPrice" clickable @click="ItemUpdate.Price = value.Item.PrimaryPrice">
                <q-item-section>
                  <q-item-label caption>{{BusinessPartner.PrimaryPriceListName}}</q-item-label>
                  <q-item-label>{{formatPrice(value.Item.PrimaryPrice)}}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="value.Item.SecondaryPrice && !BusinessPartner.Affiliate && BusinessPartner.SecondaryPriceList !== BusinessPartner.PrimaryPriceList" clickable @click="ItemUpdate.Price = value.Item.SecondaryPrice">
                <q-item-section>
                  <q-item-label caption>{{BusinessPartner.SecondaryPriceListName}}</q-item-label>
                  <q-item-label>{{formatPrice(value.Item.SecondaryPrice)}}</q-item-label>
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
                      :value="ItemUpdate.Price"
                      @input="ItemUpdate.Price = /\d+(.\d\d?)?/.test($event) ? Number($event) : ItemUpdate.Price"
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
                  :value="ItemUpdate.Quantity"
                  @input="ItemUpdate.Quantity = Number.isInteger(Number($event)) && Number($event) >= 1 ? Number($event) : ItemUpdate.Quantity"
                  dense
                  borderless
                ></q-input>
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
          <q-btn @click="remove" class="q-mx-md q-mb-md" color="negative">Quitar</q-btn>
          <q-btn @click="update" class="q-mx-md q-mb-md" color="positive" :disable="!canUpdate">Guardar Cambios</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </tr>
</template>

<script>
import { Dialog } from 'quasar'
import { ref, reactive, computed } from '@vue/composition-api'
import { formatPrice, itemSubTotal } from 'src/utils'
export default {
  name: 'CartItem',
  props: {
    editable: {
      type: Boolean,
      default: false
    },
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
      if (props.editable) {
        ItemUpdate.Quantity = props.value.Quantity
        ItemUpdate.Price = props.value.Price

        showDialog.value = true
      }
    }

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
