/**
 * WebDAV 设置常量
 */

export const WEBDAV_PRESETS = [
  { value: 'custom', label: '自定义', url: '' },
  { value: 'jianguoyun', label: '坚果云', url: 'https://dav.jianguoyun.com/dav/' },
  { value: 'nextcloud', label: 'Nextcloud', url: '' },
  { value: 'owncloud', label: 'ownCloud', url: '' },
];

export const SYNC_MODES = [
  { value: 'manual', label: '手动同步' },
  { value: 'auto', label: '自动同步（每 5 分钟）' },
  { value: 'realtime', label: '实时同步' },
];

/**
 * 根据预设获取默认 URL
 */
export const getPresetUrl = (preset) => {
  const presetInfo = WEBDAV_PRESETS.find((p) => p.value === preset);
  return presetInfo?.url || '';
};

/**
 * 格式化最后同步时间
 */
export const formatLastSyncTime = (lastSyncTime) => {
  if (!lastSyncTime) return '从未同步';
  const date = new Date(lastSyncTime);
  return date.toLocaleString('zh-CN');
};
