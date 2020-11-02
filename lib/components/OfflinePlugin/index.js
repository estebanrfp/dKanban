import * as OfflinePluginRuntime from 'offline-plugin/runtime'
import createAlert from '../Alerts'

const OfflinePlugin = () => OfflinePluginRuntime.install({
  onUpdating: () => {
    console.log('SW Event:', 'onUpdating')
  },
  onUpdateReady: () => {
    console.log('SW Event:', 'onUpdateReady')
    OfflinePluginRuntime.applyUpdate()
  },
  onUpdated: () => {
    console.log('SW Event:', 'onUpdated')
    // window.location.reload()
    createAlert('', 'New update', `Refresh your browser !
    <span class="actions">
      <input type="button" value="refresh" onClick="location.reload();">
    </span>
    `, 'info', true, false)
  },
  onUpdateFailed: () => {
    console.log('SW Event:', 'onUpdateFailed')
  }
})

export default OfflinePlugin
