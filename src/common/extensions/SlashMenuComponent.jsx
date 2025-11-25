import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

/**
 * SlashMenuComponent - 斜杠命令菜单
 * 当用户输入 / 时显示命令列表
 * Notion 风格设计
 */
const SlashMenuComponent = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands = [
    {
      icon: 'H1',
      title: '标题 1',
      description: '大号标题',
      category: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      icon: 'H2',
      title: '标题 2',
      description: '中号标题',
      category: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      icon: 'H3',
      title: '标题 3',
      description: '小号标题',
      category: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      icon: '¶',
      title: '段落',
      description: '普通文本',
      category: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('paragraph').run()
      },
    },
    {
      icon: '•',
      title: '无序列表',
      description: '创建无序列表',
      category: '列表',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      icon: '1.',
      title: '有序列表',
      description: '创建有序列表',
      category: '列表',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      icon: '☐',
      title: '待办列表',
      description: '创建待办清单',
      category: '列表',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
    {
      icon: '<>',
      title: '代码块',
      description: '插入代码块',
      category: '高级',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run()
      },
    },
    {
      icon: '"',
      title: '引用',
      description: '插入引用块',
      category: '高级',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setBlockquote().run()
      },
    },
    {
      icon: '—',
      title: '分隔线',
      description: '插入水平分隔线',
      category: '高级',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
    {
      icon: 'B',
      title: 'BiliBili 视频',
      description: '嵌入 B站 视频',
      category: '媒体',
      command: ({ editor, range }) => {
        const url = prompt('请输入 BiliBili 视频链接 (例如: https://www.bilibili.com/video/BV1xx411c7mD):')
        if (url) {
          const match = url.match(/BV[0-9a-zA-Z]+/)
          if (match) {
            editor.chain().focus().deleteRange(range).setBiliBiliVideo({ src: match[0] }).run()
          } else {
            alert('无效的 BiliBili 链接')
          }
        }
      },
    },
    {
      icon: '▶',
      title: 'YouTube 视频',
      description: '嵌入 YouTube 视频',
      category: '媒体',
      command: ({ editor, range }) => {
        const url = prompt('请输入 YouTube 视频链接:')
        if (url) {
          const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
            /youtube\.com\/embed\/([^?&\s]+)/,
          ]
          let videoId = null
          for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match && match[1]) {
              videoId = match[1]
              break
            }
          }
          if (videoId) {
            editor.chain().focus().deleteRange(range).setYouTubeVideo({ videoId }).run()
          } else {
            alert('无效的 YouTube 链接')
          }
        }
      },
    },
    {
      icon: 'PDF',
      title: 'PDF 文件',
      description: '嵌入 PDF 文档',
      category: '媒体',
      command: ({ editor, range }) => {
        const src = prompt('请输入 PDF 文件路径 (file:// 或 https://):')
        if (src) {
          editor.chain().focus().deleteRange(range).setPDFEmbed({ src }).run()
        }
      },
    },
    {
      icon: '🔗',
      title: '网页预览',
      description: '嵌入网页链接',
      category: '媒体',
      command: ({ editor, range }) => {
        const url = prompt('请输入网页链接:')
        if (url) {
          editor.chain().focus().deleteRange(range).setWebEmbed({ url }).run()
        }
      },
    },
  ]

  const filteredCommands = commands.filter((item) =>
    item.title.toLowerCase().includes(props.query.toLowerCase()) ||
    item.description.toLowerCase().includes(props.query.toLowerCase())
  )

  const selectItem = (index) => {
    const item = filteredCommands[index]
    if (item) {
      props.command(item)
    }
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((selectedIndex + filteredCommands.length - 1) % filteredCommands.length)
        return true
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((selectedIndex + 1) % filteredCommands.length)
        return true
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        selectItem(selectedIndex)
        return true
      }

      return false
    },
  }))

  useEffect(() => {
    setSelectedIndex(0)
  }, [props.query])

  if (filteredCommands.length === 0) {
    return (
      <div className="
        bg-notion-bg-primary dark:bg-notion-dark-bg-secondary
        rounded-lg shadow-lg
        border border-notion-border dark:border-notion-dark-border
        p-4 min-w-[280px] max-w-[360px]
      ">
        <div className="flex items-center gap-3 text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
          <span className="text-lg opacity-50">🔍</span>
          <div>
            <div className="text-sm font-medium">未找到命令</div>
            <div className="text-xs opacity-70">尝试其他关键词</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="
      bg-notion-bg-primary dark:bg-notion-dark-bg-secondary
      rounded-lg shadow-lg
      border border-notion-border dark:border-notion-dark-border
      max-h-80 overflow-y-auto
      p-1 min-w-[280px] max-w-[360px]
      scrollbar-thin scrollbar-track-transparent scrollbar-thumb-notion-border dark:scrollbar-thumb-notion-dark-border
    ">
      {filteredCommands.map((item, index) => (
        <button
          key={index}
          className={`
            w-full flex items-center gap-3 p-2.5 rounded-md cursor-pointer
            text-left
            transition-colors duration-fast
            ${index === selectedIndex
              ? 'bg-notion-accent-blue/10'
              : 'hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
            }
          `}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className={`
            w-8 h-8 flex items-center justify-center rounded-md
            text-sm font-medium
            ${index === selectedIndex
              ? 'bg-notion-accent-blue/20 text-notion-accent-blue'
              : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-secondary dark:text-notion-dark-text-secondary'
            }
          `}>
            {item.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className={`
              text-sm font-medium
              ${index === selectedIndex
                ? 'text-notion-accent-blue'
                : 'text-notion-text-primary dark:text-notion-dark-text-primary'
              }
            `}>
              {item.title}
            </div>
            {item.description && (
              <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary truncate">
                {item.description}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
})

SlashMenuComponent.displayName = 'SlashMenuComponent'

export default SlashMenuComponent
