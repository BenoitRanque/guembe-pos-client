<template>
  <span class="relative-position">
    <q-btn
      v-if="canEditPrice"
      @click.stop size="xs"
      dense icon="mdi-pencil"
      flat
    >
      <q-menu>
        <q-list>
          <q-item
            clickable
            v-close-popup
            :class="{ 'text-weight-bold': value === clientPriceList}"
            @click="$emit('input', clientPriceList)"
          >
            <q-item-section>{{clientPriceListName}}</q-item-section>
            <q-item-section side>{{formatPrice(clientPrice)}}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-close-popup
            :class="{ 'text-weight-bold': value === defaultPriceList}"
            @click="$emit('input', defaultPriceList)"
          >
            <q-item-section>{{defaultPriceListName}}</q-item-section>
            <q-item-section side>{{formatPrice(defaultPrice)}}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    {{formatPrice(currentPrice)}}
  </span>
</template>

<script>
import store from 'src/store'
import { computed } from '@vue/composition-api'
export default {
  name: 'ItemPrice',
  props: {
    value: {
      type: Number
    },
    ItemPrices: {
      type: Array,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  setup (props, { emit }) {
    const defaultPriceList = computed(() => store.getters['sales/defaultPriceList'])
    const defaultPriceListName = computed(() => store.getters['sales/defaultPriceListName'])
    const clientPriceList = computed(() => store.getters['sales/clientPriceList'])
    const clientPriceListName = computed(() => store.getters['sales/clientPriceListName'])

    const getPrice = store.getters['sales/itemPrice']

    const clientPrice = computed(() => getPrice(props.ItemPrices, clientPriceList.value))
    const defaultPrice = computed(() => getPrice(props.ItemPrices, defaultPriceList.value))
    const currentPrice = computed(() => getPrice(props.ItemPrices, props.value))

    const canEditPrice = computed(() => props.editable && clientPrice.value && defaultPrice.value && (clientPrice.value !== defaultPrice.value))

    function formatPrice (price) {
      return price ? store.getters['sales/formatPrice'](price) : 'no tiene precio'
    }

    return {
      defaultPriceListName,
      clientPriceListName,
      clientPriceList,
      defaultPriceList,
      clientPrice,
      defaultPrice,
      currentPrice,
      formatPrice,
      canEditPrice
    }
  }
}
</script>
