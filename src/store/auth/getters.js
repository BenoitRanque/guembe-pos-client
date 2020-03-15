export function isAuthenticated (state) {
  return state.Employee !== null
}

export function EmployeeID (state, { isAuthenticated }) {
  if (!isAuthenticated) {
    return null
  }
  return state.Employee.EmployeeID
}

export function SalesPersonCode (state, { isAuthenticated }) {
  if (!isAuthenticated) {
    return null
  }
  return state.Employee.SalesPersonCode
}

export function SalesPersonName (state, { isAuthenticated }) {
  if (!isAuthenticated) {
    return null
  }
  return state.Employee.SalesPerson.SalesPersonName
}

export function isAuthorized (state, { isAuthenticated }) {
  return roles => {
    if (!isAuthenticated) {
      return false
    }

    if (Array.isArray(roles)) {
      return state.Employee.Roles.some(role => roles.includes(role))
    } else {
      return state.Employee.Roles.includes(roles)
    }
  }
}
