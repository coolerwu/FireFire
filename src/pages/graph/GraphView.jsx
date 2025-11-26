import React, { useCallback, useEffect, useState, useRef, useContext } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { electronAPI } from '../../utils/electronAPI';
import { Spin, Input, Select, Empty, Tooltip } from 'antd';
import { SearchOutlined, ZoomInOutlined, ZoomOutOutlined, AimOutlined } from '@ant-design/icons';
import { Context } from '../../index';

// 标签颜色映射
const TAG_COLORS = [
    '#0f7b6c', // green (primary)
    '#2563eb', // blue
    '#dc2626', // red
    '#9333ea', // purple
    '#ea580c', // orange
    '#0891b2', // cyan
    '#65a30d', // lime
    '#db2777', // pink
    '#4f46e5', // indigo
    '#ca8a04', // yellow
];

const DEFAULT_NODE_COLOR = '#9ca3af'; // gray

const getTagColor = (tag, tagColorMap) => {
    if (!tag) return DEFAULT_NODE_COLOR;
    if (!tagColorMap.has(tag)) {
        const colorIndex = tagColorMap.size % TAG_COLORS.length;
        tagColorMap.set(tag, TAG_COLORS[colorIndex]);
    }
    return tagColorMap.get(tag);
};

const GraphView = () => {
    const { setActiveKey, setting, setEditingNote } = useContext(Context);
    const graphRef = useRef();
    const containerRef = useRef();
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const [allTags, setAllTags] = useState([]);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const tagColorMapRef = useRef(new Map());

    // 加载图谱数据
    const loadGraphData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await electronAPI.getGraphData();
            setGraphData(data);

            // 提取所有标签
            const tags = new Set();
            data.nodes.forEach(node => {
                if (node.tags) {
                    node.tags.forEach(tag => tags.add(tag));
                }
            });
            setAllTags(Array.from(tags));
        } catch (error) {
            console.error('加载图谱数据失败:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGraphData();
    }, [loadGraphData]);

    // 响应容器尺寸变化
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight - 60, // 减去控制栏高度
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // 过滤数据
    const filteredData = React.useMemo(() => {
        let nodes = graphData.nodes;
        let links = graphData.links;

        // 按标签过滤
        if (selectedTag) {
            const filteredNodeIds = new Set(
                nodes
                    .filter(n => n.tags && n.tags.includes(selectedTag))
                    .map(n => n.id)
            );

            // 也包含与筛选节点有链接的节点
            links.forEach(link => {
                if (filteredNodeIds.has(link.source) || filteredNodeIds.has(link.source?.id)) {
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    filteredNodeIds.add(targetId);
                }
                if (filteredNodeIds.has(link.target) || filteredNodeIds.has(link.target?.id)) {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                    filteredNodeIds.add(sourceId);
                }
            });

            nodes = nodes.filter(n => filteredNodeIds.has(n.id));
            links = links.filter(l => {
                const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
            });
        }

        // 按搜索文本过滤（高亮而非隐藏）
        if (searchText) {
            nodes = nodes.map(n => ({
                ...n,
                _highlighted: n.name.toLowerCase().includes(searchText.toLowerCase()),
            }));
        }

        return { nodes, links };
    }, [graphData, selectedTag, searchText]);

    // 点击节点跳转
    const handleNodeClick = useCallback(async (node) => {
        if (node.type === 'journal') {
            // 跳转到日记页面
            setActiveKey('journal');
            // 滚动到对应日记
            setTimeout(() => {
                const targetElement = document.querySelector(`[data-journal-id="${node.id}"]`);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            // 打开笔记编辑器
            try {
                const settingInfo = await electronAPI.readSettingFile();
                const suffix = settingInfo.notebookSuffix || '.md';

                const noteInfo = {
                    id: node.id,
                    filename: node.id + suffix,
                    type: 'file',
                    notebookPath: `${settingInfo.notebookPath}/${node.id}${suffix}`,
                    attachmentPath: `${settingInfo.attachmentPath}/${node.id}`,
                };

                setEditingNote(noteInfo);
                setActiveKey('editor');
            } catch (error) {
                console.error('打开笔记失败:', error);
            }
        }
    }, [setActiveKey, setEditingNote]);

    // 节点绘制
    const paintNode = useCallback((node, ctx, globalScale) => {
        const label = node.name || node.id;
        const fontSize = 12 / globalScale;
        const nodeSize = Math.sqrt(node.val || 1) * 4;

        // 获取节点颜色
        let color = DEFAULT_NODE_COLOR;
        if (node.tags && node.tags.length > 0) {
            color = getTagColor(node.tags[0], tagColorMapRef.current);
        }

        // 高亮效果
        const isHighlighted = node._highlighted;
        const isHovered = hoveredNode?.id === node.id;

        // 绘制节点
        ctx.beginPath();

        if (node.type === 'journal') {
            // 日记节点用方形
            const size = nodeSize * 1.5;
            ctx.rect(node.x - size / 2, node.y - size / 2, size, size);
        } else {
            // 普通笔记用圆形
            ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
        }

        ctx.fillStyle = isHighlighted || isHovered ? color : color + '99';
        ctx.fill();

        // 高亮边框
        if (isHighlighted || isHovered) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }

        // 标签（只在放大到一定程度时显示）
        if (globalScale > 0.5 || isHovered) {
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = isHovered ? '#000' : '#666';
            ctx.fillText(label.slice(0, 20), node.x, node.y + nodeSize + 2);
        }
    }, [hoveredNode]);

    // 缩放控制
    const handleZoomIn = () => {
        if (graphRef.current) {
            graphRef.current.zoom(1.5, 400);
        }
    };

    const handleZoomOut = () => {
        if (graphRef.current) {
            graphRef.current.zoom(0.67, 400);
        }
    };

    const handleCenterGraph = () => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(400, 50);
        }
    };

    // 搜索定位
    useEffect(() => {
        if (searchText && graphRef.current && filteredData.nodes.length > 0) {
            const matchedNode = filteredData.nodes.find(n => n._highlighted);
            if (matchedNode) {
                graphRef.current.centerAt(matchedNode.x, matchedNode.y, 500);
                graphRef.current.zoom(2, 500);
            }
        }
    }, [searchText, filteredData.nodes]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                <Spin size="large" tip="加载知识图谱..." />
            </div>
        );
    }

    if (graphData.nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                <Empty description="暂无笔记数据，创建一些笔记后即可查看知识图谱" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
            {/* 控制栏 */}
            <div className="flex-shrink-0 h-14 px-4 flex items-center gap-4 border-b border-notion-border dark:border-notion-dark-border">
                <h2 className="text-lg font-semibold text-notion-text-primary dark:text-notion-dark-text-primary">
                    知识图谱
                </h2>

                <Input
                    prefix={<SearchOutlined className="text-notion-text-tertiary" />}
                    placeholder="搜索笔记..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="w-48"
                    allowClear
                />

                <Select
                    placeholder="按标签筛选"
                    value={selectedTag}
                    onChange={setSelectedTag}
                    allowClear
                    className="w-36"
                    options={allTags.map(tag => ({ value: tag, label: tag }))}
                />

                <div className="flex-1" />

                <div className="flex items-center gap-1">
                    <Tooltip title="放大">
                        <button
                            onClick={handleZoomIn}
                            className="p-2 rounded hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover text-notion-text-secondary"
                        >
                            <ZoomInOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title="缩小">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 rounded hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover text-notion-text-secondary"
                        >
                            <ZoomOutOutlined />
                        </button>
                    </Tooltip>
                    <Tooltip title="居中">
                        <button
                            onClick={handleCenterGraph}
                            className="p-2 rounded hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover text-notion-text-secondary"
                        >
                            <AimOutlined />
                        </button>
                    </Tooltip>
                </div>

                <span className="text-xs text-notion-text-tertiary">
                    {filteredData.nodes.length} 节点 / {filteredData.links.length} 链接
                </span>
            </div>

            {/* 图谱区域 */}
            <div className="flex-1 relative">
                <ForceGraph2D
                    ref={graphRef}
                    graphData={filteredData}
                    width={dimensions.width}
                    height={dimensions.height}
                    nodeCanvasObject={paintNode}
                    nodePointerAreaPaint={(node, color, ctx) => {
                        const nodeSize = Math.sqrt(node.val || 1) * 4;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeSize + 5, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.fill();
                    }}
                    onNodeClick={handleNodeClick}
                    onNodeHover={setHoveredNode}
                    linkColor={() => '#e5e7eb'}
                    linkWidth={1}
                    linkDirectionalArrowLength={4}
                    linkDirectionalArrowRelPos={1}
                    cooldownTicks={100}
                    onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
                    backgroundColor="transparent"
                />

                {/* 悬浮信息 */}
                {hoveredNode && (
                    <div className="absolute bottom-4 left-4 p-3 bg-white dark:bg-notion-dark-bg-secondary rounded-lg shadow-lg border border-notion-border dark:border-notion-dark-border max-w-xs">
                        <div className="font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-1">
                            {hoveredNode.name}
                        </div>
                        {hoveredNode.tags && hoveredNode.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {hoveredNode.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{
                                            backgroundColor: getTagColor(tag, tagColorMapRef.current) + '20',
                                            color: getTagColor(tag, tagColorMapRef.current),
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="text-xs text-notion-text-tertiary mt-1">
                            {hoveredNode.type === 'journal' ? '日记' : '笔记'} · {hoveredNode.val} 个链接
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphView;
