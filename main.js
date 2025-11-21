const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
const path = require("path");
const {init} = require("./electron");
const updater = require('./electron/updater');
const workspaceManager = require('./electron/workspaceManager');

//浏览器引用
let window;

//创建浏览器窗口函数
let createWindow = () => {
    //创建浏览器窗口
    window = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, './preload.js'),
            webSecurity: false,
        }
    });

    if (process.argv[2] === 'dev') {
        window.loadURL('http://localhost:3000');
        window.webContents.openDevTools();
    } else {
        //加载应用中的index.html文件
        window.loadFile('./build/index.html');
    }

    //当window被关闭时，除掉window的引用
    window.on('closed', () => {
        window = null;
    });

    afterCreated();
};

const afterCreated = () => {
    init(window);

    // 设置更新器的主窗口
    updater.setMainWindow(window);

    // 延迟3秒后检查更新（避免阻塞启动）
    setTimeout(() => {
        const {getCurSettingConfig} = require('./electron/settingFile');
        const settings = getCurSettingConfig();

        // 默认开启自动更新检查
        if (settings.autoUpdate !== false) {
            updater.checkForUpdates();
        }
    }, 3000);
}

/**
 * 检查工作空间状态并处理
 */
async function checkAndSetupWorkspace() {
    const result = workspaceManager.checkWorkspace();

    switch (result.status) {
        case 'ready':
            // 工作空间已配置且有效，正常启动
            console.log('[Main] 工作空间已就绪:', result.path);
            return true;

        case 'migrated':
            // 自动迁移成功，正常启动
            console.log('[Main] 已自动迁移旧数据:', result.path);
            return true;

        case 'invalid':
            // 工作空间无效，显示错误并要求重新选择
            const choice = dialog.showMessageBoxSync({
                type: 'error',
                title: '工作空间无效',
                message: '之前的工作空间已不可用',
                detail: `原因: ${result.reason}\n\n请选择一个新的工作空间目录。`,
                buttons: ['选择工作空间', '退出应用'],
                defaultId: 0,
            });

            if (choice === 0) {
                return await showWorkspaceSelector();
            } else {
                app.quit();
                return false;
            }

        case 'first-time':
            // 首次启动，显示欢迎界面
            console.log('[Main] 首次启动，显示工作空间选择');
            // TODO: 在 Phase 2 实现欢迎窗口
            // 暂时显示文件夹选择对话框
            return await showWorkspaceSelector();

        default:
            console.error('[Main] 未知的工作空间状态:', result.status);
            return false;
    }
}

/**
 * 显示工作空间选择对话框
 */
async function showWorkspaceSelector() {
    const result = dialog.showOpenDialogSync({
        properties: ['openDirectory', 'createDirectory'],
        title: '选择工作空间文件夹',
        message: '请选择一个文件夹作为笔记存储位置',
        buttonLabel: '选择',
    });

    if (!result || result.length === 0) {
        // 用户取消选择
        const choice = dialog.showMessageBoxSync({
            type: 'warning',
            title: '未选择工作空间',
            message: '您需要选择一个工作空间才能使用 FireFire',
            buttons: ['重新选择', '退出应用'],
            defaultId: 0,
        });

        if (choice === 0) {
            return await showWorkspaceSelector();
        } else {
            app.quit();
            return false;
        }
    }

    const selectedPath = result[0];

    try {
        // 验证并设置工作空间
        workspaceManager.setWorkspacePath(selectedPath);
        console.log('[Main] 工作空间已设置:', selectedPath);
        return true;
    } catch (error) {
        // 验证失败
        dialog.showMessageBoxSync({
            type: 'error',
            title: '工作空间无效',
            message: '所选文件夹不能作为工作空间',
            detail: error.message,
            buttons: ['确定'],
        });

        return await showWorkspaceSelector();
    }
}

const buildMenu = () => {
    // const menuTemplateArr = [{
    //     label: '关于',
    //     submenu: [{
    //         label: `Version ${app.getVersion()}`,
    //         enabled: false
    //     }]
    // }];
    // if (process.platform === 'darwin') {
    //     menuTemplateArr.unshift({
    //         label: app.getName(),
    //         submenu: [
    //             {
    //                 label: 'Quit',
    //                 accelerator: 'CmdOrCtrl+Q',
    //                 click() {
    //                     app.quit();
    //                 }
    //             }
    //         ]
    //     });
    // }
    //
    // Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplateArr));
};

//当app准备就绪时候开启窗口
app.on('ready', async () => {
    buildMenu();

    // 检查并设置工作空间
    const workspaceReady = await checkAndSetupWorkspace();
    if (!workspaceReady) {
        // 工作空间设置失败，退出应用
        return;
    }

    // 工作空间已就绪，创建主窗口
    createWindow();
});

//当全部窗口都被关闭之后推出
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

//在macos上，单击dock图标并且没有其他窗口打开的时候，重新创建一个窗口
app.on('activate', () => {
    if (window == null) {
        createWindow();
    }
});

// 自动更新 IPC 处理程序
ipcMain.handle('check-for-updates', () => {
    updater.checkForUpdates();
});

ipcMain.handle('download-update', () => {
    updater.downloadUpdate();
});

ipcMain.handle('quit-and-install', () => {
    updater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
    return updater.getCurrentVersion();
});

// 工作空间 IPC 处理程序
ipcMain.handle('get-current-workspace', () => {
    return workspaceManager.getWorkspacePath();
});

ipcMain.handle('change-workspace', async () => {
    const result = dialog.showOpenDialogSync({
        properties: ['openDirectory', 'createDirectory'],
        title: '选择新的工作空间文件夹',
        message: '请选择一个文件夹作为新的笔记存储位置',
        buttonLabel: '选择',
    });

    if (!result || result.length === 0) {
        return { success: false, canceled: true };
    }

    const selectedPath = result[0];

    try {
        // 验证并设置工作空间
        workspaceManager.setWorkspacePath(selectedPath);
        console.log('[IPC] 工作空间已更改:', selectedPath);
        return { success: true, path: selectedPath };
    } catch (error) {
        console.error('[IPC] 更改工作空间失败:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('open-workspace-folder', () => {
    const workspacePath = workspaceManager.getWorkspacePath();
    if (!workspacePath) {
        return { success: false, error: '工作空间未配置' };
    }

    const {shell} = require('electron');
    shell.openPath(workspacePath).then(error => {
        if (error) {
            console.error('[IPC] 打开文件夹失败:', error);
        }
    });

    return { success: true };
});

ipcMain.handle('restart-app', () => {
    app.relaunch();
    app.exit(0);
});