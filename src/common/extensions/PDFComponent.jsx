import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFComponent = ({ node, deleteNode }) => {
  const { src } = node.attrs;
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setError('无法加载 PDF 文件');
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages || 1, prev + 1));
  };

  if (!src) {
    return (
      <NodeViewWrapper className="pdf-embed-wrapper">
        <div className="pdf-embed-placeholder">
          无效的 PDF 文件路径
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="pdf-embed-wrapper">
      <div className="pdf-embed-container">
        {error ? (
          <div className="pdf-embed-error">{error}</div>
        ) : (
          <>
            <Document
              file={src}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="pdf-embed-loading">加载中...</div>}
            >
              <Page
                pageNumber={pageNumber}
                width={680}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
            {numPages && (
              <div className="pdf-controls">
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="pdf-control-button"
                >
                  上一页
                </button>
                <span className="pdf-page-info">
                  {pageNumber} / {numPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="pdf-control-button"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
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
};

export default PDFComponent;
