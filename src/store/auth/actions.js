import gql from 'src/gql'
import { date } from 'quasar'
const { subtractFromDate } = date

function getRefreshDelay (token) {
  const body = token.split('.')[1]

  const payload = JSON.parse(atob(body))

  return (subtractFromDate(new Date(payload.exp * 1000), { minutes: 3 }).getTime() - new Date().getTime())
}
export async function LOGIN ({ commit, dispatch }, { EmployeeID, Password }) {
  const query = /* GraphQL */`
    query Login ($Credentials: CredentialsInput!) {
      auth: session_login (Credentials: $Credentials) {
        token
        session {
          EmployeeID
          SalesEmployeeCode
          SalesEmployeeName
          Roles
        }
      }
    }
  `
  const variables = {
    Credentials: {
      EmployeeID,
      Password
    }
  }

  const { auth } = await gql({ query, variables })

  commit('AUTH', auth)
  dispatch('SCHEDULE_REFRESH')
}

export async function REFRESH_TOKEN ({ commit, dispatch }) {
  const query = /* GraphQL */`
    query {
      auth: session_refresh {
        token
        session {
          EmployeeID
          SalesEmployeeCode
          SalesEmployeeName
          Roles
        }
      }
    }
  `

  const { auth } = await gql({ query })

  commit('AUTH', auth)

  dispatch('SCHEDULE_REFRESH')
}

export async function SCHEDULE_REFRESH ({ commit, dispatch, state }) {
  const delay = getRefreshDelay(state.token)

  const task = setTimeout(async () => {
    try {
      await dispatch('REFRESH_TOKEN')
    } catch (err1) {
      gql.handleError(err1)
      try {
        await dispatch('REFRESH_TOKEN')
      } catch (err2) {
        gql.handleError(err2)
      }
    }
  }, delay)

  commit('REFRESH_TOKEN_TASK', task)
}

export async function LOGOUT ({ commit, state }) {
  const query = /* GraphQL */`
    query {
      session_logout
    }
  `
  try {
    await gql({ query })
  } catch (error) {
    throw error
  } finally {
    commit('AUTH')

    clearTimeout(state.refreshTokenTask)
    commit('REFRESH_TOKEN_TASK')
  }
}

export async function CHANGE_PASSWORD (ctx, { Credentials, NewPassword }) {
  const query = /* GraphQL */`
    mutation ($Credentials: CredentialsInput!, $NewPassword: String!) {
      success: password_change (Credentials: $Credentials, NewPassword: $NewPassword)
    }
  `
  // credentials must have EmployeeID, Password properties
  const variables = {
    Credentials,
    NewPassword
  }

  const { success } = await gql({ query, variables })

  return success
}
export async function RESET_PASSWORD (ctx, { SAPB1Credentials, EmployeeID, NewPassword }) {
  const query = /* GraphQL */`
    mutation ($SAPB1Credentials: SAPB1CredentialsInput!, $EmployeeID: Int!, $NewPassword: String!) {
      success: password_reset (SAPB1Credentials: $SAPB1Credentials, EmployeeID: $EmployeeID, NewPassword: $NewPassword)
    }
  `
  const variables = {
    SAPB1Credentials,
    EmployeeID,
    NewPassword
  }

  const { success } = await gql({ query, variables })

  return success
}
