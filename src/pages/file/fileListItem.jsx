import {Input, message, Modal} from "antd";
import {DeleteOutlined, EditOutlined, FolderOutlined, FileTextOutlined, MoreOutlined} from "@ant-design/icons";
import moment from "moment/moment";
import {Context} from "../../index";
import {useContext, useRef, useState} from "react";
import {electronAPI} from "../../utils/electronAPI";

const FileListItem = ({item, chooseCwjsonCallback}) => {
    //上下文
    const {refresh, curDir} = useContext(Context);

    //选中状态
    const [isSelected, setIsSelected] = useState(false);
    const [showActions, setShowActions] = useState(false);

    //重命名文件
    const renameFileRef = useRef(null);
    const renameFunc = (e) => {
        e.stopPropagation();
        Modal.confirm({
            title: `重命名`,
            icon: <EditOutlined/>,
            content: <Input ref={renameFileRef} defaultValue={item.id} className="mt-2"/>,
            okText: '确认',
            onOk: () => {
                const newName = renameFileRef.current?.input?.value;
                if (!newName || newName === item.id) return;
                electronAPI.renameNotebookFile(`${curDir}/${item.id}`, `${curDir}/${newName}`).then(res => {
                    if (res) {
                        refresh();
                    } else {
                        message.error('重命名失败');
                    }
                })
            },
            cancelText: '取消',
        });
    };

    //删除文件
    const deleteFunc = (e) => {
        e.stopPropagation();
        Modal.confirm({
            title: `删除${item.isDirectory ? '文件夹' : '文件'}`,
            content: `确定删除「${item.id}」吗？此操作不可撤销。`,
            okText: '删除',
            okButtonProps: { danger: true },
            onOk: () => {
                const deletePromise = item.isDirectory
                    ? electronAPI.deleteDirectory(`${curDir}/${item.id}`)
                    : electronAPI.deleteNotebookFile(`${curDir}/${item.id}`);

                deletePromise.then(res => {
                    if (res) {
                        refresh();
                        message.success('删除成功');
                    } else {
                        message.error('删除失败');
                    }
                });
            },
            cancelText: '取消',
        });
    };

    //点击文件/文件夹
    const handleClick = () => {
        if (item.isDirectory) {
            refresh({curDir: `${curDir}/${item.filename}`});
        } else {
            setIsSelected(true);
            chooseCwjsonCallback(item);
        }
    };

    return (
        <div
            onClick={handleClick}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className={`
                group flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-md
                cursor-pointer select-none
                transition-colors duration-fast
                ${isSelected
                    ? 'bg-notion-bg-selected dark:bg-notion-dark-bg-selected'
                    : 'hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
                }
            `}
        >
            {/* 图标 */}
            <div className={`
                flex-shrink-0 w-5 h-5 flex items-center justify-center
                ${item.isDirectory
                    ? 'text-notion-accent-blue'
                    : 'text-notion-text-tertiary dark:text-notion-dark-text-tertiary'
                }
            `}>
                {item.isDirectory ? <FolderOutlined /> : <FileTextOutlined />}
            </div>

            {/* 文件名和信息 */}
            <div className="flex-1 min-w-0">
                <div className="text-sm text-notion-text-primary dark:text-notion-dark-text-primary truncate font-medium">
                    {item.id}
                </div>
                <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-0.5">
                    {moment(item.updateTime).format('MM-DD HH:mm')}
                    {item.isDirectory && <span className="ml-2">文件夹</span>}
                </div>
            </div>

            {/* 操作按钮 */}
            <div className={`
                flex-shrink-0 flex items-center gap-1
                transition-opacity duration-fast
                ${showActions ? 'opacity-100' : 'opacity-0'}
            `}>
                <button
                    onClick={renameFunc}
                    className="
                        p-1.5 rounded
                        text-notion-text-tertiary dark:text-notion-dark-text-tertiary
                        hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                        hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
                        transition-colors duration-fast
                    "
                    title="重命名"
                >
                    <EditOutlined className="text-xs" />
                </button>
                <button
                    onClick={deleteFunc}
                    className="
                        p-1.5 rounded
                        text-notion-text-tertiary dark:text-notion-dark-text-tertiary
                        hover:bg-notion-accent-red/10
                        hover:text-notion-accent-red
                        transition-colors duration-fast
                    "
                    title="删除"
                >
                    <DeleteOutlined className="text-xs" />
                </button>
            </div>
        </div>
    );
}

export default FileListItem;
