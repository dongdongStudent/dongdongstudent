// src/translator/translator.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Tab,
  Tabs,
  Zoom,
  Fade,
  Slide,
  Switch,
  FormControlLabel,
  Collapse
} from '@mui/material';
import {
  VolumeUp,
  Close,
  Translate,
  Clear,
  Search,
  ContentCopy,
  MenuBook,
  School,
  AutoStories,
  History as HistoryIcon,
  Star,
  StarBorder,
  DragHandle,
  Add,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { F_translator, F_speak } from '../Function/weisimin.js';
import { message } from 'antd';
import VocabularyMaster from '../word/workStudy.js';
import WordBook from '../word/wordReviewBook.js';
import { getToken } from '../config.js';
import { F_get_words_study } from '../word/wordReviewUtils.js';

// 标签页组件
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`translator-tabpanel-${index}`}
      aria-labelledby={`translator-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// 可拖拽组件 - 支持触摸事件
const DraggableDialog = ({ children, open, onClose, isCompact, ...props }) => {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('translator_position');
    if (saved) {
      return JSON.parse(saved);
    }
    // 手机端默认显示在中间
    const isMobile = window.innerWidth <= 600;
    return { 
      x: isMobile ? 10 : window.innerWidth - (isCompact ? 280 : 720),
      y: isMobile ? 80 : 100
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('translator_minimized') === 'true';
  });
  const dialogRef = useRef(null);

  // 检测是否为手机端
  const isMobile = window.innerWidth <= 600;

  useEffect(() => {
    const handleResize = () => {
      if (!isDragging && !localStorage.getItem('translator_position')) {
        const newIsMobile = window.innerWidth <= 600;
        setPosition({
          x: newIsMobile ? 10 : window.innerWidth - (isCompact ? 280 : 720),
          y: newIsMobile ? 80 : 100
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDragging, isCompact]);

  useEffect(() => {
    localStorage.setItem('translator_position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('translator_minimized', isMinimized);
  }, [isMinimized]);

  // 鼠标/触摸开始
  const handleDragStart = (e) => {
    // 检查是否点击在拖拽手柄上
    const target = e.target;
    if (!target.closest('.drag-handle')) return;

    e.preventDefault(); // 防止触摸时页面滚动
    
    setIsDragging(true);
    const rect = dialogRef.current?.getBoundingClientRect();
    if (rect) {
      // 获取触摸点或鼠标点坐标
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }
  };

  // 鼠标/触摸移动
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault(); // 防止触摸时页面滚动

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // 计算边界
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;

    setPosition({
      x: Math.max(0, Math.min(maxX, clientX - dragOffset.x)),
      y: Math.max(0, Math.min(maxY, clientY - dragOffset.y))
    });
  }, [isDragging, dragOffset]);

  // 鼠标/触摸结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加/移除事件监听
  useEffect(() => {
    if (isDragging) {
      // 鼠标事件
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      
      // 触摸事件
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('touchcancel', handleDragEnd);
    }
    
    return () => {
      // 移除鼠标事件
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      
      // 移除触摸事件
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

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
          width: isMinimized ? 280 : (isCompact ? 280 : (isMobile ? 'calc(100% - 20px)' : 700)),
          height: isMinimized ? 50 : (isCompact ? 300 : (isMobile ? 500 : 600)),
          maxHeight: isMobile ? '90vh' : '80vh',
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
          touchAction: 'none', // 防止触摸时页面滚动
          userSelect: 'none' // 防止拖动时选中文字
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
            touchAction: 'none', // 防止触摸时页面滚动
            '&:active': {
              cursor: 'grabbing'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isCompact ? 0.5 : 1 }}>
            <DragHandle sx={{ color: '#858585', fontSize: isCompact ? 16 : 20 }} />
            <Translate sx={{ color: '#4ec9b0', fontSize: isCompact ? 16 : 20 }} />
            <Typography variant={isCompact ? "caption" : "subtitle1"} sx={{ fontWeight: 500 }}>
              {isCompact ? '翻译' : '单词学习'}
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
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {children}
          </Box>
        )}
      </Paper>
    </Zoom>
  );
};

// ========== 极简翻译组件（简洁模式专用） ==========
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
  onWordAdded
}) => {
  const [isAdding, setIsAdding] = useState(false);

  // 检查登录状态
  const checkLoginStatus = useCallback(() => {
    if (!getToken) {
      message.warning('请先登录');
      return false;
    }
    return true;
  }, [getToken]);

  // 添加单词
  const handleAddWord = async () => {
    if (!checkLoginStatus()) return;

    const trimmedWord = searchInput.trim();
    if (!trimmedWord) {
      message.warning('请输入单词');
      return;
    }

    if (existingWords.some(w => 
      (typeof w === 'string' ? w : w.word).toLowerCase() === trimmedWord.toLowerCase()
    )) {
      message.warning(`"${trimmedWord}" 已存在`);
      return;
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
        
        // 自动翻译
        onSearch();
        
        if (onWordAdded) {
          onWordAdded({
            word: trimmedWord,
            translation: translation,
            success: true
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
    <Box sx={{ p: 2 }}>
      {/* 输入框和添加按钮并排 */}
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
          placeholder="输入英文单词..."
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
          disabled={isAdding || !searchInput.trim()}
          size="small"
          sx={{
            minWidth: 60,
            height: 40,
            backgroundColor: '#4ec9b0',
            color: '#1e1e1e',
            fontSize: '0.9rem',
            fontWeight: 500,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { 
              backgroundColor: '#3da890',
              boxShadow: 'none'
            },
            '&:disabled': { 
              backgroundColor: '#444',
              color: '#888'
            }
          }}
        >
          {isAdding ? '添加中' : '添加'}
        </Button>
      </Box>

      {/* 翻译结果区域 - 极简显示 */}
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

// ========== 完整翻译组件（普通模式） ==========
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
  onWordAdded
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [preview, setPreview] = useState('');

  // 实时翻译预览
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim()) {
        F_translator(searchInput).then(setPreview);
      } else {
        setPreview('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // 检查登录状态
  const checkLoginStatus = useCallback(() => {
    if (!getToken) {
      message.warning('请先登录');
      return false;
    }
    return true;
  }, [getToken]);

  // 添加单词
  const handleAddWord = async () => {
    if (!checkLoginStatus()) return;

    const trimmedWord = searchInput.trim();
    if (!trimmedWord) {
      message.warning('请输入单词');
      return;
    }

    if (existingWords.some(w => 
      (typeof w === 'string' ? w : w.word).toLowerCase() === trimmedWord.toLowerCase()
    )) {
      message.warning(`"${trimmedWord}" 已存在`);
      return;
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
        
        // 自动翻译
        onSearch();
        
        if (onWordAdded) {
          onWordAdded({
            word: trimmedWord,
            translation: preview,
            success: true
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
    <Box sx={{ p: 2 }}>
      {/* 输入框和添加按钮并排 */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddWord();
            }
          }}
          placeholder="输入英文单词..."
          variant="outlined"
          size="small"
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Translate sx={{ color: '#858585', fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: preview && searchInput && (
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
          disabled={isAdding || !searchInput.trim()}
          size="small"
          sx={{
            minWidth: 60,
            height: 40,
            backgroundColor: '#4ec9b0',
            color: '#1e1e1e',
            fontSize: '0.9rem',
            fontWeight: 500,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { 
              backgroundColor: '#3da890',
              boxShadow: 'none'
            },
            '&:disabled': { 
              backgroundColor: '#444',
              color: '#888'
            }
          }}
        >
          {isAdding ? '添加中' : '添加'}
        </Button>
      </Box>

      {/* 发音按钮放在输入框下方 */}
      {searchInput && (
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
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
      )}

      {/* 翻译结果区域 */}
      {loading && (
        <Box sx={{ textAlign: 'center', py: 3, mt: 2 }}>
          <CircularProgress size={30} sx={{ color: '#4ec9b0' }} />
        </Box>
      )}

      {error && !loading && (
        <Alert 
          severity="error" 
          size="small"
          sx={{ 
            mt: 2,
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
          mt: 2,
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

// 翻译组件
const WordTranslator = ({
  open,
  onClose,
  word: initialWord = '',
  onAddToWordBook,
  isWordInBook = false,
  G_word_name = 'word_english_test_study',
  onWordChange,
  autoSpeak = true,
  getToken: propGetToken,
  initialTab = 1,
  defaultCompact = false
}) => {
  const [word, setWord] = useState(initialWord);
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(initialWord);
  const [isCompact, setIsCompact] = useState(() => {
    const saved = localStorage.getItem('translator_compact');
    return saved !== null ? JSON.parse(saved) : defaultCompact;
  });
  
  const [tabValue, setTabValue] = useState(() => {
    const saved = localStorage.getItem('translator_tab');
    return saved !== null ? parseInt(saved) : initialTab;
  });
  
  const [existingWords, setExistingWords] = useState([]);
  
  const [showVocabMaster, setShowVocabMaster] = useState(false);
  const [showWordBook, setShowWordBook] = useState(false);
  const [vocabKey, setVocabKey] = useState(0);

  // 获取已有单词列表
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
    localStorage.setItem('translator_tab', tabValue.toString());
  }, [tabValue]);

  useEffect(() => {
    if (open && !isCompact) {
      if (tabValue === 1) {
        setShowVocabMaster(true);
        setShowWordBook(false);
        setVocabKey(prev => prev + 1);
      } else if (tabValue === 2) {
        setShowVocabMaster(false);
        setShowWordBook(true);
      } else {
        setShowVocabMaster(false);
        setShowWordBook(false);
      }
    }
  }, [open, tabValue, isCompact]);

  useEffect(() => {
    if (initialWord && open) {
      setSearchInput(initialWord);
      setWord(initialWord);
      translateWord(initialWord, true);
    }
  }, [initialWord, open]);

  const translateWord = useCallback(async (wordToTranslate, shouldSpeak = true) => {
    if (!wordToTranslate || wordToTranslate.trim() === '') {
      setError('请输入要翻译的单词');
      return;
    }

    const cleanedWord = wordToTranslate.replace(/[.,!?;:'"()\[\]{}]/g, "").trim();
    
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
            source: 'translator'
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    if (newValue === 1) {
      setShowVocabMaster(true);
      setShowWordBook(false);
      setVocabKey(prev => prev + 1);
    } else if (newValue === 2) {
      setShowVocabMaster(false);
      setShowWordBook(true);
    } else {
      setShowVocabMaster(false);
      setShowWordBook(false);
    }
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

  const handleVocabMasterClose = () => {
    setShowVocabMaster(false);
    setTabValue(0);
    fetchExistingWords();
  };

  const handleWordBookClose = () => {
    setShowWordBook(false);
    setTabValue(0);
    fetchExistingWords();
  };

  const toggleCompact = () => {
    setIsCompact(!isCompact);
  };

  const handleWordAdded = (data) => {
    setSearchInput(data.word);
    translateWord(data.word, true);
    fetchExistingWords();
    
    if (onWordChange) {
      onWordChange({
        word: data.word,
        action: 'added',
        source: 'translator'
      });
    }
  };

  return (
    <DraggableDialog open={open} onClose={onClose} isCompact={isCompact}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 简洁模式开关 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          px: 2, 
          pt: 1,
          borderBottom: '1px solid #3c3c3c'
        }}>
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

        {/* 内容区域 - 简洁模式直接显示翻译，不显示标签页 */}
        {isCompact ? (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
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
            />
          </Box>
        ) : (
          <>
            {/* 标签页 - 仅在普通模式显示 */}
            <Box sx={{ borderBottom: 1, borderColor: '#3c3c3c', px: 2, flexShrink: 0 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    color: '#858585',
                    minHeight: 48,
                    '&.Mui-selected': {
                      color: '#4ec9b0'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#4ec9b0'
                  }
                }}
              >
                <Tab icon={<Translate />} label="翻译" iconPosition="start" />
                <Tab icon={<School />} label="学习" iconPosition="start" />
                <Tab icon={<AutoStories />} label="复习" iconPosition="start" />
              </Tabs>
            </Box>

            {/* 内容区域 */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <TabPanel value={tabValue} index={0}>
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
                />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {showVocabMaster && (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderBottom: '1px solid #3c3c3c',
                      backgroundColor: '#2d2d2d'
                    }}>
                      <Typography variant="h6" sx={{ color: '#4ec9b0', fontSize: '1rem' }}>
                        单词学习
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="返回翻译">
                          <IconButton 
                            size="small"
                            onClick={() => setTabValue(0)}
                            sx={{ color: '#858585' }}
                          >
                            <Translate fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton 
                          size="small"
                          onClick={handleVocabMasterClose}
                          sx={{ color: '#858585' }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                      <VocabularyMaster
                        key={vocabKey}
                        getToken={getTokenValue()}
                        clickWork={word}
                        onClose={handleVocabMasterClose}
                        onWordChange={(data) => {
                          if (onWordChange) onWordChange(data);
                          if (data?.word) {
                            setWord(data.word);
                            setSearchInput(data.word);
                          }
                        }}
                        G_word_name={G_word_name}
                      />
                    </Box>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                {showWordBook && (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderBottom: '1px solid #3c3c3c',
                      backgroundColor: '#2d2d2d'
                    }}>
                      <Typography variant="h6" sx={{ color: '#4ec9b0', fontSize: '1rem' }}>
                        单词复习本
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="返回翻译">
                          <IconButton 
                            size="small"
                            onClick={() => setTabValue(0)}
                            sx={{ color: '#858585' }}
                          >
                            <Translate fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton 
                          size="small"
                          onClick={handleWordBookClose}
                          sx={{ color: '#858585' }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                      <WordBook
                        G_json={`word_english_test_review`}
                        onClose={handleWordBookClose}
                        onWordSelect={(selectedWord) => {
                          setWord(selectedWord);
                          setSearchInput(selectedWord);
                          setTabValue(0);
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </TabPanel>
            </Box>
          </>
        )}
      </Box>
    </DraggableDialog>
  );
};

export const QuickTranslateButton = ({ word, onClick, size = 'small' }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    F_speak(word);
    onClick(word);
  };

  return (
    <Tooltip title={`翻译 "${word}"`}>
      <IconButton
        size={size}
        onClick={handleClick}
        sx={{
          color: '#858585',
          '&:hover': {
            color: '#4ec9b0',
            backgroundColor: 'rgba(78, 201, 176, 0.1)'
          }
        }}
      >
        <Translate fontSize={size} />
      </IconButton>
    </Tooltip>
  );
};

export default WordTranslator;