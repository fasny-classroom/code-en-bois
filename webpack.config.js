
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: 'auto',
  },
  devServer: {
    static: [
      { directory: path.resolve(__dirname, 'build') },
      { directory: path.resolve(__dirname, 'conf'), publicPath: '/conf' },
    ],
    allowedHosts: 'all',
  },
  module: {
    rules: [
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html' }),
    new CopyWebpackPlugin({ patterns: [{ from: 'conf', to: 'conf' }] }),
  ],
};

module.exports = (env, argv) => config;
