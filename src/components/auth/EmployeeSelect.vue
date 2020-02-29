<template>
  <q-select
    v-bind="$attrs"
    :loading="LoadingOptions"
    :options="Options"
    v-model="Employee"
    use-input
    input-debounce="0"
    @filter="filterFunction"
  ></q-select>
</template>

<script>
import { computed, ref } from '@vue/composition-api'
import gql from 'src/gql'
export default {
  name: 'EmployeeSelect',
  props: {
    value: {
      type: [Number, Array],
      default: null
    }
  },
  setup (props, { emit }) {
    const EmployeeOptions = ref([])

    function mapEmployee (EmployeeID) {
      return EmployeeOptions.value.find(({ value }) => value === EmployeeID) || null
    }

    const Employee = computed({
      get () {
        if (Array.isArray(props.value)) {
          return props.value.map(mapEmployee)
        } else {
          return mapEmployee(props.value)
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
        return EmployeeOptions.value.filter(({ label }) => label.toLowerCase().indexOf(filter.value) > -1)
      } else {
        return EmployeeOptions.value
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

        const { options } = await gql({
          query: /* GraphQL */`
            query {
              options: session_employees {
                value: EmployeeID
                label: SalesEmployeeName
              }
            }
          `
        })

        EmployeeOptions.value = options.sort((a, b) => a.label.localeCompare(b.label))
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
      Employee
    }
  }
}
</script>
