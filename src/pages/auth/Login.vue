<template>
  <q-page padding class="flex flex-center">
    <!-- content -->
    <auth-login></auth-login>
  </q-page>
</template>

<script>
import AuthLogin from 'components/auth/Login'
export default {
  name: 'Login',
  components: { AuthLogin }
}
</script>
