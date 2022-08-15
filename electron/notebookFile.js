const fs = require('fs');
const {ipcMain} = require("electron");
const {getCurSettingConfig} = require("./settingFile");

/**
 * 获取当前notebook完整path
 */
const getCurNotebookFullPath = () => {
    return getCurSettingConfig().notebookPath;
}

/**
 * 获取当前notebook后缀
 */
const getCurNotebookSuffix = () => {
    return getCurSettingConfig().notebookSuffix;
}

/**
 * 当前cwjson文件列表缓存
 */
let cwjsonFileMap = {};

/**
 * 文件初始化
 */
exports.init = () => {
    ipcMain.handle('readNotebookFileList', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();
        if (!fs.existsSync(curNotebookFullPath)) {
            fs.mkdirSync(curNotebookFullPath);
        }

        const fileList = fs.readdirSync(curNotebookFullPath)
        if (fileList) {
            return fileList.filter(file => file.endsWith(curNotebookSuffix)).map(file => {
                const cwjsonFile = {
                    filename: file,
                    id: file.substring(0, file.lastIndexOf(curNotebookSuffix)),
                };
                cwjsonFileMap[cwjsonFile.id] = cwjsonFile;
                return cwjsonFile;
            });
        } else {
            cwjsonFileMap = {};
            return [];
        }
    });
    ipcMain.handle('readNotebookFile', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        if (!fs.existsSync(curNotebookFullPath)) {
            fs.mkdirSync(curNotebookFullPath);
        }

        const fileList = fs.readdirSync(curNotebookFullPath)
        console.log(fileList);
    });
    ipcMain.handle('writeNotebookFile', (event, absPath, content) => {

    });
};