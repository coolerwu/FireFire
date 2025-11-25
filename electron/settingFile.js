const {confPath} = require("./env");
const fs = require("fs");
const fsPromises = require("fs").promises;
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
 * NOTE: FireFire now uses Markdown (.md) format for all notes
 */
const defaultSettingConfig = {
    notebookPath: path.join(confPath, 'notebook'),
    attachmentPath: path.join(confPath, 'attachment'),
    notebookSuffix: '.md',  // Changed from .cwjson to .md
    themeSource: 'system',
    autoSave: 10,
};
/**
 * 当前setting文件配置
 */
let curSettingConfig = defaultSettingConfig;

/**
 * 是否首次设置（用于显示欢迎页面）
 */
let isFirstTime = false;

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
 * 注意：启动时需要同步加载配置，以确保应用正确初始化
 */
exports.init = () => {
    try {
        // 检测是否首次设置
        const settingExists = fs.existsSync(settingFullPath);

        if (!settingExists) {
            // 首次设置：创建默认配置文件
            isFirstTime = true;
            fs.writeFileSync(settingFullPath, JSON.stringify(curSettingConfig));
            console.log('[SettingFile] 首次启动，创建默认配置');
        } else {
            const content = fs.readFileSync(settingFullPath)?.toString();
            if (!content) {
                isFirstTime = true;
                fs.writeFileSync(settingFullPath, JSON.stringify(curSettingConfig));
            } else {
                curSettingConfig = JSON.parse(content);
                // 检查是否已完成首次设置
                isFirstTime = curSettingConfig.firstTimeComplete !== true;
            }
        }
    } catch (error) {
        console.error('[SettingFile] 初始化配置文件失败:', error);
        // 使用默认配置
        curSettingConfig = { ...defaultSettingConfig };
        isFirstTime = true;
    }

    // 确保必要字段存在
    if (!curSettingConfig.notebookPath) {
        curSettingConfig.notebookPath = defaultSettingConfig.notebookPath;
    }

    if (!curSettingConfig.attachmentPath) {
        curSettingConfig.attachmentPath = defaultSettingConfig.attachmentPath;
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

    // 读取配置（同步返回内存中的配置）
    ipcMain.handle('readSettingFile', (event) => {
        return curSettingConfig;
    });

    // 写入配置（异步写入文件）
    ipcMain.handle('writeSettingFile', async (event, content) => {
        if (!content) {
            return { success: false, error: '内容不能为空' };
        }

        try {
            curSettingConfig = content;
            await fsPromises.writeFile(settingFullPath, JSON.stringify(content, null, 2));
            setThemeSource();
            console.log('[SettingFile] 配置保存成功');
            return { success: true };
        } catch (error) {
            console.error('[SettingFile] 保存配置失败:', error);
            return { success: false, error: error.message };
        }
    });

    // 检查是否首次设置
    ipcMain.handle('is-first-time-setup', () => {
        return isFirstTime;
    });

    // 标记首次设置完成
    ipcMain.handle('complete-first-time-setup', async () => {
        try {
            curSettingConfig.firstTimeComplete = true;
            isFirstTime = false;
            await fsPromises.writeFile(settingFullPath, JSON.stringify(curSettingConfig, null, 2));
            console.log('[SettingFile] 首次设置完成');
            return { success: true };
        } catch (error) {
            console.error('[SettingFile] 标记首次设置完成失败:', error);
            return { success: false, error: error.message };
        }
    });
};