import { gql } from 'src/gql'
export default async ({ store }) => {
  store.dispatch('config/loadLocalConfig')
  try {
    await store.dispatch('config/loadSalesPointConfig')
  } catch (error) {
    gql.handleError(error)
  }
}
