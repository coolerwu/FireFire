const path = require("path");
const confPath = (process.env.HOME || process.env.USERPROFILE) + "/.firefire";

const settingJsonName = 'setting.json';

const notebookDirName = 'notebook';
const notebookDirPath = path.join(confPath, notebookDirName);

const defaultSettingJson = {
    notebookPath: notebookDirPath,
};

module.exports = {
    confPath, settingJsonName, defaultSettingJson, notebookDirName, notebookDirPath
}