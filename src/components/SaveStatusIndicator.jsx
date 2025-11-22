import React, { useState, useEffect } from 'react';
import { CheckCircleOutlined, LoadingOutlined, ExclamationCircleOutlined, CloudOutlined } from '@ant-design/icons';
import { subscribeSaveStatus, SaveStatus } from '../utils/cwjsonFileOp';

/**
 * 保存状态指示器组件
 */
const SaveStatusIndicator = ({ style }) => {
    const [status, setStatus] = useState(SaveStatus.IDLE);

    useEffect(() => {
        const unsubscribe = subscribeSaveStatus((newStatus) => {
            setStatus(newStatus);
        });
        return unsubscribe;
    }, []);

    const getStatusConfig = () => {
        switch (status) {
            case SaveStatus.PENDING:
                return {
                    icon: <CloudOutlined spin style={{ fontSize: 14 }} />,
                    text: '待保存',
                    color: '#faad14',
                };
            case SaveStatus.SAVING:
                return {
                    icon: <LoadingOutlined style={{ fontSize: 14 }} />,
                    text: '保存中...',
                    color: '#1890ff',
                };
            case SaveStatus.SAVED:
                return {
                    icon: <CheckCircleOutlined style={{ fontSize: 14 }} />,
                    text: '已保存',
                    color: '#52c41a',
                };
            case SaveStatus.ERROR:
                return {
                    icon: <ExclamationCircleOutlined style={{ fontSize: 14 }} />,
                    text: '保存失败',
                    color: '#ff4d4f',
                };
            default:
                return null;
        }
    };

    const config = getStatusConfig();

    if (!config) {
        return null;
    }

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: config.color,
                fontSize: '12px',
                transition: 'all 0.3s ease',
                ...style,
            }}
        >
            {config.icon}
            <span>{config.text}</span>
        </div>
    );
};

export default SaveStatusIndicator;
