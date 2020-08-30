const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OfflinePlugin = require('offline-plugin')

module.exports = {
  entry: './lib/index.ts',
  plugins: [
    new OfflinePlugin({
      caches: 'all',
      excludes: ['**/*.map'],
      autoUpdate: true,
      ServiceWorker: {
        events: true
      },
      AppCache: {
        events: true
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(css|styl)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader?importLoaders=true',
          'postcss-loader',
          'stylus-loader'
        ]
      },
      {
        test: /\.html$/,
        use: ['html-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
}
