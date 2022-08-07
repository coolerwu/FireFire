import {getSetting, setSetting, SUCCESS} from "../../common/global";
import {Button, Form, Input} from "antd";
import './index.less';
import {useEffect, useRef} from "react";

const Setting = ({needLoadApp}) => {
    const settingFormRef = useRef(null);

    useEffect(() => {
        settingFormRef?.current?.setFieldsValue(getSetting());
    }, [])

    const onFinishFunc = async (values) => {
        window.electronAPI.opFile(8, null, values).then(res => {
            if (SUCCESS === res) {
                setSetting(values);
                needLoadApp && needLoadApp();
            }
        })
    };

    return (
        <>
            <Form className={'settingForm'} ref={settingFormRef} onFinish={onFinishFunc}>
                <Form.Item label={'notebook地址'} name={'notebookPath'}>
                    <Input/>
                </Form.Item>

                <Form.Item label={'标签地址'} name={'tagPath'}>
                    <Input/>
                </Form.Item>

                <Form.Item wrapperCol={{span: 12, offset: 10}}>
                    <Button type="primary" htmlType="submit">
                        保存
                    </Button>
                </Form.Item>
            </Form>
        </>
    );
}


export default Setting;