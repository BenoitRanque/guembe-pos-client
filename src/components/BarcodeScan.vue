<template>
  <div class="q-pa-xl flex flex-center column">
    <q-spinner-bars size="lg" color="accent" />
    <div class="text-subtitle1">
      Escaneando
    </div>
  </div>
</template>

<script>
import { watch, ref } from '@vue/composition-api'
export default {
  name: 'BarcodeScan',
  props: {
    active: {
      type: Boolean,
      default: false
    }
  },
  setup (props, { emit }) {
    const scanBuffer = ref('')

    function handleKeyboardInput (event) {
      if (event.key === 'Enter') {
        emit('scanned', scanBuffer.value)
        scanBuffer.value = ''
      } else {
        scanBuffer.value += String.fromCharCode(event.charCode)
      }
    }

    watch(() => props.active, active => {
      scanBuffer.value = ''
      if (active) {
        window.addEventListener('keypress', handleKeyboardInput)
      } else {
        window.removeEventListener('keypress', handleKeyboardInput)
      }
    })
  }
}
</script>
