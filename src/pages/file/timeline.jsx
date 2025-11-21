import React, { useState, useEffect, useContext, useCallback } from "react";
import { List, Card, Typography, Space, Button } from "antd";
import { ClockCircleOutlined, EditOutlined } from "@ant-design/icons";
import { Context } from "../../index";
import { electronAPI } from "../../utils/electronAPI";
import dayjs from "dayjs";
import "./timeline.less";

const { Title, Text } = Typography;

/**
 * 单个日记卡片组件
 */
const JournalCard = ({ journal, chooseCwjsonCallback, theme }) => {
    const [textPreview, setTextPreview] = useState('');

    useEffect(() => {
        const loadContent = async () => {
            try {
                const jsonContent = await electronAPI.readNotebookFile(journal.id);
                const parsed = JSON.parse(jsonContent);

                // 提取纯文本预览
                const extractTextContent = (tiptapJSON) => {
                    if (!tiptapJSON || !tiptapJSON.content) return '';

                    let text = '';
                    const traverse = (node) => {
                        if (node.type === 'text') {
                            text += node.text;
                        }
                        if (node.content) {
                            node.content.forEach(traverse);
                        }
                    };

                    traverse(tiptapJSON);
                    return text;
                };

                const text = extractTextContent(parsed);
                setTextPreview(text);
            } catch (error) {
                console.error('[Timeline] 读取笔记失败:', error);
                setTextPreview('加载失败');
            }
        };

        loadContent();
    }, [journal.id]);

    return (
        <Card
            hoverable
            style={{
                marginBottom: '20px',
                borderRadius: '12px',
                boxShadow: `0 2px 8px ${theme.boxShadowColor}`,
                cursor: 'pointer',
            }}
            onClick={() => {
                chooseCwjsonCallback({
                    id: journal.id,
                    type: 'file',
                });
            }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* 标题和时间 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        {journal.title || journal.id}
                    </Title>
                    <Space>
                        <ClockCircleOutlined />
                        <Text type="secondary">
                            {dayjs(journal.updatedAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                    </Space>
                </div>

                {/* 笔记内容 */}
                <div style={{
                    maxHeight: 'none',
                    overflow: 'visible',
                    lineHeight: '1.8',
                    color: 'var(--fg-secondary, #525252)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}>
                    {textPreview || '正在加载...'}
                </div>

                {/* 编辑按钮 */}
                <div style={{ textAlign: 'right', marginTop: '12px' }}>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            chooseCwjsonCallback({
                                id: journal.id,
                                type: 'file',
                            });
                        }}
                    >
                        编辑
                    </Button>
                </div>
            </Space>
        </Card>
    );
};

/**
 * 时间线视图 - 显示所有笔记内容
 * @param chooseCwjsonCallback 选择文件的回调
 */
const Timeline = ({ chooseCwjsonCallback }) => {
    const { theme } = useContext(Context);
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 10;

    // 加载日记
    const loadJournals = useCallback(async (reset = false) => {
        if (loading) return;

        setLoading(true);
        try {
            const currentOffset = reset ? 0 : offset;
            const result = await electronAPI.getJournals(limit, currentOffset);

            if (reset) {
                setJournals(result);
                setOffset(limit);
            } else {
                setJournals([...journals, ...result]);
                setOffset(offset + limit);
            }

            setHasMore(result.length === limit);
        } catch (error) {
            console.error('[Timeline] 加载失败:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, offset, journals, limit]);

    useEffect(() => {
        loadJournals(true);
    }, [loadJournals]);

    return (
        <div style={{
            height: '100%',
            overflow: 'auto',
            padding: '20px',
            backgroundColor: 'var(--bg, #ffffff)',
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <Title level={2} style={{ marginBottom: '24px' }}>
                    <ClockCircleOutlined style={{ marginRight: '12px' }} />
                    时间线
                </Title>

                <List
                    loading={loading}
                    dataSource={journals}
                    renderItem={(journal) => (
                        <List.Item key={journal.id} style={{ border: 'none', padding: 0 }}>
                            <JournalCard
                                journal={journal}
                                chooseCwjsonCallback={chooseCwjsonCallback}
                                theme={theme}
                            />
                        </List.Item>
                    )}
                    locale={{ emptyText: '暂无内容' }}
                />

                {hasMore && (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Button onClick={() => loadJournals()} loading={loading}>
                            加载更多
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timeline;
