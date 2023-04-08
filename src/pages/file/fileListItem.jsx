import {Button, Input, message, Modal, Popover, Space} from "antd";
import {DeleteFilled, EditFilled, FileFilled, ProfileFilled} from "@ant-design/icons";
import moment from "moment/moment";
import {Context} from "../../index";
import './fileListItem.less';
import {useContext, useRef, useState} from "react";

const FileListItem = ({item, chooseCwjsonCallback}) => {
    //上下文
    const {setLoad, curDir, setCurDir, theme} = useContext(Context);

    //重命名文件
    const renameFileRef = useRef(null);
    const renameFunc = (item) => {
        Modal.confirm({
            title: `重命名${item.id}文件`,
            icon: <EditFilled/>,
            content: <Input ref={renameFileRef}/>,
            okText: '确认',
            onOk: () => {
                window.electronAPI.renameNotebookFile(`${curDir}/${item.id}`, `${curDir}/${renameFileRef.current.input.value}`).then(res => {
                    if (res) {
                        setLoad(true);
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
            title: `删除${item.id}文件`,
            icon: <DeleteFilled/>,
            okText: '确认',
            onOk: () => {
                window.electronAPI.deleteNotebookFile(`${curDir}/${item.id}`).then(res => {
                    if (res) {
                        setLoad(true);
                    } else {
                        message.error('文件删除失败');
                    }
                })
            },
            cancelText: '取消',
        });
    };

    //详情按钮
    const [chooseFileHover, setChooseFileHover] = useState(null);
    const detailFunc = () => {
        if (item.isDirectory) {
            setCurDir(`${curDir}/${item.filename}`)
            setLoad(true);
        } else {
            setChooseFileHover(item.id);
            chooseCwjsonCallback(item);
        }
    }

    //hover样式
    const [hoverBoxShadow, setHoverBoxShadow] = useState('none');
    const changeMouseEnterEvent = () => {
        setHoverBoxShadow('10px 0 10px white');
    }
    const changeMouseLeaveEvent = () => {
        setHoverBoxShadow('none');
    }

    return (
        <>
            <div onClick={detailFunc} className={chooseFileHover === item.id ? 'chooseListItem' : 'listItem'}
                 onMouseEnter={changeMouseEnterEvent} onMouseLeave={changeMouseLeaveEvent}
                 style={{boxShadow: hoverBoxShadow}}>
                <div>
                    <Space align={'center'}>
                        {item.isDirectory ? <Button type="primary" icon={<ProfileFilled/>} size={'small'}/> :
                            <Button type="primary" icon={<FileFilled/>} size={'small'}/>}
                        <span style={{fontSize: theme.fontSizeLarge}}>{item.id}</span>
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
        </>
    );
}

export default FileListItem;