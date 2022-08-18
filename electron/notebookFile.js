const fs = require('fs');
const {ipcMain} = require("electron");
const {getCurSettingConfig} = require("./settingFile");
const path = require("path");
const uuid = require("uuid");

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
                const fileStat = fs.statSync(path.join(curNotebookFullPath, file));
                const cwjsonFile = {
                    filename: file,
                    id: file.substring(0, file.lastIndexOf(curNotebookSuffix)),
                    updateTime: fileStat.mtimeMs,
                };
                cwjsonFileMap[cwjsonFile.id] = cwjsonFile;
                return cwjsonFile;
            }).sort((left, right) => right.updateTime - left.updateTime);
        } else {
            cwjsonFileMap = {};
            return [];
        }
    });
    ipcMain.handle('createNotebookFile', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();
        let fileFullPath = path.join(curNotebookFullPath, absPath);
        if (!fileFullPath.endsWith(curNotebookSuffix)) {
            fileFullPath += curNotebookSuffix;
        }
        if (!fs.existsSync(fileFullPath)) {
            fs.writeFileSync(fileFullPath, '');
        }
    });
    ipcMain.handle('readNotebookFile', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();
        let fileFullPath = path.join(curNotebookFullPath, absPath);
        if (!fileFullPath.endsWith(curNotebookSuffix)) {
            fileFullPath += curNotebookSuffix;
        }
        if (!fs.existsSync(fileFullPath)) {
            console.log('error');
        }
        const content = fs.readFileSync(fileFullPath)
        return content ? content.toString() : '';
    });
    ipcMain.handle('writeNotebookFile', (event, absPath, content) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();
        let fileFullPath = path.join(curNotebookFullPath, absPath);
        if (!fileFullPath.endsWith(curNotebookSuffix)) {
            fileFullPath += curNotebookSuffix;
        }
        if (!fs.existsSync(fileFullPath)) {
            console.log('error');
        }
        fs.writeFileSync(fileFullPath, content)
    });
    ipcMain.handle('renameNotebookFile', (event, oldPath, newPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();
        const newFileFullPath = path.join(curNotebookFullPath, newPath) + curNotebookSuffix;
        const oldFileFullPath = path.join(curNotebookFullPath, oldPath) + curNotebookSuffix;
        if (fs.existsSync(oldFileFullPath) && !fs.existsSync(newFileFullPath)) {
            fs.renameSync(oldFileFullPath, newFileFullPath);
            return true;
        } else {
            return false;
        }
    })
    ipcMain.handle('deleteNotebookFile', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();
        const fileFullPath = path.join(curNotebookFullPath, absPath) + curNotebookSuffix;
        const dirFullPath = path.join(curNotebookFullPath, absPath);
        if (fs.existsSync(fileFullPath)) {
            fs.rmSync(fileFullPath);
            if (fs.existsSync(dirFullPath)) {
                fs.rmSync(dirFullPath, {recursive: true, force: true});
            }
            return true;
        } else {
            return false;
        }
    })
    ipcMain.handle('copyToNotebookDir', (event, pid, fromPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const fileDirFullPath = path.join(curNotebookFullPath, pid);
        if (!fs.existsSync(fileDirFullPath)) {
            fs.mkdirSync(fileDirFullPath);
        }
        const picSuffix = fromPath.substring(fromPath.lastIndexOf('.'));
        const srcUrl = path.join(fileDirFullPath, uuid.v4()) + picSuffix;
        fs.cpSync(fromPath, srcUrl);
        return srcUrl;
    })
};