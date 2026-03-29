import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  AccessTime as TimeIcon,
  Image as ImageIcon,
  Translate as TranslateIcon,
  Add as AddIcon,
  VolumeUp as VolumeUpIcon,
  Language as LanguageIcon,
  Refresh as RefreshIcon,
  TextFields as TextFieldsIcon,
  Translate as TranslateOutlinedIcon
} from '@mui/icons-material';
import WordTranslator from '../translator/translator.js';
import { sentenceApi } from '../sentence/api.js';
import { F_speak } from '../Function/weisimin.js';

const ReadingTest = ({ 
  passage,
  loading = false,
  onRefresh,
  timeSpent = 0,
  onBackToHome,
  onSentenceSelect,
  G_word_name = 'word_english_test_study',
  getToken
}) => {
  // 翻译相关状态
  const [showTranslator, setShowTranslator] = useState(false);
  const [translateWord, setTranslateWord] = useState('');
  
  // 发音加载状态
  const [speakingWord, setSpeakingWord] = useState(null);
  
  // 显示模式: 'english' | 'chinese' | 'bilingual'
  const [displayMode, setDisplayMode] = useState('english');

  // 句子添加相关状态
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isAddingSentence, setIsAddingSentence] = useState(false);

  // ========== 将文本分割成句子 ==========
  const splitIntoSentences = (text) => {
    if (!text) return [];
    
    // 按句号、问号、感叹号分割，但保留缩写词
    const sentences = [];
    let currentSentence = '';
    let i = 0;
    
    const commonAbbrs = ['mr', 'mrs', 'ms', 'dr', 'prof', 'rev', 'st', 'etc', 'vs', 'inc', 'ltd', 'co', 'jr', 'sr', 'no'];
    
    while (i < text.length) {
      currentSentence += text[i];
      
      if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
        if (text[i] === '.') {
          // 检查是否是缩写词
          const words = currentSentence.split(/\s+/);
          const lastWord = words[words.length - 1] || '';
          const wordWithoutDot = lastWord.slice(0, -1).toLowerCase();
          
          const nextChar = text[i + 1] || '';
          const nextNextChar = text[i + 2] || '';
          
          const isEndOfSentence = !commonAbbrs.includes(wordWithoutDot) && 
                                 ((nextChar === ' ' && /[A-Z]/.test(nextNextChar)) || 
                                  i === text.length - 1 ||
                                  nextChar === '\n');
          
          if (isEndOfSentence) {
            sentences.push(currentSentence.trim());
            currentSentence = '';
          }
        } else {
          sentences.push(currentSentence.trim());
          currentSentence = '';
        }
      }
      
      i++;
    }
    
    // 添加最后一个句子（如果没有结束标点）
    if (currentSentence.trim()) {
      sentences.push(currentSentence.trim());
    }
    
    // 如果按标点分割后没有句子，返回原文本
    if (sentences.length === 0 && text.trim()) {
      return [text.trim()];
    }
    
    return sentences.filter(s => s);
  };

  // ========== 将中文文本分割成句子 ==========
  const splitChineseIntoSentences = (text) => {
    if (!text) return [];
    
    // 中文按句号、问号、感叹号、省略号分割
    const sentences = [];
    let currentSentence = '';
    
    for (let i = 0; i < text.length; i++) {
      currentSentence += text[i];
      
      if (text[i] === '。' || text[i] === '？' || text[i] === '！' || text[i] === '…') {
        sentences.push(currentSentence.trim());
        currentSentence = '';
      }
    }
    
    if (currentSentence.trim()) {
      sentences.push(currentSentence.trim());
    }
    
    if (sentences.length === 0 && text.trim()) {
      return [text.trim()];
    }
    
    return sentences.filter(s => s);
  };

  // ========== 图片路径处理函数 ==========
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('/pic/A/')) {
      const relativePath = imagePath.substring(1);
      return `https://www.ddstudent.xyz/server/src/1_english/resource/english_a_z/${relativePath}`;
    }
    
    if (imagePath.startsWith('./')) {
      const relativePath = imagePath.substring(2);
      return `https://www.ddstudent.xyz/server/src/1_english/resource/english_a_z/${relativePath}`;
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return imagePath;
  };

  // ========== 单词点击翻译+发音功能 ==========
  const handleWordClick = async (word, e) => {
    if (e) e.stopPropagation();
    
    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}]$/g, "").trim();
    
    if (cleanedWord && /^[a-zA-Z'\-]+$/.test(cleanedWord) && cleanedWord.length >= 2) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
      
      setSpeakingWord(cleanedWord);
      try {
        await F_speak(cleanedWord);
        console.log('单词发音完成:', cleanedWord);
      } catch (error) {
        console.error('单词发音失败:', error);
      } finally {
        setSpeakingWord(null);
      }
    }
  };

  // ========== 句子选择功能（添加英文和中文） ==========
  const handleSentenceSelect = async (englishSentence, chineseTranslation, e) => {
    if (e) e.stopPropagation();
    
    console.log('选择句子 - 英文:', englishSentence);
    console.log('选择句子 - 中文:', chineseTranslation);
    
    if (onSentenceSelect) {
      onSentenceSelect(englishSentence);
    }
    
    setTranslateWord(englishSentence);
    setShowTranslator(true);
    
    // 添加句子时同时传入英文和中文
    await addSentenceToServer(englishSentence, chineseTranslation);
  };

  // ========== 添加句子到服务器（同时保存英文和中文） ==========
  const addSentenceToServer = async (englishSentence, chineseTranslation) => {
    if (!englishSentence || !englishSentence.trim()) {
      showSnackbar('句子不能为空', 'error');
      return;
    }

    setIsAddingSentence(true);
    try {
      // 检查句子是否已存在
      try {
        const existingSentences = await sentenceApi.getSentences('sentences', { limit: 1000 });
        if (existingSentences && existingSentences.sentences) {
          const sentences = existingSentences.sentences;
          const exists = Object.values(sentences).some(sentenceObj => 
            sentenceObj.text && sentenceObj.text.toLowerCase().trim() === englishSentence.toLowerCase().trim()
          );
          
          if (exists) {
            showSnackbar(`⚠️ 句子 "${englishSentence.substring(0, 30)}..." 已存在于句子库中`, 'warning');
            setIsAddingSentence(false);
            return;
          }
        }
      } catch (checkErr) {
        console.warn('检查句子重复时出错，继续添加:', checkErr);
      }

      const sentenceData = {
        id: Date.now().toString(),
        text: englishSentence.trim(),
        chinese: chineseTranslation || '', // 保存中文翻译
        pass: false,
        correct_count: 0,
        wrong_count: 0,
        extraction_count: 0,
        added_at: new Date().toISOString(),
        source: 'english_a_z_reading'
      };

      const result = await sentenceApi.addSentence(sentenceData, 'sentences');
      
      if (result?.flag === 1) {
        const successMessage = chineseTranslation 
          ? `✅ 句子添加成功: ${englishSentence.substring(0, 30)}... (已包含中文翻译)`
          : `✅ 句子添加成功: ${englishSentence.substring(0, 30)}...`;
        showSnackbar(successMessage, 'success');
      } else {
        showSnackbar(result?.message || "添加句子失败", 'error');
      }
    } catch (err) {
      console.error("添加句子异常:", err);
      showSnackbar("网络异常，请重试", 'error');
    } finally {
      setIsAddingSentence(false);
    }
  };

  // ========== 显示消息提示 ==========
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // ========== 关闭消息提示 ==========
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // ========== 渲染可点击的文本（点击单词触发翻译+发音） ==========
  const renderClickableText = (text, stopPropagation = true) => {
    if (!text) return text;
    
    const elements = [];
    let lastIndex = 0;
    
    const wordRegex = /\b[a-zA-Z'\-]{2,}\b/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }
      
      const word = match[0];
      elements.push(
        <span
          key={`word-${match.index}`}
          style={{
            cursor: 'pointer',
            color: 'inherit',
            fontWeight: 'inherit',
            borderRadius: '2px',
            backgroundColor: 'transparent',
            display: 'inline',
            lineHeight: 'inherit',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            transition: 'background-color 0.2s ease'
          }}
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation();
            handleWordClick(word, e);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(26, 35, 126, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="点击翻译并发音"
        >
          {word}
          {speakingWord === word && (
            <CircularProgress 
              size={12} 
              sx={{ 
                ml: 0.5, 
                verticalAlign: 'middle',
                color: '#4caf50'
              }} 
            />
          )}
        </span>
      );
      
      lastIndex = match.index + word.length;
    }
    
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }
    
    return elements;
  };

  // ========== 渲染单个句子（带按钮） ==========
  const renderSentence = (englishSentence, chineseTranslation, index) => {
    // 确定要显示的文本
    let displayText = '';
    let displayTranslation = '';
    
    if (displayMode === 'english') {
      displayText = englishSentence;
    } else if (displayMode === 'chinese') {
      displayText = chineseTranslation;
    } else if (displayMode === 'bilingual') {
      displayText = englishSentence;
      displayTranslation = chineseTranslation;
    }
    
    // 如果没有要显示的内容，返回null
    if (!displayText && !displayTranslation) return null;
    
    return (
      <Box
        key={`sentence-${index}`}
        sx={{
          display: 'block',
          position: 'relative',
          mb: displayMode === 'bilingual' ? 2 : 1,
          '&:hover': {
            '& .sentence-add-button': {
              opacity: 1,
              visibility: 'visible',
              transform: 'translateY(0) scale(1)'
            },
            '& .sentence-speak-button': {
              opacity: 1,
              visibility: 'visible',
              transform: 'translateY(0) scale(1)'
            },
            '& .sentence-translate-button': {
              opacity: 1,
              visibility: 'visible',
              transform: 'translateY(0) scale(1)'
            }
          }
        }}
      >
        {/* 英文句子或中文翻译 */}
        {displayText && (
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: 1.8, 
              fontSize: '1.1rem',
              display: 'block',
              pr: 9,
              backgroundColor: 'transparent',
              borderRadius: 1,
              transition: 'background-color 0.2s',
              width: '100%',
              color: displayMode === 'chinese' ? '#2c3e50' : 'inherit',
              '&:hover': {
                backgroundColor: 'rgba(26, 35, 126, 0.03)'
              }
            }}
          >
            {displayMode === 'chinese' 
              ? displayText 
              : renderClickableText(displayText, true)}
          </Typography>
        )}
        
        {/* 双语模式下的中文翻译 */}
        {displayMode === 'bilingual' && displayTranslation && (
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1,
              pl: 2,
              color: '#666',
              fontStyle: 'italic',
              borderLeft: '3px solid #1a237e',
              backgroundColor: 'rgba(26, 35, 126, 0.02)',
              py: 0.5,
              display: 'block',
              width: 'calc(100% - 70px)'
            }}
          >
            🇨🇳 {displayTranslation}
          </Typography>
        )}
        
        {/* 句子翻译按钮（仅在非中文模式下显示） */}
        {displayMode !== 'chinese' && englishSentence && (
          <Tooltip title="翻译">
            <IconButton
              className="sentence-translate-button"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setTranslateWord(englishSentence);
                setShowTranslator(true);
              }}
              sx={{
                position: 'absolute',
                top: 0,
                right: 48,
                transform: 'translateY(0) scale(0.8)',
                opacity: 0,
                visibility: 'hidden',
                transition: 'opacity 0.2s, visibility 0.2s, transform 0.2s',
                bgcolor: '#ff9800',
                color: 'white',
                width: 24,
                height: 24,
                zIndex: 10,
                '&:hover': {
                  bgcolor: '#f57c00',
                  transform: 'translateY(0) scale(1.1)'
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 16
                }
              }}
            >
              <TranslateIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* 句子发音按钮（仅在非中文模式下显示） */}
        {displayMode !== 'chinese' && englishSentence && (
          <Tooltip title="发音">
            <IconButton
              className="sentence-speak-button"
              size="small"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await F_speak(englishSentence);
                } catch (error) {
                  console.error('句子发音失败:', error);
                  showSnackbar('发音失败，请重试', 'error');
                }
              }}
              sx={{
                position: 'absolute',
                top: 0,
                right: 24,
                transform: 'translateY(0) scale(0.8)',
                opacity: 0,
                visibility: 'hidden',
                transition: 'opacity 0.2s, visibility 0.2s, transform 0.2s',
                bgcolor: '#4caf50',
                color: 'white',
                width: 24,
                height: 24,
                zIndex: 10,
                '&:hover': {
                  bgcolor: '#388e3c',
                  transform: 'translateY(0) scale(1.1)'
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 16
                }
              }}
            >
              <VolumeUpIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* 句子添加按钮 - 同时添加英文和中文 */}
        <Tooltip title="添加这个句子（中英文）">
          <IconButton
            className="sentence-add-button"
            size="small"
            onClick={(e) => handleSentenceSelect(englishSentence, chineseTranslation, e)}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              transform: 'translateY(0) scale(0.8)',
              opacity: 0,
              visibility: 'hidden',
              transition: 'opacity 0.2s, visibility 0.2s, transform 0.2s',
              bgcolor: '#1a237e',
              color: 'white',
              width: 24,
              height: 24,
              zIndex: 10,
              '&:hover': {
                bgcolor: '#283593',
                transform: 'translateY(0) scale(1.1)'
              },
              '& .MuiSvgIcon-root': {
                fontSize: 16
              }
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // ========== 渲染带分割句子的文本 ==========
  const renderTextWithSplitSentences = (text, translation) => {
    if (!text && displayMode === 'english') return null;
    if (!translation && displayMode === 'chinese') return null;
    
    // 分割英文句子
    const englishSentences = text ? splitIntoSentences(text) : [];
    // 分割中文句子
    const chineseSentences = translation ? splitChineseIntoSentences(translation) : [];
    
    // 如果句子数量不匹配，按最多的显示
    const maxLength = Math.max(englishSentences.length, chineseSentences.length);
    
    return (
      <Box sx={{ position: 'relative' }}>
        {Array.from({ length: maxLength }).map((_, index) => {
          const englishSentence = englishSentences[index] || '';
          const chineseSentence = chineseSentences[index] || '';
          
          // 根据显示模式决定显示什么
          if (displayMode === 'english' && !englishSentence) return null;
          if (displayMode === 'chinese' && !chineseSentence) return null;
          
          // 渲染句子，同时传入英文和中文
          return renderSentence(englishSentence, chineseSentence, index);
        })}
      </Box>
    );
  };

  // ========== 格式化时间 ==========
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ========== 切换显示模式 ==========
  const handleDisplayModeChange = (event, newMode) => {
    if (newMode !== null) {
      setDisplayMode(newMode);
      const modeNames = {
        'english': '仅显示英文',
        'chinese': '仅显示中文',
        'bilingual': '中英文对照'
      };
      showSnackbar(`已切换到：${modeNames[newMode]}`, 'info');
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, textAlign: 'center', width: 300 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            加载中...
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!passage) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <MenuBookIcon sx={{ fontSize: 48, color: '#9e9e9e', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            暂无阅读内容
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            请点击"选择篇章"按钮开始阅读
          </Typography>
          <Button
            variant="contained"
            onClick={onBackToHome}
            sx={{ mt: 2, bgcolor: '#1a237e' }}
          >
            返回首页
          </Button>
        </Paper>
      </Box>
    );
  }

  const allContent = passage.content || [];

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f5f5',
      overflow: 'hidden'
    }}>

      {/* 顶部工具栏 */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1.5, 
          bgcolor: '#fff', 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            📖 {passage.title || '阅读理解'}
          </Typography>
          {passage.difficulty && (
            <Chip 
              label={`难度: ${passage.difficulty === 1 ? '简单' : passage.difficulty === 2 ? '中等' : passage.difficulty === 3 ? '困难' : passage.difficulty}`} 
              size="small"
              color={passage.difficulty === 1 ? 'success' : passage.difficulty === 2 ? 'warning' : 'error'}
            />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              学习时长: {formatTime(timeSpent)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* 三种模式切换按钮组 */}
          <ToggleButtonGroup
            value={displayMode}
            exclusive
            onChange={handleDisplayModeChange}
            aria-label="显示模式"
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 1,
                fontSize: '0.875rem'
              }
            }}
          >
            <ToggleButton value="english" aria-label="仅英文">
              <TextFieldsIcon sx={{ mr: 0.5 }} />
              仅英文
            </ToggleButton>
            <ToggleButton value="chinese" aria-label="仅中文">
              <TranslateOutlinedIcon sx={{ mr: 0.5 }} />
              仅中文
            </ToggleButton>
            <ToggleButton value="bilingual" aria-label="中英文对照">
              <LanguageIcon sx={{ mr: 0.5 }} />
              中英对照
            </ToggleButton>
          </ToggleButtonGroup>
          
          {onRefresh && (
            <Tooltip title="刷新">
              <IconButton onClick={onRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Paper>

      {/* 主要内容区域 */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 1, sm: 2, md: 3 },
        gap: 3,
        overflow: 'hidden',
        bgcolor: '#f8f9fa'
      }}>

        {/* 内容区域 */}
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          pb: 2
        }}>
          {allContent.map((content, index) => (
            <Paper 
              key={index}
              elevation={0}
              sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 3,
                p: { xs: 2, sm: 3 },
                bgcolor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  borderColor: '#e0e0e0'
                }
              }}
            >
              {/* 图片区域 */}
              <Box sx={{ 
                width: { xs: '100%', lg: '45%' },
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
              }}>
                <Box sx={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#fafafa',
                  borderRadius: 2,
                  p: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid #e8e8e8'
                }}>
                  {content?.image ? (
                    <img 
                      src={getImageUrl(content.image)} 
                      alt={content.alt || `Part ${index + 1}`}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <ImageIcon sx={{ 
                        fontSize: 72, 
                        color: '#cfd8dc', 
                        mb: 2,
                        opacity: 0.6
                      }} />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        暂无图片
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mt: 2, 
                    textAlign: 'center',
                    color: '#546e7a',
                    fontWeight: 500,
                    fontSize: '0.9rem'
                  }}
                >
                  第 {index + 1} 部分
                </Typography>
              </Box>

              {/* 文字区域 */}
              <Box sx={{ 
                width: { xs: '100%', lg: '55%' },
                display: 'flex',
                flexDirection: 'column',
                flex: 1
              }}>
                <Box sx={{ 
                  flex: 1,
                  overflow: 'auto',
                  p: { xs: 2, sm: 3 },
                  bgcolor: '#fefefe',
                  borderRadius: 2,
                  border: '1px solid #f5f5f5',
                  minHeight: 300
                }}>
                  <Box sx={{
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' },
                    lineHeight: 1.8,
                    color: '#2c3e50',
                    textAlign: 'justify',
                    letterSpacing: '0.01em',
                    '& span[style*="cursor: pointer"]': {
                      borderBottom: '2px dotted #64b5f6',
                      paddingBottom: '1px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                        borderBottom: '2px solid #2196f3',
                        borderRadius: '3px'
                      }
                    }
                  }}>
                    {renderTextWithSplitSentences(content?.text, content?.translation)}
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* 翻译组件 */}
      <WordTranslator
        open={showTranslator}
        onClose={() => setShowTranslator(false)}
        word={translateWord}
        G_word_name={G_word_name}
        getToken={getToken}
        defaultCompact = {true}
      />

      {/* 消息提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          marginTop: '70px',
          zIndex: 1300
        }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ 
            width: 'auto',
            maxWidth: '400px',
            boxShadow: 3
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReadingTest;