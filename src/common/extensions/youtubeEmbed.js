import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import YouTubeComponent from './YouTubeComponent';

// Extract YouTube video ID from various URL formats
export function extractYouTubeId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/v\/([^?&\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export const YouTubeEmbed = Node.create({
  name: 'youtube',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      videoId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-youtube-video': HTMLAttributes.videoId,
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeComponent);
  },

  addCommands() {
    return {
      setYouTubeVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
