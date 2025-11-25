import React, {useContext, useEffect, useRef, useState} from "react";
import {Button, Input, Modal, Tag, Collapse, message} from "antd";
import {FileAddOutlined, HddOutlined, SearchOutlined, TagsOutlined, ThunderboltOutlined, ChevronRightIcon} from "@ant-design/icons";
import {Context} from "../../index";
import FileListItem from "./fileListItem";
import {electronAPI} from "../../utils/electronAPI";
import {handleAPIError} from "../../utils/errorHandler";
import {logger} from "../../utils/logger";
import {FILE_CONSTANTS, formatDateForFilename} from "../../utils/constants";

const { Panel } = Collapse;

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
            content: <Input ref={newFileOrDirectoryRef} className="mt-2"/>,
            okText: '确认',
            onOk: () => {
                const dirName = newFileOrDirectoryRef.current?.input?.value;
                if (!dirName || !dirName.trim()) {
                    message.warning('请输入文件夹名称');
                    return;
                }
                electronAPI.createNotebookDir(`${curDir}/${dirName.trim()}`)
                    .then(() => {
                        message.success('文件夹创建成功');
                        refresh();
                    })
                    .catch(err => handleAPIError(err, 'createNotebookDir'));
            },
            cancelText: '取消',
        });
    };
    const createFileEvent = () => {
        Modal.confirm({
            title: `创建文件`,
            icon: <FileAddOutlined/>,
            content: <Input ref={newFileOrDirectoryRef} className="mt-2"/>,
            okText: '确认',
            onOk: () => {
                const fileName = newFileOrDirectoryRef.current?.input?.value;
                if (!fileName || !fileName.trim()) {
                    message.warning('请输入文件名');
                    return;
                }
                electronAPI.createNotebookFile(`${curDir}/${fileName.trim()}`)
                    .then(() => {
                        message.success('文件创建成功');
                        refresh();
                    })
                    .catch(err => handleAPIError(err, 'createNotebookFile'));
            },
            cancelText: '取消',
        });
    };

    // 快速笔记功能
    const createQuickNote = async () => {
        try {
            // 确保 Quick Notes 文件夹存在
            const quickNotesDir = FILE_CONSTANTS.QUICK_NOTES_DIR;
            await electronAPI.createNotebookDir(quickNotesDir);

            // 生成文件名：使用当前时间戳
            const fileName = `${FILE_CONSTANTS.NOTE_PREFIX}${formatDateForFilename()}`;

            // 创建文件
            const filePath = `${quickNotesDir}/${fileName}`;
            await electronAPI.createNotebookFile(filePath);

            // 刷新并选中新文件
            refresh();

            // 通知用户
            logger.info(`创建快速笔记: ${filePath}`);
        } catch (error) {
            logger.error('创建快速笔记失败:', error);
        }
    };

    // 打开今日日记
    const openTodayJournal = async () => {
        try {
            // 创建今日日记（如果不存在）
            const journalPath = await electronAPI.createJournal();

            // 刷新文件列表
            refresh();

            // 选中并打开日记
            logger.info(`打开今日日记: ${journalPath}`);
        } catch (error) {
            logger.error('打开日记失败:', error);
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
            logger.error('加载标签失败:', err);
        });
    }, []);

    // 面包屑路径
    const pathParts = curDir.split("/").map((f, index, arr) => {
        const isRoot = f === '.';
        const displayName = isRoot ? '根目录' : f;
        const fullPath = isRoot ? '.' : arr.slice(0, index + 1).join('/');
        return { displayName, fullPath, isRoot };
    });

    return (
        <div className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary border-r border-notion-border dark:border-notion-dark-border">
            {/* 头部操作区 */}
            <div className="flex-shrink-0 p-4 space-y-3 border-b border-notion-border dark:border-notion-dark-border">
                {/* 快速操作按钮 */}
                <div className="flex gap-2">
                    <button
                        onClick={createQuickNote}
                        className="
                            flex-1 flex items-center justify-center gap-2
                            px-3 py-2.5 rounded-md
                            bg-notion-accent-green text-white
                            text-sm font-medium
                            hover:opacity-90
                            transition-opacity duration-fast
                        "
                    >
                        <ThunderboltOutlined />
                        快速笔记
                    </button>
                    <button
                        onClick={createDirectoryEvent}
                        className="
                            p-2.5 rounded-md
                            border border-notion-border dark:border-notion-dark-border
                            text-notion-text-secondary dark:text-notion-dark-text-secondary
                            hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                            hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
                            transition-colors duration-fast
                        "
                        title="创建文件夹"
                    >
                        <HddOutlined />
                    </button>
                    <button
                        onClick={createFileEvent}
                        className="
                            p-2.5 rounded-md
                            border border-notion-border dark:border-notion-dark-border
                            text-notion-text-secondary dark:text-notion-dark-text-secondary
                            hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                            hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
                            transition-colors duration-fast
                        "
                        title="创建文件"
                    >
                        <FileAddOutlined />
                    </button>
                </div>

                {/* 搜索框 */}
                <div className="relative">
                    <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-text-tertiary dark:text-notion-dark-text-tertiary" />
                    <input
                        type="text"
                        placeholder="搜索笔记..."
                        onChange={searchFunc}
                        className="
                            w-full pl-9 pr-3 py-2 rounded-md
                            bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary
                            text-notion-text-primary dark:text-notion-dark-text-primary
                            placeholder:text-notion-text-tertiary dark:placeholder:text-notion-dark-text-tertiary
                            text-sm
                            border-none outline-none
                            focus:ring-2 focus:ring-notion-accent-blue/30
                            transition-all duration-fast
                        "
                    />
                </div>

                {/* 标签筛选 */}
                {tags.length > 0 && (
                    <Collapse
                        ghost
                        defaultActiveKey={['tags']}
                        className="notion-collapse"
                    >
                        <Panel
                            header={
                                <span className="flex items-center gap-1.5 text-sm text-notion-text-secondary dark:text-notion-dark-text-secondary">
                                    <TagsOutlined />
                                    标签筛选
                                </span>
                            }
                            key="tags"
                        >
                            <div className="flex flex-wrap gap-1.5">
                                <span
                                    onClick={() => setSelectedTag(null)}
                                    className={`
                                        px-2 py-0.5 rounded text-xs cursor-pointer
                                        transition-colors duration-fast
                                        ${selectedTag === null
                                            ? 'bg-notion-accent-blue text-white'
                                            : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-secondary dark:text-notion-dark-text-secondary hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
                                        }
                                    `}
                                >
                                    全部
                                </span>
                                {tags.map(tag => (
                                    <span
                                        key={tag.name}
                                        onClick={() => setSelectedTag(tag.name)}
                                        className={`
                                            px-2 py-0.5 rounded text-xs cursor-pointer
                                            transition-colors duration-fast
                                            ${selectedTag === tag.name
                                                ? 'bg-notion-accent-blue text-white'
                                                : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-secondary dark:text-notion-dark-text-secondary hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
                                            }
                                        `}
                                    >
                                        #{tag.name} ({tag.count})
                                    </span>
                                ))}
                            </div>
                        </Panel>
                    </Collapse>
                )}

                {/* 面包屑路径 */}
                <div className="flex items-center gap-1 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary overflow-x-auto">
                    {pathParts.map((part, index) => (
                        <React.Fragment key={part.fullPath}>
                            {index > 0 && <span className="mx-0.5">/</span>}
                            <span
                                onClick={() => refresh({curDir: part.fullPath})}
                                className="
                                    px-1 py-0.5 rounded cursor-pointer whitespace-nowrap
                                    hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                                    hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
                                    transition-colors duration-fast
                                "
                            >
                                {part.displayName}
                            </span>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* 文件列表 */}
            <div className="flex-1 overflow-y-auto">
                {displayCwjsonList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                        <div className="text-3xl mb-2">📁</div>
                        <div className="text-sm">暂无笔记</div>
                        <div className="text-xs mt-1">点击"快速笔记"开始写作</div>
                    </div>
                ) : (
                    <div className="py-1">
                        {displayCwjsonList.map(item => (
                            <FileListItem
                                key={item.id}
                                item={item}
                                chooseCwjsonCallback={chooseCwjsonCallback}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileList;
