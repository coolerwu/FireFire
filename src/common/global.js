const fileList = 'fileList';

const getFileList = () => JSON.parse(window.localStorage.getItem(fileList));
const setFileList = list => window.localStorage.setItem(fileList, JSON.stringify(list));

const SUCCESS = 'success'

export {
    setFileList, getFileList, SUCCESS
};