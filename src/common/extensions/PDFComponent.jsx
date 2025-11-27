import React, { useState, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Document, Page, pdfjs } from 'react-pdf';
import { logger } from '../../utils/logger';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFComponent = ({ node, deleteNode }) => {
  const { src } = node.attrs;
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    logger.error('PDF load error:', error);
    setError('无法加载 PDF 文件');
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages || 1, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(2.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  React.useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen, handleKeyDown]);

  if (!src) {
    return (
      <NodeViewWrapper className="pdf-embed-wrapper">
        <div className="pdf-embed-placeholder">
          无效的 PDF 文件路径
        </div>
      </NodeViewWrapper>
    );
  }

  const pdfContent = (
    <div className={`pdf-embed-container ${isFullscreen ? 'pdf-fullscreen' : ''}`}>
      {error ? (
        <div className="pdf-embed-error">{error}</div>
      ) : (
        <>
          <div className="pdf-document-wrapper" style={{ transform: `scale(${isFullscreen ? 1 : scale})`, transformOrigin: 'top center' }}>
            <Document
              file={src}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="pdf-embed-loading">加载中...</div>}
            >
              <Page
                pageNumber={pageNumber}
                width={isFullscreen ? Math.min(window.innerWidth * 0.9, 1200) : 680}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
          {numPages && (
            <div className="pdf-controls">
              <div className="pdf-controls-group">
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="pdf-control-button"
                  title="上一页"
                >
                  ◀
                </button>
                <span className="pdf-page-info">
                  {pageNumber} / {numPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="pdf-control-button"
                  title="下一页"
                >
                  ▶
                </button>
              </div>
              <div className="pdf-controls-group">
                <button
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  className="pdf-control-button"
                  title="缩小"
                >
                  −
                </button>
                <span className="pdf-zoom-info">{Math.round(scale * 100)}%</span>
                <button
                  onClick={zoomIn}
                  disabled={scale >= 2.0}
                  className="pdf-control-button"
                  title="放大"
                >
                  +
                </button>
              </div>
              <button
                onClick={toggleFullscreen}
                className="pdf-control-button pdf-fullscreen-button"
                title={isFullscreen ? '退出全屏 (Esc)' : '全屏预览'}
              >
                {isFullscreen ? '✕' : '⛶'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <>
        <NodeViewWrapper className="pdf-embed-wrapper">
          <div className="pdf-embed-placeholder">PDF 全屏预览中...</div>
        </NodeViewWrapper>
        <div className="pdf-fullscreen-overlay" onClick={(e) => e.target === e.currentTarget && toggleFullscreen()}>
          {pdfContent}
        </div>
      </>
    );
  }

  return (
    <NodeViewWrapper className="pdf-embed-wrapper">
      {pdfContent}
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

export default PDFComponent;
