const fs = require('fs');
const pa = require('path');
const {confPath, settingJsonName, defaultSettingJson, notebookDirPath, tagPath} = require("./env");

let failure = true;
let settingJsonData = null;

const init = () => {
    try {
        if (!fs.existsSync(confPath)) {
            fs.mkdirSync(confPath);
        }

        const settingJsonFullPath = pa.join(confPath, settingJsonName);
        if (!fs.existsSync(settingJsonFullPath)) {
            fs.writeFileSync(settingJsonFullPath, JSON.stringify(defaultSettingJson));
        }

        settingJsonData = fs.readFileSync(settingJsonFullPath);
        settingJsonData = settingJsonData ? settingJsonData.toString() : JSON.stringify(defaultSettingJson);
        settingJsonData = JSON.parse(settingJsonData);

        if (!settingJsonData.notebookPath) {
            settingJsonData.notebookPath = notebookDirPath;
        }
        if (!settingJsonData.tagPath) {
            settingJsonData.tagPath = tagPath;
        }

        fs.writeFileSync(settingJsonFullPath, JSON.stringify(settingJsonData));

        if (!fs.existsSync(settingJsonData.notebookPath)) {
            fs.mkdirSync(settingJsonData.notebookPath);
        }
        if (!fs.existsSync(settingJsonData.tagPath)) {
            fs.mkdirSync(settingJsonData.tagPath);
        }
        failure = false;
    } catch (err) {
        console.error(err);
    }
};

//读取设置文件
const getSettingJsonData = () => {
    return settingJsonData;
}

//写入设置文件
const writeSettingJsonData = (values) => {
    const settingJsonFullPath = pa.join(confPath, settingJsonName);
    fs.writeFileSync(settingJsonFullPath, JSON.stringify(values));
    failure = true;
    init();
}

const findJsonList = (path) => {
    if (failure) {
        return [];
    }

    if (!path) {
        path = settingJsonData.notebookPath;
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
                files: findJsonList(fullPath),
                fullPath: fullPath,
            });
        } else {
            fileJsonList.push({
                name: replaceSuffix(item),
                value: item,
                directory: false,
                fullPath: fullPath,
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
    const filePath = pa.join(settingJsonData.notebookPath, path);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const data = fs.readFileSync(filePath);
    return data ? data.toString() : null;
}

const writeFileAsync = (path, text) => {
    const filePath = pa.join(settingJsonData.notebookPath, path);
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
    const filePath = pa.join(settingJsonData.notebookPath, path);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
    }

    text = text ? text : '';
    fs.writeFileSync(filePath, text);
}

const mv = (path, text) => {
    const oldPath = pa.join(settingJsonData.notebookPath, path);
    const newPath = pa.join(settingJsonData.notebookPath, text + getSuffix(oldPath));
    if (fs.existsSync(newPath)) {
        console.log('文件存在')
        return
    }

    fs.renameSync(oldPath, newPath)
}

const del = path => {
    const filePath = pa.join(settingJsonData.notebookPath, path);
    if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            fs.rmdirSync(filePath);
        } else {
            fs.rmSync(filePath);
        }
    }
}

module.exports = {
    init, findJsonList, readFile, writeFileAsync, mv, del, writeFile, getSettingJsonData, writeSettingJsonData
};
