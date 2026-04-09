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
  
  // 发音加载状态
  const [speakingWord, setSpeakingWord] = useState(null);
  
  // 显示模式: 'english' | 'chinese' | 'bilingual'
  const [displayMode, setDisplayMode] = useState('english');

  // 句子添加相关状态
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isAddingSentence, setIsAddingSentence] = useState(false);

  // ========== 检测是否为 Markdown 标题 ==========
  const isMarkdownHeading = (text) => {
    return /^#{1,3}\s+.+$/.test(text.trim());
  };

  // ========== 渲染可点击的文本内容（无虚线） ==========
  const renderClickableContent = (content) => {
    if (!content) return null;
    
    const elements = [];
    let lastIndex = 0;
    
    // 匹配单词（包括带撇号的缩写词如 it's, don't, can't）
    const wordRegex = /\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b/g;
    let match;
    
    while ((match = wordRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        elements.push(content.substring(lastIndex, match.index));
      }
      
      const word = match[0];
      elements.push(
        <span
          key={`word-${match.index}`}
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
    
    if (lastIndex < content.length) {
      elements.push(content.substring(lastIndex));
    }
    
    return elements;
  };

  // ========== 将文本分割成句子（支持换行符和逗号作为分割标志） ==========
  const splitTextIntoSentences = (text) => {
    if (!text) return [];
    
    // 先按行分割
    const lines = text.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 如果是 Markdown 标题，单独作为一个单元
      if (isMarkdownHeading(line)) {
        const cleanHeading = line.replace(/^#{1,3}\s+/, '');
        result.push({ type: 'heading', content: cleanHeading, original: line });
        continue;
      }
      
      // 处理普通句子
      let sentence = line;
      // 如果句子以标点结尾，直接添加
      if (/[.!?,]$/.test(sentence)) {
        result.push({ type: 'sentence', content: sentence });
      } else {
        // 如果没有标点结尾，尝试合并下一行
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          if (!nextLine) break;
          if (isMarkdownHeading(nextLine)) break;
          sentence += ' ' + nextLine;
          if (/[.!?,]$/.test(nextLine)) {
            j++;
            break;
          }
          j++;
        }
        i = j - 1;
        result.push({ type: 'sentence', content: sentence });
      }
    }
    
    // 最后再按标点符号细分
    const finalResult = [];
    for (const item of result) {
      if (item.type === 'heading') {
        finalResult.push(item);
        continue;
      }
      
      // 按标点符号分割长句子（包括逗号）
      const sentences = splitByPunctuation(item.content);
      for (const sentence of sentences) {
        if (sentence.trim()) {
          finalResult.push({ type: 'sentence', content: sentence.trim() });
        }
      }
    }
    
    return finalResult;
  };

  // ========== 按标点符号分割句子（支持逗号，正确处理缩写词） ==========
  const splitByPunctuation = (text) => {
    const sentences = [];
    let current = '';
    let i = 0;
    
    // 常见缩写词（这些词后面的句号不表示句子结束）
    const commonAbbrs = [
      'mr', 'mrs', 'ms', 'dr', 'prof', 'rev', 'st', 'etc', 'vs', 
      'inc', 'ltd', 'co', 'jr', 'sr', 'no', 'vol', 'ed', 'al',
      'a.m', 'p.m', 'e.g', 'i.e', 'fig', 'sec', 'chap', 'pp'
    ];
    
    while (i < text.length) {
      current += text[i];
      
      // 检查是否是句子结束标点（句号、感叹号、问号、逗号）
      if (text[i] === '.' || text[i] === '!' || text[i] === '?' || text[i] === ',') {
        // 对于逗号，直接作为句子分隔符
        if (text[i] === ',') {
          // 检查是否是数字中的逗号（如 1,000）
          const prevChar = text[i - 1] || '';
          const nextChar = text[i + 1] || '';
          const isNumberComma = /[0-9]/.test(prevChar) && /[0-9]/.test(nextChar);
          
          // 如果不是数字中的逗号，则作为句子分隔符
          if (!isNumberComma) {
            // 确保当前句子有内容
            const trimmedCurrent = current.trim();
            if (trimmedCurrent && trimmedCurrent !== ',') {
              // 移除末尾的逗号
              const sentenceWithoutComma = trimmedCurrent.replace(/,$/, '');
              if (sentenceWithoutComma) {
                sentences.push(sentenceWithoutComma);
              }
            }
            current = '';
          }
        }
        // 对于句号，需要特殊处理缩写词
        else if (text[i] === '.') {
          // 获取当前句子中的单词
          const words = current.split(/\s+/);
          // 检查最后一个词是否是缩写词
          let isAbbreviation = false;
          
          for (let k = words.length - 1; k >= 0; k--) {
            let word = words[k];
            // 移除可能的标点
            word = word.replace(/[.,!?;:"()\[\]{}]$/, '');
            if (word && commonAbbrs.includes(word.toLowerCase())) {
              isAbbreviation = true;
              break;
            }
            // 检查是否是带点的缩写如 "a.m."
            if (word && word.endsWith('.') && commonAbbrs.includes(word.slice(0, -1).toLowerCase())) {
              isAbbreviation = true;
              break;
            }
            // 只检查最后几个词
            if (k < words.length - 2) break;
          }
          
          // 检查下一个字符
          const nextChar = text[i + 1] || '';
          const nextNextChar = text[i + 2] || '';
          
          // 判断是否是真正的句子结束
          const isEndOfSentence = !isAbbreviation && 
                                 ((nextChar === ' ' && /[A-Z0-9]/.test(nextNextChar)) || 
                                  i === text.length - 1 ||
                                  nextChar === '\n' ||
                                  nextChar === '');
          
          if (isEndOfSentence) {
            sentences.push(current.trim());
            current = '';
          }
        } else {
          // 感叹号和问号总是句子结束
          sentences.push(current.trim());
          current = '';
        }
      }
      
      i++;
    }
    
    // 添加剩余内容
    if (current.trim()) {
      sentences.push(current.trim());
    }
    
    return sentences;
  };

  // ========== 将中文文本分割成句子 ==========
  const splitChineseIntoSentences = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 中文标题检测
      if (line.startsWith('#') && !line.startsWith('##')) {
        const cleanHeading = line.replace(/^#+\s*/, '');
        result.push({ type: 'heading', content: cleanHeading });
        continue;
      }
      
      // 按中文标点分割（句号、问号、感叹号、逗号）
      let sentence = '';
      for (let j = 0; j < line.length; j++) {
        sentence += line[j];
        if (line[j] === '。' || line[j] === '？' || line[j] === '！' || line[j] === '，' || line[j] === '…') {
          if (sentence.trim()) {
            result.push({ type: 'sentence', content: sentence.trim() });
            sentence = '';
          }
        }
      }
      if (sentence.trim()) {
        result.push({ type: 'sentence', content: sentence.trim() });
      }
    }
    
    return result;
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
      
      setSpeakingWord(cleanedWord);
      try {
        await F_speak(cleanedWord);
        console.log('发音完成:', cleanedWord);
      } catch (error) {
        console.error('发音失败:', error);
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

  // ========== 渲染单个句子或标题（带按钮） ==========
  const renderSentenceWithButtons = (item, chineseTranslation, index) => {
    // 如果是标题，只显示标题（可点击翻译），不显示添加按钮
    if (item.type === 'heading') {
      const headingText = item.content;
      // 根据标题级别设置样式
      let fontSize = '1.5rem';
      if (item.original) {
        if (item.original.startsWith('# ')) fontSize = '1.8rem';
        else if (item.original.startsWith('## ')) fontSize = '1.5rem';
        else if (item.original.startsWith('### ')) fontSize = '1.3rem';
      }
      
      const headingStyle = {
        fontSize: fontSize,
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
          key={`heading-${index}`} 
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
          {speakingWord === headingText && (
            <CircularProgress 
              size={14} 
              sx={{ 
                ml: 1, 
                verticalAlign: 'middle',
                color: '#4caf50'
              }} 
            />
          )}
        </Typography>
      );
    }
    
    // 普通句子
    const englishSentence = item.content;
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
              : renderClickableContent(displayText)}
          </Typography>
        )}
        
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

  // ========== 根据模式渲染内容 ==========
  const renderContentByMode = (text, translation) => {
    if (displayMode === 'english') {
      const items = splitTextIntoSentences(text);
      const chineseItems = translation ? splitChineseIntoSentences(translation) : [];
      
      return (
        <Box>
          {items.map((item, idx) => {
            const chineseItem = chineseItems[idx] || { type: 'sentence', content: '' };
            const chineseContent = chineseItem.type === 'sentence' ? chineseItem.content : '';
            return renderSentenceWithButtons(item, chineseContent, idx);
          })}
        </Box>
      );
    } else if (displayMode === 'chinese') {
      const items = splitChineseIntoSentences(translation);
      
      return (
        <Box>
          {items.map((item, idx) => {
            return renderSentenceWithButtons({ type: 'sentence', content: '' }, item.content, idx);
          })}
        </Box>
      );
    } else {
      const englishItems = splitTextIntoSentences(text);
      const chineseItems = translation ? splitChineseIntoSentences(translation) : [];
      const maxLength = Math.max(englishItems.length, chineseItems.length);
      
      return (
        <Box>
          {Array.from({ length: maxLength }).map((_, idx) => {
            const englishItem = englishItems[idx] || { type: 'sentence', content: '' };
            const chineseItem = chineseItems[idx] || { type: 'sentence', content: '' };
            const chineseContent = chineseItem.type === 'sentence' ? chineseItem.content : '';
            return renderSentenceWithButtons(englishItem, chineseContent, idx);
          })}
        </Box>
      );
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
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#e3f2fd'
                      }
                    }
                  }}>
                    {renderContentByMode(content?.text, content?.translation)}
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