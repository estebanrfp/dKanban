const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')

const CopyPlugin = require('copy-webpack-plugin')
const { GenerateSW } = require('workbox-webpack-plugin')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// const autoprefixer = require('autoprefixer')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const developmentPlugins = []
const productionPlugins = [
  new CompressionPlugin({
    filename: '[path][base].gz',
    algorithm: 'gzip',
    test: /\.js$|\.css$|\.html$/,
    threshold: 10240,
    minRatio: 0.8
    // deleteOriginalAssets: true
  }),
  new CompressionPlugin({
    filename: '[path][base].br',
    algorithm: 'brotliCompress',
    test: /\.(js|css|html|svg)$/,
    // compressionOptions: {
    //   params: {
    //     [zlib.constants.BROTLI_PARAM_QUALITY]: 11
    //   }
    // },
    threshold: 10240,
    minRatio: 0.8
  }),
  new OptimizeCSSAssetsPlugin({
    cssProcessorOptions: {
      safe: true,
      discardComments: {
        removeAll: true
      }
    }
  })
]

module.exports = (env, { mode }) => ({
  // entry: path.resolve(__dirname, './lib/index.ts'),
  entry: path.resolve(__dirname, 'lib', 'index.ts'),
  output: {
    filename: '[name].[contenthash].js',
    publicPath: '/'
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
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
          'css-loader?importLoaders=true'
        ]
      },
      {
        test: /\.html$/,
        use: ['html-loader']
      }
    ]
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css']
  },
  plugins: [
    ...(mode === 'production' ? productionPlugins : developmentPlugins),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html')
    }),
    new CopyPlugin({
      patterns: [
        {
          from: '**/*',
          to: path.resolve(__dirname, 'dist'),
          context: path.resolve(__dirname, 'static')
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].css'
    }),
    new GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      sourcemap: true,
      navigateFallback: '/index.html'
    })
  ].filter(Boolean)
})
