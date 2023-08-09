const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  entry: {
    'components-bundle': './public/components.js',
    'styles-bundle': './public/style.scss'
  },
  mode: 'production',
  output: {
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /components\.js$/,
        use: {
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env'] }
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ],
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
}
