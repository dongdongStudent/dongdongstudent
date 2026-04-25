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
import WordTranslator from '../translator/index.js';
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
  
  // 显示模式: 'english' | 'chinese' | 'bilingual'
  const [displayMode, setDisplayMode] = useState('english');

  // 中英对照模式下，记录哪些句子的中文已经清晰显示（使用唯一ID）
  const [revealedChineseIndexes, setRevealedChineseIndexes] = useState(new Set());

  // 句子添加相关状态
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isAddingSentence, setIsAddingSentence] = useState(false);

  // ========== 检测是否为标题（用于新结构中的标题识别）==========
  const isHeading = (text) => {
    // 检查是否以 # 开头，或者是否包含标题特征
    return text && (text.startsWith('#') || (text.length < 30 && text.endsWith(':') && !text.includes('.')));
  };

  // ========== 提取干净的标题文本 ==========
  const getCleanHeading = (text) => {
    if (!text) return '';
    return text.replace(/^#+\s*/, '').trim();
  };

  // ========== 切换中文清晰显示/模糊 ==========
  const toggleChineseReveal = (sentenceUniqueId, e) => {
    if (e) e.stopPropagation();
    setRevealedChineseIndexes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sentenceUniqueId)) {
        newSet.delete(sentenceUniqueId);
      } else {
        newSet.add(sentenceUniqueId);
      }
      return newSet;
    });
  };

  // ========== 生成句子的唯一ID ==========
  const generateSentenceId = (partIndex, sentenceIndex) => {
    return `${partIndex}-${sentenceIndex}`;
  };

  // ========== 渲染可点击的文本内容（支持 Markdown 粗体） ==========
  const renderClickableContent = (content) => {
    if (!content) return null;
    
    // 第一步：解析 Markdown 粗体标记 **text**
    const parts = [];
    let lastIndex = 0;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(content)) !== null) {
      // 添加粗体标记之前的普通文本
      if (match.index > lastIndex) {
        const normalText = content.substring(lastIndex, match.index);
        parts.push({ type: 'normal', content: normalText });
      }
      
      // 添加粗体文本（特殊标记）
      const boldText = match[1];
      parts.push({ type: 'bold', content: boldText });
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余的普通文本
    if (lastIndex < content.length) {
      parts.push({ type: 'normal', content: content.substring(lastIndex) });
    }
    
    // 第二步：渲染每个部分
    const elements = [];
    
    for (let idx = 0; idx < parts.length; idx++) {
      const part = parts[idx];
      
      if (part.type === 'bold') {
        // 粗体文本：整体可点击，显示为粗体红色
        const boldText = part.content;
        
        // 将粗体文本内的单词拆分成可单独点击的单词
        const wordRegex = /\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b/g;
        let wordMatch;
        let wordLastIndex = 0;
        const boldElements = [];
        
        while ((wordMatch = wordRegex.exec(boldText)) !== null) {
          if (wordMatch.index > wordLastIndex) {
            boldElements.push(boldText.substring(wordLastIndex, wordMatch.index));
          }
          
          const word = wordMatch[0];
          boldElements.push(
            <span
              key={`bold-word-${idx}-${wordMatch.index}`}
              style={{
                cursor: 'pointer',
                color: '#d32f2f',
                fontWeight: 'bold',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                display: 'inline',
                lineHeight: 'inherit',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                transition: 'all 0.2s ease'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleWordClick(word, e);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffebee';
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.textDecoration = 'none';
              }}
              title="点击翻译并发音"
            >
              {word}
            </span>
          );
          
          wordLastIndex = wordMatch.index + word.length;
        }
        
        if (wordLastIndex < boldText.length) {
          boldElements.push(boldText.substring(wordLastIndex));
        }
        
        elements.push(
          <span key={`bold-container-${idx}`} style={{ fontWeight: 'bold' }}>
            {boldElements}
          </span>
        );
      } else {
        // 普通文本：按单词拆分，每个单词可点击
        const normalText = part.content;
        const wordRegex = /\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b/g;
        let wordMatch;
        let wordLastIndex = 0;
        
        while ((wordMatch = wordRegex.exec(normalText)) !== null) {
          if (wordMatch.index > wordLastIndex) {
            elements.push(normalText.substring(wordLastIndex, wordMatch.index));
          }
          
          const word = wordMatch[0];
          elements.push(
            <span
              key={`normal-word-${idx}-${wordMatch.index}`}
              style={{
                cursor: 'pointer',
                color: '#1976d2',
                fontWeight: '500',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                display: 'inline',
                lineHeight: 'inherit',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                transition: 'all 0.2s ease'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleWordClick(word, e);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.textDecoration = 'none';
              }}
              title="点击翻译并发音"
            >
              {word}
            </span>
          );
          
          wordLastIndex = wordMatch.index + word.length;
        }
        
        if (wordLastIndex < normalText.length) {
          elements.push(normalText.substring(wordLastIndex));
        }
      }
    }
    
    return elements;
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

  // ========== 单词/标题点击翻译+发音功能 ==========
  const handleWordClick = async (word, e) => {
    if (e) e.stopPropagation();
    
    // 清理单词，移除标点符号（但保留缩写词的撇号）
    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}\u201c\u201d\u2018\u2019]$/g, "").trim();
    
    if (cleanedWord && cleanedWord.length >= 1) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
      await F_speak(cleanedWord);
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
    
    await addSentenceToServer(englishSentence, chineseTranslation);
  };

  // ========== 添加句子到服务器 ==========
  const addSentenceToServer = async (englishSentence, chineseTranslation) => {
    if (!englishSentence || !englishSentence.trim()) {
      showSnackbar('句子不能为空', 'error');
      return;
    }

    setIsAddingSentence(true);
    try {
      try {
        const existingSentences = await sentenceApi.getSentences('sentences', { limit: 1000 });
        if (existingSentences && existingSentences.sentences) {
          const sentences = existingSentences.sentences;
          const exists = Object.values(sentences).some(sentenceObj => 
            sentenceObj.text && sentenceObj.text.toLowerCase().trim() === englishSentence.toLowerCase().trim()
          );
          
          if (exists) {
            showSnackbar(`⚠️ 句子已存在于句子库中`, 'warning');
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
        chinese: chineseTranslation || '',
        pass: false,
        correct_count: 0,
        wrong_count: 0,
        extraction_count: 0,
        added_at: new Date().toISOString(),
        source: 'english_a_z_reading'
      };

      const result = await sentenceApi.addSentence(sentenceData, 'sentences');
      
      if (result?.flag === 1) {
        showSnackbar(`✅ 句子添加成功`, 'success');
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

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // ========== 去除 Markdown 标记（用于中文翻译） ==========
  const removeMarkdown = (text) => {
    if (!text) return '';
    // 移除粗体标记 **text** -> text
    return text.replace(/\*\*([^*]+)\*\*/g, '$1');
  };

  // ========== 渲染中文翻译区域（带模糊效果） ==========
  const renderChineseTranslation = (chineseText, sentenceUniqueId, isRevealed) => {
    if (!chineseText) return null;
    
    return (
      <Box
        onClick={(e) => toggleChineseReveal(sentenceUniqueId, e)}
        sx={{
          mt: 1,
          pl: 2,
          pr: 2,
          py: 1,
          borderRadius: 1.5,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: isRevealed ? 'rgba(25, 118, 210, 0.08)' : 'rgba(158, 158, 158, 0.05)',
          borderLeft: isRevealed ? '3px solid #1976d2' : '3px solid #bdbdbd',
          position: 'relative',
          '&:hover': {
            backgroundColor: isRevealed ? 'rgba(25, 118, 210, 0.12)' : 'rgba(158, 158, 158, 0.1)',
          }
        }}
      >
        {!isRevealed ? (
          // 模糊状态：显示提示文字和模糊的中文
          <Box sx={{ position: 'relative' }}>
            <Typography
              variant="body2"
              sx={{
                filter: 'blur(4px)',
                userSelect: 'none',
                color: '#9e9e9e',
                fontStyle: 'italic',
                lineHeight: 1.6,
                transition: 'filter 0.2s ease'
              }}
            >
              {chineseText}
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 3,
                fontSize: '0.7rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              <span>🔒</span>
              <span>点击显示中文</span>
            </Box>
          </Box>
        ) : (
          // 清晰状态：显示清晰的中文
          <Typography
            variant="body2"
            sx={{
              color: '#1976d2',
              fontStyle: 'italic',
              lineHeight: 1.6,
              fontWeight: 500,
              animation: 'fadeIn 0.3s ease',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(-5px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            📖 {chineseText}
          </Typography>
        )}
      </Box>
    );
  };

  // ========== 渲染单个句子（带按钮）- 新版，直接接收英文和中文 ==========
  const renderSentenceItem = (englishSentence, chineseTranslation, sentenceUniqueId, isHeading = false, headingText = '') => {
    // 如果是标题
    if (isHeading) {
      const headingStyle = {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        margin: '0.75rem 0 0.5rem 0',
        color: '#1a237e',
        fontFamily: '"Georgia", "Times New Roman", serif',
        cursor: 'pointer',
        display: 'inline-block',
        transition: 'all 0.2s ease'
      };
      
      return (
        <Typography 
          key={`heading-${sentenceUniqueId}`} 
          style={headingStyle}
          onClick={(e) => handleWordClick(headingText, e)}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.textDecoration = 'none';
          }}
          title="点击翻译整个标题"
        >
          {headingText}
        </Typography>
      );
    }
    
    // 去除中文翻译中的 Markdown 标记
    const cleanChineseTranslation = removeMarkdown(chineseTranslation);
    let displayText = '';
    
    if (displayMode === 'english') {
      displayText = englishSentence;
    } else if (displayMode === 'chinese') {
      displayText = cleanChineseTranslation;
    } else if (displayMode === 'bilingual') {
      displayText = englishSentence;
    }
    
    if (!displayText) return null;
    
    // 判断中文是否应该清晰显示
    const isChineseRevealed = displayMode === 'bilingual' && revealedChineseIndexes.has(sentenceUniqueId);
    
    return (
      <Box
        key={`sentence-${sentenceUniqueId}`}
        sx={{
          display: 'block',
          position: 'relative',
          mb: displayMode === 'bilingual' ? 2.5 : 1.5,
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
        {/* 英文部分 */}
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
            : renderClickableContent(displayText)}
        </Typography>
        
        {/* 中文翻译区域（仅在中英对照模式下显示） */}
        {displayMode === 'bilingual' && cleanChineseTranslation && (
          renderChineseTranslation(cleanChineseTranslation, sentenceUniqueId, isChineseRevealed)
        )}
        
        {/* 按钮区域 */}
        {displayMode !== 'chinese' && englishSentence && (
          <Tooltip title="翻译整句">
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
        
        <Tooltip title="添加这个句子（中英文）">
          <IconButton
            className="sentence-add-button"
            size="small"
            onClick={(e) => handleSentenceSelect(englishSentence, cleanChineseTranslation, e)}
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
      // 切换模式时清空已清晰显示的中文索引
      setRevealedChineseIndexes(new Set());
      const modeNames = {
        'english': '仅显示英文',
        'chinese': '仅显示中文',
        'bilingual': '中英文对照（点击模糊区域显示清晰中文）'
      };
      showSnackbar(`已切换到：${modeNames[newMode]}`, 'info');
    }
  };

  // ========== 根据新结构渲染内容 ==========
  const renderContentFromSentences = (sentencesArray, partIndex) => {
    if (!sentencesArray || sentencesArray.length === 0) {
      return <Typography color="text.secondary">暂无内容</Typography>;
    }
    
    // 在 Part 内部维护句子索引
    let sentenceIndexInPart = 0;
    
    return (
      <Box>
        {sentencesArray.map((item, idx) => {
          // 检查是否是标题（通过检查 english 字段是否以 # 开头）
          const isHeadingItem = item.english && isHeading(item.english);
          
          if (isHeadingItem) {
            const headingText = getCleanHeading(item.english);
            const headingUniqueId = `${partIndex}-heading-${idx}`;
            // 标题只显示，不显示中文对照和添加按钮
            return renderSentenceItem('', '', headingUniqueId, true, headingText);
          } else {
            // 普通句子：生成唯一ID（Part索引 + Part内句子索引）
            const sentenceUniqueId = `${partIndex}-sentence-${sentenceIndexInPart++}`;
            return renderSentenceItem(item.english, item.chinese || '', sentenceUniqueId, false);
          }
        })}
      </Box>
    );
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

  // 获取内容数组 - 支持新旧两种格式
  const allContent = passage.content || [];
  
  // 检测是新格式还是旧格式
  const isNewFormat = allContent.length > 0 && allContent[0].sentences !== undefined;

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f5f5',
      overflow: 'hidden'
    }}>

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

      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 1, sm: 2, md: 3 },
        gap: 3,
        overflow: 'hidden',
        bgcolor: '#f8f9fa'
      }}>

        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          pb: 2
        }}>
          {allContent.map((content, partIndex) => (
            <Paper 
              key={partIndex}
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
              {/* 左侧图片区域 */}
              <Box sx={{ 
                width: { xs: '100%', lg: '40%' },
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#fafafa',
                  borderRadius: 2,
                  p: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid #e8e8e8',
                  minHeight: 200,
                  maxHeight: 350,
                  height: 'auto'
                }}>
                  {content?.image ? (
                    <img 
                      src={getImageUrl(content.image)} 
                      alt={content.alt || `Part ${partIndex + 1}`}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: '8px',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="text-align:center"><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="font-size: 48px; color: #cfd8dc; margin-bottom: 8px;"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg><p class="MuiTypography-root MuiTypography-body2 MuiTypography-colorTextSecondary" style="font-style: italic;">图片加载失败</p></div>';
                      }}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <ImageIcon sx={{ 
                        fontSize: 48, 
                        color: '#cfd8dc', 
                        mb: 1,
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
                    mt: 1.5, 
                    textAlign: 'center',
                    color: '#546e7a',
                    fontWeight: 500,
                    fontSize: '0.85rem'
                  }}
                >
                  Part {partIndex + 1}
                </Typography>
              </Box>

              {/* 右侧文本区域 */}
              <Box sx={{ 
                width: { xs: '100%', lg: '60%' },
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
                  minHeight: 280
                }}>
                  <Box sx={{
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' },
                    lineHeight: 1.8,
                    color: '#2c3e50',
                    textAlign: 'justify',
                    letterSpacing: '0.01em',
                    '& span[style*="cursor: pointer"]': {
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#e3f2fd'
                      }
                    }
                  }}>
                    {/* 根据格式选择渲染方式 */}
                    {isNewFormat ? (
                      renderContentFromSentences(content.sentences, partIndex)
                    ) : (
                      // 旧格式兼容：使用原来的渲染逻辑（这里简化处理，直接显示文本）
                      <Typography color="text.secondary">
                        旧格式内容，请更新数据格式
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      <WordTranslator
        open={showTranslator}
        onClose={() => setShowTranslator(false)}
        word={translateWord}
        G_word_name={G_word_name}
        getToken={getToken}
        defaultCompact={true}
      />

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