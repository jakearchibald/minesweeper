const path = require('path');
const util = require('util');

const { RawSource } = require('webpack-sources');
const ejs = require('ejs');
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
        debugger;
        const output = await renderFile(this.templatePath, stats);
        compilation.assets[this.outputName] = new RawSource(output);
      });
    });
  }
}

module.exports = {
  mode: 'development',
  devtool: '',
  entry: {
    main: './src/script/entry1.ts',
    sub: './src/script/entry2.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 0
    },
    runtimeChunk: 'single'
  },
  plugins: [
    new HTMLRender(path.resolve(__dirname, 'src', 'index.ejs'), 'index.html'),
  ]
};
