import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IconButton,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  Divider,
  Tooltip,
  TextField,
  Chip,
  Zoom,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  VolumeUp,
  Close,
  Translate,
  MenuBook,
  School,
  AutoStories,
  DragHandle,
  RecordVoiceOver,
  Add,
  ContentCopy,
  Sync
} from '@mui/icons-material';
import { F_translator } from '../Function/weisimin.js';

// ========== 可拖拽弹窗组件 ==========
export const DraggableDialog = ({ children, open, onClose, isCompact, title = "翻译", onToggleMode, onAddWord, onAddSentence }) => {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('translator_position');
    if (saved) return JSON.parse(saved);
    const isMobile = window.innerWidth <= 600;
    return { x: isMobile ? 10 : window.innerWidth - 500 - 20, y: isMobile ? 80 : 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(() => localStorage.getItem('translator_minimized') === 'true');
  const dialogRef = useRef(null);
  const isMobile = window.innerWidth <= 600;
  const FIXED_WIDTH = isCompact ? 800 : 600;
  const FIXED_HEIGHT = isCompact ? 50 : 500;

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
      setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
    }
  };

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const maxX = window.innerWidth - FIXED_WIDTH;
    const maxY = window.innerHeight - FIXED_HEIGHT;
    setPosition({
      x: Math.max(0, Math.min(maxX, clientX - dragOffset.x)),
      y: Math.max(0, Math.min(maxY, clientY - dragOffset.y))
    });
  }, [isDragging, dragOffset, FIXED_WIDTH, FIXED_HEIGHT]);

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

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
          width: FIXED_WIDTH,
          height: isMinimized ? 50 : FIXED_HEIGHT,
          maxWidth: window.innerWidth - 20,
          maxHeight: window.innerHeight - 20,
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
        }}
      >
        {isCompact ? (
          <Box sx={{ p: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#2d2d2d', height: '100%' }}>
            <Box className="drag-handle" onMouseDown={handleDragStart} onTouchStart={handleDragStart} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'grab', touchAction: 'none', '&:active': { cursor: 'grabbing' }, userSelect: 'none' }}>
              <DragHandle sx={{ color: '#858585', fontSize: 16 }} />
              <Translate sx={{ color: '#4ec9b0', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#858585', fontWeight: 500 }}>翻译</Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>{children}</Box>
            <Button size="small" onClick={onToggleMode} sx={{ color: '#858585', p: 0.5, fontSize: '0.7rem', textTransform: 'none', minWidth: 60 }} title="切换模式">切换</Button>
            <IconButton size="small" onClick={onClose} sx={{ color: '#858585', p: 0.5 }}><Close fontSize="small" /></IconButton>
          </Box>
        ) : (
          <>
            <Box className="drag-handle" onMouseDown={handleDragStart} onTouchStart={handleDragStart} sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3c3c3c', cursor: 'grab', backgroundColor: '#2d2d2d', touchAction: 'none', '&:active': { cursor: 'grabbing' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DragHandle sx={{ color: '#858585', fontSize: 20 }} />
                <Translate sx={{ color: '#4ec9b0', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{title}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={() => setIsMinimized(!isMinimized)} sx={{ color: '#858585' }} title={isMinimized ? "展开" : "最小化"}>
                  {isMinimized ? <Typography variant="caption">□</Typography> : <Typography variant="caption">─</Typography>}
                </IconButton>
                <IconButton size="small" onClick={onClose} sx={{ color: '#858585' }}><Close fontSize="small" /></IconButton>
              </Box>
            </Box>
            {!isMinimized && <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minHeight: 0 }}>{children}</Box>}
          </>
        )}
      </Paper>
    </Zoom>
  );
};

