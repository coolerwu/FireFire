/**
 * Markdown Converter Module
 *
 * Handles bidirectional conversion between Tiptap JSON and Markdown format.
 * Uses marked for Markdown parsing and gray-matter for frontmatter.
 * This is the ONLY format - .cwjson support has been removed.
 */

const TurndownService = require('turndown');
const matter = require('gray-matter');
const { marked } = require('marked');

/**
 * Convert Tiptap JSON to Markdown string with frontmatter
 * @param {Object} tiptapJSON - Tiptap document JSON
 * @param {Object} metadata - Note metadata (title, created, updated, tags)
 * @returns {string} Markdown content with YAML frontmatter
 */
function tiptapToMarkdown(tiptapJSON, metadata = {}) {
  try {
    if (!tiptapJSON || !tiptapJSON.content) {
      console.warn('[MarkdownConverter] Empty or invalid Tiptap JSON');
      return matter.stringify('', metadata);
    }

    // Convert Tiptap JSON to HTML first
    const html = tiptapJSONToHTML(tiptapJSON);

    // Convert HTML to Markdown using Turndown
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**',
    });

    // Add custom rules for Markdown elements
    addTurndownRules(turndown);

    const markdown = turndown.turndown(html);

    // Add frontmatter if metadata provided
    if (Object.keys(metadata).length > 0) {
      return matter.stringify(markdown, metadata);
    }

    return markdown;
  } catch (error) {
    console.error('[MarkdownConverter] Error converting Tiptap to Markdown:', error);
    throw new Error(`Failed to convert to Markdown: ${error.message}`);
  }
}

/**
 * Convert Markdown string to Tiptap JSON
 * @param {string} markdownContent - Markdown content with optional frontmatter
 * @returns {Object} { content: tiptapJSON, metadata: {...} }
 */
function markdownToTiptap(markdownContent) {
  try {
    if (!markdownContent || typeof markdownContent !== 'string') {
      console.warn('[MarkdownConverter] Empty or invalid Markdown content');
      return {
        content: { type: 'doc', content: [] },
        metadata: {}
      };
    }

    // Parse frontmatter
    const { content, data: metadata } = matter(markdownContent);

    // Parse Markdown to HTML tokens using marked
    const tokens = marked.lexer(content);

    // Convert tokens to Tiptap JSON
    const tiptapContent = tokensToTiptap(tokens);

    return {
      content: {
        type: 'doc',
        content: tiptapContent
      },
      metadata: metadata || {}
    };
  } catch (error) {
    console.error('[MarkdownConverter] Error converting Markdown to Tiptap:', error);
    throw new Error(`Failed to parse Markdown: ${error.message}`);
  }
}

/**
 * Convert marked tokens to Tiptap JSON nodes
 * @param {Array} tokens - Marked tokens
 * @returns {Array} Tiptap nodes
 */
function tokensToTiptap(tokens) {
  const nodes = [];

  for (const token of tokens) {
    const node = tokenToTiptapNode(token);
    if (node) {
      if (Array.isArray(node)) {
        nodes.push(...node);
      } else {
        nodes.push(node);
      }
    }
  }

  return nodes;
}

/**
 * Convert a single marked token to Tiptap node
 * @param {Object} token - Marked token
 * @returns {Object|Array|null} Tiptap node(s)
 */
