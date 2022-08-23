const {override, fixBabelImports, addLessLoader, addWebpackAlias, adjustStyleLoaders} = require("customize-cra");
const path = require("path");

module.exports = override(
    // 针对antd 实现按需打包：根据import来打包 (使用babel-plugin-import)
    fixBabelImports("import", {
        libraryName: "antd",
        libraryDirectory: "es",
        style: true, //自动打包相关的样式 默认为 style:'css'
    }),
    addLessLoader({
        lessOptions: {
            javascriptEnabled: true,
            modifyVars: {
                '@primary-color': '#25b864',
            }
        }
    }),
    adjustStyleLoaders(({ use: [, , postcss] }) => {
        const postcssOptions = postcss.options;
        postcss.options = { postcssOptions };
    }),
    //增加路径别名的处理
    addWebpackAlias({
        '@': path.resolve('./src'),
        assets: path.resolve(__dirname, './src/assets'),
        components: path.resolve(__dirname, './src/components'),
        pages: path.resolve(__dirname, './src/pages'),
        common: path.resolve(__dirname, './src/common'),
        utils: path.resolve(__dirname, './src/utils'),
    })
);