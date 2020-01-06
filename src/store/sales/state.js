export default {
  //
  catalog: [], // list of items that can be sold
  pricelists: [],
  creditcards: [],
  QuickSale: {
    Client: null,
    Items: [],
    Invoice: {
      VATExempt: false,
      Payment: null,
      PaymentGroupCode: -1, // TODO: us a configurable default value
      U_NIT: 'SIN NOMBRE',
      U_RAZSOC: '0'
    }
  }
  // sale: {
  //   client: null,
  //   items: [],
  //   invoices: [],
  //   payment: null
  // }
}
