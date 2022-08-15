import {Button, Form, Input} from "antd";

/**
 * 创建文件
 * @param callback 刷新页面
 */
const CreateFile = ({callback}) => {
    //保存文件
    const saveFileFunc = (values) => {
        window.electronAPI.createNotebookFile(values.filename).then(res => {
            callback && callback();
        })
    }

    return (
        <>
            <Form labelCol={{span: 8}} wrapperCol={{span: 8}} onFinish={saveFileFunc} style={{marginTop: '40vh'}}>
                <Form.Item label={'文件名'} name={'filename'} rules={[{required: true}]}>
                    <Input/>
                </Form.Item>
                <Form.Item wrapperCol={{span: 12}} style={{marginLeft: '45%'}}>
                    <Button type="primary" htmlType="submit">
                        保存
                    </Button>
                </Form.Item>
            </Form>
        </>
    );
};

export default CreateFile;