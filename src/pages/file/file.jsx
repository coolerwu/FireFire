import React, {useState, useEffect, useRef} from "react";
import Timeline from "./timeline";
import Markdown from "./markdown";

/**
 * @param fileList 文件列表
 * @param initialNote 初始选中的笔记（用于新建笔记后自动打开）
 * @param onNoteOpened 笔记打开后的回调
 */
const File = ({cwjsonList, initialNote, onNoteOpened}) => {
    //当前选择的文件
    const [curCwjson, setCurCwjson] = useState(null);
    const processedNoteRef = useRef(null);

    // 处理初始笔记
    useEffect(() => {
        if (initialNote && initialNote.id !== processedNoteRef.current) {
            processedNoteRef.current = initialNote.id;
            setCurCwjson(initialNote);
            onNoteOpened?.();
        }
    }, [initialNote, onNoteOpened]);

    const chooseCwjsonCallback = (cwjson) => {
        setCurCwjson(cwjson);
    }

    return (
        <div style={{display: 'flex', height: '100vh', overflow: 'hidden'}}>
            {/* 左侧：时间线视图 */}
            <div style={{width: curCwjson ? '400px' : '100%', height: '100%', overflow: 'hidden', transition: 'width 0.3s ease'}}>
                <Timeline chooseCwjsonCallback={chooseCwjsonCallback}/>
            </div>
            {/* 右侧：编辑器（仅在选中文件时显示） */}
            {curCwjson && (
                <div style={{width: 'calc(100% - 400px)', height: '100%', overflow: 'hidden', borderLeft: '1px solid #e5e5e5'}}>
                    <Markdown cwjson={curCwjson}/>
                </div>
            )}
        </div>
    );
}

export default File;