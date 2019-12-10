<template>
  <q-page class="flex flex-center">
    <q-btn @click="print">Print</q-btn>
    <img alt="Quasar logo" src="~assets/quasar-logo-full.svg">
  </q-page>
</template>

<script>
export default {
  name: 'PageIndex',
  methods: {
    print () {
      // see here!
      // https://stackoverflow.com/questions/37627064/how-to-print-a-div-in-electronjs
    }
  }
}
</script>
