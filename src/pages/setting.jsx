import React, {useContext, useEffect, useRef} from "react";
import {Button, Col, Form, InputNumber, Radio, Row} from "antd";
import './setting.less';
import {Context} from "../index";

const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
};

const Setting = () => {
    const {setLoad, setActiveKey, setting} = useContext(Context);
    //表单ref
    const formRef = useRef(null);

    useEffect(() => {
        formRef.current.setFieldsValue({...setting});
    }, [setting]);

    const onFinish = (values) => {
        setting.themeSource = values.themeSource
        setting.autoSave = values.autoSave
        window.electronAPI.writeSettingFile(setting);
        setLoad(true);
        setActiveKey('100');
    };

    return (
        <>
            <Form {...layout} name="setting" onFinish={onFinish} ref={formRef}>
                <Row>
                    <Col span={18} offset={3}>
                        <Form.Item name="themeSource" label="模式">
                            <Radio.Group>
                                <Radio value="light">明亮模式</Radio>
                                <Radio value="dark">暗黑模式</Radio>
                                <Radio value="system">跟随系统</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col span={18} offset={3}>
                        <Form.Item name="autoSave" label="自动保存时间间隔">
                            <InputNumber addonAfter={'s'} min={1} max={60}/>
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col span={18} offset={3}>
                        <Form.Item wrapperCol={{span: 12, offset: 6}}>
                            <Button type="primary" htmlType="submit">
                                Submit
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </>
    );
}

export default Setting;