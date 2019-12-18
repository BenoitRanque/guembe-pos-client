<template>
  <q-item clickable @click="showDialog = true">
    <q-item-section side style="width: 4rem">
      <q-item-label>{{value.Quantity}}</q-item-label>
    </q-item-section>
    <q-item-section>
      <q-item-label>{{value.ItemName}}</q-item-label>
    </q-item-section>
    <q-item-section side style="width: 4rem">
      <q-item-label>12.00</q-item-label>
    </q-item-section>
    <q-item-section side style="width: 4rem">
      <q-item-label>24.00</q-item-label>
    </q-item-section>
    <q-dialog v-model="showDialog">
      <q-card>
        <q-card-section>
          content
        </q-card-section>
        <q-card-section>
          <pre>{{value}}</pre>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-actions align="around">
          <q-btn flat v-close-popup @click="remove">Quitar</q-btn>
          <q-btn flat v-close-popup>OK</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-item>
</template>

<script>
export default {
  name: 'SalesItem',
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      showDialog: false
    }
  },
  methods: {
    remove () {
      this.$q.dialog({
        title: `Quitar item`,
        message: `Confirmar que desea quitar el item`,
        cancel: true
      }).onOk(() => {
        this.$emit('remove')
      }).onCancel(() => {
        this.$refs.slideItem.reset()
      })
    }
  }
}
</script>
