<template>
  <q-table
    flat
    :data="data"
    :columns="columns"
    row-key="ItemCode"
    :pagination.sync="pagination"
    :filter="filter"
    hide-header
    grid
  >
    <template v-slot:top>
      <q-input class="col" autofocus outlined dense debounce="300" v-model="filter" placeholder="Buscar">
        <template v-slot:prepend>
          <q-icon name="mdi-magnify" />
        </template>
      </q-input>
      <q-space></q-space>
      <q-select
        dense
        class="col q-ml-sm"
        label="Filtro de Grupo"
        clearable
        outlined
        :options="itemGroups"
        v-model="filterGroup"
      ></q-select>
      <q-select
        dense
        class="col q-ml-sm"
        label="Filtro de SubGrupo"
        clearable
        outlined
        v-if="filterGroup"
        :disable="!filterGroup"
        :options="itemSubGroups"
        v-model="filterSubGroup"
      ></q-select>
    </template>
    <template v-slot:item="props">
      <item-select-item
        :key="props.row.ItemCode"
        class="q-ma-xs bg-blue-2 text-weight-bold cursor-pointer"
        :item="props.row"
        @selected="selected"
      >

      </item-select-item>
    </template>
  </q-table>
</template>

<script>
import ItemSelectItem from 'components/sales/ItemSelectItem'
import { reactive, watch, toRefs, computed } from '@vue/composition-api'
import store from 'src/store'

export default {
  name: 'clientSelect',
  components: { ItemSelectItem },
  setup (props, { emit }) {
    const table = reactive({
      columns: [],
      filter: '',
      filterGroup: '',
      filterSubGroup: '',
      pagination: {
        page: 1,
        rowsPerPage: 7
      },
      loading: false
    })

    watch(() => table.filterGroup, filterGroup => {
      if (!filterGroup) {
        table.filterSubGroup = ''
      }
    })

    const items = computed(() => store.state.sales.catalog)

    const itemGroups = computed(() => Array.from(new Set(items.value.map(item => item.DisplayGroup))))
    const itemSubGroups = computed(() => !table.filterGroup ? table.filterGroup : Array.from(new Set(items.value
      .filter(item => item.DisplayGroup === table.filterGroup)
      .map(item => item.SubDisplayGroup))))

    const data = computed(() => {
      return items.value.filter(item => {
        if (table.filterGroup && table.filterGroup !== item.DisplayGroup) return false
        if (table.filterSubGroup && table.filterSubGroup !== item.SubDisplayGroup) return false
        return true
      })
    })

    function selected (selectedItem) {
      emit('selected', selectedItem)
      table.filter = ''
    }

    return {
      ...toRefs(table),
      itemGroups,
      itemSubGroups,
      data,
      selected
    }
  }
}
</script>
