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
  Sync,
  VolumeOff,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';
import { F_translator } from '../Function/weisimin.js';

// ========== 可拖拽弹窗组件 ==========
export const DraggableDialog = ({ children, open, onClose, isCompact, title = "翻译", onToggleMode, onAddWord, onAddSentence, autoSpeak, onAutoSpeakChange }) => {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('translator_position');
    if (saved) return JSON.parse(saved);
    const isMobile = window.innerWidth <= 600;
    return { x: isMobile ? 10 : window.innerWidth - 500 - 20, y: isMobile ? 80 : 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(() => localStorage.getItem('translator_minimized') === 'true');
  const [localAutoSpeak, setLocalAutoSpeak] = useState(autoSpeak !== undefined ? autoSpeak : true);
  const dialogRef = useRef(null);
  const FIXED_WIDTH = isCompact ? 800 : 400;
  const FIXED_HEIGHT = isCompact ? 50 : 500;

  useEffect(() => {
    localStorage.setItem('translator_position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('translator_minimized', isMinimized);
  }, [isMinimized]);

  // 同步外部 autoSpeak 变化到本地
  useEffect(() => {
    if (autoSpeak !== undefined) {
      setLocalAutoSpeak(autoSpeak);
    }
  }, [autoSpeak]);

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

  // 处理自动发音切换 - 同时更新本地和通知父组件
  const handleAutoSpeakToggle = useCallback((checked) => {
    setLocalAutoSpeak(checked);
    onAutoSpeakChange?.(checked);
  }, [onAutoSpeakChange]);

  // 克隆 children 并传递 autoSpeak 和 onAutoSpeakChange
  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children, { 
        autoSpeak: localAutoSpeak, 
        onAutoSpeakChange: handleAutoSpeakToggle 
      })
    : children;

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
          zIndex: 10000,
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
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>{childrenWithProps}</Box>
            <Button size="small" onClick={onToggleMode} sx={{ color: '#858585', p: 0.5, fontSize: '0.7rem', textTransform: 'none', minWidth: 60 }} title="切换模式">切换模式</Button>
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
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title="自动发音">
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={localAutoSpeak}
                        onChange={(e) => handleAutoSpeakToggle(e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#4ec9b0' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#4ec9b0' }
                        }}
                      />
                    }
                    label={<Typography variant="caption" sx={{ color: '#858585' }}>自动发音</Typography>}
                    labelPlacement="start"
                    sx={{ mr: 1 }}
                  />
                </Tooltip>
                <IconButton size="small" onClick={() => setIsMinimized(!isMinimized)} sx={{ color: '#858585' }} title={isMinimized ? "展开" : "最小化"}>
                  {isMinimized ? <Typography variant="caption">□</Typography> : <Typography variant="caption">─</Typography>}
                </IconButton>
                <IconButton size="small" onClick={onClose} sx={{ color: '#858585' }}><Close fontSize="small" /></IconButton>
              </Box>
            </Box>
            {!isMinimized && <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minHeight: 0 }}>{childrenWithProps}</Box>}
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

  useEffect(() => {
    setInputValue(sentence);
  }, [sentence]);

  const syncToWordInput = useCallback((text) => {
    if (!text || !text.trim()) return;
    const trimmedText = text.trim();
    if (trimmedText === lastSyncedValue) return;

    setLastSyncedValue(trimmedText);
    if (onWordInputSync) {
      onWordInputSync(trimmedText);
    }

    if (onSpeak) {
      onSpeak(trimmedText);
    }
  }, [lastSyncedValue, onWordInputSync, onSpeak]);

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

  const handleSelect = (e) => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText && selectedText.length > 0 && selectedText.length < 200) {
      syncToWordInput(selectedText);
    }
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Chip
          label={`${index + 1}/${total}`}
          size="small"
          sx={{ backgroundColor: '#0e639c', color: '#fff', minWidth: 50 }}
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

      <Box sx={{ mb: 1 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          value={inputValue}
          onChange={handleInputChange}
          onSelect={handleSelect}
          onCopy={handleCopy}
          onCut={handleCopy}
          placeholder={`句子 ${index + 1}`}
          variant="outlined"
          size="small"
          InputProps={{
            sx: {
              backgroundColor: '#1a1a1a',
              color: '#d4d4d4',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3c3c3c' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4ec9b0' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4ec9b0' }
            }
          }}
        />
      </Box>

      {localTranslation && (
        <Box sx={{ mt: 1, p: 1, backgroundColor: '#1a1a1a', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: '#858585' }}>翻译：</Typography>
          <Typography variant="body2" sx={{ color: '#4ec9b0', wordWrap: 'break-word', whiteSpace: 'normal' }}>
            {localTranslation}
          </Typography>
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
          sx: {
            backgroundColor: '#1a1a1a', color: '#d4d4d4', fontSize: '1rem', height: 40,
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
        onClick={onAddWord}
        disabled={loading || !wordInput.trim()}
        sx={{
          height: 40,
          backgroundColor: '#4ec9b0',
          color: '#1e1e1e',
          textTransform: 'none',
          whiteSpace: 'nowrap',
        }}
        title="将单词添加到个人词典"
      >
        +单词本
      </Button>

      <Button
        size="small"
        variant="outlined"
        onClick={() => onAddSentence(wordInput, translation)}
        disabled={loading || !wordInput.trim()}
        sx={{
          height: 40,
          backgroundColor: '#4ec9b0',
          color: '#1e1e1e',
          textTransform: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        +句子本
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

// ========== 完整模式翻译组件 ==========
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
  onOpenSentenceCenter,
  autoSpeak = true,
  onAutoSpeakChange
}) => {
  const [wordTranslation, setWordTranslation] = useState(null);
  const [wordLoading, setWordLoading] = useState(false);
  const lastSyncedTextRef = useRef('');
  const currentTranslatePromiseRef = useRef(null);
  const lastSentenceListRef = useRef([]);
  const autoSpeakTimeoutRef = useRef(null);
  const isAutoSpeakEnabledRef = useRef(autoSpeak);

  // 同步外部的 autoSpeak 状态
  useEffect(() => {
    isAutoSpeakEnabledRef.current = autoSpeak;
  }, [autoSpeak]);

  const handleTranslateWord = useCallback(async (text) => {
    if (!text?.trim()) return;
    const trimmedText = text.trim();

    if (currentTranslatePromiseRef.current) {
      return;
    }

    setWordLoading(true);

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

  const handleSyncToWordInput = useCallback((text) => {
    if (!text || !text.trim()) return;
    const trimmedText = text.trim();
    if (lastSyncedTextRef.current === trimmedText) return;

    lastSyncedTextRef.current = trimmedText;
    setWordInput(trimmedText);
    handleTranslateWord(trimmedText);
  }, [setWordInput, handleTranslateWord]);

  // 自动朗读第一个句子的函数
  const autoSpeakFirstSentence = useCallback(() => {
    if (!isAutoSpeakEnabledRef.current) {
      return;
    }
    
    if (sentenceList && sentenceList.length > 0) {
      const firstSentence = sentenceList[0];
      if (firstSentence && firstSentence.trim()) {
        if (autoSpeakTimeoutRef.current) {
          clearTimeout(autoSpeakTimeoutRef.current);
        }
        autoSpeakTimeoutRef.current = setTimeout(() => {
          if (isAutoSpeakEnabledRef.current && onSpeak && firstSentence.trim()) {
            onSpeak(firstSentence.trim());
          }
        }, 300);
      }
    }
  }, [sentenceList, onSpeak]);

  // 监听句子列表变化
  useEffect(() => {
    if (!isAutoSpeakEnabledRef.current) {
      return;
    }
    
    if (sentenceList && sentenceList.length > 0) {
      const prevList = lastSentenceListRef.current;
      const currentFirstSentence = sentenceList[0];
      const prevFirstSentence = prevList[0];
      
      if (currentFirstSentence !== prevFirstSentence && currentFirstSentence && currentFirstSentence.trim()) {
        autoSpeakFirstSentence();
      }
    }
    
    lastSentenceListRef.current = [...sentenceList];
    
    return () => {
      if (autoSpeakTimeoutRef.current) {
        clearTimeout(autoSpeakTimeoutRef.current);
      }
    };
  }, [sentenceList, autoSpeakFirstSentence]);

  return (
    <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" startIcon={<School />} onClick={onOpenVocabMaster} sx={{ color: '#4ec9b0', borderColor: '#4ec9b0' }}>单词学习</Button>
          <Button size="small" variant="outlined" startIcon={<AutoStories />} onClick={onOpenWordBook} sx={{ color: '#ffab40', borderColor: '#ffab40' }}>复习单词</Button>
          <Button size="small" variant="outlined" startIcon={<RecordVoiceOver />} onClick={onOpenSentenceCenter} sx={{ color: '#9c27b0', borderColor: '#9c27b0' }}>复习句子</Button>
        </Box>
        
        {/* 自动朗读状态指示器 */}
        {autoSpeak && sentenceList.length > 0 && (
          <Chip
            icon={<VolumeUpIcon sx={{ fontSize: 14 }} />}
            label="自动朗读中"
            size="small"
            sx={{ backgroundColor: '#4ec9b0', color: '#1e1e1e', fontSize: '0.7rem' }}
          />
        )}
      </Box>

      <Divider sx={{ my: 2, borderColor: '#3c3c3c' }} />

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

      <Typography variant="subtitle2" sx={{ color: '#4ec9b0', mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        📝 句子列表 ({sentenceList.length} 个句子)
        <Chip
          label="光标选中自动同步到单词框并翻译"
          size="small"
          sx={{ backgroundColor: '#4ec9b0', color: '#1e1e1e', fontSize: '0.7rem' }}
        />
      </Typography>

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