function tokenToTiptapNode(token) {
  switch (token.type) {
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: token.depth },
        content: parseInlineTokens(token.tokens || [{ type: 'text', text: token.text }])
      };

    case 'paragraph':
      return {
        type: 'paragraph',
        content: parseInlineTokens(token.tokens || [{ type: 'text', text: token.text }])
      };

    case 'code':
      return {
        type: 'codeBlock',
        attrs: { language: token.lang || '' },
        content: [{ type: 'text', text: token.text }]
      };

    case 'blockquote':
      const quoteContent = tokensToTiptap(token.tokens || []);
      return {
        type: 'blockquote',
        content: quoteContent.length > 0 ? quoteContent : [{ type: 'paragraph', content: [] }]
      };

    case 'list':
      return token.items.map(item => ({
        type: 'listItem',
        content: tokensToTiptap(item.tokens || [])
      }));

    case 'list_item':
      // Task list item
      if (token.task) {
        return {
          type: 'taskItem',
          attrs: { checked: token.checked },
          content: tokensToTiptap(token.tokens || [])
        };
      }
      return {
        type: 'listItem',
        content: tokensToTiptap(token.tokens || [])
      };

    case 'hr':
      return { type: 'horizontalRule' };

    case 'html':
      // Check for custom embeds
      if (token.text.includes('data-type=')) {
        return parseCustomEmbed(token.text);
      }
      // Skip other HTML
      return null;

    case 'table':
      return {
        type: 'table',
        content: [
          ...(token.header ? [{ type: 'tableRow', content: token.header.map(cell => ({
            type: 'tableHeader',
            content: parseInlineTokens(cell.tokens || [])
          }))}] : []),
          ...token.rows.map(row => ({
            type: 'tableRow',
            content: row.map(cell => ({
              type: 'tableCell',
              content: parseInlineTokens(cell.tokens || [])
            }))
          }))
        ]
      };

    case 'space':
      return null;

    case 'text':
      // Handle standalone text tokens (shouldn't happen at block level but marked sometimes generates them)
      if (token.text && token.text.trim()) {
        // Check if this text token has inline tokens (bold, italic, etc.)
        if (token.tokens && token.tokens.length > 0) {
          return {
            type: 'paragraph',
            content: parseInlineTokens(token.tokens)
          };
        }
        return {
          type: 'paragraph',
          content: [{ type: 'text', text: token.text }]
        };
      }
      return null;

    default:
      console.log('[MarkdownConverter] Unknown token type:', token.type);
      return null;
  }
}

/**
 * Parse inline tokens (bold, italic, links, etc.)
 * @param {Array} tokens - Inline tokens
 * @returns {Array} Tiptap text nodes with marks
 */
function parseInlineTokens(tokens) {
  const nodes = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        nodes.push({ type: 'text', text: token.text });
        break;

      case 'strong':
        const strongContent = parseInlineTokens(token.tokens || [{ type: 'text', text: token.text }]);
        nodes.push(...strongContent.map(node => ({
          ...node,
          marks: [...(node.marks || []), { type: 'bold' }]
        })));
        break;

      case 'em':
        const emContent = parseInlineTokens(token.tokens || [{ type: 'text', text: token.text }]);
        nodes.push(...emContent.map(node => ({
          ...node,
          marks: [...(node.marks || []), { type: 'italic' }]
        })));
        break;

      case 'codespan':
        nodes.push({
          type: 'text',
          text: token.text,
          marks: [{ type: 'code' }]
        });
        break;

      case 'link':
        const linkContent = parseInlineTokens(token.tokens || [{ type: 'text', text: token.text }]);
        nodes.push(...linkContent.map(node => ({
          ...node,
          marks: [...(node.marks || []), { type: 'link', attrs: { href: token.href } }]
        })));
        break;

      case 'del':
        const delContent = parseInlineTokens(token.tokens || [{ type: 'text', text: token.text }]);
        nodes.push(...delContent.map(node => ({
          ...node,
          marks: [...(node.marks || []), { type: 'strike' }]
        })));
        break;

      case 'image':
        nodes.push({
          type: 'image',
          attrs: {
            src: token.href,
            alt: token.text || '',
            title: token.title || null
          }
        });
        break;

      case 'br':
        nodes.push({ type: 'hardBreak' });
        break;

      default:
        if (token.text) {
          nodes.push({ type: 'text', text: token.text });
        }
        break;
    }
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }];
}

/**
 * Parse custom embed HTML
 * @param {string} html - HTML string
 * @returns {Object|null} Tiptap custom node
 */
