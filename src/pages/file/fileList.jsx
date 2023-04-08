import React, {useContext, useRef, useState} from "react";
import {Button, Col, Input, List, Modal, Row, Tooltip} from "antd";
import './fileList.less';
import {FileAddOutlined, HddOutlined, SearchOutlined} from "@ant-design/icons";
import {Context} from "../../index";
import FileListItem from "./fileListItem";

/**
 * @param cwjsonList 文件列表
 * @param chooseCwjsonCallback 选中文件的回调函数
 */
const FileList = ({cwjsonList, chooseCwjsonCallback}) => {
    //上下文
    const {setLoad, curDir, setCurDir} = useContext(Context);

    //新建文件/文件夹ref
    const newFileOrDirectoryRef = useRef(null);
    const createDirectoryEvent = () => {
        Modal.confirm({
            title: `创建文件夹`,
            icon: <HddOutlined/>,
            content: <Input ref={newFileOrDirectoryRef}/>,
            okText: '确认',
            onOk: () => {
                window.electronAPI.createNotebookDir(`${curDir}/${newFileOrDirectoryRef.current.input.value}`).then(() => {
                    setLoad(true);
                })
            },
            cancelText: '取消',
        });
    };
    const createFileEvent = () => {
        Modal.confirm({
            title: `创建文件`,
            icon: <FileAddOutlined/>,
            content: <Input ref={newFileOrDirectoryRef}/>,
            okText: '确认',
            onOk: () => {
                window.electronAPI.createNotebookFile(`${curDir}/${newFileOrDirectoryRef.current.input.value}`).then(() => {
                    setLoad(true);
                })
            },
            cancelText: '取消',
        });
    };

    //搜索符合规则的文件
    const [displayCwjsonList, setDisplayCwjsonList] = useState(cwjsonList);
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
                                    <Button style={{width: '100%'}} icon={<HddOutlined/>} onClick={createDirectoryEvent}/>
                                </Tooltip>
                            </Col>
                            <Col span={12}>
                                <Tooltip title={'创建文件'}>
                                    <Button style={{width: '100%'}} icon={<FileAddOutlined/>} onClick={createFileEvent}/>
                                </Tooltip>
                            </Col>
                        </Row>
                        <Row style={{marginTop: '10px'}}>
                            <Col span={24}>
                                当前路径：{curDir.split("/").map(f => {
                                    if (f === '.') {
                                        f = '根目录';
                                    }
                                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                                    return <span key={f}><a style={{display: 'inline'}} onClick={() => {
                                        if (f === '根目录') {
                                            f = '.';
                                        }
                                        setCurDir(curDir.substring(0, curDir.lastIndexOf(f)) + f);
                                        setLoad(true);
                                    }}>{f}</a>-</span>;
                                })}
                            </Col>
                        </Row>
                    </div>
                }
                // footer={<div>Footer</div>}
                bordered
                dataSource={displayCwjsonList}
                renderItem={item => <FileListItem item={item} chooseCwjsonCallback={chooseCwjsonCallback}/>}
            />
        </>
    );
};

export default FileList;