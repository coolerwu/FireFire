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
 * 获取当前notebook完整path
 */
const getCurAttachmentFullPath = () => {
    return getCurSettingConfig().attachmentPath;
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

        let fileFullPath;
        if (absPath === undefined) {
            fileFullPath = curNotebookFullPath;
        } else {
            fileFullPath = path.join(curNotebookFullPath, absPath);
        }

        const fileList = fs.readdirSync(fileFullPath);
        if (fileList) {
            return fileList.filter(file => {
                if (file.endsWith(curNotebookSuffix)) {
                    return true;
                } else if (file.includes('.')) {
                    return false;
                } else {
                    return true;
                }
            }).map(file => {
                let curFilePath = path.join(fileFullPath, file);
                const fileStat = fs.statSync(curFilePath);
                const attachmentPath = getCurAttachmentFullPath();
                const notebookPath = getCurNotebookFullPath();
                let attachmentFullPath = path.join(attachmentPath, curFilePath.substring(notebookPath.length));
                attachmentFullPath = attachmentFullPath.substring(0, attachmentFullPath.lastIndexOf(curNotebookSuffix));
                const cwjsonFile = {
                    filename: file,
                    isDirectory: fileStat.isDirectory(),
                    id: fileStat.isDirectory() ? file : file.substring(0, file.lastIndexOf(curNotebookSuffix)),
                    updateTime: fileStat.mtimeMs,
                    notebookPath: curFilePath,
                    attachmentPath: attachmentFullPath,
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
    ipcMain.handle('createNotebookDir', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        let fileFullPath = path.join(curNotebookFullPath, absPath);
        if (!fs.existsSync(fileFullPath)) {
            fs.mkdirSync(fileFullPath);
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
    });
    ipcMain.handle('deleteNotebookFile', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const curNotebookSuffix = getCurNotebookSuffix();
        const fileFullPath = path.join(curNotebookFullPath, absPath) + curNotebookSuffix;
        if (fs.existsSync(fileFullPath)) {
            fs.rmSync(fileFullPath);
            return true;
        } else {
            return false;
        }
    });
    ipcMain.handle('deleteDirectory', (event, absPath) => {
        const curNotebookFullPath = getCurNotebookFullPath();
        const fileFullPath = path.join(curNotebookFullPath, absPath);
        if (fs.existsSync(fileFullPath)) {
            const fileList = fs.readdirSync(fileFullPath);
            if (fileList || fileList.length > 0) {
                return false;
            }
            fs.rmSync(fileFullPath, {recursive: true, force: true});
            return true;
        } else {
            return false;
        }
    });
    ipcMain.handle('copyAttachment', (event, fromPath, toDirectoryPath) => {
        //检查路径
        if (!fs.existsSync(fromPath)) {
            return null;
        }

        //创建父目录
        if (!fs.existsSync(toDirectoryPath)) {
            fs.mkdirSync(toDirectoryPath);
        }

        //附件后缀
        let attachmentSuffix = "";
        if (fromPath.lastIndexOf('.') !== -1) {
            attachmentSuffix = fromPath.substring(fromPath.lastIndexOf('.'));
        }

        //移动指定文件
        const srcUrl = path.join(toDirectoryPath, uuid.v4()) + attachmentSuffix;
        fs.cpSync(fromPath, srcUrl);
        return srcUrl;
    });
    ipcMain.handle('copyAttachmentByBase64', (event, base64, toDirectoryPath) => {
        //检查路径
        if (!base64) {
            return null;
        }

        //创建父目录
        if (!fs.existsSync(toDirectoryPath)) {
            fs.mkdirSync(toDirectoryPath);
        }

        let arr = base64.split(',');
        let mime = arr[0].match(/:(.*?);/)[1];
        let byteStr = atob(arr[1]);
        let n = byteStr.length
        let u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = byteStr.charCodeAt(n);
        }

        //移动指定文件
        const srcUrl = path.join(toDirectoryPath, uuid.v4()) + '.' + mime.substring(mime.lastIndexOf('/') + 1);
        fs.writeFileSync(srcUrl, u8arr)
        return srcUrl;
    });
};