import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const YouTubeComponent = ({ node, deleteNode }) => {
  const { videoId } = node.attrs;

  if (!videoId) {
    return (
      <NodeViewWrapper className="youtube-embed-wrapper">
        <div className="youtube-embed-placeholder">
          无效的 YouTube 视频 ID
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="youtube-embed-wrapper">
      <div className="youtube-embed-container">
        <iframe
          className="youtube-embed-iframe"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`YouTube video ${videoId}`}
        />
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

export default YouTubeComponent;
