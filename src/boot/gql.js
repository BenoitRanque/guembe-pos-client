import gql from 'src/gql'

export default async ({ Vue }) => {
  Vue.prototype.$gql = gql
}
