const path = require("path");
const resolve = require("path").resolve;
const WarningsToErrorsPlugin = require("warnings-to-errors-webpack-plugin");

module.exports = {
  entry: "./Assets/Scripts/App",
  plugins: [new WarningsToErrorsPlugin()],
  output: {
    path: path.resolve(__dirname, "wwwroot/js"),
    filename: "App.js",
  },
  devtool: "inline-source-map",
  optimization: {
    minimize: false,
  },
  stats: {
    errorDetails: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  module: {
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
      {
        test: /environment\.ts?$/,
        loader: "file-replace-loader",
        options: {
          condition: 'if-replacement-exists',
          replacement: resolve("./Scripts/environments/environment.prod.ts"),
          async: true,
        },
      },
      {
        test: /\.module\.scss$/,
        use: [
          "style-loader",
          {
            loader: "@teamsupercell/typings-for-css-modules-loader",
            options: {
              disableLocalsExport: true,
            },
          },
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
          "sass-loader",
        ],
      },
    ],
  },
  performance: {
    maxAssetSize: 4000000,
    maxEntrypointSize: 4000000,
  },
};
