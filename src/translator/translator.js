// src/translator/translator.js
import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  Divider,
  Tooltip,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Zoom,
  Switch,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import {
  VolumeUp,
  Close,
  Translate,
  MenuBook,
  School,
  AutoStories,
  DragHandle,
  ContentCopy
} from '@mui/icons-material';
import { F_translator, F_speak } from '../Function/weisimin.js';
import { message } from 'antd';
import VocabularyMaster from '../word/workStudy.js';
import WordBook from '../word/wordReviewBook.js';
import { getToken } from '../config.js';
import { F_get_words_study } from '../word/wordReviewUtils.js';
import SentenceCenter from '../sentence/review_center.js';

// 辅助函数：检查是否为有效的单词或短语（不超过7个单词）
const isValidText = (text) => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  
  // 检查是否包含中文字符（如果是中文就不处理）
  if (/[\u4e00-\u9fa5]/.test(trimmed)) return false;
  
  // 检查单词数量
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  return words.length > 0 && words.length <= 7;
};

// 辅助函数：获取单词数量
const getWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// 辅助函数：检查是否为单词（不含空格或只有1个单词）
const isSingleWord = (text) => {
  const words = text.trim().split(/\s+/);
  return words.length === 1;
};

// 可拖拽组件 - 支持自定义宽高
const DraggableDialog = ({ children, open, onClose, isCompact, title = "翻译", customWidth, customHeight }) => {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('translator_position');
    if (saved) {
      return JSON.parse(saved);
    }
    const isMobile = window.innerWidth <= 600;
    const width = customWidth || (isCompact ? 280 : (isMobile ? 'calc(100% - 20px)' : 450));
    const defaultWidth = typeof width === 'number' ? width : 450;
    return { 
      x: isMobile ? 10 : window.innerWidth - defaultWidth - 20,
      y: isMobile ? 80 : 100
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('translator_minimized') === 'true';
  });
  const dialogRef = useRef(null);

  const isMobile = window.innerWidth <= 600;

  useEffect(() => {
    localStorage.setItem('translator_position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('translator_minimized', isMinimized);
  }, [isMinimized]);

  const handleDragStart = (e) => {
    const target = e.target;
    if (!target.closest('.drag-handle')) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = dialogRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }
  };

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    setPosition({
      x: Math.max(0, Math.min(maxX, clientX - dragOffset.x)),
      y: Math.max(0, Math.min(maxY, clientY - dragOffset.y))
    });
  }, [isDragging, dragOffset]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('touchcancel', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const getWidth = () => {
    if (customWidth) return customWidth;
    if (isMinimized) return 280;
    if (isCompact) return 280;
    if (isMobile) return 'calc(100% - 20px)';
    return 450;
  };

  const getHeight = () => {
    if (customHeight) return customHeight;
    if (isMinimized) return 50;
    if (isCompact) return 350;
    if (isMobile) return 600;
    return 650;
  };

  if (!open) return null;

  return (
    <Zoom in={open}>
      <Paper
        ref={dialogRef}
        elevation={24}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        sx={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: getWidth(),
          height: getHeight(),
          maxHeight: isMobile ? '90vh' : '85vh',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1300,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          transition: isDragging ? 'none' : 'all 0.2s ease',
          cursor: isDragging ? 'grabbing' : 'default',
          border: '1px solid #3c3c3c',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <Box
          className="drag-handle"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          sx={{
            p: isCompact ? 0.5 : 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #3c3c3c',
            cursor: 'grab',
            backgroundColor: '#2d2d2d',
            touchAction: 'none',
            '&:active': { cursor: 'grabbing' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isCompact ? 0.5 : 1 }}>
            <DragHandle sx={{ color: '#858585', fontSize: isCompact ? 16 : 20 }} />
            <Translate sx={{ color: '#4ec9b0', fontSize: isCompact ? 16 : 20 }} />
            <Typography variant={isCompact ? "caption" : "subtitle1"} sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
          </Box>
          <Box>
            <IconButton 
              size="small" 
              onClick={onClose} 
              sx={{ color: '#858585', p: isCompact ? 0.5 : 1 }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {!isMinimized && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            {children}
          </Box>
        )}
      </Paper>
    </Zoom>
  );
};

// ========== 极简翻译组件 ==========
const CompactTranslator = ({
  word,
  translation,
  loading,
  error,
  onSearch,
  onSpeak,
  searchInput,
  setSearchInput,
  G_word_name,
  getToken,
  existingWords = [],
  onWordAdded,
  onOpenVocabMaster,
  onOpenWordBook,
  onOpenSentenceCenter
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const wordCount = getWordCount(searchInput);
  const isValidLength = wordCount > 0 && wordCount <= 7;
  const isWord = isSingleWord(searchInput);

  const checkLoginStatus = useCallback(() => {
    if (!getToken) {
      message.warning('请先登录');
      return false;
    }
    return true;
  }, [getToken]);

  const handleAddWord = async () => {
    if (!checkLoginStatus()) return;

    const trimmedWord = searchInput.trim();
    if (!trimmedWord) {
      message.warning('请输入单词或短语');
      return;
    }

    if (wordCount > 7) {
      message.warning('最多支持7个单词的短语');
      return;
    }

    if (isWord && existingWords.some(w => 
      (typeof w === 'string' ? w : w.word).toLowerCase() === trimmedWord.toLowerCase()
    )) {
      message.warning(`"${trimmedWord}" 已存在`);
      return;
    }

    if (!isWord) {
      message.info(`添加短语 "${trimmedWord}" 到学习列表`);
    }

    setIsAdding(true);
    try {
      const url = `https://www.ddstudent.xyz/server/english/update_words_study/${G_word_name}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken
        },
        body: JSON.stringify({
          type: 'add',
          word: trimmedWord
        })
      });

      const data = await res.json();
      if (data.flag === 1) {
        message.success(`"${trimmedWord}" 添加成功`);
        onSearch();
        if (onWordAdded) {
          onWordAdded({
            word: trimmedWord,
            translation: translation,
            success: true,
            isPhrase: !isWord
          });
        }
      } else {
        message.error(data.msg || "添加失败");
      }
    } catch (err) {
      console.error("添加单词异常:", err);
      message.error("网络异常，请重试");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddWord();
            }
          }}
          placeholder="输入英文单词或短语（最多7个词）..."
          variant="outlined"
          size="small"
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Translate sx={{ color: '#858585', fontSize: 18 }} />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: '#1a1a1a',
              color: '#d4d4d4',
              fontSize: '0.95rem',
              height: 40,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3c3c3c',
                borderWidth: 1
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4ec9b0'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4ec9b0',
                borderWidth: 2
              }
            }
          }}
        />

        <Button
          variant="contained"
          onClick={handleAddWord}
          disabled={isAdding || !searchInput.trim() || !isValidLength}
          size="small"
          sx={{
            minWidth: 60,
            height: 40,
            backgroundColor: '#4ec9b0',
            color: '#1e1e1e',
            fontSize: '0.9rem',
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': { backgroundColor: '#3da890' },
            '&:disabled': { backgroundColor: '#444', color: '#888' }
          }}
        >
          {isAdding ? '添加中' : '添加'}
        </Button>
      </Box>

      {searchInput.trim() && !isValidLength && wordCount > 7 && (
        <Alert 
          severity="warning" 
          size="small"
          sx={{ 
            mb: 2,
            backgroundColor: 'rgba(255, 171, 64, 0.1)',
            color: '#ffab40',
            border: '1px solid #ffab40',
            py: 0.5
          }}
        >
          最多支持7个单词，当前有{wordCount}个单词
        </Alert>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CircularProgress size={24} sx={{ color: '#4ec9b0' }} />
        </Box>
      )}

      {error && !loading && (
        <Alert 
          severity="error" 
          size="small"
          sx={{ 
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            color: '#ef5350',
            border: '1px solid #ef5350',
            py: 0.5
          }}
        >
          {error}
        </Alert>
      )}

      {translation && !loading && !error && (
        <Box sx={{ 
          p: 2, 
          backgroundColor: '#2d2d2d',
          border: '1px solid #3c3c3c',
          borderRadius: 1
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 1 
          }}>
            <Typography variant="h6" sx={{ color: '#4ec9b0', fontWeight: 600, fontSize: '1.1rem' }}>
              {word}
              {!isSingleWord(word) && (
                <Chip 
                  label="短语" 
                  size="small"
                  sx={{ 
                    ml: 1,
                    backgroundColor: '#0e639c',
                    color: '#fff',
                    height: 20,
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Typography>
            <Tooltip title="发音">
              <IconButton 
                size="small" 
                onClick={() => onSpeak(word)}
                sx={{ 
                  color: '#858585',
                  '&:hover': { color: '#4ec9b0' }
                }}
              >
                <VolumeUp fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider sx={{ my: 1, borderColor: '#3c3c3c' }} />

          <Typography variant="body2" sx={{ color: '#d4d4d4', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {typeof translation === 'string' ? translation : 
             translation?.basic?.explains?.join('；') || JSON.stringify(translation)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ========== 完整翻译组件 ==========
const FullTranslator = ({
  word,
  translation,
  loading,
  error,
  onSearch,
  onSpeak,
  searchInput,
  setSearchInput,
  G_word_name,
  getToken,
  existingWords = [],
  onWordAdded,
  onOpenVocabMaster,
  onOpenWordBook,
  onOpenSentenceCenter
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [preview, setPreview] = useState('');
  const wordCount = getWordCount(searchInput);
  const isValidLength = wordCount > 0 && wordCount <= 7;
  const isWord = isSingleWord(searchInput);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() && isValidLength) {
        F_translator(searchInput).then(setPreview);
      } else {
        setPreview('');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, isValidLength]);

  const checkLoginStatus = useCallback(() => {
    if (!getToken) {
      message.warning('请先登录');
      return false;
    }
    return true;
  }, [getToken]);

  const handleAddWord = async () => {
    if (!checkLoginStatus()) return;

    const trimmedWord = searchInput.trim();
    if (!trimmedWord) {
      message.warning('请输入单词或短语');
      return;
    }

    if (wordCount > 7) {
      message.warning('最多支持7个单词的短语');
      return;
    }

    if (isWord && existingWords.some(w => 
      (typeof w === 'string' ? w : w.word).toLowerCase() === trimmedWord.toLowerCase()
    )) {
      message.warning(`"${trimmedWord}" 已存在`);
      return;
    }

    if (!isWord) {
      message.info(`添加短语 "${trimmedWord}" 到学习列表`);
    }

    setIsAdding(true);
    try {
      const url = `https://www.ddstudent.xyz/server/english/update_words_study/${G_word_name}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken
        },
        body: JSON.stringify({
          type: 'add',
          word: trimmedWord
        })
      });

      const data = await res.json();
      if (data.flag === 1) {
        message.success(`"${trimmedWord}" 添加成功`);
        onSearch();
        if (onWordAdded) {
          onWordAdded({
            word: trimmedWord,
            translation: preview,
            success: true,
            isPhrase: !isWord
          });
        }
      } else {
        message.error(data.msg || "添加失败");
      }
    } catch (err) {
      console.error("添加单词异常:", err);
      message.error("网络异常，请重试");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddWord();
            }
          }}
          placeholder="输入英文单词或短语（最多7个词）..."
          variant="outlined"
          size="small"
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Translate sx={{ color: '#858585', fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: preview && searchInput && isValidLength && (
              <InputAdornment position="end">
                <Chip 
                  label={preview} 
                  size="small"
                  sx={{ 
                    backgroundColor: '#0e639c',
                    color: '#fff',
                    height: 24,
                    fontSize: '0.75rem',
                    maxWidth: 150
                  }}
                />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: '#1a1a1a',
              color: '#d4d4d4',
              fontSize: '0.95rem',
              height: 40,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3c3c3c',
                borderWidth: 1
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4ec9b0'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4ec9b0',
                borderWidth: 2
              }
            }
          }}
        />

        <Button
          variant="contained"
          onClick={handleAddWord}
          disabled={isAdding || !searchInput.trim() || !isValidLength}
          size="small"
          sx={{
            minWidth: 60,
            height: 40,
            backgroundColor: '#4ec9b0',
            color: '#1e1e1e',
            fontSize: '0.9rem',
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': { backgroundColor: '#3da890' },
            '&:disabled': { backgroundColor: '#444', color: '#888' }
          }}
        >
          {isAdding ? '添加中' : '添加'}
        </Button>
      </Box>

      {searchInput.trim() && !isValidLength && wordCount > 7 && (
        <Alert 
          severity="warning" 
          size="small"
          sx={{ 
            mb: 2,
            backgroundColor: 'rgba(255, 171, 64, 0.1)',
            color: '#ffab40',
            border: '1px solid #ffab40'
          }}
        >
          最多支持7个单词，当前有{wordCount}个单词
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<School />}
          onClick={onOpenVocabMaster}
          sx={{ 
            color: '#4ec9b0',
            borderColor: '#4ec9b0',
            fontSize: '0.75rem',
            textTransform: 'none',
            '&:hover': { 
              backgroundColor: 'rgba(78, 201, 176, 0.1)',
              borderColor: '#4ec9b0'
            }
          }}
        >
          单词学习
        </Button>
        
        <Button
          size="small"
          variant="outlined"
          startIcon={<AutoStories />}
          onClick={onOpenWordBook}
          sx={{ 
            color: '#ffab40',
            borderColor: '#ffab40',
            fontSize: '0.75rem',
            textTransform: 'none',
            '&:hover': { 
              backgroundColor: 'rgba(255, 171, 64, 0.1)',
              borderColor: '#ffab40'
            }
          }}
        >
          复习单词
        </Button>
        
        <Button
          size="small"
          variant="outlined"
          startIcon={<MenuBook />}
          onClick={onOpenSentenceCenter}
          sx={{ 
            color: '#ff9800',
            borderColor: '#ff9800',
            fontSize: '0.75rem',
            textTransform: 'none',
            '&:hover': { 
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              borderColor: '#ff9800'
            }
          }}
        >
          句子中心
        </Button>
        
        <Tooltip title="发音">
          <IconButton 
            size="small" 
            onClick={() => onSpeak(searchInput)}
            sx={{ 
              color: '#858585',
              '&:hover': { color: '#4ec9b0' }
            }}
          >
            <VolumeUp fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={30} sx={{ color: '#4ec9b0' }} />
        </Box>
      )}

      {error && !loading && (
        <Alert 
          severity="error" 
          size="small"
          sx={{ 
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            color: '#ef5350',
            border: '1px solid #ef5350'
          }}
        >
          {error}
        </Alert>
      )}

      {translation && !loading && !error && (
        <Paper sx={{ 
          p: 2, 
          backgroundColor: '#2d2d2d',
          border: '1px solid #3c3c3c',
          borderRadius: 1
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 1 
          }}>
            <Typography variant="h6" sx={{ color: '#4ec9b0', fontWeight: 600 }}>
              {word}
              {!isSingleWord(word) && (
                <Chip 
                  label="短语" 
                  size="small"
                  sx={{ 
                    ml: 1,
                    backgroundColor: '#0e639c',
                    color: '#fff',
                    height: 20,
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Typography>
          </Box>

          <Divider sx={{ my: 1, borderColor: '#3c3c3c' }} />

          <Typography variant="body1" sx={{ color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>
            {typeof translation === 'string' ? translation : 
             translation?.basic?.explains?.join('；') || JSON.stringify(translation)}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

// 翻译组件 - 使用 forwardRef 包装以支持父组件调用
const WordTranslator = forwardRef(({
  open,
  onClose,
  word: initialWord = '',
  G_word_name = 'word_english_test_study',
  onWordChange,
  autoSpeak = true,
  getToken: propGetToken,
  defaultCompact = true,
  enableClipboardDetection = true,
  onRequestOpen  // 新增：请求打开翻译器的回调
}, ref) => {
  const [word, setWord] = useState(initialWord);
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(initialWord);
  const [isCompact, setIsCompact] = useState(() => {
    const saved = localStorage.getItem('translator_compact');
    return saved !== null ? JSON.parse(saved) : defaultCompact;
  });
  const [existingWords, setExistingWords] = useState([]);
  const [showSentenceCenter, setShowSentenceCenter] = useState(false);
  const [clipboardSnackbar, setClipboardSnackbar] = useState({ open: false, text: '' });
  
  // 独立窗口状态
  const [showVocabMaster, setShowVocabMaster] = useState(false);
  const [showWordBook, setShowWordBook] = useState(false);
  const [vocabKey, setVocabKey] = useState(0);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    // 翻译指定文本
    translateText: (text) => {
      if (text && text.trim() && isValidText(text)) {
        console.log('【WordTranslator】接收到翻译请求:', text);
        const trimmedText = text.trim();
        setSearchInput(trimmedText);
        translateWord(trimmedText, autoSpeak);
        
        // 显示提示
        setClipboardSnackbar({ 
          open: true, 
          text: `检测到选中: ${trimmedText}` 
        });
        
        return true;
      }
      return false;
    },
    // 获取当前翻译的单词
    getCurrentWord: () => searchInput,
    // 获取当前翻译结果
    getCurrentTranslation: () => translation,
    // 清空当前翻译
    clearTranslation: () => {
      setSearchInput('');
      setTranslation(null);
      setError(null);
    }
  }));

  // 剪贴板监听
  useEffect(() => {
    if (!enableClipboardDetection || !open) return;

    const handleClipboardChange = async () => {
      try {
        if (!navigator.clipboard) return;
        
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText && isValidText(clipboardText)) {
          const trimmedText = clipboardText.trim();
          
          if (searchInput === trimmedText) return;
          
          setClipboardSnackbar({ 
            open: true, 
            text: `检测到复制: ${trimmedText}` 
          });
          
          setSearchInput(trimmedText);
          translateWord(trimmedText, autoSpeak);
        }
      } catch (err) {
        console.debug('无法读取剪贴板:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleClipboardChange();
      }
    };

    const handleFocus = () => {
      handleClipboardChange();
    };

    const intervalId = setInterval(() => {
      if (document.hasFocus() && open) {
        handleClipboardChange();
      }
    }, 2000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enableClipboardDetection, open, searchInput, autoSpeak]);

  const fetchExistingWords = useCallback(async () => {
    const token = getTokenValue();
    if (!token) return;
    try {
      const words = await F_get_words_study(token, G_word_name);
      setExistingWords(Array.isArray(words) ? words : []);
    } catch (err) {
      console.error('获取单词列表失败:', err);
    }
  }, [G_word_name]);

  useEffect(() => {
    if (open) {
      fetchExistingWords();
    }
  }, [open, fetchExistingWords]);

  useEffect(() => {
    localStorage.setItem('translator_compact', JSON.stringify(isCompact));
  }, [isCompact]);

  useEffect(() => {
    if (initialWord && open && !showVocabMaster && !showWordBook) {
      setSearchInput(initialWord);
      setWord(initialWord);
      translateWord(initialWord, true);
    }
  }, [initialWord, open, showVocabMaster, showWordBook]);

  const translateWord = useCallback(async (wordToTranslate, shouldSpeak = true) => {
    if (!wordToTranslate || wordToTranslate.trim() === '') {
      setError('请输入要翻译的单词或短语');
      return;
    }

    const wordCount = getWordCount(wordToTranslate);
    if (wordCount > 7) {
      setError('最多支持7个单词的短语');
      return;
    }

    const cleanedWord = wordToTranslate.trim();
    
    setLoading(true);
    setError(null);
    
    try {
      if (shouldSpeak && autoSpeak) {
        F_speak(cleanedWord);
      }
      
      const result = await F_translator(cleanedWord);
      
      if (result) {
        setTranslation(result);
        setWord(cleanedWord);
        
        if (onWordChange) {
          onWordChange({
            word: cleanedWord,
            translation: result,
            source: 'translator',
            isPhrase: !isSingleWord(cleanedWord)
          });
        }
      } else {
        setError('未找到翻译结果');
        setTranslation(null);
      }
    } catch (err) {
      console.error('翻译失败:', err);
      setError('翻译失败，请稍后重试');
      setTranslation(null);
    } finally {
      setLoading(false);
    }
  }, [onWordChange, autoSpeak]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      translateWord(searchInput, true);
    }
  };

  const handleSpeak = (wordToSpeak) => {
    F_speak(wordToSpeak);
  };

  const getTokenValue = () => {
    if (propGetToken) {
      return propGetToken();
    }
    try {
      return getToken();
    } catch (error) {
      console.warn('获取 token 失败:', error);
      return '';
    }
  };

  const handleWordAdded = (data) => {
    setSearchInput(data.word);
    translateWord(data.word, true);
    fetchExistingWords();
    
    if (onWordChange) {
      onWordChange({
        word: data.word,
        action: 'added',
        source: 'translator',
        isPhrase: data.isPhrase
      });
    }
  };

  const toggleCompact = () => {
    setIsCompact(!isCompact);
  };

  const handleOpenVocabMaster = () => {
    setShowVocabMaster(true);
    setVocabKey(prev => prev + 1);
  };

  const handleCloseVocabMaster = () => {
    setShowVocabMaster(false);
    fetchExistingWords();
  };

  const handleOpenWordBook = () => {
    setShowWordBook(true);
  };

  const handleCloseWordBook = () => {
    setShowWordBook(false);
    fetchExistingWords();
  };

  const handleOpenSentenceCenter = () => {
    setShowSentenceCenter(true);
  };

  const shouldShowTranslator = open && !showVocabMaster && !showWordBook;

  const renderTranslatorContent = () => {
    if (isCompact) {
      return (
        <CompactTranslator
          word={word}
          translation={translation}
          loading={loading}
          error={error}
          onSearch={handleSearch}
          onSpeak={handleSpeak}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          G_word_name={G_word_name}
          getToken={getTokenValue()}
          existingWords={existingWords}
          onWordAdded={handleWordAdded}
          onOpenVocabMaster={handleOpenVocabMaster}
          onOpenWordBook={handleOpenWordBook}
          onOpenSentenceCenter={handleOpenSentenceCenter}
        />
      );
    }

    return (
      <FullTranslator
        word={word}
        translation={translation}
        loading={loading}
        error={error}
        onSearch={handleSearch}
        onSpeak={handleSpeak}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        G_word_name={G_word_name}
        getToken={getTokenValue()}
        existingWords={existingWords}
        onWordAdded={handleWordAdded}
        onOpenVocabMaster={handleOpenVocabMaster}
        onOpenWordBook={handleOpenWordBook}
        onOpenSentenceCenter={handleOpenSentenceCenter}
      />
    );
  };

  return (
    <>
      {/* 翻译窗口 */}
      {shouldShowTranslator && (
        <DraggableDialog open={true} onClose={onClose} isCompact={isCompact} title="翻译">
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 简洁模式开关 */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              px: 2, 
              pt: 1,
              pb: 0.5,
              borderBottom: '1px solid #3c3c3c'
            }}>
              {enableClipboardDetection && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ContentCopy sx={{ color: '#4ec9b0', fontSize: 14 }} />
                  <Typography variant="caption" sx={{ color: '#858585' }}>
                    自动检测剪贴板
                  </Typography>
                </Box>
              )}
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={isCompact}
                    onChange={toggleCompact}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4ec9b0',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4ec9b0',
                      },
                    }}
                  />
                }
                label={<Typography variant="caption" sx={{ color: '#858585' }}>简洁模式</Typography>}
                labelPlacement="start"
              />
            </Box>

            {/* 内容区域 */}
            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {renderTranslatorContent()}
            </Box>
          </Box>
        </DraggableDialog>
      )}

      {/* 剪贴板检测提示 */}
      <Snackbar
        open={clipboardSnackbar.open}
        autoHideDuration={2000}
        onClose={() => setClipboardSnackbar({ ...clipboardSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={clipboardSnackbar.text}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: '#4ec9b0',
            color: '#1e1e1e',
            fontWeight: 500
          }
        }}
      />

      {/* 单词学习窗口 */}
      {showVocabMaster && (
        <DraggableDialog 
          open={true} 
          onClose={handleCloseVocabMaster} 
          isCompact={false} 
          title="单词学习"
          customWidth={950}
          customHeight="85vh"
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <VocabularyMaster
                key={vocabKey}
                getToken={getTokenValue()}
                clickWork={word}
                onClose={handleCloseVocabMaster}
                onWordChange={(data) => {
                  if (onWordChange) onWordChange(data);
                  if (data?.word) {
                    setWord(data.word);
                    setSearchInput(data.word);
                  }
                }}
                G_word_name={G_word_name}
                embedded={true}
              />
            </Box>
          </Box>
        </DraggableDialog>
      )}

      {/* 单词复习窗口 */}
      {showWordBook && (
        <DraggableDialog 
          open={true} 
          onClose={handleCloseWordBook} 
          isCompact={false} 
          title="单词复习"
          customWidth={800}
          customHeight="80vh"
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <WordBook
                G_json={`word_english_test_review`}
                onClose={handleCloseWordBook}
                onWordSelect={(selectedWord) => {
                  setWord(selectedWord);
                  setSearchInput(selectedWord);
                  handleCloseWordBook();
                }}
              />
            </Box>
          </Box>
        </DraggableDialog>
      )}
      
      {/* 句子中心模态框 */}
      <Dialog
        open={showSentenceCenter}
        onClose={() => setShowSentenceCenter(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1a237e', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBook />
            <Typography variant="h6">句子学习中心</Typography>
          </Box>
          <IconButton onClick={() => setShowSentenceCenter(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <SentenceCenter />
        </DialogContent>
      </Dialog>
    </>
  );
});

WordTranslator.displayName = 'WordTranslator';

export default WordTranslator;