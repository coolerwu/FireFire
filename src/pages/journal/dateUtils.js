/**
 * 日期工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD
 */
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 格式化显示日期：2025年11月21日 星期四
 */
export const formatDisplayDate = (date) => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekday}`;
};

/**
 * 获取相对日期显示（今天、昨天、前天等）
 */
export const getRelativeDate = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = today - target;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '前天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;

  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

/**
 * 解析日期字符串为 Date 对象
 */
export const parseDate = (dateStr) => {
  return new Date(dateStr);
};

/**
 * 检查是否为今天
 */
export const isToday = (dateStr) => {
  const today = formatDate(new Date());
  return dateStr === today;
};

/**
 * 获取 N 天前的日期
 */
export const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
};
