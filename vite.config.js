import { VitePWA } from 'vite-plugin-pwa'
import copy from 'rollup-plugin-copy'

export default {
  build: {
    chunkSizeWarningLimit: 5000
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate'
      // base: './'
      // manifest: {
      //   // content of manifest
      // },
      // workbox: {
      //   // workbox options for generateSW
      //   swDest: './dist/sw.js',
      //   globDirectory: './dist',
      //   skipWaiting: true
      // }
    }),
    copy({
      targets: [{ src: './static/*', dest: './dist' }],
      verbose: true,
      hook: 'writeBundle',
      copyOnce: true
    })
  ]
}
