import axios from 'axios'
import { Notify } from 'quasar'
import store from 'src/store'

const api = axios.create({
  baseURL: `http://${process.env.DEV ? '192.168.0.202' : 'app.guembe.ti'}:6060/v1/graphql`,
  timeout: 30000,
  withCredentials: true
})

api.handleError = function handleError (error) {
  if (error.response && error.response.data) {
    Notify.create({
      message: error.response.data,
      color: 'negative',
      icon: 'mdi-alert-octagon'
    })
  } else {
    Notify.create({
      message: error.message,
      color: 'negative',
      icon: 'mdi-alert-octagon'
    })
  }
  throw error
}

api.interceptors.request.use(async request => {
  const token = store.state.auth.token

  if (token) {
    request.headers['Authorization'] = `Bearer ${token}`
  }

  return request
}, async error => Promise.reject(error))

class GraphQLError {
  constructor ({ query, variables, errors }) {
    this.query = query
    this.variables = variables
    this.errors = errors
  }

  display () {
    this.errors.forEach(({ message }) => {
      Notify.create({
        message,
        color: 'negative',
        icon: 'mdi-alert-octagon'
      })
    })
  }
}

async function gql ({ query = '', variables = {}, role = 'anonymous' }) {
  const { data: { errors, data } } = await api.post('', { query, variables }, {
    headers: {
      'X-HASURA-ROLE': role
    }
  })

  if (errors) throw new GraphQLError({ query, variables, errors })

  return data
}

gql.handleError = function handleError (error) {
  if (error instanceof GraphQLError) {
    error.display()
  } else {
    api.handleError(error)
  }
}

export { GraphQLError }

export default gql
