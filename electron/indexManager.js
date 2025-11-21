const fs = require('fs');
const path = require('path');
const { getRootPath } = require('./env');

/**
 * IndexManager - 标签和链接索引管理器
 *
 * 负责管理全局索引文件 ~/.firefire/index.json
 * 索引结构：
 * {
 *   tags: { "标签名": { count: 数量, notes: [noteId, ...] } },
 *   links: { noteId: { title: "标题", outgoing: [...], incoming: [...] } },
 *   notes: { noteId: { title: "标题", path: "路径", tags: [...], updatedAt: "时间" } }
 * }
 */
class IndexManager {
  constructor() {
    this.index = this.loadIndex();
  }

  /**
   * 获取索引文件路径
   */
  getIndexPath() {
    return path.join(getRootPath(), 'index.json');
  }

  /**
   * 加载索引文件
   */
  loadIndex() {
    const indexPath = this.getIndexPath();

    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.error('[IndexManager] 加载索引失败:', error);
        return this.createEmptyIndex();
      }
    }

    return this.createEmptyIndex();
  }

  /**
   * 创建空索引结构
   */
  createEmptyIndex() {
    return {
      tags: {},
      links: {},
      notes: {},
    };
  }

  /**
   * 保存索引到文件
   */
  saveIndex() {
    const indexPath = this.getIndexPath();

    try {
      fs.writeFileSync(indexPath, JSON.stringify(this.index, null, 2), 'utf8');
      console.log('[IndexManager] 索引已保存');
    } catch (error) {
      console.error('[IndexManager] 保存索引失败:', error);
    }
  }

  /**
   * 从 Tiptap JSON 内容中提取标签
   */
  extractTags(content) {
    const tags = new Set();

    const traverse = (node) => {
      if (node.type === 'tag' && node.attrs && node.attrs.tag) {
        tags.add(node.attrs.tag);
      }

      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    };

    if (content && content.content) {
      traverse(content);
    }

    return Array.from(tags);
  }

  /**
   * 从 Tiptap JSON 内容中提取链接
   */
  extractLinks(content) {
    const links = new Set();

    const traverse = (node) => {
      if (node.type === 'internalLink' && node.attrs && node.attrs.target) {
        links.add(node.attrs.target);
      }

      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    };

    if (content && content.content) {
      traverse(content);
    }

    return Array.from(links);
  }

  /**
   * 从文件路径生成唯一 ID
   */
  generateNoteId(filePath) {
    // 使用相对路径作为 ID（去除扩展名）
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * 提取笔记标题（从内容的第一个标题节点或文件名）
   */
  extractTitle(content, filePath) {
    if (content && content.content && Array.isArray(content.content)) {
      for (const node of content.content) {
        if (node.type && node.type.startsWith('heading') && node.content) {
          // 提取标题文本
          const text = this.extractText(node);
          if (text) {
            return text;
          }
        }
      }
    }

    // 如果没有标题，使用文件名
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * 从节点中提取纯文本
   */
  extractText(node) {
    if (node.type === 'text') {
      return node.text || '';
    }

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(child => this.extractText(child)).join('');
    }

    return '';
  }

  /**
   * 更新笔记索引（在保存笔记时调用）
   */
  updateNoteIndex(filePath, content) {
    const noteId = this.generateNoteId(filePath);
    const title = this.extractTitle(content, filePath);
    const tags = this.extractTags(content);
    const outgoingLinks = this.extractLinks(content);

    // 移除旧的标签索引
    this.removeNoteFromTags(noteId);

    // 移除旧的链接索引
    this.removeNoteFromLinks(noteId);

    // 更新笔记信息
    this.index.notes[noteId] = {
      title,
      path: filePath,
      tags,
      updatedAt: new Date().toISOString(),
    };

    // 更新标签索引
    this.updateTagsIndex(noteId, tags);

    // 更新链接索引
    this.updateLinksIndex(noteId, title, outgoingLinks);

    // 保存索引
    this.saveIndex();

    console.log(`[IndexManager] 已更新笔记索引: ${title} (${tags.length} 个标签, ${outgoingLinks.length} 个链接)`);
  }

  /**
   * 从标签索引中移除笔记
   */
  removeNoteFromTags(noteId) {
    Object.keys(this.index.tags).forEach(tag => {
      const tagData = this.index.tags[tag];
      const idx = tagData.notes.indexOf(noteId);

      if (idx !== -1) {
        tagData.notes.splice(idx, 1);
        tagData.count = tagData.notes.length;

        // 如果标签下没有笔记了，删除该标签
        if (tagData.count === 0) {
          delete this.index.tags[tag];
        }
      }
    });
  }

  /**
   * 从链接索引中移除笔记
   */
  removeNoteFromLinks(noteId) {
    // 移除自己的 outgoing 链接对其他笔记 incoming 的影响
    if (this.index.links[noteId]) {
      const oldOutgoing = this.index.links[noteId].outgoing || [];

      oldOutgoing.forEach(targetId => {
        if (this.index.links[targetId]) {
          const idx = this.index.links[targetId].incoming.indexOf(noteId);
          if (idx !== -1) {
            this.index.links[targetId].incoming.splice(idx, 1);
          }
        }
      });
    }

    // 删除自己的链接记录
    delete this.index.links[noteId];
  }

  /**
   * 更新标签索引
   */
  updateTagsIndex(noteId, tags) {
    tags.forEach(tag => {
      if (!this.index.tags[tag]) {
        this.index.tags[tag] = {
          count: 0,
          notes: [],
        };
      }

      if (!this.index.tags[tag].notes.includes(noteId)) {
        this.index.tags[tag].notes.push(noteId);
        this.index.tags[tag].count = this.index.tags[tag].notes.length;
      }
    });
  }

  /**
   * 更新链接索引
   */
  updateLinksIndex(noteId, title, outgoingLinks) {
    // 初始化当前笔记的链接记录
    if (!this.index.links[noteId]) {
      this.index.links[noteId] = {
        title,
        outgoing: [],
        incoming: [],
      };
    }

    // 更新 outgoing 链接
    this.index.links[noteId].outgoing = outgoingLinks;
    this.index.links[noteId].title = title;

    // 更新 incoming 链接（反向链接）
    outgoingLinks.forEach(targetId => {
      if (!this.index.links[targetId]) {
        this.index.links[targetId] = {
          title: targetId, // 临时使用 ID 作为标题，待目标笔记更新时会修正
          outgoing: [],
          incoming: [],
        };
      }

      if (!this.index.links[targetId].incoming.includes(noteId)) {
        this.index.links[targetId].incoming.push(noteId);
      }
    });
  }

  /**
   * 删除笔记索引（在删除笔记时调用）
   */
  deleteNoteIndex(filePath) {
    const noteId = this.generateNoteId(filePath);

    // 移除标签索引
    this.removeNoteFromTags(noteId);

    // 移除链接索引
    this.removeNoteFromLinks(noteId);

    // 删除笔记记录
    delete this.index.notes[noteId];

    // 保存索引
    this.saveIndex();

    console.log(`[IndexManager] 已删除笔记索引: ${noteId}`);
  }

  /**
   * 获取所有标签列表（按笔记数量排序）
   */
  getAllTags() {
    return Object.entries(this.index.tags)
      .map(([name, data]) => ({
        name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 根据标签获取笔记列表
   */
  getNotesByTag(tag) {
    const tagData = this.index.tags[tag];

    if (!tagData) {
      return [];
    }

    return tagData.notes.map(noteId => this.index.notes[noteId]).filter(Boolean);
  }

  /**
   * 获取笔记的反向链接
   */
  getBacklinks(noteId) {
    const linkData = this.index.links[noteId];

    if (!linkData || !linkData.incoming) {
      return [];
    }

    return linkData.incoming
      .map(incomingId => this.index.notes[incomingId])
      .filter(Boolean);
  }

  /**
   * 搜索笔记（按标题、标签）
   */
  searchNotes(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    Object.entries(this.index.notes).forEach(([id, note]) => {
      let score = 0;

      // 标题匹配
      if (note.title.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }

      // 标签匹配
      if (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        score += 5;
      }

      if (score > 0) {
        results.push({ id, ...note, score });
      }
    });

    // 按相关性排序
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * 检查笔记是否存在
   */
  noteExists(noteId) {
    return !!this.index.notes[noteId];
  }

  /**
   * 重建整个索引（扫描所有笔记文件）
   */
  rebuildIndex(notebookPath, suffix = '.cwjson') {
    console.log('[IndexManager] 开始重建索引...');

    this.index = this.createEmptyIndex();

    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith(suffix)) {
          try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            this.updateNoteIndex(filePath, content);
          } catch (error) {
            console.error(`[IndexManager] 读取文件失败: ${filePath}`, error);
          }
        }
      });
    };

    if (fs.existsSync(notebookPath)) {
      scanDirectory(notebookPath);
    }

    console.log(`[IndexManager] 索引重建完成: ${Object.keys(this.index.notes).length} 个笔记, ${Object.keys(this.index.tags).length} 个标签`);
  }
}

// 导出单例
module.exports = new IndexManager();
