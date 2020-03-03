import axios from 'axios'
import { Notify } from 'quasar'
import store from 'src/store'

const api = axios.create({
  baseURL: `http://${process.env.DEV ? '192.168.0.202' : 'gpos.guembe.ti'}:4040/graphql`,
  timeout: 1000 * 60 * 5, // 5 minutes
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

async function gql ({ query = '', variables = {} }) {
  try {
    const response = await api.post('', { query, variables })
    const { data: { errors, data } } = response

    if (errors) throw new GraphQLError({ query, variables, errors })

    return data
  } catch (error) {
    if (error.response && error.response.data && error.response.data.errors) {
      throw new GraphQLError({ query, variables, errors: error.response.data.errors })
    } else {
      throw error
    }
  }
}

gql.handleError = function handleError (error) {
  if (error instanceof GraphQLError) {
    error.display()
  } else {
    api.handleError(error)
  }
}

export { GraphQLError, gql, api }

export default gql
