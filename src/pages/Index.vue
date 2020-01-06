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
      this.$print({
        printOptions: {
          margins: {
            marginType: 'none'
          },
          deviceName: 'Facturas',
          silent: false
        },
        preview: false,
        template: 'invoice',
        copy: false,
        job: {
          message: 'original'
        }
      })
    }
  }
}
</script>
