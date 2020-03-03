<template>
  <q-page class="flex flex-center no-wrap">
    <img alt="Guembe logo" style="width: 40vw; max-height: 60vh;" src="~assets/isologo.svg">
    <user-login v-if="!isAuthenticated" class="q-ma-lg"></user-login>
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
import UserLogin from 'components/Login'
export default {
  name: 'PageIndex',
  components: { UserLogin },
  computed: mapGetters('auth', ['isAuthenticated'])
}
</script>
