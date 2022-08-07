const fileList = 'fileList';

const getFileList = () => JSON.parse(window.localStorage.getItem(fileList));
const setFileList = list => window.localStorage.setItem(fileList, JSON.stringify(list));

const tagList = 'tagList';

const getTagList = () => JSON.parse(window.localStorage.getItem(tagList));
const setTagList = list => window.localStorage.setItem(tagList, JSON.stringify(list));

const setting = 'setting';

const getSetting = () => JSON.parse(window.localStorage.getItem(setting));
const setSetting = list => window.localStorage.setItem(setting, JSON.stringify(list));

const SUCCESS = 'success'

export {
    setFileList, getFileList, SUCCESS, setTagList, getTagList, getSetting, setSetting
};