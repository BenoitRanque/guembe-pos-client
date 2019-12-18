export function isAuthenticated (state) {
  return state.session !== null
}

export function EmployeeID (state, { isAuthenticated }) {
  if (!isAuthenticated) {
    return null
  }
  return state.session.EmployeeID
}

export function SalesEmployeeCode (state, { isAuthenticated }) {
  if (!isAuthenticated) {
    return null
  }
  return state.session.SalesEmployeeCode
}

export function SalesEmployeeName (state, { isAuthenticated }) {
  if (!isAuthenticated) {
    return null
  }
  return state.session.SalesEmployeeName
}

export function isAuthorized (state, { isAuthenticated }) {
  return roles => {
    if (!isAuthenticated) {
      return false
    }

    if (Array.isArray(roles)) {
      return state.session.Roles.some(role => roles.includes(role))
    } else {
      return state.session.Roles.includes(roles)
    }
  }
}
