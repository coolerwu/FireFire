/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Notion 风格配色
      colors: {
        // 亮色模式
        notion: {
          bg: {
            primary: '#ffffff',
            secondary: '#f7f6f3',
            tertiary: '#f1f1ef',
            hover: 'rgba(55, 53, 47, 0.08)',
            selected: 'rgba(55, 53, 47, 0.08)',
          },
          text: {
            primary: '#37352f',
            secondary: '#787774',
            tertiary: '#9b9a97',
            placeholder: '#9b9a97',
          },
          border: {
            DEFAULT: 'rgba(55, 53, 47, 0.09)',
            strong: 'rgba(55, 53, 47, 0.16)',
          },
          accent: {
            blue: '#2eaadc',
            green: '#0f7b6c',
            red: '#e03e3e',
            yellow: '#dfab01',
            orange: '#d9730d',
            purple: '#9065b0',
            pink: '#ad1a72',
          },
        },
        // 暗色模式
        'notion-dark': {
          bg: {
            primary: '#191919',
            secondary: '#202020',
            tertiary: '#2f2f2f',
            hover: 'rgba(255, 255, 255, 0.055)',
            selected: 'rgba(255, 255, 255, 0.08)',
          },
          text: {
            primary: '#e3e2e0',
            secondary: '#9b9a97',
            tertiary: '#6b6b6b',
            placeholder: '#5a5a5a',
          },
          border: {
            DEFAULT: 'rgba(255, 255, 255, 0.094)',
            strong: 'rgba(255, 255, 255, 0.16)',
          },
        },
      },
      // 间距系统
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      // 字体
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
        mono: [
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'PT Mono',
          'Liberation Mono',
          'Courier',
          'monospace',
        ],
      },
      // 字号
      fontSize: {
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'base': ['16px', { lineHeight: '1.7' }],
        'lg': ['18px', { lineHeight: '1.6' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['32px', { lineHeight: '1.3' }],
        '4xl': ['40px', { lineHeight: '1.2' }],
      },
      // 圆角
      borderRadius: {
        'none': '0',
        'sm': '3px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        'full': '9999px',
      },
      // 阴影
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'DEFAULT': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04)',
        'notion-menu': '0 0 0 1px rgba(55, 53, 47, 0.09), 0 3px 6px rgba(55, 53, 47, 0.15)',
        'notion-menu-dark': '0 0 0 1px rgba(255, 255, 255, 0.094), 0 3px 6px rgba(0, 0, 0, 0.4)',
      },
      // 动画
      transitionDuration: {
        'fast': '100ms',
        'normal': '150ms',
        'slow': '200ms',
      },
      transitionTimingFunction: {
        'notion': 'ease-out',
      },
      // 布局
      width: {
        'sidebar': '240px',
        'sidebar-collapsed': '64px',
        'editor': '700px',
      },
      maxWidth: {
        'editor': '700px',
      },
      minWidth: {
        'sidebar': '200px',
      },
    },
  },
  plugins: [],
}
