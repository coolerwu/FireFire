import React, {useState} from "react";
import {List} from "antd";
import './fileList.less';
import moment from "moment";

/**
 * @param cwjsonList 文件列表
 * @param chooseCwjsonCallback 选中文件的回调函数
 */
const FileList = ({cwjsonList, chooseCwjsonCallback}) => {
    //选择文章的hover样式
    const [chooseFileHover, setChooseFileHover] = useState(null);

    const renderItem = (item) => {
        const click = () => {
            setChooseFileHover(item.id);
            chooseCwjsonCallback(item);
        }

        return (
            <>
                <List.Item className={chooseFileHover === item.id ? 'listItem chooseListItem' : 'listItem'} onClick={click}>
                    <List.Item.Meta
                        title={item.id}
                        description={moment(item.updateTime).format('YYYY-MM-DD HH:mm:ss')}/>
                </List.Item>
            </>
        )
    }

    return (
        <>
            <List
                size="large"
                style={{height: '100vh'}}
                // header={<div>文章列表</div>}
                // footer={<div>Footer</div>}
                bordered
                dataSource={cwjsonList}
                renderItem={renderItem}
            />
        </>
    );
};

export default FileList;