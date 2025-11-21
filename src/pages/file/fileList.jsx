import React, {useContext, useEffect, useRef, useState} from "react";
import {Button, Col, Input, List, Modal, Row, Tooltip, Tag, Collapse} from "antd";
import './fileList.less';
import {FileAddOutlined, HddOutlined, SearchOutlined, TagsOutlined, ThunderboltOutlined} from "@ant-design/icons";
import {Context} from "../../index";
import FileListItem from "./fileListItem";
import {electronAPI} from "../../utils/electronAPI";

const { Panel } = Collapse;

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

    //标签相关状态
    const [tags, setTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null);

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

    // 快速笔记功能
    const createQuickNote = async () => {
        try {
            // 确保 Quick Notes 文件夹存在
            const quickNotesDir = 'Quick Notes';
            await electronAPI.createNotebookDir(quickNotesDir);

            // 生成文件名：使用当前时间戳
            const now = new Date();
            const fileName = `笔记-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

            // 创建文件
            const filePath = `${quickNotesDir}/${fileName}`;
            await electronAPI.createNotebookFile(filePath);

            // 刷新并选中新文件
            refresh();

            // 通知用户
            console.log(`[QuickNote] 创建快速笔记: ${filePath}`);
        } catch (error) {
            console.error('[QuickNote] 创建失败:', error);
        }
    };

    //搜索符合规则的文件
    const [displayCwjsonList, setDisplayCwjsonList] = useState(cwjsonList);
    const [tagFilteredList, setTagFilteredList] = useState([]);

    // 根据标签筛选笔记
    useEffect(() => {
        if (selectedTag) {
            electronAPI.getNotesByTag(selectedTag).then(notes => {
                // 将标签筛选的笔记路径转换为 cwjson 对象
                const filteredList = cwjsonList.filter(cwjson => {
                    return notes.some(note => note.path.includes(cwjson.id));
                });
                setTagFilteredList(filteredList);
                setDisplayCwjsonList(filteredList);
            });
        } else {
            setTagFilteredList(cwjsonList);
            setDisplayCwjsonList(cwjsonList);
        }
    }, [selectedTag, cwjsonList]);

    const searchFunc = (e) => {
        const value = e.target.value;
        const baseList = selectedTag ? tagFilteredList : cwjsonList;
        if (value) {
            setDisplayCwjsonList(baseList.filter(cwjson => cwjson.id.indexOf(value) !== -1));
        } else {
            setDisplayCwjsonList(baseList);
        }
    };

    //加载标签
    useEffect(() => {
        electronAPI.getAllTags().then(setTags).catch(err => {
            console.error('加载标签失败:', err);
        });
    }, []);

    //样式
    const [headerHeight, setHeaderHeight] = useState(null);
    const headerRef = useRef(null);
    useEffect(() => {
        setHeaderHeight(headerRef?.current.offsetHeight);
    }, []);

    return (
        <div style={{
            height: '100%',
            borderRadius: '10px 10px 10px 0px',
            boxShadow: `2px 2px 2px 1px ${theme.boxShadowColor}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div ref={headerRef} style={{
                padding: '10px',
                boxShadow: `0px 0px 10px 0px ${theme.boxShadowColor}`,
                flexShrink: 0
            }}>
                {/* 快速笔记按钮 */}
                <Row style={{marginBottom: '10px'}}>
                    <Col span={24}>
                        <Button
                            type="primary"
                            icon={<ThunderboltOutlined />}
                            onClick={createQuickNote}
                            block
                            style={{
                                height: '40px',
                                fontSize: '14px',
                                fontWeight: 500,
                                borderRadius: '8px',
                            }}
                        >
                            快速笔记
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <Input prefix={<SearchOutlined/>} allowClear onChange={searchFunc}
                               onClick={searchFunc}/>
                    </Col>
                </Row>
                {/* 标签筛选 */}
                {tags.length > 0 && (
                    <Collapse
                        ghost
                        style={{marginTop: '10px'}}
                        defaultActiveKey={['tags']}
                    >
                        <Panel
                            header={
                                <span style={{fontSize: '13px'}}>
                                    <TagsOutlined style={{marginRight: '6px'}}/>
                                    标签筛选
                                </span>
                            }
                            key="tags"
                        >
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                                <Tag
                                    color={selectedTag === null ? 'blue' : 'default'}
                                    style={{cursor: 'pointer'}}
                                    onClick={() => setSelectedTag(null)}
                                >
                                    全部
                                </Tag>
                                {tags.map(tag => (
                                    <Tag
                                        key={tag.name}
                                        color={selectedTag === tag.name ? 'blue' : 'default'}
                                        style={{cursor: 'pointer'}}
                                        onClick={() => setSelectedTag(tag.name)}
                                    >
                                        #{tag.name} ({tag.count})
                                    </Tag>
                                ))}
                            </div>
                        </Panel>
                    </Collapse>
                )}
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
                    flex: 1,
                    overflow: 'auto',
                }}
                dataSource={displayCwjsonList}
                renderItem={item => <FileListItem item={item} chooseCwjsonCallback={chooseCwjsonCallback}/>}
            />}
        </div>
    );
};

export default FileList;