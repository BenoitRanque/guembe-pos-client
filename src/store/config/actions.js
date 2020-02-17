import { gql } from 'src/gql'
import { LocalStorage, Notify } from 'quasar'

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
    return Notify.create({
      icon: 'mdi-alert-octagon',
      color: 'negative',
      message: 'Para buen uso del POS debe configurar el punto de venta'
    })
  }

  const { salespoint, pricelists, creditcards } = await gql({
    query: /* GraphQL */`
      query ($Code: String!) {
        pricelists {
          PriceListNo
          PriceListName
        }
        creditcards {
          CreditCardCode
          CreditCardName
        }
        salespoint (Code: $Code) {
          Code
          Name
          Catalog {
            ItemCode
            ItemName
            AllowManualPrice
            AllowCredit
            AllowAffiliate
            ItemPrices {
              PriceList
              Price
            }
          }
        }
      }
    `,
    variables: {
      Code: state.SalesPointCode
    }
  })
  commit('SALESPOINT', salespoint)
  commit('PRICELISTS', pricelists)
  commit('CREDITCARDS', creditcards)
}
