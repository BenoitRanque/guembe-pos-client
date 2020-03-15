<template>
  <q-select
    v-bind="$attrs"
    :loading="LoadingOptions"
    :options="Options"
    v-model="SalesPoint"
    :use-input="!value || Array.isArray(value)"
    input-debounce="0"
    @filter="filterFunction"
  ></q-select>
</template>

<script>
import { computed, ref } from '@vue/composition-api'
import gql from 'src/gql'
export default {
  name: 'SalesPointSelect',
  props: {
    value: {
      type: [String, Array],
      default: null
    }
  },
  setup (props, { emit }) {
    const SalesPointOptions = ref([])

    function mapSalesPoint (SalesPointCode) {
      return SalesPointOptions.value.find(({ value }) => value === SalesPointCode) || null
    }

    const SalesPoint = computed({
      get () {
        if (Array.isArray(props.value)) {
          return props.value.map(mapSalesPoint)
        } else {
          return mapSalesPoint(props.value)
        }
      },
      set (value) {
        if (Array.isArray(value)) {
          emit('input', value.map(({ value }) => value))
        } else {
          emit('input', value ? value.value : null)
        }
      }
    })

    const filter = ref('')
    const Options = computed(() => {
      if (filter.value) {
        return SalesPointOptions.value.filter(({ label }) => label.toLowerCase().indexOf(filter.value) > -1)
      } else {
        return SalesPointOptions.value
      }
    })

    function filterFunction (filterValue, update) {
      update(() => {
        filter.value = filterValue.toLowerCase()
      })
    }

    const LoadingOptions = ref(false)

    async function loadOptions () {
      try {
        LoadingOptions.value = true

        const { salespoints: { options } } = await gql({
          query: /* GraphQL */`
            query {
              salespoints {
                options: pageItems {
                  value: Code
                  label: Name
                }
              }
            }
          `
        })

        SalesPointOptions.value = options.sort((a, b) => a.label.localeCompare(b.label))
      } catch (error) {
        gql.handleError(error)
      } finally {
        LoadingOptions.value = false
      }
    }

    loadOptions()

    return {
      LoadingOptions,
      filterFunction,
      Options,
      SalesPoint
    }
  }
}
</script>
