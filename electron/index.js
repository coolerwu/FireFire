const {init: initSettingFileOperation} = require('./settingFile');
const {init: initNotebookFileOperation} = require('./notebookFile');
const {init: initRootFileOperation} = require('./rootFile');

/**
 * 文件操作函数初始化
 */
const initFileOperation = () => {
    initRootFileOperation();
    initSettingFileOperation();
    initNotebookFileOperation();
}

exports.init = () => {
    //文件操作函数初始化
    initFileOperation();
};