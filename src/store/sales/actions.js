import gql from 'src/gql'

export async function REFRESH_CATALOG ({ commit, rootState, rootGetters }) {
  const query = /* GraphQL */`
    query Catalog ($where: SalesPointItem_bool_exp) {
      items: SalesPointItem (where: $where) {
        ItemCode
        ItemName
        Group
        SubGroup
        WarehouseCode
        CostingCode
        CostingCode2
      }
    }
  `
  const variables = {
    where: {
      SalesPointID: {
        _eq: rootState.config.SalesPointID
      }
    }
  }

  const role = ['cajero', 'mesero'].find(rootGetters['auth/isAuthorized'])

  const { items } = await gql({ query, variables, role })

  commit('CATALOG', items)
}
