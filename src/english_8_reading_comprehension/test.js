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
  LinearProgress,
  IconButton,
  Tooltip,
  Zoom,
  Fade,
  Chip,
  useTheme,
  useMediaQuery,
  Grid,
  Modal,
  Backdrop,
  Collapse
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Lightbulb as LightbulbIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Send as SendIcon,
  MenuBook as MenuBookIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Translate as TranslateIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import WordTranslator from '../translator/index.js';

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

  // ========== 图片路径处理函数 ==========
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('./')) {
      const relativePath = imagePath.substring(2);
      return `https://www.ddstudent.xyz/server/src/1_english/resource/english_test_8_test_reading/${relativePath}`;
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return imagePath;
  };

  // ========== 图片点击放大功能 ==========
  const handleImageClick = (src, alt) => {
    if (!src) return;
    setSelectedImage({ src, alt: alt || '图片预览' });
    setImageScale(1);
    setImageRotation(0);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

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
    if (e) e.stopPropagation();
    
    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}]$/g, "").trim();
    
    if (cleanedWord && /^[a-zA-Z'\-]+$/.test(cleanedWord) && cleanedWord.length >= 2) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
    }
  };

// ========== 渲染可点击的文本（整个区域箭头样式） ==========
const renderClickableText = (text, stopPropagation = true) => {
  if (!text) return text;
  
  const elements = [];
  let lastIndex = 0;
  const wordRegex = /\b[a-zA-Z'\-]{2,}\b/g;
  let match;
  
  while ((match = wordRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      // 普通文本部分（包括空格）
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        elements.push(
          <span
            key={`plain-${match.index}`}
            style={{
              cursor: 'default',
              display: 'inline',
              whiteSpace: 'normal',
              wordBreak: 'break-word'
            }}
          >
            {plainText}
          </span>
        );
      }
    }
    
    const word = match[0];
    elements.push(
      <span
        key={`word-${match.index}`}
        style={{
          cursor: 'default',
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
        title="点击翻译"
      >
        {word}
      </span>
    );
    
    lastIndex = match.index + word.length;
  }
  
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      elements.push(
        <span
          key={`plain-end`}
          style={{
            cursor: 'default',
            display: 'inline',
            whiteSpace: 'normal',
            wordBreak: 'break-word'
          }}
        >
          {remainingText}
        </span>
      );
    }
  }
  
  return elements;
};

  // ========== 渲染选项（悬浮解析版本） ==========
  const renderOption = (option, optionLetter, isSelected, isCorrect, isWrong, onSelect) => {
    if (!option) return null;
    
    const handleLetterClick = (e) => {
      e.stopPropagation();
      if (onSelect && !isCorrect && !isWrong) {
        onSelect(optionLetter);
      }
    };
    
    // 获取当前题目的解析内容
    const currentQ = questions[currentQuestionIndex];
    const currentResult = currentQ ? results[currentQ.id] : null;
    const explanationContent = currentQ ? (explanations[currentQ.id]?.explanation || currentQ.explanation || '') : '';
    
    if (typeof option === 'string') {
      return (
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {/* 可点击的字母区域 */}
            <Box
              onClick={handleLetterClick}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: isSelected ? '#1a237e' : '#e0e0e0',
                color: isSelected ? 'white' : '#1a237e',
                // cursor: isCorrect || isWrong ? 'default' : 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                '&:hover': {
                  backgroundColor: isSelected ? '#283593' : (isCorrect || isWrong ? '#e0e0e0' : '#bdbdbd'),
                  transform: (isCorrect || isWrong) ? 'none' : 'scale(1.05)'
                }
              }}
            >
              {optionLetter}
            </Box>
            {/* 不可点击的选项内容 */}
<Typography
  component="span"
  sx={{
    fontWeight: isSelected ? 600 : 400,
    color: isCorrect ? '#4caf50' : isWrong ? '#f44336' : 'inherit',
    textDecoration: isWrong ? 'line-through' : 'none',
    fontSize: '0.95rem',
    cursor: 'default',  // ✅ 箭头样式
    flex: 1
  }}
>
  {renderClickableText(option, false)}  {/* 里面的单词也会有自己的 cursor 样式 */}
