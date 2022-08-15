const fs = require('fs');
const path = require("path");
const {confPath} = require("./env");

/**
 * 配置文件夹初始化
 */
exports.init = () => {
    //创建配置文件夹
    if (!fs.existsSync(confPath)) {
        fs.mkdirSync(confPath);
    }
};