const {confPath} = require("./env");
const fs = require("fs");
const {ipcMain, nativeTheme} = require("electron");
const path = require("path");

/**
 * 配置文件夹名称
 */
const settingJsonName = 'setting.json';
/**
 * 配置文件夹全路径
 */
const settingFullPath = path.join(confPath, settingJsonName);
/**
 * 默认setting文件配置
 */
const defaultSettingConfig = {
    notebookPath: path.join(confPath, 'notebook'),
    notebookSuffix: '.cwjson',
    themeSource: 'system',
    autoSave: 10,
};
/**
 * 当前setting文件配置
 */
let curSettingConfig = defaultSettingConfig;

/**
 * 获取当前默认配置
 */
exports.getCurSettingConfig = () => {
    return curSettingConfig;
}

/**
 * 设置暗黑模式或者明亮模式
 */
const setThemeSource = () => {
    nativeTheme.themeSource = curSettingConfig.themeSource;
};

/**
 * 配置文件初始化
 */
exports.init = () => {
    if (!fs.existsSync(settingFullPath)) {
        fs.writeFileSync(settingFullPath, JSON.stringify(curSettingConfig));
    }
    const content = fs.readFileSync(settingFullPath)?.toString();
    if (!content) {
        fs.writeFileSync(settingFullPath, JSON.stringify(curSettingConfig));
    } else {
        curSettingConfig = JSON.parse(content);
    }

    if (!curSettingConfig.notebookSuffix) {
        curSettingConfig.notebookSuffix = defaultSettingConfig.notebookSuffix;
    }

    if (curSettingConfig.themeSource === undefined) {
        curSettingConfig.themeSource = 'system';
    }

    if (curSettingConfig.autoSave === undefined) {
        curSettingConfig.autoSave = 10;
    }

    setThemeSource();

    ipcMain.handle('readSettingFile', (event) => {
        return curSettingConfig;
    });
    ipcMain.handle('writeSettingFile', (event, content) => {
        if (content) {
            curSettingConfig = content;
            fs.writeFileSync(settingFullPath, JSON.stringify(content));
            setThemeSource();
        }
    });
};