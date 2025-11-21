import React, {useContext, useEffect, useRef, useState} from "react";
import {Button, Col, Input, List, Modal, Row, Tooltip} from "antd";
import './fileList.less';
import {FileAddOutlined, HddOutlined, SearchOutlined} from "@ant-design/icons";
import {Context} from "../../index";
import FileListItem from "./fileListItem";
import {electronAPI} from "../../utils/electronAPI";

/**
 * 创建文件/文件夹样式
 */
const buildEditStyle = (theme) => {
    return {
        borderRadius: '1em',
        boxShadow: `2px 2px ${theme.boxShadowColor}`,
        width: '100%',
    }
}

/**
 * @param cwjsonList 文件列表
 * @param chooseCwjsonCallback 选中文件的回调函数
 */
const FileList = ({cwjsonList, chooseCwjsonCallback}) => {
    //上下文
    const {refresh, curDir, theme} = useContext(Context);

    //新建文件/文件夹ref
    const newFileOrDirectoryRef = useRef(null);
    const createDirectoryEvent = () => {
        Modal.confirm({
            title: `创建文件夹`,
            icon: <HddOutlined/>,
            content: <Input ref={newFileOrDirectoryRef}/>,
            okText: '确认',
            onOk: () => {
                electronAPI.createNotebookDir(`${curDir}/${newFileOrDirectoryRef.current.input.value}`).then(() => {
                    refresh();
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
                electronAPI.createNotebookFile(`${curDir}/${newFileOrDirectoryRef.current.input.value}`).then(() => {
                    refresh();
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

    //样式
    const [headerHeight, setHeaderHeight] = useState(null);
    const headerRef = useRef(null);
    useEffect(() => {
        setHeaderHeight(headerRef?.current.offsetHeight);
    }, []);

    return (
        <div style={{borderRadius: '10px 10px 10px 0px', boxShadow: `2px 2px 2px 1px ${theme.boxShadowColor}`}}>
            <div ref={headerRef} style={{padding: '10px', boxShadow: `0px 0px 10px 0px ${theme.boxShadowColor}`}}>
                <Row>
                    <Col span={24}>
                        <Input prefix={<SearchOutlined/>} allowClear onChange={searchFunc}
                               onClick={searchFunc}/>
                    </Col>
                </Row>
                <Row style={{marginTop: '10px'}}>
                    <Col span={11}>
                        <Tooltip title={'创建文件夹'}>
                            <Button style={buildEditStyle(theme)} icon={<HddOutlined/>}
                                    onClick={createDirectoryEvent}/>
                        </Tooltip>
                    </Col>
                    <Col span={11} offset={2}>
                        <Tooltip title={'创建文件'}>
                            <Button style={buildEditStyle(theme)} icon={<FileAddOutlined/>}
                                    onClick={createFileEvent}/>
                        </Tooltip>
                    </Col>
                </Row>
                <div style={{marginTop: '10px', display: 'flex', flexWrap: 'wrap'}}>
                    <div>当前路径：</div>
                    {curDir.split("/").map((f) => {
                        let isRoot = false;
                        if (f === '.') {
                            f = '根目录';
                            isRoot = true;
                        }
                        // eslint-disable-next-line jsx-a11y/anchor-is-valid
                        return <div key={f}>{isRoot ? '' : '-'}<a style={{display: 'inline'}} onClick={() => {
                            if (f === '根目录') {
                                f = '.';
                            }
                            refresh({curDir: curDir.substring(0, curDir.lastIndexOf(f)) + f});
                        }}>{f}</a></div>;
                    })}
                </div>
            </div>
            {headerHeight && <List
                size="large"
                id={'fileList'}
                style={{
                    height: `calc(100vh - ${headerHeight}px)`,
                    overflow: 'auto',
                }}
                dataSource={displayCwjsonList}
                renderItem={item => <FileListItem item={item} chooseCwjsonCallback={chooseCwjsonCallback}/>}
            />}
        </div>
    );
};

export default FileList;