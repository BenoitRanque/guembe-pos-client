export function CATALOG (state, items) {
  state.catalog = items
}

export function CLIENT (state, client) {
  state.QuickSale.Client = client
}

export function PRICELISTS (state, pricelists) {
  state.pricelists = pricelists
}

export function CREDITCARDS (state, creditcards) {
  state.creditcards = creditcards
}

export function REPLACE_ITEMS (state, items) {
  state.QuickSale.Items = items
}

export function ADD_ITEM (state, { item }) {
  state.QuickSale.Items.unshift(item)
}

export function UPDATE_ITEM (state, { index, item }) {
  state.QuickSale.Items.splice(index, 1, {
    ...state.QuickSale.Items[index],
    ...item
  })
}

export function REMOVE_ITEM (state, { index }) {
  state.QuickSale.Items.splice(index, 1)
}

export function INVOICE (state, invoice) {
  state.QuickSale.Invoice = invoice
}

export function PAYMENT (state, payment) {
  state.QuickSale.Invoice.Payment = payment
}