function parseCustomEmbed(html) {
  const typeMatch = html.match(/data-type="([^"]+)"/);
  const srcMatch = html.match(/data-src="([^"]+)"/);

  if (!typeMatch || !srcMatch) return null;

  const type = typeMatch[1];
  const src = srcMatch[1];

  switch (type) {
    case 'bilibili':
      return {
        type: 'BiliBili',
        attrs: { src: src, width: 640, height: 480 }
      };
    case 'youtube':
      return {
        type: 'youtubeEmbed',
        attrs: { src: src }
      };
    case 'pdf':
      return {
        type: 'pdfEmbed',
        attrs: { src: src }
      };
    case 'web':
      return {
        type: 'webEmbed',
        attrs: { src: src }
      };
    default:
      return null;
  }
}

/**
 * Convert Tiptap JSON to HTML string
 * @param {Object} tiptapJSON - Tiptap document JSON
 * @returns {string} HTML string
 */
function tiptapJSONToHTML(tiptapJSON) {
  if (!tiptapJSON || !tiptapJSON.content) {
    return '';
  }

  let html = '';

  for (const node of tiptapJSON.content) {
    html += nodeToHTML(node);
  }

  return html;
}

/**
 * Convert a single Tiptap node to HTML
 * @param {Object} node - Tiptap node
 * @returns {string} HTML string
 */
function nodeToHTML(node) {
  if (!node) return '';

  const { type, content, attrs, marks, text } = node;

  // Text node
  if (type === 'text') {
    let html = text || '';

    // Apply marks (bold, italic, etc.)
    if (marks && marks.length > 0) {
      for (const mark of marks) {
        html = applyMark(html, mark);
      }
    }

    return html;
  }

  // Block nodes
  switch (type) {
    case 'paragraph':
      return `<p>${contentToHTML(content)}</p>\n`;

    case 'heading':
      const level = attrs?.level || 1;
      return `<h${level}>${contentToHTML(content)}</h${level}>\n`;

    case 'codeBlock':
      const language = attrs?.language || '';
      const code = getTextContent(content);
      return `<pre><code class="language-${language}">${escapeHTML(code)}</code></pre>\n`;

    case 'bulletList':
      return `<ul>\n${contentToHTML(content)}</ul>\n`;

    case 'orderedList':
      return `<ol>\n${contentToHTML(content)}</ol>\n`;

    case 'listItem':
      return `<li>${contentToHTML(content)}</li>\n`;

    case 'taskList':
      return `<ul class="task-list">\n${contentToHTML(content)}</ul>\n`;

    case 'taskItem':
      const checked = attrs?.checked ? ' checked' : '';
      return `<li class="task-item"><input type="checkbox"${checked}> ${contentToHTML(content)}</li>\n`;

    case 'blockquote':
      return `<blockquote>\n${contentToHTML(content)}</blockquote>\n`;

    case 'horizontalRule':
      return '<hr>\n';

    case 'image':
      const src = attrs?.src || '';
      const alt = attrs?.alt || '';
      const title = attrs?.title ? ` title="${attrs.title}"` : '';
      return `<img src="${src}" alt="${alt}"${title}>\n`;

    case 'hardBreak':
      return '<br>\n';

    // Custom nodes - preserve as HTML with data attributes
    case 'BiliBili':
      return `<!-- BiliBili: ${attrs?.src} -->\n<div data-type="bilibili" data-src="${attrs?.src}" data-width="${attrs?.width}" data-height="${attrs?.height}"></div>\n`;

    case 'youtubeEmbed':
      return `<!-- YouTube: ${attrs?.src} -->\n<div data-type="youtube" data-src="${attrs?.src}"></div>\n`;

    case 'pdfEmbed':
      return `<!-- PDF: ${attrs?.src} -->\n<div data-type="pdf" data-src="${attrs?.src}"></div>\n`;

    case 'webEmbed':
      return `<!-- WebEmbed: ${attrs?.src} -->\n<div data-type="web" data-src="${attrs?.src}"></div>\n`;

    case 'table':
      return `<table>\n${contentToHTML(content)}</table>\n`;

    case 'tableRow':
      return `<tr>\n${contentToHTML(content)}</tr>\n`;

    case 'tableCell':
      return `<td>${contentToHTML(content)}</td>`;

    case 'tableHeader':
      return `<th>${contentToHTML(content)}</th>`;

    default:
      // Unknown node type - try to render content
      console.warn('[MarkdownConverter] Unknown node type:', type);
      if (content && content.length > 0) {
        return contentToHTML(content);
      }
      return '';
  }
}

