import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  Collapse,
  IconButton,
  Tooltip,
  Zoom,
  Fade,
  Chip,
  useTheme,
  useMediaQuery,
  Grid,
  Modal,
  Backdrop
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Lightbulb as LightbulbIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Psychology as PsychologyIcon,
  Send as SendIcon,
  MenuBook as MenuBookIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Translate as TranslateIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon
} from '@mui/icons-material';
import WordTranslator from '../translator/translator.js';

const ReadingTest = ({
  passage,
  questions = [],
  answers = {},
  explanations = {},
  givenWords = [],
  loading = false,
  error = null,
  onRefresh,
  onAnswerChange,
  onSubmit,
  timeSpent = 0,
  G_word_name = 'word_english_test_study',
  getToken
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // 内部状态
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  // 翻译相关状态
  const [showTranslator, setShowTranslator] = useState(false);
  const [translateWord, setTranslateWord] = useState('');

  // 图片放大相关状态
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ src: '', alt: '' });
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  // 当切换题目时更新
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= questions.length) {
      setCurrentQuestionIndex(0);
    }
  }, [questions]);

  // ========== 拖动调整左右宽度 ==========
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const container = document.getElementById('split-container');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      if (newLeftWidth >= 30 && newLeftWidth <= 70) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ========== 图片路径处理函数（修正为正确路径） ==========
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    // 如果是相对路径（以 ./ 开头），转换为完整 URL
    if (imagePath.startsWith('./')) {
      // 移除开头的 ./
      const relativePath = imagePath.substring(2);
      // 构建正确的完整 URL
      return `https://www.ddstudent.xyz/server/src/1_english/resource/english_test_8_test_reading/${relativePath}`;
    }
    
    // 如果是绝对路径（以 http 开头），直接返回
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // 其他情况，原样返回
    return imagePath;
  };

  // ========== 图片点击放大功能 ==========
  const handleImageClick = (src, alt) => {
    if (!src) {
      console.warn('图片源为空');
      return;
    }
    setSelectedImage({ 
      src, 
      alt: alt || '图片预览' 
    });
    setImageScale(1); // 重置缩放
    setImageRotation(0); // 重置旋转
    setModalOpen(true);
  };

  // ========== 关闭图片放大模态框 ==========
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // ========== 图片缩放控制 ==========
  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setImageScale(1);
    setImageRotation(0);
  };

  // ========== 单词点击翻译功能 ==========
  const handleWordClick = (word, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    // 清理单词（去掉标点符号）
    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}]$/g, "").trim();
    
    // 验证是否为有效英文单词
    if (cleanedWord && /^[a-zA-Z'\-]+$/.test(cleanedWord) && cleanedWord.length >= 2) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
    }
  };

  // ========== 渲染可点击的文本（无下划线版） ==========
  const renderClickableText = (text, stopPropagation = true) => {
    if (!text) return text;
    
    const elements = [];
    let lastIndex = 0;
    
    // 匹配英文单词的正则（至少2个字符）
    const wordRegex = /\b[a-zA-Z'\-]{2,}\b/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      // 添加单词前的普通文本
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }
      
      // 添加可点击的单词
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
            if (stopPropagation) {
              e.stopPropagation();
            }
            handleWordClick(word, e);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(26, 35, 126, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="点击翻译"
        >
          {word}
        </span>
      );
      
      lastIndex = match.index + word.length;
    }
    
    // 添加剩余的文本
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }
    
    return elements;
  };

  // ========== 渲染选项（支持图片）- 完全修复空值错误 ==========
  const renderOption = (option, optionLetter, isSelected, isCorrect, isWrong, currentResult) => {
    // 如果 option 为空，返回空
    if (!option) return null;
    
    // 处理普通文本选项
    if (typeof option === 'string') {
      return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            component="span"
            sx={{
              fontWeight: isSelected ? 600 : 400,
              color: isCorrect ? '#4caf50' : isWrong ? '#f44336' : 'inherit',
              textDecoration: isWrong ? 'line-through' : 'none'
            }}
          >
            {optionLetter}. {renderClickableText(option)}
          </Typography>
          {isCorrect && (
            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18 }} />
          )}
        </Box>
      );
    }
    
    // 处理对象类型的选项
    const hasImage = option?.image || option?.imageUrl;
    
    // 如果选项包含图片
    if (hasImage) {
      const imageSrc = getImageUrl(option.image || option.imageUrl);
      const imageAlt = option?.text || `选项${optionLetter}`;
      
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            sx={{
              fontWeight: isSelected ? 600 : 400,
              color: isCorrect ? '#4caf50' : isWrong ? '#f44336' : 'inherit',
              minWidth: '24px'
            }}
          >
            {optionLetter}.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {imageSrc && (
              <Box 
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(imageSrc, imageAlt);
                }}
                sx={{ cursor: 'pointer', position: 'relative' }}
              >
                <img 
                  src={imageSrc} 
                  alt={imageAlt}
                  style={{
                    maxWidth: '100px',
                    maxHeight: '100px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #1a237e' : '1px solid #e0e0e0',
                    marginBottom: '4px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <ZoomInIcon 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    right: 8, 
                    fontSize: 18, 
                    color: '#1a237e',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    borderRadius: '50%',
                    padding: '2px',
                    opacity: 0.7
                  }} 
                />
              </Box>
            )}
            {option?.text && (
              <Typography variant="caption">
                {renderClickableText(option.text)}
              </Typography>
            )}
          </Box>
          {isCorrect && <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18, ml: 1 }} />}
        </Box>
      );
    }
    
    // 默认处理（对象但没有图片）
    return (
      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          component="span"
          sx={{
            fontWeight: isSelected ? 600 : 400,
            color: isCorrect ? '#4caf50' : isWrong ? '#f44336' : 'inherit',
            textDecoration: isWrong ? 'line-through' : 'none'
          }}
        >
          {optionLetter}. {renderClickableText(option?.text || '')}
        </Typography>
        {isCorrect && (
          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18 }} />
        )}
      </Box>
    );
  };

  // ========== 核对当前题目 ==========
  const handleCheckCurrent = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    
    const answer = answers[currentQ.id];
    if (!answer) {
      alert('请先选择答案');
      return;
    }

    const correctAnswer = currentQ.correctAnswer;
    const isCorrect = answer === correctAnswer;
    
    setResults(prev => ({
      ...prev,
      [currentQ.id]: {
        isCorrect,
        correctAnswer,
        userAnswer: answer
      }
    }));
  };

  // ========== 上一题/下一题 ==========
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // ========== 提交所有答案 ==========
  const handleSubmitAll = async () => {
    const allChecked = questions.every(q => results[q.id]);
    if (!allChecked) {
      alert('请先完成所有题目');
      return;
    }

    if (onSubmit) {
      const result = await onSubmit(answers, timeSpent, { 
        total: questions.length, 
        correct: Object.values(results).filter(r => r.isCorrect).length 
      });
      
      if (result?.success) {
        setSubmitted(true);
      }
    }
  };

  // ========== 渲染文章内容（支持图片）- 修复图片放大错误 ==========
  const renderContent = (content) => {
    if (!content) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ 文章内容为空
        </Alert>
      );
    }
    
    // 如果内容包含图片标记 ![alt](url)
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // 重置正则表达式的 lastIndex
    imageRegex.lastIndex = 0;
    
    while ((match = imageRegex.exec(content)) !== null) {
      // 添加图片前的文本
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        const lines = textBefore.split('\n');
        lines.forEach((line, idx) => {
          if (line.trim() === '') {
            parts.push(<Box key={`text-empty-${idx}`} sx={{ height: 12 }} />);
          } else if (line.startsWith('### ')) {
            parts.push(
              <Typography key={`text-h-${idx}`} variant="h6" sx={{ mt: 3, mb: 1, color: '#1a237e', fontWeight: 600, borderLeft: '4px solid #ffd700', pl: 2 }}>
                {renderClickableText(line.substring(4))}
              </Typography>
            );
          } else {
            parts.push(
              <Typography key={`text-p-${idx}`} variant="body1" paragraph sx={{ lineHeight: 1.8, textIndent: '2em', mb: 1.5, color: '#2c3e50' }}>
                {renderClickableText(line)}
              </Typography>
            );
          }
        });
      }
      
      // 安全地获取图片信息
      const imageAlt = match && match[1] ? match[1] : '文章图片';
      const imagePath = match && match[2] ? match[2] : '';
      
      // 添加图片 - 使用 getImageUrl 转换路径，并添加点击放大功能
      if (imagePath) {
        const imageUrl = getImageUrl(imagePath);
        if (imageUrl) {
          parts.push(
            <Box 
              key={`img-${match.index}`} 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                my: 2,
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (imageUrl) {
                  handleImageClick(imageUrl, imageAlt);
                }
              }}
            >
              <img 
                src={imageUrl} 
                alt={imageAlt}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px', 
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x300?text=图片加载失败';
                }}
              />
              <ZoomInIcon 
                sx={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  right: 16, 
                  fontSize: 24, 
                  color: '#1a237e',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '50%',
                  padding: '4px',
                  opacity: 0.8,
                  '&:hover': {
                    opacity: 1
                  }
                }} 
              />
            </Box>
          );
        }
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余的文本
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      const lines = remainingText.split('\n');
      lines.forEach((line, idx) => {
        if (line.trim() === '') {
          parts.push(<Box key={`remain-empty-${idx}`} sx={{ height: 12 }} />);
        } else if (line.startsWith('### ')) {
          parts.push(
            <Typography key={`remain-h-${idx}`} variant="h6" sx={{ mt: 3, mb: 1, color: '#1a237e', fontWeight: 600, borderLeft: '4px solid #ffd700', pl: 2 }}>
              {renderClickableText(line.substring(4))}
            </Typography>
          );
        } else {
          parts.push(
            <Typography key={`remain-p-${idx}`} variant="body1" paragraph sx={{ lineHeight: 1.8, textIndent: '2em', mb: 1.5, color: '#2c3e50' }}>
              {renderClickableText(line)}
            </Typography>
          );
        }
      });
    }
    
    return parts.length > 0 ? parts : (
      // 如果没有图片标记，按原方式处理
      content.split('\n').map((line, index) => {
        if (line.trim() === '') {
          return <Box key={index} sx={{ height: 12 }} />;
        }
        if (line.startsWith('### ')) {
          return (
            <Typography key={index} variant="h6" sx={{ mt: 3, mb: 1, color: '#1a237e', fontWeight: 600, borderLeft: '4px solid #ffd700', pl: 2 }}>
              {renderClickableText(line.substring(4))}
            </Typography>
          );
        }
        return (
          <Typography key={index} variant="body1" paragraph sx={{ lineHeight: 1.8, textIndent: '2em', mb: 1.5, color: '#2c3e50' }}>
            {renderClickableText(line)}
          </Typography>
        );
      })
    );
  };

  // 计算统计
  const stats = {
    total: questions.length,
    answered: Object.keys(results).length,
    correct: Object.values(results).filter(r => r?.isCorrect).length
  };

  const currentQ = questions[currentQuestionIndex];
  const currentResult = currentQ ? results[currentQ.id] : null;
  const currentExplanation = currentQ ? (explanations[currentQ.id]?.explanation || currentQ.explanation) : '';

  if (loading && !passage) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
        <Typography sx={{ ml: 2 }}>加载文章中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        {onRefresh && (
          <Button variant="contained" onClick={onRefresh} startIcon={<RefreshIcon />}>
            重试
          </Button>
        )}
      </Box>
    );
  }

  if (!passage || questions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <MenuBookIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">暂无文章</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          请点击"抽取题目"开始练习
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* 头部添加翻译按钮和进度条 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              答题进度
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {stats.answered}/{stats.total} 题 • 正确 {stats.correct} 题
            </Typography>
          </Box>
          <Tooltip title="打开翻译器">
            <IconButton 
              size="small" 
              onClick={() => {
                setTranslateWord('');
                setShowTranslator(true);
              }}
              sx={{ color: '#1a237e', bgcolor: 'rgba(26, 35, 126, 0.1)' }}
            >
              <TranslateIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <LinearProgress
          variant="determinate"
          value={stats.total > 0 ? (stats.answered / stats.total) * 100 : 0}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* 左右分栏内容 */}
      <Box 
        id="split-container"
        sx={{ 
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          bgcolor: '#f5f5f5',
          borderRadius: 1
        }}
      >
        {/* 左侧 - 文章区 */}
        <Box
          sx={{
            width: isMobile ? '100%' : `${leftWidth}%`,
            overflow: 'auto',
            bgcolor: 'white',
            p: 3,
            borderRight: !isMobile ? '1px solid #e0e0e0' : 'none'
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: '#1a237e', fontWeight: 600, mb: 3 }}>
            {renderClickableText(passage.title)}
          </Typography>
          
          {/* 文章内容 - 可点击翻译，支持图片 */}
          <Box>
            {renderContent(passage.content)}
          </Box>
        </Box>

        {/* 可拖动分割线 */}
        {!isMobile && (
          <Box
            sx={{
              width: '4px',
              cursor: 'col-resize',
              bgcolor: isDragging ? '#ffb300' : '#e0e0e0',
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: '#ffb300' },
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '2px',
                height: '30px',
                bgcolor: isDragging ? 'white' : '#9e9e9e',
                borderRadius: 1
              }
            }}
            onMouseDown={() => setIsDragging(true)}
          />
        )}

        {/* 右侧 - 答题区 */}
        <Box
          sx={{
            width: isMobile ? '100%' : `${100 - leftWidth}%`,
            overflow: 'auto',
            bgcolor: '#f8f9fa',
            p: 3
          }}
        >
          {/* 当前题目 */}
          {currentQ && (
            <Zoom in={true} key={currentQ.id}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  {/* 题目标题 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ color: '#1a237e' }}>
                        第 {currentQ.number} 题
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({currentQuestionIndex + 1} / {questions.length})
                      </Typography>
                    </Box>
                    {currentResult && (
                      <Chip
                        icon={currentResult.isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                        label={currentResult.isCorrect ? '正确' : '错误'}
                        color={currentResult.isCorrect ? 'success' : 'error'}
                        size="small"
                      />
                    )}
                  </Box>

                  {/* 题目内容 - 可点击翻译 */}
                  <Typography variant="body1" sx={{ mb: 3, fontWeight: 500, fontSize: '1.1rem' }}>
                    {renderClickableText(currentQ.question)}
                  </Typography>

                  {/* 选项 - 支持图片 */}
                  <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
                    <RadioGroup
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => onAnswerChange(currentQ.id, e.target.value)}
                    >
                      <Grid container spacing={2}>
                        {currentQ.options.map((option, optIndex) => {
                          const optionLetter = String.fromCharCode(65 + optIndex);
                          const isSelected = answers[currentQ.id] === optionLetter;
                          const isCorrect = currentResult && currentResult.correctAnswer === optionLetter;
                          const isWrong = currentResult && isSelected && !currentResult.isCorrect;
                          
                          return (
                            <Grid item xs={12} sm={6} key={optIndex}>
                              <FormControlLabel
                                value={optionLetter}
                                control={<Radio />}
                                disabled={!!currentResult}
                                label={renderOption(option, optionLetter, isSelected, isCorrect, isWrong, currentResult)}
                                sx={{
                                  width: '100%',
                                  m: 0,
                                  p: 1,
                                  borderRadius: 1,
                                  bgcolor: isSelected && !currentResult ? 'rgba(26, 35, 126, 0.05)' : 'transparent',
                                  border: isCorrect ? '1px solid #4caf50' : 'none',
                                  '& .MuiFormControlLabel-label': {
                                    width: '100%'
                                  }
                                }}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>
                    </RadioGroup>
                  </FormControl>

                  {/* 操作按钮区域 */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* 核对按钮 */}
                    {!currentResult ? (
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleCheckCurrent}
                        disabled={!answers[currentQ.id]}
                        sx={{ 
                          bgcolor: '#1a237e',
                          py: 1.2,
                          '&:hover': { bgcolor: '#283593' }
                        }}
                      >
                        核对答案
                      </Button>
                    ) : (
                      <>
                        {/* 解析悬浮按钮 - 解析内容也可点击翻译 */}
                        <Tooltip
                          title={
                            <Box sx={{ p: 1, maxWidth: 300 }}>
                              <Typography variant="subtitle2" sx={{ color: '#ffb300', mb: 1 }}>
                                📖 题目解析
                              </Typography>
                              <Typography variant="body2" component="div">
                                {renderClickableText(currentExplanation, false)}
                              </Typography>
                              {!currentResult.isCorrect && (
                                <Typography variant="body2" sx={{ mt: 1, color: '#ffb300' }}>
                                  正确答案: {currentResult.correctAnswer}
                                </Typography>
                              )}
                            </Box>
                          }
                          arrow
                          placement="top"
                          enterDelay={300}
                          leaveDelay={200}
                        >
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<LightbulbIcon />}
                            sx={{ 
                              borderColor: '#ffb300',
                              color: '#ff8f00',
                              '&:hover': { borderColor: '#ffa000', bgcolor: '#fff8e1' }
                            }}
                          >
                            查看解析
                          </Button>
                        </Tooltip>
                      </>
                    )}
                  </Box>

                  {/* 错误时显示正确答案 */}
                  {currentResult && !currentResult.isCorrect && (
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        mt: 2, 
                        p: 1, 
                        bgcolor: '#ffebee',
                        borderColor: '#f44336',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <InfoIcon sx={{ color: '#c62828', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: '#c62828' }}>
                        正确答案: {currentResult.correctAnswer}
                      </Typography>
                    </Paper>
                  )}
                </CardContent>
              </Card>
            </Zoom>
          )}

          {/* 导航按钮 */}
          {questions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                startIcon={<NavigateBeforeIcon />}
                sx={{ borderColor: '#1a237e', color: '#1a237e', py: 1.2 }}
              >
                上一题
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                endIcon={<NavigateNextIcon />}
                sx={{ borderColor: '#1a237e', color: '#1a237e', py: 1.2 }}
              >
                下一题
              </Button>
            </Box>
          )}

          {/* 题目快速导航 */}
          {questions.length > 1 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                快速跳转:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = !!results[q.id];
                  const isCorrect = results[q.id]?.isCorrect;
                  
                  return (
                    <Tooltip key={q.id} title={`第 ${q.number} 题`}>
                      <Button
                        size="small"
                        variant={isCurrent ? "contained" : "outlined"}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        sx={{
                          minWidth: 40,
                          height: 40,
                          bgcolor: isCurrent ? '#1a237e' : 
                                   isAnswered ? (isCorrect ? '#4caf50' : '#f44336') : 'transparent',
                          color: isCurrent ? 'white' : 
                                 isAnswered ? 'white' : '#1a237e',
                          borderColor: '#1a237e',
                          '&:hover': {
                            bgcolor: isCurrent ? '#283593' : 
                                    isAnswered ? (isCorrect ? '#388e3c' : '#d32f2f') : 'rgba(26,35,126,0.1)'
                          }
                        }}
                      >
                        {q.number}
                      </Button>
                    </Tooltip>
                  );
                })}
              </Box>
            </Paper>
          )}

          {/* 提交所有答案按钮 */}
          {!submitted && stats.answered === stats.total && stats.total > 0 && (
            <Fade in={true}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                onClick={handleSubmitAll}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                sx={{ py: 1.5 }}
              >
                {loading ? '提交中...' : '提交所有答案'}
              </Button>
            </Fade>
          )}

          {/* 提交后的结果统计 */}
          {submitted && (
            <Paper sx={{ p: 3, mt: 3, bgcolor: '#e8f5e9', textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
                练习完成！
              </Typography>
              <Typography variant="body1">
                正确 {stats.correct} 题，错误 {stats.total - stats.correct} 题
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, color: '#1a237e', fontWeight: 600 }}>
                正确率 {Math.round((stats.correct / stats.total) * 100)}%
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* 翻译组件 */}
      <WordTranslator
        open={showTranslator}
        onClose={() => setShowTranslator(false)}
        word={translateWord}
        G_word_name={G_word_name}
        getToken={getToken}
      />

      {/* 图片放大模态框 - 增强版 */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.95)' }
        }}
      >
        <Fade in={modalOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              outline: 'none',
              width: '100vw',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* 顶部控制栏 */}
            <Box
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
                display: 'flex',
                gap: 1,
                zIndex: 1400
              }}
            >
              <Paper sx={{ display: 'flex', gap: 0.5, p: 0.5, bgcolor: 'rgba(0,0,0,0.6)' }}>
                <Tooltip title="缩小">
                  <IconButton onClick={handleZoomOut} size="small" sx={{ color: 'white' }}>
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="放大">
                  <IconButton onClick={handleZoomIn} size="small" sx={{ color: 'white' }}>
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="旋转">
                  <IconButton onClick={handleRotate} size="small" sx={{ color: 'white' }}>
                    <RotateRightIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="重置">
                  <IconButton onClick={handleReset} size="small" sx={{ color: 'white' }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Paper>
              <IconButton
                onClick={handleCloseModal}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* 图片容器 */}
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                p: 4
              }}
            >
              <Box
                sx={{
                  display: 'inline-block',
                  transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                  transition: 'transform 0.2s ease',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/800x600?text=图片加载失败';
                  }}
                />
              </Box>
            </Box>

            {/* 底部图片说明 */}
            {selectedImage.alt && (
              <Paper
                sx={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  px: 3,
                  py: 1,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  borderRadius: 4,
                  maxWidth: '80%'
                }}
              >
                <Typography variant="body2" align="center">
                  {selectedImage.alt}
                </Typography>
              </Paper>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default ReadingTest;