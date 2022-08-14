const {app, BrowserWindow, ipcMain} = require('electron');
const path = require("path");
const {init, findJsonList, readFile, writeFileAsync, mv, del, writeFile, getSettingJsonData, writeSettingJsonData} = require("./electron/file");

//浏览器引用
let window;

//环境
let mode = process.argv[2];

//创建浏览器窗口函数
let createWindow = () => {
    //创建浏览器窗口
    window = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, './preload.js')
        }
    });

    if (mode === 'dev') {
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

    init();

    const opFileFunc = (type, path, text) => {
        if (!type) {
            return null;
        }

        switch (type) {
            //读取所有文件
            case 1:
                return findJsonList();
            //读取指定文件
            case 2:
                return readFile(path);
            //异步写文件
            case 3:
                writeFileAsync(path, text);
                return 'success';
            //同步写文件
            case 6:
                writeFile(path, text);
                return 'success';
            case 4:
                mv(path, text);
                return 'success';
            case 5:
                del(path);
                return 'success';
            //读取设置
            case 7:
                return getSettingJsonData();
            //写设置
            case 8:
                writeSettingJsonData(text);
                return 'success';
            default:
                return null;
        }
    }

    ipcMain.handle('opFile', (event, type, path, text) => {
        if (type instanceof Array) {
            return type.map(f => opFileFunc(f.type, f.path, f.text));
        } else {
            return opFileFunc(type, path, text);
        }
    });
};

//当app准备就绪时候开启窗口
app.on('ready', createWindow);

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