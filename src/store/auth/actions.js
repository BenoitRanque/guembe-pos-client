import gql from 'src/gql'
import { date } from 'quasar'
const { subtractFromDate } = date

function getRefreshDelay (token) {
  const body = token.split('.')[1]

  const payload = JSON.parse(atob(body))

  return (subtractFromDate(new Date(payload.exp * 1000), { minutes: 3 }).getTime() - new Date().getTime())
}
export async function LOGIN ({ commit, dispatch, rootState }, { EmployeeID, Password }) {
  const query = /* GraphQL */`
    query Login ($SalesPointID: Int! $Credentials: CredentialsInput!) {
      auth: session_login (Credentials: $Credentials SalesPointID: $SalesPointID) {
        token
        session {
          EmployeeID
          SalesPointID
          SalesEmployeeCode
          SalesEmployeeName
          Roles
        }
      }
    }
  `
  const variables = {
    SalesPointID: rootState.config.SalesPointID,
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
          SalesPointID
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
    } catch (error) {
      gql.handleError(error)
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