/**
 * Apply a mark (formatting) to text
 * @param {string} text - Text to format
 * @param {Object} mark - Mark object
 * @returns {string} Formatted HTML
 */
function applyMark(text, mark) {
  switch (mark.type) {
    case 'bold':
    case 'strong':
      return `<strong>${text}</strong>`;
    case 'italic':
    case 'em':
      return `<em>${text}</em>`;
    case 'code':
      return `<code>${text}</code>`;
    case 'underline':
      return `<u>${text}</u>`;
    case 'strike':
      return `<s>${text}</s>`;
    case 'link':
      const href = mark.attrs?.href || '';
      return `<a href="${href}">${text}</a>`;
    case 'highlight':
      const color = mark.attrs?.color || '';
      return color ? `<mark style="background-color: ${color}">${text}</mark>` : `<mark>${text}</mark>`;
    case 'textStyle':
      if (mark.attrs?.color) {
        return `<span style="color: ${mark.attrs.color}">${text}</span>`;
      }
      return text;
    default:
      return text;
  }
}

/**
 * Convert content array to HTML
 * @param {Array} content - Array of nodes
 * @returns {string} HTML string
 */
function contentToHTML(content) {
  if (!content || content.length === 0) return '';
  return content.map(node => nodeToHTML(node)).join('');
}

/**
 * Get plain text content from nodes
 * @param {Array} content - Array of nodes
 * @returns {string} Plain text
 */
function getTextContent(content) {
  if (!content || content.length === 0) return '';

  return content.map(node => {
    if (node.type === 'text') {
      return node.text || '';
    }
    if (node.content) {
      return getTextContent(node.content);
    }
    return '';
  }).join('');
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Add custom Turndown rules for special elements
 * @param {TurndownService} turndown - Turndown instance
 */
function addTurndownRules(turndown) {
  // Task list items
  turndown.addRule('taskListItem', {
    filter: node => {
      return node.nodeName === 'LI' && node.classList.contains('task-item');
    },
    replacement: (content, node) => {
      const checkbox = node.querySelector('input[type="checkbox"]');
      const checked = checkbox && checkbox.checked;
      return `- [${checked ? 'x' : ' '}] ${content}\n`;
    }
  });

  // Custom embed nodes - preserve as HTML comments + divs
  turndown.addRule('customEmbeds', {
    filter: node => {
      return node.nodeName === 'DIV' && node.getAttribute('data-type');
    },
    replacement: (content, node) => {
      const type = node.getAttribute('data-type');
      const src = node.getAttribute('data-src');
      return `\n<!-- ${type}: ${src} -->\n<div data-type="${type}" data-src="${src}"></div>\n\n`;
    }
  });
}

/**
 * Extract metadata from Tiptap JSON
 * @param {Object} tiptapJSON - Tiptap document JSON
 * @param {string} noteId - Note ID
 * @returns {Object} Metadata object
 */
function extractMetadata(tiptapJSON, noteId) {
  // Extract title from first heading or first paragraph
  let title = noteId;

  if (tiptapJSON && tiptapJSON.content && tiptapJSON.content.length > 0) {
    const firstNode = tiptapJSON.content[0];

    if (firstNode.type === 'heading' || firstNode.type === 'paragraph') {
      title = getTextContent(firstNode.content) || noteId;
      // Limit title length
      if (title.length > 100) {
        title = title.substring(0, 100) + '...';
      }
    }
  }

  const now = new Date().toISOString();

  return {
    title: title,
    created: now,
    updated: now,
    tags: []
  };
}

module.exports = {
  tiptapToMarkdown,
  markdownToTiptap,
  extractMetadata
};