</Typography>
            {isCorrect && (
              <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            )}
            {isWrong && (
              <CancelIcon sx={{ color: '#f44336', fontSize: 20 }} />
            )}
          </Box>
          
          {/* 悬浮解析 - 只在选中且错误时显示 */}
          {isWrong && explanationContent && (
            <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                p: 1.5,
                zIndex: 1400,
                bgcolor: '#fff8e1',
                border: '1px solid #ffb300',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                maxWidth: '100%',
                wordBreak: 'break-word',
                minWidth: '200px'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LightbulbIcon sx={{ color: '#ffb300', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: '#ff8f00', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    题目解析
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5d4e2e', lineHeight: 1.5 }}>
                    {renderClickableText(explanationContent, false)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 500, display: 'block', mt: 1 }}>
                    正确答案: {currentResult?.correctAnswer}
                  </Typography>
                </Box>
              </Box>
              {/* 小三角箭头 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  left: 18,
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #ffb300',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 1,
                    left: -7,
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderBottom: '7px solid #fff8e1'
                  }
                }}
              />
            </Paper>
          )}
        </Box>
      );
    }
    
    const hasImage = option?.image || option?.imageUrl;
    
    if (hasImage) {
      const imageSrc = getImageUrl(option.image || option.imageUrl);
      const imageAlt = option?.text || `选项${optionLetter}`;
      
      return (
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* 可点击的字母区域 */}
            <Box
              onClick={handleLetterClick}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: isSelected ? '#1a237e' : '#e0e0e0',
                color: isSelected ? 'white' : '#1a237e',
                // cursor: isCorrect || isWrong ? 'default' : 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                '&:hover': {
                  backgroundColor: isSelected ? '#283593' : (isCorrect || isWrong ? '#e0e0e0' : '#bdbdbd'),
                  transform: (isCorrect || isWrong) ? 'none' : 'scale(1.05)'
                }
              }}
            >
              {optionLetter}
            </Box>
            {/* 不可点击的选项内容 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              {imageSrc && (
                <Box 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick(imageSrc, imageAlt);
                  }}
                  // sx={{ cursor: 'pointer', position: 'relative' }}
                >
                  <img 
                    src={imageSrc} 
                    alt={imageAlt}
                    style={{
                      maxWidth: '120px',
                      maxHeight: '120px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #1a237e' : '1px solid #e0e0e0',
                      marginBottom: '4px',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      // cursor: 'pointer'
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
                <Typography variant="caption" sx={{ mt: 0.5, textAlign: 'center' }}>
                  {renderClickableText(option.text, false)}
                </Typography>
              )}
            </Box>
            {isCorrect && <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />}
            {isWrong && <CancelIcon sx={{ color: '#f44336', fontSize: 20 }} />}
          </Box>
          
          {/* 悬浮解析 - 只在选中且错误时显示 */}
          {isWrong && explanationContent && (
            <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                p: 1.5,
                zIndex: 1400,
                bgcolor: '#fff8e1',
                border: '1px solid #ffb300',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                maxWidth: '100%',
                wordBreak: 'break-word',
                minWidth: '200px'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LightbulbIcon sx={{ color: '#ffb300', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: '#ff8f00', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    题目解析
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5d4e2e', lineHeight: 1.5 }}>
                    {renderClickableText(explanationContent, false)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 500, display: 'block', mt: 1 }}>
                    正确答案: {currentResult?.correctAnswer}
                  </Typography>
                </Box>
              </Box>
              {/* 小三角箭头 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  left: 18,
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #ffb300',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 1,
                    left: -7,
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderBottom: '7px solid #fff8e1'
                  }
                }}
              />
            </Paper>
          )}
        </Box>
      );
    }
    
    return (
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {/* 可点击的字母区域 */}
          <Box
            onClick={handleLetterClick}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: isSelected ? '#1a237e' : '#e0e0e0',
              color: isSelected ? 'white' : '#1a237e',
              // cursor: isCorrect || isWrong ? 'default' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: isSelected ? '#283593' : (isCorrect || isWrong ? '#e0e0e0' : '#bdbdbd'),
                transform: (isCorrect || isWrong) ? 'none' : 'scale(1.05)'
              }
            }}
          >
            {optionLetter}
          </Box>
          {/* 不可点击的选项内容 */}
          <Typography
            component="span"
            sx={{
              fontWeight: isSelected ? 600 : 400,
              color: isCorrect ? '#4caf50' : isWrong ? '#f44336' : 'inherit',
              textDecoration: isWrong ? 'line-through' : 'none',
              fontSize: '0.95rem',
              flex: 1
            }}
          >
            {renderClickableText(option?.text || '', false)}
          </Typography>
          {isCorrect && (
            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
          )}
          {isWrong && (
            <CancelIcon sx={{ color: '#f44336', fontSize: 20 }} />
          )}
        </Box>
        
        {/* 悬浮解析 - 只在选中且错误时显示 */}
        {isWrong && explanationContent && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              p: 1.5,
              zIndex: 1400,
              bgcolor: '#fff8e1',
              border: '1px solid #ffb300',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              maxWidth: '100%',
              wordBreak: 'break-word',
              minWidth: '200px'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <LightbulbIcon sx={{ color: '#ffb300', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#ff8f00', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  题目解析
                </Typography>
                <Typography variant="body2" sx={{ color: '#5d4e2e', lineHeight: 1.5 }}>
                  {renderClickableText(explanationContent, false)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 500, display: 'block', mt: 1 }}>
                  正确答案: {currentResult?.correctAnswer}
                </Typography>
              </Box>
            </Box>
            {/* 小三角箭头 */}
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                left: 18,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid #ffb300',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 1,
                  left: -7,
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderBottom: '7px solid #fff8e1'
                }
              }}
            />
          </Paper>
        )}
      </Box>
    );
  };

  // ========== 渲染文章内容 ==========
  const renderContent = (content) => {
    if (!content) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ 文章内容为空
        </Alert>
      );
    }
    
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    imageRegex.lastIndex = 0;
    
    while ((match = imageRegex.exec(content)) !== null) {
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
      
      const imageAlt = match && match[1] ? match[1] : '文章图片';
      const imagePath = match && match[2] ? match[2] : '';
      
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
                // cursor: 'pointer',
                position: 'relative'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (imageUrl) handleImageClick(imageUrl, imageAlt);
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
                  // cursor: 'pointer'
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
                  '&:hover': { opacity: 1 }
                }} 
              />
            </Box>
          );
        }
      }
      
      lastIndex = match.index + match[0].length;
    }
    
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

  // 计算统计
  const stats = {
    total: questions.length,
    answered: Object.keys(results).length,
    correct: Object.values(results).filter(r => r?.isCorrect).length
  };

  const currentQ = questions[currentQuestionIndex];
  const currentResult = currentQ ? results[currentQ.id] : null;

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
      {/* 头部 */}
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

      {/* 左右分栏 */}
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
        {/* 左侧文章区 */}
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
          <Box>
            {renderContent(passage.content)}
          </Box>
        </Box>

        {/* 分割线 */}
        {!isMobile && (
          <Box
            sx={{
              width: '4px',
              // cursor: 'col-resize',
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

        {/* 右侧答题区 */}
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
              <Card sx={{ mb: 3, overflow: 'visible' }}>
                <CardContent sx={{ overflow: 'visible' }}>
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

                  {/* 题目内容 */}
                  <Typography variant="body1" sx={{ mb: 3, fontWeight: 500, fontSize: '1.1rem' }}>
                    {renderClickableText(currentQ.question)}
                  </Typography>

                  {/* 选项 - 只有点击字母区域才触发 */}
                  <Box sx={{ width: '100%', mb: 2, overflow: 'visible' }}>
                    <Grid container spacing={2} sx={{ overflow: 'visible' }}>
                      {currentQ.options.map((option, optIndex) => {
                        const optionLetter = String.fromCharCode(65 + optIndex);
                        const isSelected = answers[currentQ.id] === optionLetter;
                        const isCorrect = currentResult && currentResult.correctAnswer === optionLetter;
                        const isWrong = currentResult && isSelected && !currentResult.isCorrect;
                        
                        const handleOptionSelect = (value) => {
                          if (currentResult) return; // 已经答过，不能修改
                          // 保存答案
                          onAnswerChange(currentQ.id, value);
                          
                          // 自动核对答案
                          const correctAnswer = currentQ.correctAnswer;
                          const isAnswerCorrect = value === correctAnswer;
                          
                          setResults(prev => ({
                            ...prev,
                            [currentQ.id]: {
                              isCorrect: isAnswerCorrect,
                              correctAnswer,
                              userAnswer: value
                            }
                          }));
                        };
                        
                        return (
                          <Grid item xs={12} sm={6} key={optIndex} sx={{ overflow: 'visible' }}>
                            {renderOption(option, optionLetter, isSelected, isCorrect, isWrong, handleOptionSelect)}
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
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

      {/* 图片放大模态框 */}
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
            {/* 控制栏 */}
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
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
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

            {/* 图片说明 */}
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