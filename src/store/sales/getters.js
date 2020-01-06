export function defaultPriceList (state, getters, rootState) {
  return rootState.config.defaults.PriceListNo
}

export function clientPriceList (state, getters) {
  if (state.QuickSale.client) {
    return state.QuickSale.Client.PriceListNum
  } else {
    return getters.defaultPriceList
  }
}

export function priceListName (state) {
  return priceListNo => {
    const priceList = state.pricelists.find(list => list.PriceListNo === priceListNo)
    return priceList ? priceList.PriceListName : null
  }
}

export function defaultPriceListName (state, getters) {
  return getters.priceListName(getters.defaultPriceList)
}

export function clientPriceListName (state, getters) {
  return getters.priceListName(getters.clientPriceList)
}

export function itemPrice (state, getters) {
  return (ItemPrices, priceList = getters.clientPriceList) => {
    const price = ItemPrices.find(list => list.PriceList === priceList)
    return price && price.Price !== 0 ? price.Price : null
  }
}

export function itemSubtotal (state, getters) {
  return (price, quantity) => ((price * 100) * quantity) / 100
}

export function saleTotal (state, getters) {
  return state.QuickSale.Items.reduce((total, { item, quantity, priceList }) => {
    return ((total * 100) + (getters.itemSubtotal(getters.itemPrice(item.ItemPrices, priceList), quantity) * 100)) / 100
  }, 0)
}

export function formatPrice () {
  return price => `${price} BS`
  // return price => `${price.toFixed(2)} BS`
}

export function saleItems (state) {
  return state.QuickSale.Items
}

export function saleInvoices (state) {
  return state.QuickSale.Invoices
}

export function saleClientInternal (state) {
  const INTERNAL_CLIENT_GROUPCODE = 114 // TODO: change this to be a configuration
  // return true if the selected client is internal, meaning the invoice will not be a legal invoice
  return state.QuickSale.Client && state.QuickSale.Client.GroupCode === INTERNAL_CLIENT_GROUPCODE
}

export function salePayTermsOptions (state, getters) {
  const PAY_TERM_IMMEDIATE = -1 // TODO: change this to be a configuration

  const options = []

  if (state.QuickSale.Client && state.QuickSale.Client.PayTermsGrpCode !== PAY_TERM_IMMEDIATE) {
    options.push({ value: state.QuickSale.Client.PayTermsGrpCode, label: 'CREDITO' })
  }

  if (!getters.saleClientInternal) {
    options.push({ value: PAY_TERM_IMMEDIATE, label: 'CONTADO' })
  }

  if (!options.length) {
    throw new Error(`Cannot provide pay terms options for client ${state.QuickSale.Client.CardCode}`)
  }

  return options
}

export function quickSale (state) {
  return state.QuickSale
}
