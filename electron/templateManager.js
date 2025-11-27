const fs = require('fs');
const path = require('path');
const { confPath } = require('./env');
const { v4: uuidv4 } = require('uuid');

/**
 * 笔记模板管理器
 *
 * 管理内置模板和用户自定义模板
 */
class TemplateManager {
  constructor() {
    this.templatesDir = path.join(confPath, 'templates');
    this.initialized = false;
  }

  /**
   * 初始化模板管理器
   */
  init() {
    if (this.initialized) return;

    // 确保模板目录存在
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }

    // 初始化内置模板
    this.initBuiltinTemplates();

    this.initialized = true;
    console.log('[TemplateManager] 模板管理器初始化完成');
  }

  /**
   * 内置模板定义
   */
  getBuiltinTemplates() {
    return [
      {
        id: 'builtin-meeting',
        name: '会议记录',
        description: '记录会议要点、参与者和行动项',
        category: 'builtin',
        icon: '📋',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '会议记录 - {{date}}' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '基本信息' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '时间：{{date}} {{time}}' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '地点：' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '参与者：' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '议程' }] },
            { type: 'bulletList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '议题 1' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '议题 2' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '讨论要点' }] },
            { type: 'paragraph' },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '行动项' }] },
            { type: 'taskList', content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '待办事项 1 - 负责人: @xxx' }] }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '待办事项 2 - 负责人: @xxx' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '下次会议' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '时间：' }] },
          ],
        },
        variables: ['date', 'time'],
      },
      {
        id: 'builtin-reading',
        name: '读书笔记',
        description: '记录书籍要点、摘录和感想',
        category: 'builtin',
        icon: '📚',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '《书名》读书笔记' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '书籍信息' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '作者：' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '出版社：' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '阅读日期：{{date}}' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '评分：⭐⭐⭐⭐⭐' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '内容概要' }] },
            { type: 'paragraph' },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '精彩摘录' }] },
            { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: '摘录内容...' }] }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '读后感' }] },
            { type: 'paragraph' },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '行动计划' }] },
            { type: 'taskList', content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '将学到的知识应用到...' }] }] },
            ]},
          ],
        },
        variables: ['date'],
      },
      {
        id: 'builtin-daily',
        name: '日报/周报',
        description: '记录工作进展和计划',
        category: 'builtin',
        icon: '📝',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '工作报告 - {{date}}' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '今日完成' }] },
            { type: 'taskList', content: [
              { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '已完成任务 1' }] }] },
              { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '已完成任务 2' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '进行中' }] },
            { type: 'bulletList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '进行中的任务...' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '明日计划' }] },
            { type: 'taskList', content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '计划任务 1' }] }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '计划任务 2' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '问题与风险' }] },
            { type: 'paragraph' },
          ],
        },
        variables: ['date'],
      },
      {
        id: 'builtin-project',
        name: '项目计划',
        description: '规划项目目标、里程碑和任务',
        category: 'builtin',
        icon: '🎯',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '项目名称' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '项目概述' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '项目目标：' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '开始日期：{{date}}' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '预计完成：' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '里程碑' }] },
            { type: 'orderedList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '阶段 1：需求分析' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '阶段 2：设计' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '阶段 3：开发' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '阶段 4：测试' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '阶段 5：上线' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '任务分解' }] },
            { type: 'taskList', content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '任务 1' }] }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '任务 2' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '资源需求' }] },
            { type: 'paragraph' },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '风险评估' }] },
            { type: 'paragraph' },
          ],
        },
        variables: ['date'],
      },
      {
        id: 'builtin-study',
        name: '学习笔记',
        description: '记录学习内容、要点和练习',
        category: 'builtin',
        icon: '🎓',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '学习主题' }] },
            { type: 'paragraph', content: [{ type: 'text', text: '日期：{{date}}' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '学习目标' }] },
            { type: 'bulletList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '目标 1' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '目标 2' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '核心概念' }] },
            { type: 'paragraph' },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '详细笔记' }] },
            { type: 'paragraph' },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '代码/示例' }] },
            { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: '// 代码示例' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '练习与问题' }] },
            { type: 'taskList', content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '练习 1' }] }] },
            ]},
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '参考资料' }] },
            { type: 'bulletList', content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '链接/书籍' }] }] },
            ]},
          ],
        },
        variables: ['date'],
      },
      {
        id: 'builtin-blank',
        name: '空白笔记',
        description: '从空白开始创作',
        category: 'builtin',
        icon: '📄',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '无标题' }] },
            { type: 'paragraph' },
          ],
        },
        variables: [],
      },
    ];
  }

  /**
   * 初始化内置模板（写入到文件）
   */
  initBuiltinTemplates() {
    const builtinDir = path.join(this.templatesDir, 'builtin');
    if (!fs.existsSync(builtinDir)) {
      fs.mkdirSync(builtinDir, { recursive: true });
    }

    const builtinTemplates = this.getBuiltinTemplates();
    for (const template of builtinTemplates) {
      const filePath = path.join(builtinDir, `${template.id}.json`);
      // 总是更新内置模板
      fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');
    }
  }

  /**
   * 获取所有模板
   */
  getAllTemplates() {
    const templates = [];

    // 内置模板
    const builtinDir = path.join(this.templatesDir, 'builtin');
    if (fs.existsSync(builtinDir)) {
      const files = fs.readdirSync(builtinDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(builtinDir, file), 'utf-8');
          const template = JSON.parse(content);
          template.isBuiltin = true;
          templates.push(template);
        } catch (err) {
          console.error(`[TemplateManager] 读取内置模板失败: ${file}`, err);
        }
      }
    }

    // 用户模板
    const userDir = path.join(this.templatesDir, 'user');
    if (fs.existsSync(userDir)) {
      const files = fs.readdirSync(userDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(userDir, file), 'utf-8');
          const template = JSON.parse(content);
          template.isBuiltin = false;
          templates.push(template);
        } catch (err) {
          console.error(`[TemplateManager] 读取用户模板失败: ${file}`, err);
        }
      }
    }

    return templates;
  }

  /**
   * 获取单个模板
   */
  getTemplate(templateId) {
    const templates = this.getAllTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * 创建用户模板
   */
  createTemplate(name, description, content, icon = '📝') {
    const userDir = path.join(this.templatesDir, 'user');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const template = {
      id: `user-${uuidv4()}`,
      name,
      description,
      category: 'user',
      icon,
      content,
      variables: this.extractVariables(content),
      createdAt: new Date().toISOString(),
    };

    const filePath = path.join(userDir, `${template.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');

    console.log(`[TemplateManager] 创建用户模板: ${name}`);
    return template;
  }

  /**
   * 更新用户模板
   */
  updateTemplate(templateId, updates) {
    if (templateId.startsWith('builtin-')) {
      throw new Error('无法修改内置模板');
    }

    const userDir = path.join(this.templatesDir, 'user');
    const filePath = path.join(userDir, `${templateId}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error('模板不存在');
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const template = JSON.parse(content);

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.content) {
      updatedTemplate.variables = this.extractVariables(updates.content);
    }

    fs.writeFileSync(filePath, JSON.stringify(updatedTemplate, null, 2), 'utf-8');

    console.log(`[TemplateManager] 更新用户模板: ${templateId}`);
    return updatedTemplate;
  }

  /**
   * 删除用户模板
   */
  deleteTemplate(templateId) {
    if (templateId.startsWith('builtin-')) {
      throw new Error('无法删除内置模板');
    }

    const userDir = path.join(this.templatesDir, 'user');
    const filePath = path.join(userDir, `${templateId}.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[TemplateManager] 删除用户模板: ${templateId}`);
      return true;
    }

    return false;
  }

  /**
   * 从内容中提取变量
   */
  extractVariables(content) {
    const contentStr = JSON.stringify(content);
    const matches = contentStr.match(/\{\{(\w+)\}\}/g) || [];
    const variables = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
    return variables;
  }

  /**
   * 应用模板（替换变量）
   */
  applyTemplate(templateId, variables = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 默认变量
    const now = new Date();
    const defaultVars = {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      datetime: now.toISOString(),
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      day: now.getDate().toString().padStart(2, '0'),
    };

    const allVars = { ...defaultVars, ...variables };

    // 替换变量
    let contentStr = JSON.stringify(template.content);
    for (const [key, value] of Object.entries(allVars)) {
      contentStr = contentStr.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    return JSON.parse(contentStr);
  }

  /**
   * 导出模板
   */
  exportTemplate(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('模板不存在');
    }
    return JSON.stringify(template, null, 2);
  }

  /**
   * 导入模板
   */
  importTemplate(jsonString) {
    try {
      const imported = JSON.parse(jsonString);

      // 验证必要字段
      if (!imported.name || !imported.content) {
        throw new Error('模板格式无效');
      }

      // 作为用户模板导入
      return this.createTemplate(
        imported.name,
        imported.description || '',
        imported.content,
        imported.icon || '📝'
      );
    } catch (err) {
      console.error('[TemplateManager] 导入模板失败:', err);
      throw err;
    }
  }
}

// 导出单例
module.exports = new TemplateManager();
