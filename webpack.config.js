const path = require('path')
const webpack = require('webpack')

var config = {
  devtools: '#eval',
  entry: {
   forms: './ui/forms.js'
 },
 output: {
     path: path.resolve(__dirname, 'public/js'),
     filename: '[name].js'
 },
  resolve: ['', '.js', '.jsx'],
  module: {
        loaders: [{
            test: /.jsx?$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
                presets: ['es2015', 'react']
            }
        }]
    },
  // plugins: [
  //   new webpack.DefinePlugin({
  //     'process.env': {
  //       'NODE_ENV': JSON.stringify('production')
  //     }
  //   })
  // ]
}

module.exports = config
