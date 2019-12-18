import Vue from 'vue'
import Vuex from 'vuex'

import config from './config'
import auth from './auth'
import sales from './sales'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

// export default function (/* { ssrContext } */) {
//   const Store = new Vuex.Store({
//     modules: {
//       config,
//       auth
//     },

//     // enable strict mode (adds overhead!)
//     // for dev mode only
//     strict: process.env.DEV
//   })

//   return Store
// }

const Store = new Vuex.Store({
  modules: {
    config,
    auth,
    sales
  },

  // enable strict mode (adds overhead!)
  // for dev mode only
  strict: process.env.DEV
})

export default Store
