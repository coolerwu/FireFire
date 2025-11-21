import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

const SlashMenuComponent = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands = [
    {
      icon: '#',
      title: '标题 1',
      description: '大号标题',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      icon: '##',
      title: '标题 2',
      description: '中号标题',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      icon: '###',
      title: '标题 3',
      description: '小号标题',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      icon: '📝',
      title: '段落',
      description: '普通文本',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('paragraph').run()
      },
    },
    {
      icon: '•',
      title: '无序列表',
      description: '创建无序列表',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      icon: '1.',
      title: '有序列表',
      description: '创建有序列表',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      icon: '☑',
      title: '待办列表',
      description: '创建待办清单',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
    {
      icon: '</>',
      title: '代码块',
      description: '插入代码块',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run()
      },
    },
    {
      icon: '💬',
      title: '引用',
      description: '插入引用块',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setBlockquote().run()
      },
    },
    {
      icon: '—',
      title: '分隔线',
      description: '插入水平分隔线',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
    {
      icon: '📺',
      title: 'BiliBili 视频',
      description: '嵌入 B站 视频',
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
      icon: '▶️',
      title: 'YouTube 视频',
      description: '嵌入 YouTube 视频',
      command: ({ editor, range }) => {
        const url = prompt('请输入 YouTube 视频链接:')
        if (url) {
          // Extract video ID
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
      icon: '📄',
      title: 'PDF 文件',
      description: '嵌入 PDF 文档',
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
      <div className="slash-menu">
        <div className="slash-menu-item" style={{ opacity: 0.5, cursor: 'default' }}>
          <span className="icon">🔍</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div className="title">未找到命令</div>
            <div className="description">尝试其他关键词</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="slash-menu">
      {filteredCommands.map((item, index) => (
        <button
          key={index}
          className={`slash-menu-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => selectItem(index)}
        >
          <span className="icon">{item.icon}</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div className="title">{item.title}</div>
            {item.description && <div className="description">{item.description}</div>}
          </div>
        </button>
      ))}
    </div>
  )
})

export default SlashMenuComponent
