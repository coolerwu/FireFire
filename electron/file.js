const fs = require('fs');
const pa = require('path');
const {confPath, settingJsonName, defaultSettingJson, notebookDirPath} = require("./env");
const path = require("path");

let failure = true;
let notebookDirFullPath = null;

const init = () => {
    try {
        if (!fs.existsSync(confPath)) {
            fs.mkdirSync(confPath);
        }

        const settingJsonFullPath = pa.join(confPath, settingJsonName);
        if (!fs.existsSync(settingJsonFullPath)) {
            fs.writeFileSync(settingJsonFullPath, JSON.stringify(defaultSettingJson));
        }

        let settingJsonData = fs.readFileSync(settingJsonFullPath)
        settingJsonData = settingJsonData ? settingJsonData.toString() : JSON.stringify(defaultSettingJson);
        settingJsonData = JSON.parse(settingJsonData);

        const notebookDirFullPathTmp = settingJsonData.notebookPath ? settingJsonData.notebookPath : notebookDirPath;
        if (fs.existsSync(notebookDirFullPathTmp)) {
            notebookDirFullPath = notebookDirFullPathTmp;
            failure = false;
        }
    } catch (err) {
        console.error(err);
    }
};

const findJsonList = (path) => {
    if (failure) {
        return [];
    }

    if (!path) {
        path = notebookDirFullPath;
    }

    const fileList = fs.readdirSync(path);
    const fileJsonList = []

    fileList.forEach((item, index) => {
        const fullPath = pa.join(path, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            fileJsonList.push({
                name: replaceSuffix(item),
                value: item,
                directory: true,
            });
        } else {
            fileJsonList.push({
                name: replaceSuffix(item),
                value: item,
                directory: false,
            });
        }
    });
    return fileJsonList;
}

const replaceSuffix = path => {
    return path ? path.replaceAll('.json', '') : path;
}

const getSuffix = path => {
    return path ? path.substring(path.lastIndexOf('.')) : path;
}

const readFile = path => {
    const filePath = pa.join(notebookDirFullPath, path);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const data = fs.readFileSync(filePath);
    return data ? data.toString() : null;
}

const writeFileAsync = (path, text) => {
    const filePath = pa.join(notebookDirFullPath, path);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
    }

    fs.writeFile(filePath, text, err => {
        if (err) {
            console.error(err)
        }
    })
}

const writeFile = (path, text) => {
    const filePath = pa.join(notebookDirFullPath, path);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
    }

    text = text ? text : '';
    fs.writeFileSync(filePath, text);
}

const mv = (path, text) => {
    const oldPath = pa.join(notebookDirFullPath, path);
    const newPath = pa.join(notebookDirFullPath, text + getSuffix(oldPath));
    if (fs.existsSync(newPath)) {
        console.log('文件存在')
        return
    }

    fs.renameSync(oldPath, newPath)
}

const del = path => {
    const filePath = pa.join(notebookDirFullPath, path);
    if (fs.existsSync(filePath)) {
        fs.rmSync(filePath);
    }
}

module.exports = {
    init, findJsonList, readFile, writeFileAsync, mv, del, writeFile
};
