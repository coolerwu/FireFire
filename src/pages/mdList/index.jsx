import {getFileList} from "../../common/global";
import {Button, Col, List, Row} from "antd";
import './index.less';
import {useEffect, useState} from "react";
import Markdown from "../markdown";
import {DeleteOutlined} from "@ant-design/icons";

const MdList = ({jumpFunc, needLoad, chooseFile}) => {
    //左span
    const [leftSpan, setLeftSpan] = useState(24);
    //右span
    const [rightSpan, setRightSpan] = useState(0);
    //文件
    const [file, setFile] = useState(null);
    //文件内容
    const [fileContent, setFileContent] = useState(null);

    const loadMore =
        (
            <div
                style={{
                    textAlign: 'center',
                    marginTop: 12,
                    height: 32,
                    lineHeight: '32px',
                }}
            >
                {/*<Button>loading more</Button>*/}
            </div>
        );

    const jumpEditFileFunc = fileLocal => {
        if (fileLocal?.name === file?.name) {
            setLeftSpan(24);
            setRightSpan(0);
            setFile(null);
            setFileContent(null);
            return
        }

        setRightSpan(0);
        setFile(fileLocal);
        window.electronAPI.opFile(2, fileLocal.value).then(res => {
            setFileContent(res);

            setLeftSpan(6);
            setRightSpan(18);
        })
    };

    const deleteFileFunc = file => {
        window.electronAPI.opFile(5, file.value).then(res => {
            setRightSpan(0);
            setLeftSpan(24);

            needLoad(null)
        })
    }

    useEffect(() => {
        if (chooseFile) {
            const ff = getFileList().filter(file => file.name === chooseFile);
            if (ff && ff.length > 0) {
                jumpEditFileFunc(ff[0]);
            }
        }
    }, [chooseFile]);

    return (
        <>
            <Row>
                <Col span={leftSpan}>
                    <List
                        // className="demo-loadmore-list"
                        itemLayout="horizontal"
                        loadMore={loadMore}
                        dataSource={getFileList()}
                        renderItem={item => (
                            <List.Item className={file?.name === item?.name ? 'listItem listItemHover' : 'listItem'}
                                       onClick={() => jumpEditFileFunc(item)}
                                       actions={[<Button type={'text'} onClick={() => deleteFileFunc(item)}><DeleteOutlined/></Button>]}>
                                <List.Item.Meta
                                    title={item.name}
                                />
                            </List.Item>
                        )}
                    />
                </Col>
                {
                    rightSpan !== 0 && <Col span={rightSpan} className={'detail'}>
                        <Markdown file={file} fileContent={fileContent} needLoad={needLoad}/>
                    </Col>
                }
            </Row>
        </>
    );
}


export default MdList;