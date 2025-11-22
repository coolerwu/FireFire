import React from 'react';
import { Result, Button } from 'antd';
import {logger} from '../utils/logger';

/**
 * 全局错误边界组件
 * 捕获子组件树中的 JavaScript 错误，显示降级 UI
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // 更新 state 使下一次渲染能够显示降级后的 UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // 记录错误信息
        logger.error('[ErrorBoundary] 捕获到错误:', error);
        logger.error('[ErrorBoundary] 错误信息:', errorInfo);

        this.setState({ errorInfo });

        // 可以在这里上报错误到日志服务
        // logErrorToService(error, errorInfo);
    }

    handleReload = () => {
        // 重新加载页面
        window.location.reload();
    };

    handleRetry = () => {
        // 重置错误状态，尝试重新渲染
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            const { error } = this.state;
            const { fallback } = this.props;

            // 如果提供了自定义 fallback，使用它
            if (fallback) {
                return fallback;
            }

            // 默认错误 UI
            return (
                <div style={{
                    padding: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '300px',
                }}>
                    <Result
                        status="error"
                        title="页面出错了"
                        subTitle={error?.message || '发生了意外错误，请尝试刷新页面'}
                        extra={[
                            <Button
                                type="primary"
                                key="retry"
                                onClick={this.handleRetry}
                            >
                                重试
                            </Button>,
                            <Button
                                key="reload"
                                onClick={this.handleReload}
                            >
                                刷新页面
                            </Button>,
                        ]}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
