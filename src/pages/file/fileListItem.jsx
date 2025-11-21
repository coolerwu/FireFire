import {Button, Input, message, Modal, Popover, Space} from "antd";
import {DeleteFilled, EditFilled, FileFilled, ProfileFilled} from "@ant-design/icons";
import moment from "moment/moment";
import {Context} from "../../index";
import './fileListItem.less';
import {useContext, useRef, useState} from "react";
import {electronAPI} from "../../utils/electronAPI";

const FileListItem = ({item, chooseCwjsonCallback}) => {
    //上下文
    const {refresh, curDir, theme} = useContext(Context);

    //重命名文件
    const renameFileRef = useRef(null);
    const renameFunc = (item) => {
        Modal.confirm({
            title: `重命名${item.id}文件`,
            icon: <EditFilled/>,
            content: <Input ref={renameFileRef}/>,
            okText: '确认',
            onOk: () => {
                electronAPI.renameNotebookFile(`${curDir}/${item.id}`, `${curDir}/${renameFileRef.current.input.value}`).then(res => {
                    if (res) {
                        refresh();
                    } else {
                        message.error('文件重命名失败');
                    }
                })
            },
            cancelText: '取消',
        });
    };

    //删除文件
    const deleteFunc = (item) => {
        Modal.confirm({
            title: item.isDirectory ? `删除——${item.id}——文件夹` : `删除——${item.id}——文件`,
            icon: <DeleteFilled/>,
            okText: '确认',
            onOk: () => {
                if (item.isDirectory) {
                    electronAPI.deleteDirectory(`${curDir}/${item.id}`).then(res => {
                        if (res) {
                            refresh();
                        } else {
                            message.error('文件删除失败');
                        }
                    })
                } else {
                    electronAPI.deleteNotebookFile(`${curDir}/${item.id}`).then(res => {
                        if (res) {
                            refresh();
                        } else {
                            message.error('文件删除失败');
                        }
                    })
                }
            },
            cancelText: '取消',
        });
    };

    //详情按钮
    const [chooseFileHover, setChooseFileHover] = useState(null);
    const detailFunc = () => {
        if (item.isDirectory) {
            refresh({curDir: `${curDir}/${item.filename}`});
        } else {
            setChooseFileHover(item.id);
            chooseCwjsonCallback(item);
        }
    }

    //hover样式
    const [hoverBoxShadow, setHoverBoxShadow] = useState('none');
    const changeMouseEnterEvent = () => {
        setHoverBoxShadow(`10px 0 10px ${theme.boxShadowColor}`);
    }
    const changeMouseLeaveEvent = () => {
        setHoverBoxShadow('none');
    }

    const filenameInputRef = useRef(null);
    const [fileInputBordered, setFileInputBordered] = useState(false);
    const changeFilenameBorderedEvent = (newBordered, e) => {
        if (e) {
            e.stopPropagation();
        }

        //设置边框
        setFileInputBordered(newBordered);
        if (newBordered) {
            return;
        }
        if (fileInputBordered === newBordered) {
            return;
        }

        //检查文件名是否合法
        const newFilename = filenameInputRef?.current?.input?.value;
        if (!newFilename) {
            message.error('文件名不能为空哟！');
            return;
        } else if (newFilename === item.id) {
            return;
        }

        //更新文件名
        Modal.confirm({
            title: `此操作不可逆`,
            icon: <EditFilled/>,
            content: `确认将${item.id}命名为${newFilename}`,
            okText: '确认',
            onOk: () => {
                electronAPI.renameNotebookFile(`${curDir}/${item.id}`, `${curDir}/${newFilename}`).then(res => {
                    if (res) {
                        refresh();
                    } else {
                        message.error('文件重命名失败');
                    }
                })
            },
            cancelText: '取消',
        });
    }

    return (
        <div onClick={detailFunc} className={chooseFileHover === item.id ? 'chooseListItem' : 'listItem'}
             onMouseEnter={changeMouseEnterEvent} onMouseLeave={changeMouseLeaveEvent}
             style={{boxShadow: hoverBoxShadow}}>
            <div>
                <Space align={'center'}>
                    {item.isDirectory ? <Button type="primary" icon={<ProfileFilled/>} size={'small'}/> :
                        <Button type="primary" icon={<FileFilled/>} size={'small'}/>}
                    <Input style={{fontSize: theme.fontSizeMedium}} bordered={fileInputBordered} ref={filenameInputRef}
                           defaultValue={item.id}
                           onKeyDown={e => {
                               if(e.keyCode === 13) {
                                   changeFilenameBorderedEvent(false);
                               }
                           }}
                           onClick={e => changeFilenameBorderedEvent(true, e)}
                           onBlur={() => changeFilenameBorderedEvent(false)}/>
                </Space>
            </div>
            <div style={{width: '100%'}}>
                    <span style={{fontSize: theme.fontSizeMini}}>
                        修改时间: {moment(item.updateTime).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
            </div>
            <div style={{width: '100%'}}>
                    <span style={{fontSize: theme.fontSizeMini, textAlign: 'right'}}>
                        文件类型: {item.isDirectory ? '文件夹' : '文件'}
                    </span>
            </div>
            <div style={{textAlign: 'right'}}>
                <Popover content={'编辑'} style={{}}>
                    <Button type="primary" onClick={() => renameFunc(item)} icon={<EditFilled/>} size={'small'}/>
                </Popover>
                <Popover content={'删除'} style={{}}>
                    <Button type="primary" danger onClick={() => deleteFunc(item)} icon={<DeleteFilled/>}
                            size={'small'} style={{marginLeft: '5px'}}/>
                </Popover>
            </div>
        </div>
    );
}

export default FileListItem;