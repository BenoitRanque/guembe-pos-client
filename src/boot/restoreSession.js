import { GraphQLError } from '../gql'

export default async ({ store }) => {
  try {
    await store.dispatch('auth/REFRESH_TOKEN')
  } catch (error) {
    if (error instanceof GraphQLError) {
      // do nothing. user is not logged in
    } else {
      throw error
    }
  }
}
