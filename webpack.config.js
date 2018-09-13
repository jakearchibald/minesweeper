const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/script/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'null.js'
  },
  module: {
    rules: [
      {
        test: /index\.html$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'index.html'
            }
          },
          'extract-loader',
          {
            loader: 'html-loader',
            options: {
              interpolate: true
            }
          }
        ],
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
