const fs = require('fs');
const path = require('path');
const dbManager = require('./dbManager');
const { getCurSettingConfig } = require('./settingFile');
const { confPath } = require('./env');
const { tiptapToMarkdown } = require('./markdownConverter');

/**
 * 日记管理器
 * 负责日记的创建、自动生成和定时检查
 */
class JournalManager {
  constructor() {
    this.checkTimer = null;
    this.lastCheckedDate = null;
  }

  /**
   * 初始化日记管理器
   */
  init() {
    // 确保 journals 目录存在
    this.ensureJournalsDir();

    // 检查并创建今日日记
    this.checkTodayJournal();

    // 启动定时检查（每分钟检查一次）
    this.startDailyCheck();

    console.log('[JournalManager] 日记管理器已初始化');
  }

  /**
   * 确保 journals 目录存在
   * journals 与 notebook 平行，都在工作空间根目录下
   */
  ensureJournalsDir() {
    const journalsDir = path.join(confPath, 'journals');

    if (!fs.existsSync(journalsDir)) {
      fs.mkdirSync(journalsDir, { recursive: true });
      console.log('[JournalManager] 创建 journals 目录:', journalsDir);
    }
  }

  /**
   * 格式化日期为 YYYY-MM-DD 格式
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 格式化显示日期：2025年11月21日 星期四
   */
  formatDisplayDate(date) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 ${weekday}`;
  }

  /**
   * 获取今日日记路径
   */
  getTodayJournalPath() {
    const today = new Date();
    const dateStr = this.formatDate(today);
    return `journals/${dateStr}`;
  }

  /**
   * 创建日记
   * @param {Date} date - 日期对象，默认为今天
   * @returns {Promise<string>} 日记文件路径
   */
  async createJournal(date = new Date()) {
    const dateStr = this.formatDate(date);
    const displayDate = this.formatDisplayDate(date);

    // 检查日记是否已存在
    if (dbManager.journalExists(dateStr)) {
      console.log('[JournalManager] 日记已存在:', dateStr);
      return `journals/${dateStr}`;
    }

    // 确保 journals 目录存在
    this.ensureJournalsDir();

    const { notebookSuffix } = getCurSettingConfig();
    const filePath = path.join(confPath, 'journals', `${dateStr}${notebookSuffix}`);

    // 创建初始内容 - Logseq 风格：不需要标题，日期由 JournalEntry 组件显示
    const initialContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };

    // 转换为 Markdown 格式写入（与 notebookFile 保持一致）
    const markdownContent = tiptapToMarkdown(initialContent);
    fs.writeFileSync(filePath, markdownContent, 'utf8');

    // 保存到数据库
    dbManager.saveNote({
      id: dateStr,
      title: displayDate,
      path: filePath,
      contentText: displayDate,
      tags: [],
      outgoingLinks: [],
      isJournal: true,
      journalDate: dateStr,
    });

    console.log('[JournalManager] 创建日记:', dateStr);
    return `journals/${dateStr}`;
  }

  /**
   * 检查今日日记是否存在，不存在则创建
   */
  async checkTodayJournal() {
    const today = new Date();
    const dateStr = this.formatDate(today);

    if (!dbManager.journalExists(dateStr)) {
      await this.createJournal(today);
    }
  }

  /**
   * 启动每日检查定时器
   */
  startDailyCheck() {
    // 每分钟检查一次
    this.checkTimer = setInterval(() => {
      const now = new Date();
      const currentDate = this.formatDate(now);

      // 如果日期变了，创建新的日记
      if (currentDate !== this.lastCheckedDate) {
        this.lastCheckedDate = currentDate;
        this.checkTodayJournal();
      }
    }, 60000); // 60秒检查一次

    // 记录当前日期
    this.lastCheckedDate = this.formatDate(new Date());
  }

  /**
   * 停止定时检查
   */
  stopDailyCheck() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      console.log('[JournalManager] 停止定时检查');
    }
  }

  /**
   * 获取日记列表
   */
  getJournals(limit = 30, offset = 0) {
    return dbManager.getJournals(limit, offset);
  }

  /**
   * 获取日记总数
   */
  getJournalCount() {
    return dbManager.getJournalCount();
  }

  /**
   * 检查指定日期的日记是否存在
   */
  journalExists(date) {
    return dbManager.journalExists(date);
  }
}

// 导出单例
module.exports = new JournalManager();
