import { defineConfig } from 'umi';
import routes from './routes';
import metas, { PROJECT_NAME, IS_PROD } from './metas';
import path from 'path';

const resolvePackage = (relativePath: string) => path.join(__dirname, relativePath);
const CompressionPlugin = require('compression-webpack-plugin');
const productionGzipExtensions = /\.(js|html|css|json)(\?.*)/i;
const extraBabelIncludes = [resolvePackage('../node_modules/@walletconnect'), resolvePackage('../node_modules/unstorage')];

export default defineConfig({
  extraPostCSSPlugins: [require('autoprefixer')],
  // extraBabelPlugins: [IS_PROD ? 'transform-remove-console' : ''],
  chunks: ['umi', 'vendors', 'commons', 'web3', 'commonUtils'],
  // devtool: 'source-map',
  chainWebpack(config) {
    config.plugins.delete('friendly-error');
    config.plugins.delete('case-sensitive-paths');

    config.merge({
      optimization: {
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 30000,
          automaticNameDelimiter: '.',
          name: true,
          minChunks: 1,
          cacheGroups: {
            web3: {
              name: 'web3',
              test: /[\\/]node_modules[\\/](web3|react-dom|@walletconnect|@particle-network)[\\/]/,
              priority: 18,
              enforce: true
            },
            commonUtils: {
              name: 'commonUtils',
              test: /(sdm-js-sdk|web3-utils|antd|antd-mobile|react|react-is|react-router|react-router-dom|redux-saga|react-redux|redux|react-helmet|react-popper|react-window|lodash|query-string|qs|md5|md5.js|postmate|ahooks|sha.js|hash.js|events|asn1.js|des.js|@ant-design|rc-menu|rc-util|rc-motion|rc-align|rc-field-form|rc-tooltip|rc-dropdown|rc-resize-observer|rc-notification|rc-overflow|rc-select|rc-trigger)/,
              priority: 19,
              enforce: true
            },
            commons: {
              name: 'commons',
              test: /(@ethersproject|browserify-aes|js-sha3|whatwg-fetch|core-js|keccak|dva|ethjs-unit|elliptic|bn.js|bignumber.js|number-to-bn|axios|steam-browerify|vconsole)/,
              priority: 10,
              enforce: true
            },
            vendors: {
              name: 'vendors',
              test({ resource }: any) {
                return /[\\/]node_modules[\\/]/.test(resource);
              },
              chunks: 'async',
              priority: -11,
              enforce: true
            }
          }
        }
      }
    });
    config.plugin('compression-webpack-plugin').use(
      new CompressionPlugin({
        algorithm: 'gzip',
        test: productionGzipExtensions,
        threshold: 10240,
        minRatio: 0.8,
        deleteOriginalAssets: false
      })
    );
    config.module
      .rule('mjs')
      .test(/\.mjs$/)
      .type('javascript/auto');
    config.module.rules.get('js-in-node_modules').include.add(extraBabelIncludes);
  },
  base: '/',
  publicPath: './',
  dynamicImport: {
    loading: '@/components/router-loading'
  },
  dva: {
    immer: false,
    hmr: false,
    lazyLoad: true
  },
  hash: true,
  title: PROJECT_NAME,
  // locale: {
  //   default: 'en-US',
  //   baseNavigator: false
  // },
  antd: {
    // dark: true,
    compact: true
  },
  nodeModulesTransform: {
    type: 'none'
  },
  // theme: {
  //   'primary-color': '#fff',
  //   'body-background': '#303136'
  // },
  proxy: {
    '/user': {
      changeOrigin: true,
      target: 'https://red3.web3-tp.net'
    },
    '/transfer': {
      changeOrigin: true,
      target: 'https://transfer.web3-tp.net'
    },
    '/spending': {
      changeOrigin: true,
      target: 'https://red3.web3-tp.net'
    },
    '/token': {
      changeOrigin: true,
      target: 'https://red3.web3-tp.net'
    },
    '/spdnft': {
      changeOrigin: true,
      target: 'https://red3.web3-tp.net'
    },
    '/transtoken': {
      changeOrigin: true,
      target: 'https://vault.web3-tp.net'
    }
  },
  metas,
  routes,
  fastRefresh: {},
});
