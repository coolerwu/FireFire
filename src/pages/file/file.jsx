import React, {useState} from "react";
import {Empty} from "antd";
import Timeline from "./timeline";
import Markdown from "./markdown";

/**
 * @param fileList 文件列表
 */
const File = ({cwjsonList}) => {
    //当前选择的文件
    const [curCwjson, setCurCwjson] = useState(null);
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