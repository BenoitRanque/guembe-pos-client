<template>
  <q-card
    v-ripple
    @click="selected"
  >
    <q-card-section>
      <div class="tex-body2">
        {{item.ItemName}}
      </div>
      <div class="text-caption text-right">
        <item-price :value="priceList" :item-prices="item.ItemPrices"></item-price>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import store from 'src/store'
import { computed } from '@vue/composition-api'
import ItemPrice from 'components/sales/ItemPrice'
export default {
  name: 'ItemSelectItem',
  components: { ItemPrice },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  setup (props, { emit }) {
    const clientPriceList = computed(() => store.getters['sales/clientPriceList'])
    const defaultPriceList = computed(() => store.getters['sales/defaultPriceList'])

    function hasPrice (priceList, ItemPrices) {
      return ItemPrices.some(price => price.PriceList === priceList && price.Price !== 0)
    }

    const priceList = computed(() => {
      if (hasPrice(clientPriceList.value, props.item.ItemPrices)) return clientPriceList.value
      if (hasPrice(defaultPriceList.value, props.item.ItemPrices)) return defaultPriceList.value
      return null
    })

    function selected () {
      emit('selected', { item: props.item, priceList: priceList.value })
    }

    return {
      selected,
      priceList
    }
  }
}
</script>
