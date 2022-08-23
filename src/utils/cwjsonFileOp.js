/**
 * markdown持久化
 * @param editor 编辑器
 * @param cwjson 文件
 */
export const persist = (editor, cwjson) => {
    window.electronAPI.writeNotebookFile(cwjson.filename, JSON.stringify(editor.getJSON()));
};