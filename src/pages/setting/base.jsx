import React, {Button, Divider, Input, message, Popover, Space, Radio} from "antd";
import './base.less';
import {useContext, useEffect, useRef, useState} from "react";
import {Context} from "../../index";
import {IssuesCloseOutlined} from "@ant-design/icons";

/**
 * 校验文件读写权限
 */
async function verifyPermission(fileOrDirectory) {
    const options = {mode: 'readwrite'};
    if ((await fileOrDirectory.queryPermission(options)) === 'granted') {
        return true;
    }
    if ((await fileOrDirectory.requestPermission(options)) === 'granted') {
        return true;
    }
    return false;
}

/**
 * 输入文件保存路径方式选择
 */
const isSelfWrite = (type) => type === '手动输入';

const BaseSetting = () => {
    //上下文
    const {updateValueByKeyFunc, setting} = useContext(Context);
    useEffect(() => {
        if (setting?.themeSource) {
            setThemeSource(setting.themeSource);
        }
    }, [setting]);

    //选择笔记保存路径
    const [notebookPathTypeBtn, setNotebookPathTypeBtn] = useState('手动输入');
    const changeNotebookPathTypeEvent = () => {
        setNotebookPathTypeBtn(isSelfWrite(notebookPathTypeBtn) ? '选择文件夹' : '手动输入')
    }
    const notebookPathInput = useRef(null);
    const confirmNotebookSavePathEvent = async () => {
        if (!isSelfWrite(notebookPathTypeBtn)) {
            const directory = await window.showDirectoryPicker();
            if (!directory) {
                return;
            }

            const permission = await verifyPermission(directory);
            if (!permission) {
                message.error('已选择的文件夹无法访问（权限不足）');
                return;
            }

            const file = await directory.getFileHandle('demo.cwjson', {create: true});
            if (notebookPathInput?.current?.input) {
                notebookPathInput.current.input.value = directory.resolve(file)
            }
        }

        //保存路径
        if (notebookPathInput?.current?.input) {
            updateValueByKeyFunc('notebookPath', notebookPathInput.current.input.value);
        }
    };

    //选择附件保存路径
    const [attachmentPathTypeBtn, setAttachmentPathTypeBtn] = useState('手动输入');
    const changeAttachmentPathTypeEvent = () => {
        setAttachmentPathTypeBtn(isSelfWrite(attachmentPathTypeBtn) ? '选择文件夹' : '手动输入')
    }
    const attachmentPathInput = useRef(null);
    const confirmAttachmentSavePathEvent = async () => {
        if (!isSelfWrite(attachmentPathTypeBtn)) {
            const directory = await window.showDirectoryPicker();
            if (!directory) {
                return;
            }

            const permission = await verifyPermission(directory);
            if (!permission) {
                message.error('已选择的文件夹无法访问（权限不足）');
                return;
            }

            const file = await directory.getFileHandle('demo.cwjson', {create: true});
            if (attachmentPathInput?.current?.input) {
                attachmentPathInput.current.input.value = directory.resolve(file)
            }
        }

        //保存路径
        if (attachmentPathInput?.current?.input) {
            updateValueByKeyFunc('attachmentPath', attachmentPathInput.current.input.value);
        }
    };

    //主题模式
    const [themeSource, setThemeSource] = useState('system');
    const changeThemeSourceEvent = (e) => {
        if (e?.target?.value) {
            updateValueByKeyFunc('themeSource', e.target.value);
        }
    }

    return (
        <div className={'index'}>
            <Divider orientation={'left'} plain className={'gutter'}>笔记保存路径</Divider>
            <Space.Compact className={'filePathInput'}>
                <Button type="primary" onClick={changeNotebookPathTypeEvent}>{notebookPathTypeBtn}</Button>
                <Input ref={notebookPathInput} placeholder={isSelfWrite(notebookPathTypeBtn) ? '请输入绝对路径' : ''}
                       defaultValue={setting.notebookPath}/>
                <Button type="primary"
                        onClick={confirmNotebookSavePathEvent}>{isSelfWrite(notebookPathTypeBtn) ? '保存' : '选择'}</Button>
            </Space.Compact>
            {isSelfWrite(notebookPathTypeBtn) && <Popover content={'请输入绝对路径'} className={'filePathInputTips'}>
                <IssuesCloseOutlined/>
            </Popover>}

            <Divider orientation={'left'} plain className={'gutter'}>附件保存路径</Divider>
            <Space.Compact className={'filePathInput'}>
                <Button type="primary" onClick={changeAttachmentPathTypeEvent}>{attachmentPathTypeBtn}</Button>
                <Input ref={attachmentPathInput} placeholder={isSelfWrite(attachmentPathTypeBtn) ? '请输入绝对路径' : ''}
                       defaultValue={setting.attachmentPath}/>
                <Button type="primary"
                        onClick={confirmAttachmentSavePathEvent}>{isSelfWrite(attachmentPathTypeBtn) ? '保存' : '选择'}</Button>
            </Space.Compact>
            {isSelfWrite(attachmentPathTypeBtn) && <Popover content={'请输入绝对路径'} className={'filePathInputTips'}>
                <IssuesCloseOutlined/>
            </Popover>}

            <Divider orientation={'left'} plain className={'gutter'}>主题模式</Divider>
            <Radio.Group value={themeSource} onChange={changeThemeSourceEvent}>
                <Radio.Button value="light">明亮模式</Radio.Button>
                <Radio.Button value="dark">暗黑模式</Radio.Button>
                <Radio.Button value="system">跟随系统</Radio.Button>
            </Radio.Group>
        </div>
    );
};

export default BaseSetting;