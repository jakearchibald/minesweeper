const path = require('path');
const util = require('util');

const webpack = require('webpack');
const { RawSource } = require('webpack-sources');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ejs = require('ejs');

const devMode = process.env.NODE_ENV !== 'production';
const renderFile = util.promisify(ejs.renderFile);

class HTMLRender {
  constructor(templatePath, outputName) {
    this.templatePath = templatePath;
    this.outputName = outputName;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('HTMLRender', (compilation) => {
      compilation.hooks.optimizeAssets.tapPromise('HTMLRender', async () => {
        const stats = compilation.getStats().toJson();
        if (!stats.entrypoints.main) return;
        const output = await renderFile(this.templatePath, stats);
        compilation.assets[this.outputName] = new RawSource(output);
      });
    });
  }
}

module.exports = {
  mode: devMode ? 'development' : 'production',
  devtool: '',
  entry: {
    main: './src/script/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: devMode ? 'script/[name].[hash].js' : 'script/[name].[contenthash].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          devMode ? 'style-loader' : {
            loader: MiniCssExtractPlugin.loader,
            options: {}
          },
          {
            loader: 'typings-for-css-modules-loader',
            options: {
              namedExport: true,
              modules: true,
              localIdentName: '[local]--[hash:base64:5]'
            }
          },
        ]
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  optimization: {
    splitChunks: {},
    //runtimeChunk: 'single',
  },
  plugins: [
    new webpack.WatchIgnorePlugin([
      /css\.d\.ts$/
    ]),
    new MiniCssExtractPlugin({
      filename: "style/[name].[contenthash].css",
      chunkFilename: "[id].css"
    }),
    new HTMLRender(path.resolve(__dirname, 'src', 'index.ejs'), 'index.html'),
    devMode && new webpack.HotModuleReplacementPlugin(),
  ].filter(p => p),
  devServer: {
    contentBase: './dist',
    hot: true
  },
};
