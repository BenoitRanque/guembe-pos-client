<template>
  <q-markup-table flat>
    <thead>
      <tr>
        <th class="text-right" style="width: 10%">Cant.</th>
        <template v-if="showSalesPerson">
          <th class="text-left" style="width: 50%">Descripcion</th>
          <th class="text-left" style="width: 20%">Empleado</th>
        </template>
        <template v-else>
          <th class="text-left" style="width: 70%">Descripcion</th>
        </template>
        <th class="text-right" style="width: 10%">Precio</th>
        <th class="text-right" style="width: 10%">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <template v-if="!readonlyLines.length && !editableLines.length">
        <tr>
          <td colspan="4">
            No existen articulos en carrito
          </td>
        </tr>
      </template>
      <template v-else>
        <tr class="bg-blue-grey-3" v-for="({ Quantity, ItemDescription, Price, SalesPerson }, index) in readonlyLines" :key="`readonly_line_${index}`">
          <td class="text-right">{{Quantity}}</td>
          <td class="text-left">{{ItemDescription}}</td>
          <td v-if="showSalesPerson" class="text-left">{{SalesPerson.SalesPersonName}}</td>
          <td class="text-right">{{formatPrice(Price)}}</td>
          <td class="text-right">{{formatPrice(itemSubTotal(Price, Quantity))}}</td>
        </tr>

        <tr v-if="readonlyLines.length && editableLines.length">
          <th :colspan="showSalesPerson ? 5 : 4" style="padding: 0">
            <q-separator color="black"></q-separator>
          </th>
        </tr>

        <tr class="cursor-pointer" v-for="(line, index) in editableLines" :key="`editable_line_${index}`" @click="editableLineClicked(line, index)">
          <td class="text-right">{{line.Quantity}}</td>
          <td :colspan="showSalesPerson ? 2 : 1" class="text-left">{{line.Item.ItemName}}</td>
          <td class="text-right">{{formatPrice(line.Price)}}</td>
          <td class="text-right">{{formatPrice(itemSubTotal(line.Price, line.Quantity))}}</td>
        </tr>
      </template>
    </tbody>
    <tfoot>
      <tr>
        <th :colspan="showSalesPerson ? 5 : 4" style="padding: 0">
          <q-separator color="black"></q-separator>
        </th>
      </tr>
      <tr>
        <th :colspan="showSalesPerson ? 4 : 3">
          <div class="row">
            <slot name="footer-left"></slot>
            <q-space></q-space>
            Total
          </div>
        </th>
        <th class="text-right">
          {{formatPrice(TotalDue)}}
        </th>
        <q-dialog v-model="showDialog">
          <sales-order-line v-if="activeEditableLine" :business-partner="BusinessPartner" :value="activeEditableLine" @update="updateLine" @remove="removeLine"></sales-order-line>
        </q-dialog>
      </tr>
    </tfoot>
  </q-markup-table>
</template>

<script>
import { formatPrice, itemSubTotal } from 'src/utils'
import { computed, ref } from '@vue/composition-api'
import SalesOrderLine from 'components/SalesOrderLine'
export default {
  name: 'SaleOrderLines',
  components: { SalesOrderLine },
  props: {
    BusinessPartner: {
      type: Object,
      required: true
    },
    showSalesPerson: {
      type: Boolean,
      default: false
    },
    readonlyLines: {
      type: Array,
      default: () => []
    },
    editableLines: {
      type: Array,
      default: () => []
    }
  },
  setup (props, { emit }) {
    const TotalDue = computed(() => {
      const editableTotalCents = props.editableLines.reduce((total, { Quantity, Price }) => total + ((Price * 100) * Quantity), 0)
      const readonlyTotalCents = props.readonlyLines.reduce((total, { Quantity, Price }) => total + ((Price * 100) * Quantity), 0)
      return (editableTotalCents + readonlyTotalCents) / 100
    })

    const showDialog = ref(false)
    const activeEditableLine = ref(null)
    const activeEditableLineIndex = ref(null)

    function editableLineClicked (line, index) {
      activeEditableLine.value = line
      activeEditableLineIndex.value = index
      showDialog.value = true
    }

    function updateLine (update) {
      showDialog.value = false
      const updatedLines = props.editableLines.slice()
      updatedLines.splice(activeEditableLineIndex.value, 1, update)
      emit('update:editableLines', updatedLines)
    }
    function removeLine () {
      showDialog.value = false
      const updatedLines = props.editableLines.slice()
      updatedLines.splice(activeEditableLineIndex.value, 1)
      emit('update:editableLines', updatedLines)
    }

    return {
      formatPrice,
      itemSubTotal,
      TotalDue,
      editableLineClicked,
      showDialog,
      activeEditableLine,
      activeEditableLineIndex,
      updateLine,
      removeLine
    }
  }
}
</script>
