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
    readNotebookFileList: () => ipcRenderer.invoke('readNotebookFileList'),
    //create file only in notebook path
    createNotebookFile: (absPath) => ipcRenderer.invoke('createNotebookFile', absPath),
    //read file only in notebook path
    readNotebookFile: (absPath) => ipcRenderer.invoke('readNotebookFile', absPath),
    //write file only in notebook path
    writeNotebookFile: (absPath, content) => ipcRenderer.invoke('writeNotebookFile', absPath, content),
})