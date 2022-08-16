import React, {useContext, useRef, useState} from "react";
import {Button, Input, List, message, Modal} from "antd";
import './fileList.less';
import moment from "moment";
import {DeleteFilled, EditFilled} from "@ant-design/icons";
import {Context} from "../../index";

/**
 * @param cwjsonList 文件列表
 * @param chooseCwjsonCallback 选中文件的回调函数
 */
const FileList = ({cwjsonList, chooseCwjsonCallback}) => {
    //选择文章的hover样式
    const [chooseFileHover, setChooseFileHover] = useState(null);
    //重命名文件ref
    const renameFileRef = useRef(null);
    const {setLoad} = useContext(Context)

    //重命名文件
    const renameFunc = (item, e) => {
        Modal.confirm({
            title: `重命名${item.id}文件`,
            icon: <EditFilled/>,
            content: <Input ref={renameFileRef}/>,
            okText: '确认',
            onOk: () => {
                window.electronAPI.renameNotebookFile(item.id, renameFileRef.current.input.value).then(res => {
                    if (res) {
                        setLoad(true);
                    } else {
                        message.error('文件重命名失败');
                    }
                })
            },
            cancelText: '取消',
        });
    }

    //删除文件
    const deleteFunc = (item) => {
        Modal.confirm({
            title: `删除${item.id}文件`,
            icon: <DeleteFilled/>,
            okText: '确认',
            onOk: () => {
                window.electronAPI.deleteNotebookFile(item.id).then(res => {
                    if (res) {
                        setLoad(true);
                    } else {
                        message.error('文件删除失败');
                    }
                })
            },
            cancelText: '取消',
        });
    }

    const renderItem = (item) => {
        //详情按钮
        const detailFunc = () => {
            setChooseFileHover(item.id);
            chooseCwjsonCallback(item);
        }

        return (
            <>
                <div onClick={detailFunc} className={chooseFileHover === item.id ? 'chooseListItem' : 'listItem'}>
                    <div>
                        <h3>{item.id}</h3>
                    </div>
                    <div>
                        <span>{moment(item.updateTime).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                    <div style={{textAlign: 'right'}}>
                        <Button type={'text'} onClick={() => renameFunc(item)} icon={<EditFilled/>} size={'small'}/>
                        <Button type={'text'} onClick={() => deleteFunc(item)} icon={<DeleteFilled/>} size={'small'}/>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <List
                size="large"
                style={{height: '100vh'}}
                // header={<div>文章列表</div>}
                // footer={<div>Footer</div>}
                bordered
                dataSource={cwjsonList}
                renderItem={renderItem}
            />
        </>
    );
};

export default FileList;