import { print, printSetup } from 'src/print'

export default ({ router, Vue }) => {
  printSetup(router)
  Vue.prototype.$print = print
}
