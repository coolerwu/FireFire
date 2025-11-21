import React, { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const WebEmbedComponent = ({ node, deleteNode }) => {
  const { url } = node.attrs;
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useIframe, setUseIframe] = useState(false);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    // Try to fetch metadata using a simple approach
    // Since CORS will block most sites, we'll show a simple card with URL
    const hostname = new URL(url).hostname;
    const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;

    setMetadata({
      title: hostname,
      description: url,
      favicon,
    });
    setLoading(false);
  }, [url]);

  if (!url) {
    return (
      <NodeViewWrapper className="web-embed-wrapper">
        <div className="web-embed-placeholder">
          无效的网页链接
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="web-embed-wrapper">
      {useIframe ? (
        <div className="web-embed-iframe-container">
          <iframe
            src={url}
            className="web-embed-iframe"
            sandbox="allow-scripts allow-same-origin"
            title={url}
          />
          <div className="web-embed-controls">
            <button
              onClick={() => setUseIframe(false)}
              className="web-embed-button"
            >
              显示卡片
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="web-embed-button"
            >
              新窗口打开
            </a>
          </div>
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="web-embed-card"
        >
          {loading ? (
            <div className="web-embed-loading">加载中...</div>
          ) : metadata ? (
            <>
              <div className="web-embed-content">
                <div className="web-embed-header">
                  {metadata.favicon && (
                    <img
                      src={metadata.favicon}
                      alt=""
                      className="web-embed-favicon"
                    />
                  )}
                  <h4 className="web-embed-title">{metadata.title}</h4>
                </div>
                <p className="web-embed-description">{metadata.description}</p>
              </div>
              <div className="web-embed-controls">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setUseIframe(true);
                  }}
                  className="web-embed-button"
                >
                  显示网页
                </button>
              </div>
            </>
          ) : (
            <div className="web-embed-error">无法加载预览</div>
          )}
        </a>
      )}
      <button
        className="embed-delete-button"
        onClick={deleteNode}
        contentEditable={false}
      >
        ✕
      </button>
    </NodeViewWrapper>
  );
};

export default WebEmbedComponent;
