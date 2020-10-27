import store from 'src/store'

export function formatPrice (price) {
  // return `${price} BS`
  return `${price.toFixed(2)} BS`
}
function getPriceListName (PriceLists, PriceListNum) {
  const PriceList = PriceLists.find(PriceList => PriceList.PriceListNo === PriceListNum)
  return PriceList.PriceListName
}

export function itemSubTotal (price, quantity) {
  return ((price * 100) * quantity) / 100
}

export function getPrimaryPrice (ItemPrices, BusinessPartnerPriceList) {
  const BusinessPartnerPrice = ItemPrices.find(ItemPrice => ItemPrice.PriceList === BusinessPartnerPriceList)

  if (BusinessPartnerPrice && BusinessPartnerPrice.Price !== 0) {
    return {
      PriceList: BusinessPartnerPrice.PriceList,
      PriceListName: getPriceListName(store.state.config.PriceLists, BusinessPartnerPrice.PriceList),
      Price: BusinessPartnerPrice.Price
    }
  }

  const DefaultPrice = ItemPrices.find(ItemPrice => ItemPrice.PriceList === 1)

  if (DefaultPrice && DefaultPrice.Price !== 0) {
    return {
      PriceList: DefaultPrice.PriceList,
      PriceListName: getPriceListName(store.state.config.PriceLists, DefaultPrice.PriceList),
      Price: DefaultPrice.Price
    }
  }

  return null
}

export function getSecondaryPrice (ItemPrices, PrimaryPrice) {
  if (!PrimaryPrice || PrimaryPrice.PriceList === 1) return null
  const DefaultPrice = ItemPrices.find(ItemPrice => ItemPrice.PriceList === 1)

  if (DefaultPrice && DefaultPrice.Price !== 0 && DefaultPrice.Price !== PrimaryPrice.Price) {
    return {
      PriceList: DefaultPrice.PriceList,
      PriceListName: getPriceListName(store.state.config.PriceLists, DefaultPrice.PriceList),
      Price: DefaultPrice.Price
    }
  }

  return null
}

const datePattern = /(\d{4})-([0-1]\d)-([0-3]\d)/

export function validateDate (date) {
  if (!datePattern.test(date)) {
    throw new Error(`Could not validate date, expected yyyy-mm-dd, got '${date}'`)
  }

  return date
}

export function parseDate (date) {
  validateDate(date)

  const [ , year, month, day ] = date.match(datePattern)

  return new Date(Number(year), Number(month) - 1, Number(day))
}

export function displayDate (date) {
  validateDate(date)

  const [ , year, month, day ] = date.match(datePattern)

  return `${day}/${month}/${year}`
}

// handle print output from graphql queries
export function handleSalePrint (Print, Test) {
  if (Print) {
    if (Print.Orders) {
      Print.Orders.forEach(Order => {
        print({
          template: 'order',
          preview: Test,
          test: Test,
          printOptions: {
            silent: true,
            deviceName: Order.Printer,
            printBackground: true,
            margins: {
              marginType: 'none'
            }
          },
          data: Order
        })
      })
    }
    if (Print.Invoices) {
      Print.Invoices.forEach(Invoice => {
        print({
          template: 'invoice',
          preview: Test,
          test: Test,
          printOptions: {
            silent: true,
            deviceName: 'Facturas',
            printBackground: true,
            margins: {
              marginType: 'none'
            }
          },
          copy: false,
          data: Invoice
        })
        print({
          template: 'invoice',
          preview: Test,
          test: Test,
          printOptions: {
            silent: true,
            deviceName: 'Facturas',
            printBackground: true,
            margins: {
              marginType: 'none'
            }
          },
          copy: true,
          data: Invoice
        })
      })
    }
  }
}
