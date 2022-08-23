const {app, BrowserWindow, Menu} = require('electron');
const path = require("path");
const {init} = require("./electron");

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
app.on('ready', () => {
    buildMenu();
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