// ========== 单词输入行组件（独立放在顶部） ==========
const WordInputRow = ({ wordInput, setWordInput, onAddWord, onSpeak, onSearch, loading, translation }) => {
  const inputRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && wordInput.trim()) {
      onSearch(wordInput, true);
    }
  };

  const handleChange = (e) => {
    if (e && e.target) {
      setWordInput(e.target.value);
    }
  };

  return (
    <Paper sx={{ p: 1.5, mb: 2, backgroundColor: '#2d2d2d', border: '1px solid #4ec9b0' }}>
      <Typography variant="subtitle2" sx={{ color: '#4ec9b0', mb: 1 }}>
        📖 添加单词/短语
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          value={wordInput}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="输入要添加的单词或短语（最多7个单词）..."
          variant="outlined"
          size="small"
          sx={{ flex: 3, minWidth: 200 }}
          InputProps={{
            sx: {
              backgroundColor: '#1a1a1a',
              color: '#d4d4d4',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3c3c3c' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4ec9b0' },
            }
          }}
        />
        
        <Tooltip title="发音">
          <IconButton 
            onClick={() => wordInput.trim() && onSpeak(wordInput)} 
            disabled={!wordInput.trim() || loading}
            sx={{ color: '#4ec9b0', backgroundColor: 'rgba(78, 201, 176, 0.1)' }}
          >
            <VolumeUp fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="翻译">
          <IconButton 
            onClick={() => wordInput.trim() && onSearch(wordInput, true)}
            disabled={!wordInput.trim() || loading}
            sx={{ color: '#ffab40' }}
          >
            {loading ? <CircularProgress size={20} /> : <Translate fontSize="small" />}
          </IconButton>
        </Tooltip>
        
        <Button
          variant="contained"
          startIcon={<School />}
          onClick={onAddWord}
          disabled={!wordInput.trim() || loading}
          sx={{ 
            backgroundColor: '#4ec9b0', 
            color: '#1e1e1e',
            '&:hover': { backgroundColor: '#3da896' },
            textTransform: 'none'
          }}
        >
          添加单词
        </Button>
      </Box>
      
      {/* 显示翻译结果 - 始终显示，loading时显示旧内容 */}
      <Box sx={{ mt: 1, p: 1, backgroundColor: '#1a1a1a', borderRadius: 1, minHeight: 50 }}>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} sx={{ color: '#4ec9b0' }} />
            <Typography variant="caption" sx={{ color: '#858585' }}>翻译中...</Typography>
          </Box>
        ) : translation ? (
          <Typography variant="body2" sx={{ color: '#4ec9b0' }}>
            {typeof translation === 'string' ? translation : translation?.basic?.explains?.join('；')}
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: '#858585' }}>点击翻译按钮或选择文本查看翻译</Typography>
        )}
      </Box>
    </Paper>
  );
};

