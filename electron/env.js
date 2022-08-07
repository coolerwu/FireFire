const path = require("path");
const confPath = (process.env.HOME || process.env.USERPROFILE) + "/.firefire";

const settingJsonName = 'setting.json';

const notebookDirName = 'notebook';
const notebookDirPath = path.join(confPath, notebookDirName);

const tagName = 'tag';
const tagPath = path.join(confPath, tagName);

const defaultSettingJson = {
    notebookPath: notebookDirPath,
    tagPath: tagPath,
};

module.exports = {
    confPath, settingJsonName, defaultSettingJson, notebookDirName, notebookDirPath, tagName, tagPath,
}