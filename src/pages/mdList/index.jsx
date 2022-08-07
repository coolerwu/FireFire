import {getFileList, getSetting} from "../../common/global";
import {Avatar, Breadcrumb, Button, Card, Col, List, Row, Tooltip} from "antd";
import './index.less';
import {useEffect, useState} from "react";
import Markdown from "../markdown";
import {DeleteOutlined, FileOutlined, FolderOutlined, HomeOutlined} from "@ant-design/icons";

const MdList = ({jumpFunc, needLoad, chooseFile}) => {
    //左span
    const [leftSpan, setLeftSpan] = useState(24);
    //右span
    const [rightSpan, setRightSpan] = useState(0);
    //文件
    const [file, setFile] = useState(null);
    //文件内容
    const [fileContent, setFileContent] = useState(null);
    //文件列表
    const [fileList, setFileList] = useState(getFileList());
    //文件路径
    const [filePathList, setFilePathList] = useState([
        {
            value: getSetting().notebookPath,
            label: <HomeOutlined/>,
            file: {
                files: getFileList()
            },
        }
    ]);

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

    const jumpDirectoryFunc = fileLocal => {
        // fileLocal
        setFileList(fileLocal?.files);

        if (fileLocal === filePathList[0].file) {
            return
        }

        setFilePathList([...filePathList, {
            label: fileLocal.name,
            value: fileLocal.fullPath,
            file: fileLocal,
        }]);
    }

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

    const jumpDirectoryLevelFunc = (value) => {
        let target = filePathList[0];

        while (filePathList.length !== 1) {
            const pop = filePathList.pop();
            if (pop.value === value) {
                target = pop;
            }
        }

        if (target === filePathList[0]) {
            jumpDirectoryFunc(target.file);
            return
        }

        setFilePathList(filePathList);
        jumpDirectoryFunc(target.file);
    }

    return (
        <>
            <Row>
                <Col span={24}>
                    <Card className={'header'} bordered={false}>
                        <Breadcrumb>
                            {
                                filePathList.map((filePath, index) => {
                                    return (
                                        <Breadcrumb.Item key={index} onClick={() => jumpDirectoryLevelFunc(filePath.value)}><Tooltip
                                            title={filePath.value}>{filePath.label}</Tooltip></Breadcrumb.Item>
                                    );
                                })
                            }
                        </Breadcrumb>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col span={leftSpan}>
                    <List
                        itemLayout="horizontal"
                        loadMore={loadMore}
                        dataSource={fileList}
                        renderItem={item => (
                            <List.Item className={file?.name === item?.name ? 'listItem listItemHover' : 'listItem'}
                                       onClick={() => item.directory ? jumpDirectoryFunc(item) : jumpEditFileFunc(item)}
                                       actions={[(!item.directory || !item.files || item.files.length === 0) && <Button type={'text'} onClick={(e) => {
                                           deleteFileFunc(item);
                                           e.stopPropagation();
                                       }}><DeleteOutlined/></Button>]}>
                                <List.Item.Meta
                                    avatar={item.directory ? <Avatar style={{backgroundColor: 'rgb(193,210,240)'}}><FolderOutlined/></Avatar> :
                                        <Avatar style={{backgroundColor: 'gray', color: 'black'}}><FileOutlined/></Avatar>}
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