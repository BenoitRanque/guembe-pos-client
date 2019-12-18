<template>
  <q-page padding>
    <!-- content -->
    <q-splitter :value="50">
      <template v-slot:before>
        <q-btn @click="loadItems">refresh catalog</q-btn>
        <q-list>
          <q-item v-for="(item, index) in catalog" :key="`catalog_${index}`">
            <q-item-section>
              <q-item-label>
                {{item.ItemName}}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn dense icon="mdi-plus" @click="sale.items.unshift(Object.assign({ Quantity: 1 }, item))"></q-btn>
            </q-item-section>
          </q-item>
        </q-list>
        <!-- <pre>{{$store.state.sales}}</pre> -->

      </template>
      <template v-slot:after>
        <q-list>
          <q-item dense>
            <q-item-section side style="width: 4rem">
              <q-item-label overline><strong>Cant</strong></q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label overline><strong>Desc</strong></q-item-label>
            </q-item-section>
            <q-item-section side style="width: 4rem">
              <q-item-label overline><strong>Precio</strong></q-item-label>
            </q-item-section>
            <q-item-section side style="width: 4rem">
              <q-item-label overline><strong>Subtotal</strong></q-item-label>
            </q-item-section>
          </q-item>
          <sales-item
            v-for="(item, index) in sale.items"
            :key="`item_${index}`"
            :value="item"
            @update="sale.items.splice(index, 1, $event)"
            @remove="sale.items.splice(index, 1)"
          ></sales-item>
        </q-list>
      </template>
    </q-splitter>
  </q-page>
</template>

<script>
import SalesItem from 'components/sales/Item'
import { mapActions, mapState } from 'vuex'
export default {
  name: 'RapidSales',
  components: { SalesItem },
  data () {
    return {
      sale: {
        items: []
      }
    }
  },
  computed: {
    ...mapState('sales', ['catalog'])
  },
  methods: {
    ...mapActions('sales', ['REFRESH_CATALOG']),
    async loadItems () {
      try {
        await this.REFRESH_CATALOG()
      } catch (error) {
        this.$gql.handleError(error)
      }
    },
    addItem (item) {
      this.sale.items.unshift(item)
    }
  }
}
</script>
