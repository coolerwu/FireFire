import React, {useState} from "react";
import {Empty} from "antd";
import FileList from "./fileList";
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
            <div style={{width: '240px', height: '100%', overflow: 'hidden'}}>
                <FileList cwjsonList={cwjsonList} chooseCwjsonCallback={chooseCwjsonCallback}/>
            </div>
            <div style={{width: 'calc(100% - 240px)', height: '100%', overflow: 'hidden'}}>
                {/*{curCwjson && <CwEditor cwjson={curCwjson}/>}*/}
                {curCwjson && <Markdown cwjson={curCwjson}/>}
                {!curCwjson && <div style={{marginTop: '40vh', marginLeft: 'auto'}}><Empty/></div>}
            </div>
        </div>
    );
}

export default File;