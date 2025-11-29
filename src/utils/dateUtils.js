/**
 * 日期工具函数
 *
 * 统一的日期处理工具，避免代码重复
 */

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化为中文日期
 * @param {Date|string|number} date - 日期
 * @returns {string} 中文格式日期 (2024年01月15日)
 */
export function formatDateCN(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}年${month}月${day}日`;
}

/**
 * 获取星期
 * @param {Date|string|number} date - 日期
 * @returns {string} 星期几
 */
export function getWeekday(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  return WEEKDAYS[d.getDay()];
}

/**
 * 格式化日记标题
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @returns {string} 日记标题 (2024年01月15日 星期一)
 */
export function formatJournalTitle(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return dateStr;
  }
  return `${formatDateCN(d)} ${getWeekday(d)}`;
}

/**
 * 获取相对时间
 * @param {Date|string|number} date - 日期
 * @returns {string} 相对时间描述
 */
export function getRelativeTime(date) {
  const now = new Date();
  const target = new Date(date);

  if (isNaN(target.getTime())) {
    return '';
  }

  // 重置时间部分，只比较日期
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffDays = Math.floor((nowDate - targetDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '前天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

/**
 * 判断是否是今天
 * @param {Date|string|number} date - 日期
 * @returns {boolean}
 */
export function isToday(date) {
  const today = new Date();
  const target = new Date(date);

  return (
    today.getFullYear() === target.getFullYear() &&
    today.getMonth() === target.getMonth() &&
    today.getDate() === target.getDate()
  );
}

/**
 * 判断是否是昨天
 * @param {Date|string|number} date - 日期
 * @returns {boolean}
 */
export function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(date);

  return (
    yesterday.getFullYear() === target.getFullYear() &&
    yesterday.getMonth() === target.getMonth() &&
    yesterday.getDate() === target.getDate()
  );
}

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD
 */
export function getTodayString() {
  return formatDate(new Date(), 'YYYY-MM-DD');
}

/**
 * 解析日期字符串
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @returns {{ year: number, month: number, day: number } | null}
 */
export function parseDateString(dateStr) {
  const match = dateStr?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
  };
}

/**
 * 格式化时间戳
 * @param {number} timestamp - 毫秒时间戳
 * @param {boolean} includeTime - 是否包含时间
 * @returns {string}
 */
export function formatTimestamp(timestamp, includeTime = false) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  if (includeTime) {
    return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
  }
  return formatDate(date, 'YYYY-MM-DD');
}

/**
 * 比较两个日期（只比较日期部分）
 * @param {Date|string} date1 - 日期1
 * @param {Date|string} date2 - 日期2
 * @returns {number} -1: date1 < date2, 0: 相等, 1: date1 > date2
 */
export function compareDates(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * 获取 N 天前的日期字符串
 * @param {number} days - 天数
 * @returns {string} YYYY-MM-DD
 */
export function getDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date, 'YYYY-MM-DD');
}

/**
 * 获取相对日期显示（用于更详细的场景）
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {string} 相对日期或完整日期
 */
export function getRelativeDate(dateStr) {
  const relative = getRelativeTime(dateStr);

  // 对于超过一周的，返回完整日期
  if (relative.includes('周') || relative.includes('月') || relative.includes('年')) {
    return formatDateCN(dateStr);
  }

  return relative;
}

export default {
  formatDate,
  formatDateCN,
  getWeekday,
  formatJournalTitle,
  getRelativeTime,
  getRelativeDate,
  isToday,
  isYesterday,
  getTodayString,
  parseDateString,
  formatTimestamp,
  compareDates,
  getDaysAgo,
};
