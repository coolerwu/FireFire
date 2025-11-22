import React, { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

/**
 * 验证 URL 是否安全（只允许 http:// 和 https:// 协议）
 * @param {string} urlString - 要验证的 URL
 * @returns {{valid: boolean, url?: URL, error?: string}}
 */
const validateUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: '无效的 URL' };
  }

  try {
    const url = new URL(urlString);

    // 只允许 http 和 https 协议
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: `不支持的协议: ${url.protocol}` };
    }

    return { valid: true, url };
  } catch (error) {
    return { valid: false, error: 'URL 格式不正确' };
  }
};

const WebEmbedComponent = ({ node, deleteNode }) => {
  const { url } = node.attrs;
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useIframe, setUseIframe] = useState(false);
  const [urlError, setUrlError] = useState(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    // 验证 URL 安全性
    const validation = validateUrl(url);
    if (!validation.valid) {
      setUrlError(validation.error);
      setLoading(false);
      return;
    }

    // Try to fetch metadata using a simple approach
    // Since CORS will block most sites, we'll show a simple card with URL
    const hostname = validation.url.hostname;
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;

    setMetadata({
      title: hostname,
      description: url,
      favicon,
    });
    setUrlError(null);
    setLoading(false);
  }, [url]);

  if (!url || urlError) {
    return (
      <NodeViewWrapper className="web-embed-wrapper">
        <div className="web-embed-placeholder">
          {urlError || '无效的网页链接'}
        </div>
        <button
          className="embed-delete-button"
          onClick={deleteNode}
          contentEditable={false}
        >
          ✕
        </button>
      </NodeViewWrapper>
    );
  }

  // 再次验证 URL（防止状态更新期间的竞态条件）
  const urlValidation = validateUrl(url);
  if (!urlValidation.valid) {
    return (
      <NodeViewWrapper className="web-embed-wrapper">
        <div className="web-embed-placeholder">
          {urlValidation.error}
        </div>
        <button
          className="embed-delete-button"
          onClick={deleteNode}
          contentEditable={false}
        >
          ✕
        </button>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="web-embed-wrapper">
      {useIframe ? (
        <div className="web-embed-iframe-container">
          <iframe
            src={urlValidation.url.href}
            className="web-embed-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms"
            referrerPolicy="no-referrer"
            title={urlValidation.url.hostname}
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
