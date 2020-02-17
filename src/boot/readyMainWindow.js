import { gql } from 'src/gql'
import { Loading } from 'quasar'
export default async ({ store }) => {
  const { ipcRenderer } = require('electron')
  ipcRenderer.on('READY_MAIN_WINDOW', async () => {
    store.dispatch('config/loadLocalConfig')
    try {
      Loading.show({ message: 'Cargando Configuracion' })
      await store.dispatch('config/loadSalesPointConfig')
    } catch (error) {
      gql.handleError(error)
    } finally {
      Loading.hide()
    }
  })
}
