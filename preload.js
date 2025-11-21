window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})

const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    //read setting file
    readSettingFile: () => ipcRenderer.invoke('readSettingFile'),
    //write setting file
    writeSettingFile: (content) => ipcRenderer.invoke('writeSettingFile', content),
    //read files only in notebook path
    readNotebookFileList: (absPath) => ipcRenderer.invoke('readNotebookFileList', absPath),
    //create file only in notebook path
    createNotebookFile: (absPath) => ipcRenderer.invoke('createNotebookFile', absPath),
    //create dir only in notebook path
    createNotebookDir: (absPath) => ipcRenderer.invoke('createNotebookDir', absPath),
    //read file only in notebook path
    readNotebookFile: (absPath) => ipcRenderer.invoke('readNotebookFile', absPath),
    //write file only in notebook path
    writeNotebookFile: (absPath, content) => ipcRenderer.invoke('writeNotebookFile', absPath, content),
    //rename filename only in notebook path
    renameNotebookFile: (oldPath, newPath) => ipcRenderer.invoke('renameNotebookFile', oldPath, newPath),
    //delete filename only in notebook path
    deleteNotebookFile: (absPath) => ipcRenderer.invoke('deleteNotebookFile', absPath),
    //delete directory only in notebook path
    deleteDirectory: (absPath) => ipcRenderer.invoke('deleteDirectory', absPath),
    //copy picture to attachment path
    copyAttachment: (fromPath, toDirectoryPath) => ipcRenderer.invoke('copyAttachment', fromPath, toDirectoryPath),
    //copy base64 to attachment path
    copyAttachmentByBase64: (base64, toDirectoryPath) => ipcRenderer.invoke('copyAttachmentByBase64', base64, toDirectoryPath),
    //auto-update functions
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onUpdateStatus: (callback) => {
        const subscription = (event, status) => callback(status);
        ipcRenderer.on('update-status', subscription);
        return () => ipcRenderer.removeListener('update-status', subscription);
    },
})
