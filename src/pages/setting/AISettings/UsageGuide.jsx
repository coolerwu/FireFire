/**
 * AI 使用说明
 */
import React from 'react';
import { SettingSection } from '../BaseSettings/common';

const UsageGuide = () => {
  return (
    <SettingSection title="使用说明">
      <div className="py-3 text-sm text-notion-text-secondary dark:text-notion-dark-text-secondary space-y-2">
        <p>在编辑器中选中文本后，可以使用以下 AI 功能：</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            <strong>润色</strong> - 改善文字表达
          </li>
          <li>
            <strong>翻译</strong> - 中英文互译
          </li>
          <li>
            <strong>续写</strong> - 继续生成内容
          </li>
          <li>
            <strong>总结</strong> - 生成摘要
          </li>
          <li>
            <strong>解释</strong> - 解释选中内容
          </li>
        </ul>
        <p className="mt-3 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
          提示：点击侧边栏的「AI 对话」可以与 AI 聊天，还能让 AI 了解你最近的笔记内容
        </p>
      </div>
    </SettingSection>
  );
};

export default UsageGuide;
