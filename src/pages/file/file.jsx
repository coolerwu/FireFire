import React, {useState} from "react";
import {Col, Empty, Row} from "antd";
import FileList from "./fileList";
import Markdown from "./markdown";

/**
 * @param fileList 文件列表
 */
const File = ({cwjsonList}) => {
    //当前选择的文件
    const [curCwjson, setCurCwjson] = useState(null);

    //选中文件的回调函数
    const chooseCwjsonCallback = (cwjson) => {
        setCurCwjson(cwjson);
    }

    return (
        <>
            <Row>
                <Col span={8}>
                    <FileList cwjsonList={cwjsonList} chooseCwjsonCallback={chooseCwjsonCallback}/>
                </Col>
                <Col span={16}>
                    {/*{curCwjson && <CwEditor cwjson={curCwjson}/>}*/}
                    {
                        curCwjson && <Markdown cwjson={curCwjson}/>
                    }
                    {
                        !curCwjson && <Empty/>
                    }
                </Col>
            </Row>
        </>
    );
}

export default File;