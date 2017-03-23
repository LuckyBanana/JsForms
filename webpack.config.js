// const path = require('path')
// const webpack = require('webpack')
//
// var config = {
//   devtool: '#eval',
//   entry: {
//    forms: './ui/forms.js'
//  },
//  output: {
//      path: path.resolve(__dirname, 'public/js'),
//      filename: '[name].js'
//  },
//  resolve: {
//    extensions: ['.js', '.jsx'],
//  },
//   module: {
//         loaders: [{
//             test: /.jsx?$/,
//             loader: 'babel-loader',
//             exclude: /node_modules/,
//             query: {
//                 presets: ['es2015', 'react']
//             }
//         }]
//     },
//   // plugins: [
//   //   new webpack.DefinePlugin({
//   //     'process.env': {
//   //       'NODE_ENV': JSON.stringify('production')
//   //     }
//   //   })
//   // ]
// }

// module.exports = config


const path = require('path')
const webpack = require('webpack')
// const CompressionPlugin = require("compression-webpack-plugin");
// var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var config = {
  // devtool: 'cheap-module-source-map',
  devtool: '#eval',
  entry: [path.resolve(__dirname, 'ui/forms.js')],
  output: {
      path: path.resolve(__dirname, 'public/js'),
      filename: 'forms.js'
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
        loaders: [{
            test: /.jsx?$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
                presets: ['es2015', 'react'],
                // plugins: ["transform-decorators-legacy"]
            }
        }]
    },
  plugins: [
    // new webpack.DefinePlugin({
    //   'process.env': {
    //     'NODE_ENV': JSON.stringify('production')
    //   }
    // }),
    // new webpack.DefinePlugin({
    //   'process.env.NODE_ENV': '"production"'
    // }),
    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: true,
    //   compress:{
    //     warnings: false
    //   }
    // }),
    // new CompressionPlugin({
    //   asset: "[path].gz[query]",
    //   algorithm: "gzip",
    //   test: /\.js$|\.css$|\.html$/,
    //   threshold: 10240,
    //   minRatio: 0
    // }),
  ]
}

module.exports = config
