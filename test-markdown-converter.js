/**
 * Test Markdown Converter
 * Quick test to verify the Markdown conversion functionality works
 */

const { tiptapToMarkdown, markdownToTiptap, extractMetadata } = require('./electron/markdownConverter');

// Test 1: Simple Tiptap JSON to Markdown
console.log('\n=== Test 1: Tiptap to Markdown ===');
const testTiptap = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Hello World' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is a ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' text.' }
      ]
    }
  ]
};

const metadata = {
  title: 'Test Note',
  created: '2025-11-21T10:00:00Z',
  updated: '2025-11-21T10:30:00Z',
  tags: ['test', 'markdown']
};

try {
  const markdown = tiptapToMarkdown(testTiptap, metadata);
  console.log('✅ Conversion successful!');
  console.log('Markdown output:');
  console.log(markdown);
} catch (error) {
  console.error('❌ Conversion failed:', error.message);
}

// Test 2: Markdown to Tiptap JSON
console.log('\n=== Test 2: Markdown to Tiptap ===');
const testMarkdown = `---
title: My Note
created: 2025-11-21T10:00:00Z
updated: 2025-11-21T10:30:00Z
tags:
  - test
  - example
---

# Hello Markdown

This is a paragraph with **bold** and *italic* text.

## Features

- **Feature 1**: First feature description
- **Feature 2**: Second feature description

\`\`\`javascript
console.log('Hello World');
\`\`\`
`;

try {
  const { content, metadata: parsedMeta } = markdownToTiptap(testMarkdown);
  console.log('✅ Conversion successful!');
  console.log('Parsed metadata:', parsedMeta);
  console.log('Tiptap JSON:', JSON.stringify(content, null, 2));
} catch (error) {
  console.error('❌ Conversion failed:', error.message);
}

// Test 3: Extract metadata
console.log('\n=== Test 3: Extract Metadata ===');
try {
  const extractedMeta = extractMetadata(testTiptap, 'test-note');
  console.log('✅ Metadata extraction successful!');
  console.log('Metadata:', extractedMeta);
} catch (error) {
  console.error('❌ Metadata extraction failed:', error.message);
}

console.log('\n=== All tests complete ===\n');
