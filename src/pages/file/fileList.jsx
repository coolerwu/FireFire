import React, {useContext, useRef, useState} from "react";
import {Breadcrumb, Button, Col, Input, List, message, Modal, Row, Tooltip} from "antd";
import './fileList.less';
import moment from "moment";
import {
    DeleteFilled,
    EditFilled,
    FileAddOutlined,
    FileFilled,
    HddOutlined,
    ProfileFilled,
    SearchOutlined
} from "@ant-design/icons";
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
    //新建文件ref
    const newFileRef = useRef(null);
    //刷新页面
    const {setLoad, curDir, setCurDir} = useContext(Context);
    //展示文件
    const [displayCwjsonList, setDisplayCwjsonList] = useState(cwjsonList);

    //重命名文件
    const renameFunc = (item, e) => {
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
    }

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
    }

    //单条文件展示
    const renderItem = (item) => {
        //详情按钮
        const detailFunc = () => {
            if (item.isDirectory) {
                setCurDir(`${curDir}/${item.filename}`)
                setLoad(true);
            } else {
                setChooseFileHover(item.id);
                chooseCwjsonCallback(item);
            }
        }

        return (
            <>
                <div onClick={detailFunc} className={chooseFileHover === item.id ? 'chooseListItem' : 'listItem'}>
                    <div>
                        <Row>
                            <Col>
                                {item.isDirectory ? <ProfileFilled/> : <FileFilled/>}
                            </Col>
                            <Col style={{marginLeft: "10px"}}>
                                <h3>{item.id}</h3>
                            </Col>
                        </Row>
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

    //搜索符合规则的文件
    const searchFunc = (e) => {
        const searchValue = e.target.value;
        if (searchValue) {
            setDisplayCwjsonList(cwjsonList.filter(cwjson => cwjson.id.indexOf(searchValue) !== -1));
        } else {
            setDisplayCwjsonList(cwjsonList);
        }
    };

    return (
        <>
            <List
                size="large"
                id={'fileList'}
                style={{height: '100vh'}}
                header={
                    <div>
                        <Row>
                            <Col span={24}>
                                <Input prefix={<SearchOutlined/>} allowClear onChange={searchFunc}
                                       onClick={searchFunc}/>
                            </Col>
                        </Row>
                        <Row style={{marginTop: '10px'}}>
                            <Col span={12}>
                                <Tooltip title={'创建文件夹'}>
                                    <Button style={{width: '100%'}} icon={<HddOutlined/>} onClick={() => {
                                        Modal.confirm({
                                            title: `创建文件夹`,
                                            icon: <HddOutlined/>,
                                            content: <Input ref={newFileRef}/>,
                                            okText: '确认',
                                            onOk: () => {
                                                window.electronAPI.createNotebookDir(`${curDir}/${newFileRef.current.input.value}`).then(() => {
                                                    setLoad(true);
                                                })
                                            },
                                            cancelText: '取消',
                                        });
                                    }}/>
                                </Tooltip>
                            </Col>
                            <Col span={12}>
                                <Tooltip title={'创建文件'}>
                                    <Button style={{width: '100%'}} icon={<FileAddOutlined/>} onClick={() => {
                                        Modal.confirm({
                                            title: `创建文件`,
                                            icon: <FileAddOutlined/>,
                                            content: <Input ref={newFileRef}/>,
                                            okText: '确认',
                                            onOk: () => {
                                                window.electronAPI.createNotebookFile(`${curDir}/${newFileRef.current.input.value}`).then(() => {
                                                    setLoad(true);
                                                })
                                            },
                                            cancelText: '取消',
                                        });
                                    }}/>
                                </Tooltip>
                            </Col>
                        </Row>
                        <Row style={{marginTop: '10px'}}>
                            <Col span={24}>
                                当前路径：{curDir.split("/").map(f => {
                                    return <span key={f}><a style={{display: 'inline'}} onClick={() => {
                                        setCurDir(curDir.substring(0, curDir.lastIndexOf(f)) + f);
                                        setLoad(true);
                                    }}>{f}</a>/</span>
                                })}
                                {/*<Breadcrumb items={[{ title: 'sample' }]} />*/}
                            </Col>
                        </Row>
                    </div>
                }
                // footer={<div>Footer</div>}
                bordered
                dataSource={displayCwjsonList}
                renderItem={renderItem}
            />
        </>
    );
};

export default FileList;