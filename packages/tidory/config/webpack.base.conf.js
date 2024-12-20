require('dotenv').config()

const wd = process.cwd()

const { VueLoaderPlugin } = require('vue-loader')
const path = require('path')
const Dotenv = require('dotenv-webpack')
const webpack = require('webpack')
const WebpackBar = require('webpackbar')
const TidoryWebpackPlugin = require('tidory-webpack-plugin')

const tidoryConfig = require('../tidory.config')

module.exports = async env => {
  const fileLoaderConfig = {
    loader: require.resolve('file-loader'),
    options: {
      publicPath: env.production
        ? tidoryConfig.build.public_path || await require('../lib/public-path')(tidoryConfig)
        : '/'
    }
  }
  const webpackBaseConfig = {
    entry: {
      app: path.resolve(wd, tidoryConfig.path.entry)
    },
    resolve: {
      alias: {
        svelte: path.resolve('node_modules', 'svelte'),
        vue: path.resolve(wd, 'node_modules', 'vue/dist/vue.esm-bundler.js')
      },
      extensions: ['.mjs', '.js', '.svelte'],
      mainFields: ['svelte', 'browser', 'module', 'main']
    },
    stats: 'errors-only',
    module: {
      rules: [
        {
          test: /.(png|jpe?g|gif|svg)(\?.*)?$/,
          ...fileLoaderConfig
        },
        {
          test: /.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
          ...fileLoaderConfig
        },
        {
          test: /.(woff2?|eot|ttf|otf)(\?.*)?$/,
          ...fileLoaderConfig
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: require.resolve('vue-style-loader')
            },
            {
              loader: require.resolve('style-loader'),
              options: {
                esModule: false
              }
            },
            {
              loader: require.resolve('css-loader')
            },
            {
              loader: require.resolve('postcss-loader')
            }
          ]
        },
        {
          test: /\.pug$/,
          use: [
            {
              loader: require.resolve('raw-loader')
            },
            {
              loader: require.resolve('pug-plain-loader'),
              options: {
                doctype: 'html',
                basedir: wd,
                plugins: [
                  require('../lib/alias-pug-plugin')(Object.assign(tidoryConfig.alias || {},
                    {
                      '@tidory': require('../lib/@tidory')
                    }
                  ))
                ],
                filters: {
                  postcss: require('../lib/postcss-pug-filter')
                }
              }
            }
          ]
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules(?!(\/|\\)@tidory)/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                presets: ['@babel/preset-react'].map(require.resolve)
              }
            },
            {
              loader: require.resolve('astroturf/loader')
            }
          ]
        },
        {
          test: /\.vue$/,
          use: {
            loader: require.resolve('vue-loader'),
            options: {
              loaders: {
                js: require.resolve('babel-loader')
              }
            }
          }
        },
        {
          test: /\.svelte$/,
          use: {
            loader: require.resolve('svelte-loader'),
            options: {
              compilerOptions: {
                dev: !env.production
              },
              hotReload: !env.production
            }
          }
        },
        {
          test: /node_modules\/svelte\/.*\.mjs$/,
          resolve: {
            fullySpecified: false
          }
        }
      ]
    },
    plugins: [
      new WebpackBar({ name: 'tidory', color: 'green', reporters: ['fancy'] }),
      new Dotenv(),
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: true, __VUE_PROD_DEVTOOLS__: false
      }),
      new TidoryWebpackPlugin(env, tidoryConfig)
    ]
  }
  if (tidoryConfig.extends && typeof tidoryConfig.extends === 'function') {
    tidoryConfig.extends(webpackBaseConfig)
  }

  return webpackBaseConfig
}
