/*
 * Obetnción del literal de un valor numérico en Bolivianos
 *
 */

function getUnits (num) {
  switch (num) {
    case 1: return 'UN'
    case 2: return 'DOS'
    case 3: return 'TRES'
    case 4: return 'CUATRO'
    case 5: return 'CINCO'
    case 6: return 'SEIS'
    case 7: return 'SIETE'
    case 8: return 'OCHO'
    case 9: return 'NUEVE'
  }

  return ''
}

function getTensAndUnits (num) {
  var decena = Math.floor(num / 10)
  var unidad = num - (decena * 10)

  switch (decena) {
    case 1:
      switch (unidad) {
        case 0: return 'DIEZ'
        case 1: return 'ONCE'
        case 2: return 'DOCE'
        case 3: return 'TRECE'
        case 4: return 'CATORCE'
        case 5: return 'QUINCE'
        default: return 'DIECI' + getUnits(unidad)
      }
    case 2:
      switch (unidad) {
        case 0: return 'VEINTE'
        default: return 'VEINTI' + getUnits(unidad)
      }
    case 3: return getTensAndUnitsGreaterThanTwenty('TREINTA', unidad)
    case 4: return getTensAndUnitsGreaterThanTwenty('CUARENTA', unidad)
    case 5: return getTensAndUnitsGreaterThanTwenty('CINCUENTA', unidad)
    case 6: return getTensAndUnitsGreaterThanTwenty('SESENTA', unidad)
    case 7: return getTensAndUnitsGreaterThanTwenty('SETENTA', unidad)
    case 8: return getTensAndUnitsGreaterThanTwenty('OCHENTA', unidad)
    case 9: return getTensAndUnitsGreaterThanTwenty('NOVENTA', unidad)
    case 0: return getUnits(unidad)
  }
}

function getTensAndUnitsGreaterThanTwenty (strSin, numUnidades) {
  if (numUnidades > 0) { return strSin + ' Y ' + getUnits(numUnidades) }

  return strSin
}

function getHoundreds (num) {
  var centenas = Math.floor(num / 100)
  var decenas = num - (centenas * 100)

  switch (centenas) {
    case 1:
      if (decenas > 0) { return 'CIENTO ' + getTensAndUnits(decenas) }
      return 'CIEN'
    case 2: return 'DOSCIENTOS ' + getTensAndUnits(decenas)
    case 3: return 'TRESCIENTOS ' + getTensAndUnits(decenas)
    case 4: return 'CUATROCIENTOS ' + getTensAndUnits(decenas)
    case 5: return 'QUINIENTOS ' + getTensAndUnits(decenas)
    case 6: return 'SEISCIENTOS ' + getTensAndUnits(decenas)
    case 7: return 'SETECIENTOS ' + getTensAndUnits(decenas)
    case 8: return 'OCHOCIENTOS ' + getTensAndUnits(decenas)
    case 9: return 'NOVECIENTOS ' + getTensAndUnits(decenas)
  }

  return getTensAndUnits(decenas)
}

function getSection (num, divisor, strSingular, strPlural) {
  var cientos = Math.floor(num / divisor)
  var resto = num - (cientos * divisor)

  var letras = ''

  if (cientos > 0) {
    if (cientos > 1) { letras = getHoundreds(cientos) + ' ' + strPlural } else { letras = strSingular }
  }

  if (resto > 0) { letras += '' }

  return letras
}

function getThousands (num) {
  var divisor = 1000
  var cientos = Math.floor(num / divisor)
  var resto = num - (cientos * divisor)

  var strMiles = getSection(num, divisor, 'UN MIL', 'MIL')
  var strCentenas = getHoundreds(resto)

  if (strMiles === '') { return strCentenas }

  return strMiles + ' ' + strCentenas
}

function getMillions (num) {
  var divisor = 1000000
  var cientos = Math.floor(num / divisor)
  var resto = num - (cientos * divisor)

  var strMillones = getSection(num, divisor, 'UN MILLON', 'MILLONES')
  var strMiles = getThousands(resto)

  if (strMillones === '') { return strMiles }

  return strMillones + ' ' + strMiles
}

// this is a rewrite of the below function
function concatWithSpaces (...args) {
  return args.filter(a => !!a).join(' ')
}

// this function rewriten above
// function concatWithSpaces (/* any number of arguments */) {
//   // concatenates as a string all the arguments that have some defined value

//   var r = ''

//   for (let i = 0; i < arguments.length; i++) {
//     if (arguments[i] === undefined) { continue }

//     if (arguments[i] === '') { continue }

//     if (r !== '') { r += ' ' }

//     r += arguments[i]
//   }
//   return r
// }

function centavosToString (centavos) {
  var result = ''

  if (centavos < 10) { result += '0' }

  result += centavos + '/100'

  return result
}

function toBolivianos (num) {
  var data = {
    numero: num,
    enteros: Math.floor(num),
    centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
    letrasCentavos: '',
    letrasMonedaPlural: 'Bolivianos',
    letrasMonedaSingular: 'Boliviano'
  }

  if (data.numero < 0) { throw new Error('toBolivianos does not accept negative numbers') }

  // if (data.centavos > 0)  ALWAYS SHOW CENTS
  data.letrasCentavos = 'CON ' + centavosToString(data.centavos)

  if (data.enteros === 0) { return concatWithSpaces('CERO', data.letrasMonedaPlural, data.letrasCentavos) } else if (data.enteros === 1) { return concatWithSpaces(getMillions(data.enteros), data.letrasCentavos, data.letrasMonedaSingular) } else { return concatWithSpaces(getMillions(data.enteros), data.letrasCentavos, data.letrasMonedaPlural) }
}

function testNumericalToLiteral (numericValue, expectedLiteral) {
  var literal = toBolivianos(numericValue)

  if (literal !== expectedLiteral) { console.log('Fail (expected: ' + expectedLiteral + ' result: ' + literal + ')') }
}

/*
//  TEST concatWithSpaces

console.log(concatWithSpaces() == '');
console.log(concatWithSpaces('1') == '1');
console.log(concatWithSpaces('1', '2') == '1 2');
console.log(concatWithSpaces('1', '2', '3') == '1 2 3');
console.log(concatWithSpaces('Strings with', 'any number', 'like', 23, '') == 'Strings with any number like 23');
*/

/*
// TEST testNumericalToLiteral

testNumericalToLiteral(22278.23, 'VEINTIDOS MIL DOSCIENTOS SETENTA Y OCHO CON 23/100 Bolivianos');
testNumericalToLiteral(0, 'CERO Bolivianos');
testNumericalToLiteral(1, 'UN Boliviano');
*/

export default toBolivianos
export {
  toBolivianos,
  testNumericalToLiteral
}
