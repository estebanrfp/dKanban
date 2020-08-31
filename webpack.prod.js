const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const CopyPlugin = require('copy-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const BrotliPlugin = require('brotli-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const HtmlWebpackPlugin = require('html-webpack-plugin')

const merge = require('webpack-merge')
const TerserPlugin = require('terser-webpack-plugin')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    path: `${ __dirname }/dist`,
    filename: '[name].[hash].js',
    publicPath: './',
    chunkFilename: '[name].[hash].js'
  },
  optimization: {
    nodeEnv: 'production',
    minimize: true,
    runtimeChunk: true,
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'commons',
          chunks: 'all'
        }
      }
    },
    minimizer: [
      compiler => {
        new TerserPlugin({
          sourceMap: true,
          terserOptions: {
            compress: {
              drop_console: true
            }
          }
        }).apply(compiler)
      },
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
      options: {
        postcss: [
          autoprefixer()
        ]
      }
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[name].[hash].css'
    }),
    new CopyPlugin([{
      context: `${ __dirname }/static`,
      from: '**/*',
      to: `${ __dirname }/dist`
    }]),
    // new CopyPlugin(
    //   {
    //     patterns: [
    //       { from: 'static', to: 'dist' }
    //     ]
    //   }
    // ),
    // new CopyPlugin({
    //   patterns: [
    //     {
    //       context: `${ __dirname }/static`,
    //       from: '**/*',
    //       to: `${ __dirname }/dist`
    //     }
    //   ]
    // }),
    new ManifestPlugin({ fileName: 'manifest.json' }),
    new HtmlWebpackPlugin({
      title: 'gun.eco',
      template: 'src/index.html',
      filename: 'index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true
      }
    }),
    new CompressionPlugin({
      test: /\.js$|\.css$|\.html$|\.eot?.+$|\.ttf?.+$|\.woff?.+$|\.svg?.+$/,
      algorithm: 'gzip',
      threshold: 10240,
      minRatio: 0.8
    }),
    new BrotliPlugin({
      asset: '[path].br[query]',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8
    })
  ]
})
