<template>
  <q-page class="flex flex-center">
    <img alt="Quasar logo" style="width: 60vw; max-height: 60vh;" src="~assets/isologo.svg">
    <pre>{{$store.state.auth.session}}</pre>
  </q-page>
</template>

<script>
export default {
  name: 'PageIndex'
}
</script>
