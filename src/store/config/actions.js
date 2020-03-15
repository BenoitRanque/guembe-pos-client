import { gql } from 'src/gql'
import { LocalStorage } from 'quasar'

export function loadLocalConfig ({ commit }) {
  const config = LocalStorage.getItem('CONFIG')

  if (config) {
    commit('SALESPOINTCODE', config.SalesPointCode)
    commit('EXCHANGERATE', config.ExchangeRate)
  }
}
export function saveLocalConfig ({ state, dispatch }) {
  LocalStorage.set('CONFIG', {
    SalesPointCode: state.SalesPointCode,
    ExchangeRate: state.ExchangeRate
  })
}
export async function loadSalesPointConfig ({ state, commit }) {
  if (!state.SalesPointCode) {
    return false
  }

  const { salespoint, changerate } = await gql({
    query: /* GraphQL */`
      query ($Code: String!) {
        changerate
        salespoint (Code: $Code) {
          Code
          Name
        }
      }
    `,
    variables: {
      Code: state.SalesPointCode
    }
  })
  commit('SALESPOINT', salespoint)
  commit('EXCHANGERATE', changerate)

  return true
}