// ========== 单个句子输入行组件 ==========
const SentenceRow = ({ sentence, index, total, onSentenceAdd, onTranslate, onSpeak, loading, disabled, onWordInputSync }) => {
  const [localTranslation, setLocalTranslation] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [inputValue, setInputValue] = useState(sentence);
  const [lastSyncedValue, setLastSyncedValue] = useState('');
  const syncTimeoutRef = useRef(null);

  // 当 sentence prop 变化时更新 inputValue
  useEffect(() => {
    setInputValue(sentence);
  }, [sentence]);

  // 同步到单词输入框（同步文本并触发翻译）
  const syncToWordInput = useCallback((text) => {
    if (!text || !text.trim()) return;
    const trimmedText = text.trim();
    if (trimmedText === lastSyncedValue) return;
    
    setLastSyncedValue(trimmedText);
    if (onWordInputSync) {
      onWordInputSync(trimmedText);
    }

    // 触发语音
    if (onSpeak) {
      onSpeak(trimmedText);
    }
  }, [lastSyncedValue, onWordInputSync]);

  // 防抖同步：用户停止输入500ms后同步
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      if (newValue.trim()) {
        syncToWordInput(newValue);
      }
    }, 500);
  };

  // 处理文本选择
  const handleSelect = (e) => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText && selectedText.length > 0 && selectedText.length < 200) {
      syncToWordInput(selectedText);
    }
  };

  // 处理复制事件
  const handleCopy = (e) => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText && selectedText.length > 0) {
      setTimeout(() => {
        syncToWordInput(selectedText);
      }, 100);
    }
  };

  const handleTranslate = async () => {
    if (!inputValue.trim()) return;
    setLocalLoading(true);
    try {
      const result = await F_translator(inputValue.trim());
      if (result) {
        const translationText = typeof result === 'string' ? result : result?.basic?.explains?.join('；');
        setLocalTranslation(translationText);
        onTranslate?.(inputValue, translationText);
      }
    } catch (err) {
      console.error('翻译失败:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSpeak = () => {
    if (inputValue.trim()) {
      onSpeak?.(inputValue);
    }
  };

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Paper sx={{ p: 1.5, mb: 1.5, backgroundColor: '#2d2d2d', border: '1px solid #3c3c3c' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip 
          label={`${index + 1}/${total}`} 
          size="small" 
          sx={{ backgroundColor: '#0e639c', color: '#fff', minWidth: 50 }}
        />
        <TextField
          size="small"
          value={inputValue}
          onChange={handleInputChange}
          onSelect={handleSelect}
          onCopy={handleCopy}
          onCut={handleCopy}
          placeholder={`句子 ${index + 1}`}
          sx={{ flex: 2, minWidth: 200 }}
          InputProps={{
            sx: {
              backgroundColor: '#1a1a1a',
              color: '#d4d4d4',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3c3c3c' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4ec9b0' },
            }
          }}
        />
        
        <Tooltip title="翻译">
          <IconButton 
            size="small" 
            onClick={handleTranslate}
            disabled={!inputValue.trim() || localLoading}
            sx={{ color: '#4ec9b0' }}
          >
            {localLoading ? <CircularProgress size={16} /> : <Translate fontSize="small" />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="发音">
          <IconButton 
            size="small" 
            onClick={handleSpeak}
            disabled={!inputValue.trim()}
            sx={{ color: '#ce93d8' }}
          >
            <VolumeUp fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Button
          size="small"
          variant="outlined"
          startIcon={<MenuBook />}
          onClick={() => onSentenceAdd?.(inputValue, localTranslation)}
          disabled={disabled || !inputValue.trim()}
          sx={{ 
            color: '#ce93d8', 
            borderColor: '#ce93d8',
            '&:hover': { backgroundColor: 'rgba(206, 147, 216, 0.1)' }
          }}
        >
          添加句子
        </Button>
      </Box>
      
      {localTranslation && (
        <Box sx={{ mt: 1, p: 1, backgroundColor: '#1a1a1a', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: '#858585' }}>翻译：</Typography>
          <Typography variant="body2" sx={{ color: '#4ec9b0' }}>{localTranslation}</Typography>
        </Box>
      )}
    </Paper>
  );
};

// ========== 简洁模式翻译组件 ==========
export const CompactTranslator = ({ 
  word, translation, loading, error, onSearch, onSpeak, 
  wordInput, setWordInput, onAddWord, onAddSentence 
}) => {
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== wordInput) {
      inputRef.current.value = wordInput;
    }
  }, [wordInput]);

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.trim()) {
      const trimmedText = pastedText.trim();
      if (!/[\u4e00-\u9fa5]/.test(trimmedText)) {
        setTimeout(() => onSearch(trimmedText, true), 50);
      }
    }
  };

  const handleChange = (e) => {
    if (e && e.target) {
      setWordInput(e.target.value);
    }
  };

  return (
    <Box sx={{ p: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, height: '100%' }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        value={wordInput}
        onChange={handleChange}
        onKeyPress={(e) => { if (e.key === 'Enter' && wordInput.trim()) onSearch(wordInput, true); }}
        onPaste={handlePaste}
        placeholder="输入单词、短语或句子..."
        variant="outlined"
        size="small"
        autoFocus
        InputProps={{
          sx: { backgroundColor: '#1a1a1a', color: '#d4d4d4', fontSize: '1rem', height: 40,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3c3c3c', borderWidth: 1 },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4ec9b0' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4ec9b0', borderWidth: 2 }
          }
        }}
      />
      
      <Tooltip title="发音">
        <IconButton 
          onClick={() => wordInput.trim() && onSpeak(wordInput)} 
          disabled={!wordInput.trim() || loading} 
          size="small" 
          sx={{ color: '#4ec9b0', backgroundColor: 'rgba(78, 201, 176, 0.1)', width: 40, height: 40 }}
        >
          <VolumeUp fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Button 
        variant="contained" 
        onClick={() => wordInput.trim() && onSearch(wordInput, true)} 
        disabled={loading || !wordInput.trim()} 
        size="small" 
        sx={{ minWidth: 60, height: 40, backgroundColor: '#4ec9b0', color: '#1e1e1e', textTransform: 'none' }}
      >
        {loading ? <CircularProgress size={16} sx={{ color: '#1e1e1e' }} /> : '翻译'}
      </Button>
      
      <Button
        size="small"
        variant="outlined"
        startIcon={<School />}
        onClick={onAddWord}
        disabled={loading || !wordInput.trim()}
        sx={{ 
          color: '#ffab40', 
          borderColor: '#ffab40',
          height: 40,
          '&:hover': { backgroundColor: 'rgba(255, 171, 64, 0.1)' }
        }}
      >
        添加单词
      </Button>
      
      {translation && !loading && !error && (
        <Chip 
          label={typeof translation === 'string' ? (translation.length > 40 ? translation.substring(0, 40) + '...' : translation) : '✓'} 
          size="small" 
          onClick={() => onSpeak(word)} 
          sx={{ backgroundColor: '#4caf50', color: '#fff', height: 24, cursor: 'pointer', maxWidth: 200 }}
        />
      )}
      
      {error && !loading && <Chip label="!" size="small" sx={{ backgroundColor: '#f44336', color: '#fff', height: 24, width: 24 }} />}
    </Box>
  );
};

