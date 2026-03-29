import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * 浮动式个人笔记本组件（服务器版）
 * @param {Object} props 
 * @param {boolean} props.isOpen - 是否打开笔记本
 * @param {Function} props.onClose - 关闭笔记本的回调
 * @param {Function} props.onAddNote - 添加笔记时的回调（可选）
 * @param {Function} props.onUpdateNote - 更新笔记时的回调（可选）
 * @param {string} props.initialText - 初始化文本
 * @param {Object} props.videoContext - 视频上下文信息
 * @param {string} props.themeMode - 主题模式：'dark' 或 'light'
 * @param {string} props.baseUrl - API基础URL（应该包含 /notebook 前缀）
 * @param {Function} props.getToken - 获取token的函数
 */
const Notebook = ({
  isOpen = false,
  onClose,
  onAddNote,
  onUpdateNote,
  initialText = '',
  videoContext = null,
  themeMode = 'dark',
  baseUrl = 'http://localhost:3001/notebook',
  getToken = null,
}) => {
  // ==================== 样式定义 ====================
  const THEME = {
    dark: {
      bg: '#1e1e1e',
      paper: '#252526',
      surface: '#2d2d30',
      textPrimary: '#d4d4d4',
      textSecondary: '#858585',
      textMuted: '#6a6a6a',
      accent: '#4ec9b0',
      success: '#4caf50',
      warning: '#ff9800',
      danger: '#f44336',
      info: '#2196f3',
      border: '#3c3c3c',
      borderLight: '#4a4a4a',
      highlight: '#4ec9b020',
    },
    light: {
      bg: '#f5f5f5',
      paper: '#ffffff',
      surface: '#fafafa',
      textPrimary: '#333333',
      textSecondary: '#666666',
      textMuted: '#999999',
      accent: '#007acc',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8',
      border: '#e0e0e0',
      borderLight: '#eeeeee',
      highlight: '#007acc10',
    }
  };

  const theme = THEME[themeMode];

  // ==================== 组件样式 ====================
  const styles = {
    container: {
      position: 'fixed',
      top: 0,
      right: isOpen ? 0 : '-400px',
      width: '350px',
      height: '100vh',
      backgroundColor: theme.paper,
      borderLeft: `1px solid ${theme.border}`,
      transition: 'all 0.3s ease',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-5px 0 15px rgba(0,0,0,0.2)',
      fontFamily: "'Segoe UI', 'Microsoft YaHei', sans-serif",
      fontSize: '13px',
      lineHeight: '1.4',
      overflow: 'hidden',
    },
    header: {
      padding: '15px 20px',
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surface,
      flexShrink: 0,
    },
    headerTitle: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '600',
      color: theme.textPrimary,
    },
    headerSubtitle: {
      fontSize: '11px',
      color: theme.textSecondary,
      marginTop: '2px',
    },
    closeButton: {
      width: '32px',
      height: '32px',
      backgroundColor: theme.warning,
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    newNoteButton: {
      width: '100%',
      padding: '10px',
      backgroundColor: theme.accent,
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    noteItem: {
      backgroundColor: 'transparent',
      border: `1px solid ${theme.border}`,
      borderRadius: '6px',
      padding: '12px',
      marginBottom: '8px',
      transition: 'all 0.2s ease',
    },
    deleteButton: {
      backgroundColor: 'transparent',
      color: theme.danger,
      border: `1px solid ${theme.danger}`,
      borderRadius: '4px',
      cursor: 'pointer',
      padding: '2px 8px',
      fontSize: '12px',
      transition: 'all 0.2s ease',
    },
    editButton: {
      backgroundColor: 'transparent',
      color: theme.info,
      border: `1px solid ${theme.info}`,
      borderRadius: '4px',
      cursor: 'pointer',
      padding: '2px 8px',
      fontSize: '12px',
      transition: 'all 0.2s ease',
      marginRight: '5px',
    },
    clearButton: {
      flex: 1,
      padding: '8px 12px',
      backgroundColor: theme.surface,
      color: theme.textSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    saveButton: {
      flex: 1,
      padding: '8px 12px',
      backgroundColor: theme.accent,
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    cancelButton: {
      flex: 1,
      padding: '8px 12px',
      backgroundColor: theme.surface,
      color: theme.warning,
      border: `1px solid ${theme.warning}`,
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
  };

  // ==================== 状态管理 ====================
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [editorText, setEditorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [originalNoteContent, setOriginalNoteContent] = useState('');
  const textareaRef = useRef(null);

  // ==================== API 函数 ====================

  // 获取所有笔记
  const fetchNotes = async () => {
    try {
      const token = getToken ? getToken() : localStorage.getItem('token');
      if (!token) {
        console.warn('未登录，无法获取笔记');
        // 显示确认对话框
        setTimeout(() => {
          if (window.confirm('您需要登录才能使用此功能。是否跳转到登录页面？')) {
            navigate('/');
          }
          // 如果用户取消，关闭组件
          if (onClose && typeof onClose === 'function') {
            onClose();
          }
        }, 500);
        return;
      }

      const response = await fetch(`${baseUrl}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`获取笔记失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // 过滤掉已删除的笔记
        const validNotes = result.data.filter(note => !note.isDeleted);
        setNotes(validNotes);
      } else {
        message.error(result.message || '获取笔记失败');
      }
    } catch (error) {
      console.error('获取笔记失败:', error);
      message.error('获取笔记失败');
    }
  };

  // 创建新笔记
  const createNote = async (noteData) => {
    try {
      const token = getToken ? getToken() : localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return null;
      }

      const response = await fetch(`${baseUrl}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noteData)
      });

      if (!response.ok) {
        throw new Error(`保存笔记失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        message.error(result.message || '保存笔记失败');
        return null;
      }
    } catch (error) {
      console.error('保存笔记失败:', error);
      message.error('保存笔记失败');
      return null;
    }
  };

  // 更新笔记
  const updateNote = async (noteId, updatedContent) => {
    try {
      const token = getToken ? getToken() : localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return false;
      }
      console.log('updateNote11111111', baseUrl, noteId, updatedContent)
      const response = await fetch(`${baseUrl}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: updatedContent })
      });

      if (!response.ok) {
        throw new Error(`更新笔记失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        return true;
      } else {
        message.error(result.message || '更新笔记失败');
        return false;
      }
    } catch (error) {
      console.error('更新笔记失败:', error);
      message.error('更新笔记失败');
      return false;
    }
  };

  // 删除笔记
  const deleteNote = async (noteId) => {
    try {
      const token = getToken ? getToken() : localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return false;
      }

      const response = await fetch(`${baseUrl}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`删除笔记失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        return true;
      } else {
        message.error(result.message || '删除笔记失败');
        return false;
      }
    } catch (error) {
      console.error('删除笔记失败:', error);
      message.error('删除笔记失败');
      return false;
    }
  };

  // 搜索笔记
  const searchNotes = async (query) => {
    try {
      const token = getToken ? getToken() : localStorage.getItem('token');
      if (!token) {
        console.warn('未登录，无法搜索');
        return [];
      }

      const response = await fetch(`${baseUrl}/notes/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`搜索笔记失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // 过滤掉已删除的笔记
        const validNotes = result.data?.notes?.filter(note => !note.isDeleted) || [];
        return validNotes;
      } else {
        message.warning(result.message || '搜索失败');
        return [];
      }
    } catch (error) {
      console.error('搜索笔记失败:', error);
      return [];
    }
  };

  // ==================== 核心功能函数 ====================

  // 保存笔记（新建或更新）
  const handleSaveNote = async () => {
    if (!editorText.trim()) {
      message.warning('请输入笔记内容');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && editingNoteId) {
        // 编辑现有笔记
        const success = await updateNote(editingNoteId, editorText);
        if (success) {
          // 更新本地笔记列表
          const updatedNotes = notes.map(note =>
            note._id === editingNoteId
              ? {
                ...note,
                content: editorText,
                updatedAt: new Date().toISOString(),
                wordCount: editorText.trim().split(/\s+/).length
              }
              : note
          );

          setNotes(updatedNotes);

          // 重置编辑状态
          setIsEditing(false);
          setEditingNoteId(null);
          setOriginalNoteContent('');

          // 调用回调函数
          if (onUpdateNote) {
            onUpdateNote(editingNoteId, editorText);
          }

          message.success('笔记已更新');
        }
      } else {
        // 新建笔记
        const noteData = {
          content: editorText,
          videoContext: {
            videoTitle: videoContext?.videoTitle || '',
            currentTime: videoContext?.currentTime || 0,
            subtitle: videoContext?.subtitle || '',
            word: videoContext?.word || '',
          }
        };

        const savedNote = await createNote(noteData);

        if (savedNote) {
          // 更新本地笔记列表
          setNotes(prev => [savedNote, ...prev]);

          // 调用回调函数
          if (onAddNote) {
            onAddNote(savedNote);
          }

          message.success('笔记已保存到服务器');
        }
      }

      // 清空编辑器
      setEditorText('');
    } catch (error) {
      console.error('保存笔记失败:', error);
      message.error(isEditing ? '更新笔记失败' : '保存笔记失败');
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑笔记
  const handleEditNote = (note) => {
    setIsEditing(true);
    setEditingNoteId(note._id);
    setEditorText(note.content);
    setOriginalNoteContent(note.content);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // 删除单条笔记
  const handleDeleteNote = async (noteId) => {
    const confirmed = window.confirm('确定要删除这条笔记吗？');
    if (!confirmed) return;

    const success = await deleteNote(noteId);
    if (success) {
      const updatedNotes = notes.filter(note => note._id !== noteId);
      setNotes(updatedNotes);
      message.success('笔记已删除');

      // 如果删除的是正在编辑的笔记，重置编辑状态
      if (isEditing && editingNoteId === noteId) {
        handleCancelEdit();
      }
    }
  };

  // 新建笔记
  const handleNewNote = () => {
    setIsEditing(false);
    setEditingNoteId(null);
    setEditorText(initialText || '');
    setOriginalNoteContent('');

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingNoteId(null);
    setEditorText('');
    setOriginalNoteContent('');
  };

  // 处理搜索
  const handleSearch = async (query) => {
    setSearchText(query);

    if (query.trim()) {
      setSearchLoading(true);
      const searchResults = await searchNotes(query);
      setNotes(searchResults);
      setSearchLoading(false);
    } else {
      // 清空搜索，重新获取所有笔记
      fetchNotes();
    }
  };

  // 清空编辑器
  const handleClearEditor = () => {
    setEditorText('');
    setSearchText('');
    setIsEditing(false);
    setEditingNoteId(null);
    setOriginalNoteContent('');
    fetchNotes();
  };


  // ==================== 生命周期 ====================

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialText) {
      setEditorText(initialText);
    }
  }, [initialText]);

  // ==================== 工具函数 ====================

  // 格式化时间显示
  const formatDisplayTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else if (diffDays === 1) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }
    } catch (error) {
      return timestamp;
    }
  };

  // 格式化视频时间
  const formatVideoTime = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ==================== 渲染函数 ====================

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .note-item-animation {
          animation: slideIn 0.3s ease;
        }
        
        .notes-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .notes-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .notes-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .notes-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .hover-scale:hover {
          transform: scale(1.05);
        }
        
        .hover-lift:hover {
          transform: translateY(-2px);
        }
        
        .fade-in {
          animation: slideIn 0.3s ease;
        }
        
        .selected-note {
          border-color: #4ec9b0 !important;
          background-color: rgba(78, 201, 176, 0.05) !important;
          transform: translateX(2px);
        }
      `}</style>

      {/* 标题栏 */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>学习笔记本</h3>
          <div style={styles.headerSubtitle}>
            {searchLoading ? '搜索中...' : loading ? '加载中...' : `${notes.length} 条笔记`}
            {isEditing && ` · 编辑中 (ID: ${editingNoteId?.substring(0, 8)}...)`}
          </div>
        </div>
        <button
          onClick={() => {
            handleCancelEdit();
            onClose && onClose();
          }}
          style={styles.closeButton}
          className="hover-scale"
          title="关闭笔记本"
        >
          ✕
        </button>
      </div>

      {/* 搜索栏 */}
      <div style={{ padding: '10px', borderBottom: `1px solid ${theme.border}` }}>
        <input
          type="text"
          placeholder="搜索笔记内容..."
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
            fontSize: '12px',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = theme.accent}
          onBlur={(e) => e.target.style.borderColor = theme.border}
          disabled={searchLoading}
        />
      </div>

      {/* 操作按钮区域 */}
      <div style={{ padding: '10px 15px 0', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleNewNote}
          style={styles.newNoteButton}
          className="hover-lift"
        >
          📝 {isEditing ? '新建笔记' : '新建笔记'}
        </button>
      </div>

      {/* 笔记列表 */}
      <div
        className="notes-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px'
        }}
      >
        {searchLoading || loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textSecondary }}>
            加载中...
          </div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.textSecondary }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📝</div>
            <div>{searchText ? '未找到匹配的笔记' : '暂无笔记'}</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              {searchText ? '尝试其他关键词' : '点击上方的"新建笔记"按钮开始记录'}
            </div>
          </div>
        ) : (
          notes.map(note => (
            <div
              key={note._id}
              className={`note-item-animation ${editingNoteId === note._id ? 'selected-note' : ''}`}
              style={{
                ...styles.noteItem,
                cursor: 'pointer',
                borderColor: editingNoteId === note._id ? theme.accent : theme.border,
                backgroundColor: editingNoteId === note._id ? theme.highlight : 'transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>
                  {formatDisplayTime(note.updatedAt || note.createdAt)}
                  {note.videoContext?.videoTitle && ` · ${note.videoContext.videoTitle}`}
                  {note.videoContext?.currentTime && ` (${formatVideoTime(note.videoContext.currentTime)})`}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditNote(note);
                    }}
                    style={styles.editButton}
                    className="hover-scale"
                    title="编辑这条笔记"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note._id);
                    }}
                    style={styles.deleteButton}
                    className="hover-scale"
                    title="删除这条笔记"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div
                onClick={() => handleEditNote(note)}
                style={{
                  fontSize: '13px',
                  color: theme.textPrimary,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.4',
                  cursor: 'pointer'
                }}
              >
                {note.content.length > 100
                  ? note.content.substring(0, 100) + '...'
                  : note.content}
              </div>
              {/* 显示单词/字幕上下文 */}
              {(note.videoContext?.word || note.videoContext?.subtitle) && (
                <div style={{
                  fontSize: '11px',
                  color: theme.textSecondary,
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: `1px dotted ${theme.border}`
                }}>
                  {note.videoContext?.word && (
                    <div style={{ display: 'inline-block', marginRight: '8px' }}>
                      📌 <strong>{note.videoContext.word}</strong>
                    </div>
                  )}
                  {note.videoContext?.subtitle && (
                    <div style={{ marginTop: '2px', fontStyle: 'italic', fontSize: '10px' }}>
                      "{note.videoContext.subtitle.substring(0, 60)}
                      {note.videoContext.subtitle.length > 60 ? '...' : ''}"
                    </div>
                  )}
                </div>
              )}
              {/* 显示编辑状态 */}
              {note.updatedAt !== note.createdAt && (
                <div style={{
                  fontSize: '9px',
                  color: theme.info,
                  marginTop: '6px',
                  textAlign: 'right'
                }}>
                  已编辑
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 编辑器 */}
      <div style={{
        borderTop: `1px solid ${theme.border}`,
        padding: '15px',
        backgroundColor: theme.paper,
        flexShrink: 0
      }}>
        <div style={{
          fontSize: '12px',
          color: isEditing ? theme.success : theme.accent,
          marginBottom: '8px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{isEditing ? '📝 编辑笔记' : '📝 新建笔记'}</span>
            {isEditing && (
              <span style={{
                fontSize: '10px',
                backgroundColor: theme.success + '20',
                color: theme.success,
                padding: '2px 6px',
                borderRadius: '3px'
              }}>
                编辑模式
              </span>
            )}
          </div>
          <div style={{ fontSize: '10px', color: theme.textSecondary }}>
            {editorText.trim().length} 字
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={editorText}
          onChange={(e) => setEditorText(e.target.value)}
          placeholder="输入你的学习笔记...\n可以记录单词、语法、心得等"
          style={{
            width: '100%',
            minHeight: '120px',
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            padding: '10px',
            fontSize: '13px',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: '1.4',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = theme.accent}
          onBlur={(e) => e.target.style.borderColor = theme.border}
          rows={4}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '8px' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                style={styles.cancelButton}
                className="hover-lift"
                disabled={loading || searchLoading}
              >
                取消编辑
              </button>
              <button
                onClick={handleSaveNote}
                style={{
                  ...styles.saveButton,
                  backgroundColor: theme.success,
                  opacity: loading || !editorText.trim() ? 0.6 : 1
                }}
                className="hover-lift"
                disabled={loading || searchLoading || !editorText.trim() || editorText === originalNoteContent}
              >
                {loading ? '更新中...' : '更新笔记'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClearEditor}
                style={styles.clearButton}
                className="hover-lift"
                disabled={loading || searchLoading}
              >
                {searchText ? '清除搜索' : '清空'}
              </button>
              <button
                onClick={handleSaveNote}
                style={{
                  ...styles.saveButton,
                  opacity: loading || !editorText.trim() ? 0.6 : 1
                }}
                className="hover-lift"
                disabled={loading || searchLoading || !editorText.trim()}
              >
                {loading ? '保存中...' : '保存笔记'}
              </button>
            </>
          )}
        </div>

        {/* 上下文提示 */}
        <div style={{
          fontSize: '11px',
          color: theme.textSecondary,
          marginTop: '10px',
          textAlign: 'center',
          padding: '8px',
          backgroundColor: theme.surface,
          borderRadius: '4px',
          border: `1px solid ${theme.border}`,
          lineHeight: '1.5'
        }}>
          {videoContext?.word && `📌 当前单词: ${videoContext.word}`}
          {videoContext?.subtitle && `${videoContext?.word ? '\n' : ''}🎬 当前字幕: ${videoContext.subtitle.substring(0, 25)}${videoContext.subtitle.length > 25 ? '...' : ''}`}
          {!videoContext?.word && !videoContext?.subtitle && '📝 记录你的学习心得'}
          {isEditing && originalNoteContent && (
            <div style={{ marginTop: '5px', color: theme.warning, fontSize: '10px' }}>
              正在编辑：{originalNoteContent.substring(0, 30)}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notebook;