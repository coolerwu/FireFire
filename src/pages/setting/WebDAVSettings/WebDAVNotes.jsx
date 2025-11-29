/**
 * WebDAV 使用说明
 */
import React from 'react';
import { SettingSection } from '../BaseSettings/common';

const WebDAVNotes = () => {
  return (
    <SettingSection title="注意事项">
      <div className="py-3 text-sm text-notion-text-secondary dark:text-notion-dark-text-secondary space-y-2">
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>首次同步建议先「上传到云端」备份本地数据</li>
          <li>同步会覆盖较旧的文件，请谨慎操作</li>
          <li>坚果云用户需要使用「应用密码」而非账号密码</li>
          <li>建议定期手动备份重要笔记</li>
        </ul>
      </div>
    </SettingSection>
  );
};

export default WebDAVNotes;