// ========== 完整模式翻译组件（同步时自动翻译，但保留旧结果显示loading状态） ==========
export const FullTranslator = ({ 
  sentenceList = [],
  wordInput,
  setWordInput,
  onAddWord,
  onAddSentence,
  onSpeak,
  onTranslate,
  addingWord,
  addingSentence,
  onOpenVocabMaster,
  onOpenWordBook,
  onOpenSentenceCenter
}) => {
  // 当前翻译结果（用于单词输入框）
  const [wordTranslation, setWordTranslation] = useState(null);
  const [wordLoading, setWordLoading] = useState(false);
  const lastSyncedTextRef = useRef(''); // 记录最后同步的文本，避免重复同步
  const currentTranslatePromiseRef = useRef(null); // 用于取消正在进行的翻译

  // 翻译单词输入框的内容（保留旧结果显示loading）
  const handleTranslateWord = useCallback(async (text) => {
    if (!text?.trim()) return;
    const trimmedText = text.trim();
    
    // 如果相同文本正在翻译中，不重复请求
    if (currentTranslatePromiseRef.current) {
      return;
    }
    
    setWordLoading(true);
    // 不清空 translation，保留旧结果
    
    try {
      const result = await F_translator(trimmedText);
      if (result) {
        setWordTranslation(result);
      }
    } catch (err) {
      console.error('翻译失败:', err);
    } finally {
      setWordLoading(false);
      currentTranslatePromiseRef.current = null;
    }
  }, []);

  // 同步句子内容到单词输入框（同步文本并自动翻译，保留旧结果）
  const handleSyncToWordInput = useCallback((text) => {
    if (!text || !text.trim()) return;
    const trimmedText = text.trim();
    // 如果和上次同步的文本相同，则跳过
    if (lastSyncedTextRef.current === trimmedText) return;
    
    lastSyncedTextRef.current = trimmedText;
    setWordInput(trimmedText);
    // 自动翻译，但保留旧的翻译结果直到新结果返回
    handleTranslateWord(trimmedText);
  }, [setWordInput, handleTranslateWord]);

  return (
    <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
      {/* 功能按钮组 */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button size="small" variant="outlined" startIcon={<School />} onClick={onOpenVocabMaster} sx={{ color: '#4ec9b0', borderColor: '#4ec9b0' }}>单词学习</Button>
        <Button size="small" variant="outlined" startIcon={<AutoStories />} onClick={onOpenWordBook} sx={{ color: '#ffab40', borderColor: '#ffab40' }}>复习单词</Button>
        <Button size="small" variant="outlined" startIcon={<RecordVoiceOver />} onClick={onOpenSentenceCenter} sx={{ color: '#9c27b0', borderColor: '#9c27b0' }}>复习句子</Button>
      </Box>
      
      <Divider sx={{ my: 2, borderColor: '#3c3c3c' }} />
      
      {/* 独立的单词输入框区域 */}
      <WordInputRow 
        wordInput={wordInput}
        setWordInput={setWordInput}
        onAddWord={onAddWord}
        onSpeak={onSpeak}
        onSearch={handleTranslateWord}
        loading={wordLoading}
        translation={wordTranslation}
      />
      
      <Divider sx={{ my: 2, borderColor: '#3c3c3c' }} />
      
      <Typography variant="subtitle2" sx={{ color: '#4ec9b0', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        📝 句子列表 ({sentenceList.length} 个句子)
        <Chip 
          label="选择文本自动同步并翻译" 
          size="small" 
          sx={{ backgroundColor: '#4ec9b0', color: '#1e1e1e', fontSize: '0.7rem' }}
        />
      </Typography>
      
      {/* 句子列表 */}
      {sentenceList.length > 0 ? (
        sentenceList.map((sentence, idx) => (
          <SentenceRow
            key={idx}
            sentence={sentence}
            index={idx}
            total={sentenceList.length}
            onSentenceAdd={onAddSentence}
            onTranslate={onTranslate}
            onSpeak={onSpeak}
            loading={addingWord || addingSentence}
            disabled={addingWord || addingSentence}
            onWordInputSync={handleSyncToWordInput}
          />
        ))
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" sx={{ color: '#858585' }}>
            暂无句子，请传入文本内容
          </Typography>
        </Box>
      )}
    </Box>
  );
};