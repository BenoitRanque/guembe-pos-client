<template>
  <div>
    <q-toolbar class="print-hide bg-primary text-white shadow-6">
      <q-toolbar-title>Cola de impresion</q-toolbar-title>
    </q-toolbar>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'Print'
}
</script>
