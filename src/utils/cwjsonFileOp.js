import {electronAPI} from "./electronAPI";

/**
 * markdown持久化
 * @param editor 编辑器
 * @param cwjson 文件
 */
export const persist = (editor, cwjson) => {
    electronAPI.writeNotebookFile(cwjson.filename, JSON.stringify(editor.getJSON()));
};

/**
 * 拷贝其他地方的文件到附件文件夹
 */
export const copyAttachment = (cwjson, fromPath) => {
    if (!cwjson) {
        return null;
    }

    return electronAPI.copyAttachment(fromPath, cwjson.attachmentPath);
}

/**
 * 拷贝base64到附件文件夹
 */
export const copyAttachmentByBase64 = (cwjson, base64) => {
    if (!cwjson) {
        return null;
    }

    return electronAPI.copyAttachmentByBase64(base64, cwjson.attachmentPath);
}