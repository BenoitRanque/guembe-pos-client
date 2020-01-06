import gql from 'src/gql'
import { Notify } from 'quasar'

export async function REFRESH_CATALOG ({ commit, rootState, rootGetters }) {
  const { items } = await gql({
    query: /* GraphQL */`
      query Catalog ($where: SalesPointItem_bool_exp) {
        items: SalesPointItem (where: $where) {
          ItemCode
          DisplayGroup
          SubDisplayGroup
          WarehouseCode
          CostingCode
          CostingCode2
        }
      }
    `,
    variables: {
      where: {
        SalesPointID: {
          _eq: rootState.config.SalesPointID
        }
      }
    },
    role: 'anonymous'
  })

  const { details } = await gql({
    query: /* GraphQL */`
      query ($ItemCodes: [String!]!) {
        details: items_details (ItemCodes: $ItemCodes) {
          ItemCode
          ItemName
          ItemPrices {
            PriceList
            Price
          }
          ItemWarehouseInfoCollection {
            WarehouseCode
            InStock
          }
        }
      }
    `,
    variables: {
      ItemCodes: items.map(({ ItemCode }) => ItemCode)
    }
  })

  const catalog = items.map(item => ({
    ...item,
    ...details.find(detail => detail.ItemCode === item.ItemCode)
  }))

  commit('CATALOG', catalog)
}

export async function REFRESH_PRICELISTS ({ commit, rootState }) {
  const { pricelists } = await gql({
    query: /* GraphQL */`
      query {
        pricelists {
          PriceListNo
          PriceListName
        }
      }
    `,
    role: 'anonymous'
  })

  commit('PRICELISTS', pricelists)
}

export async function REFRESH_CREDITCARDS ({ commit, rootState }) {
  const { CreditCard } = await gql({
    query: /* GraphQL */`
      query {
        CreditCard {
          value: CreditCard
          label: CardName
        }
      }
    `,
    role: 'anonymous'
  })

  commit('CREDITCARDS', CreditCard)
}

export async function SET_CLIENT ({ commit, dispatch, state }, CardCode) {
  const {
    client
  } = await gql({
    query: /* GraphQL */`
      query Client ($CardCode: String!) {
        client (CardCode: $CardCode) {
          CardCode
          CardName
          GroupCode
          CardForeignName
          FederalTaxID
          PayTermsGrpCode
          PriceListNum
          PriceList {
            PriceListNo
            PriceListName
          }
        }
      }
    `,
    variables: { CardCode },
    role: 'anonymous'
  })

  // this throws if item prices disallow changing client
  dispatch('UPDATE_CLIENT_PRICES', client)
  commit('CLIENT', client)

  commit('INVOICE', {
    ...state.QuickSale.Invoice,
    PaymentGroupCode: client.PayTermsGrpCode,
    U_NIT: client ? client.CardForeignName : 'SIN NOMBRE',
    U_RAZSOC: client ? client.FederalTaxID : 0
  })
}

export function UPDATE_CLIENT_PRICES ({ commit, state, getters, rootState }, client) {
  const defaultPriceList = rootState.config.defaults.PriceListNo
  const clientPriceList = state.QuickSale.Client ? state.QuickSale.Client.PriceListNum : defaultPriceList

  // if new client has same pricelist as previous, skip check
  if (client.PriceListNum === clientPriceList) {
    return
  }

  function hasPrice (priceList, ItemPrices) {
    return ItemPrices.some(price => price.PriceList === priceList && price.Price !== 0)
  }

  const items = state.QuickSale.Items.reduce((items, { item, quantity }) => {
    if (hasPrice(client.PriceListNum, item.ItemPrices)) {
      items.push({
        item,
        quantity,
        priceList: client.PriceListNum
      })
    } else if (hasPrice(defaultPriceList, item.ItemPrices)) {
      items.push({
        item,
        quantity,
        priceList: defaultPriceList
      })
    } else {
      console.log(`TODO: prevent changing client if no price is available for an item already commited`)
      Notify.create({
        message: `Articulo ${item.ItemCode} ${item.ItemName} no tienen costo, a sido removido`,
        color: 'warning',
        icon: 'mdi-warning'
      })
    }
    return items
  }, [])
  commit('REPLACE_ITEMS', items)
}

export async function INIT ({ dispatch, rootState }) {
  try {
    await dispatch('SET_CLIENT', rootState.config.defaults.CardCode)
    await dispatch('REFRESH_CATALOG')
    await dispatch('REFRESH_PRICELISTS')
    await dispatch('REFRESH_CREDITCARDS')
  } catch (error) {
    gql.handleError(error)
  }
}

export async function FINALIZE ({ state, getters }) {
  const CardCode = state.QuickSale.Client.CardCode
  const Payment = state.QuickSale.Invoice.Payment &&
    (state.QuickSale.Invoice.Payment.CashSum !== 0 || state.QuickSale.Invoice.Payment.PaymentCreditCards.length)
    ? state.QuickSale.Invoice.Payment
    : null
  const Invoice = {
    VATExempt: state.QuickSale.Invoice.VATExempt,
    PaymentGroupCode: state.QuickSale.Invoice.PaymentGroupCode,
    Payment,
    U_NIT: state.QuickSale.Invoice.U_NIT,
    U_RAZSOC: state.QuickSale.Invoice.U_RAZSOC
  }
  const Items = state.QuickSale.Items.map(({ item, quantity, priceList, price }) => ({
    ItemCode: item.ItemCode,
    Quantity: quantity,
    PriceAfterVAT: priceList !== null ? getters.itemPrice(item.ItemPrices, priceList) : price
  }))
  return gql({
    query: /* GraphQL */`
      mutation CreateQuickSale ($Sale: QuickSaleInput!) {
        quick_sale (Sale: $Sale)
      }
    `,
    variables: {
      Sale: {
        CardCode,
        Invoice,
        Items
      }
    },
    role: 'anonymous'
  })
}
