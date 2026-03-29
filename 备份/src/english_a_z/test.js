import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Divider,
  Grid,
  Modal,
  Fade,
  Backdrop,
  Tooltip,
  Fab
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as TimeIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  MenuBook as BookIcon,
  Translate as TranslateIcon,
  Add as AddIcon
} from '@mui/icons-material';
import WordTranslator from '../translator/translator.js';

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
  const [currentPart, setCurrentPart] = useState(0);
  
  // 翻译相关状态
  const [showTranslator, setShowTranslator] = useState(false);
  const [translateWord, setTranslateWord] = useState('');

  // 图片放大相关状态
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ src: '', alt: '', title: '' });
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

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

  // ========== 图片点击放大功能 ==========
  const handleImageClick = (src, alt, title) => {
    if (!src) return;
    setSelectedImage({ 
      src: getImageUrl(src), 
      alt: alt || '图片预览',
      title: title || alt || '图片预览'
    });
    setImageScale(1);
    setImageRotation(0);
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
    if (e) e.stopPropagation();
    
    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}]$/g, "").trim();
    
    if (cleanedWord && /^[a-zA-Z'\-]+$/.test(cleanedWord) && cleanedWord.length >= 2) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
    }
  };

  // ========== 句子选择功能 ==========
  const handleSentenceSelect = (sentence, e) => {
    if (e) e.stopPropagation();
    if (onSentenceSelect) {
      onSentenceSelect(sentence);
    }
  };

  // ========== 将文本分割成句子 ==========
  const splitSentences = (text) => {
    if (!text) return [];
    
    const sentences = [];
    let currentSentence = '';
    let i = 0;
    
    while (i < text.length) {
      currentSentence += text[i];
      
      if (text[i] === '.' || text[i] === '!' || text[i] === '?' || text[i] === ',') {
        if (text[i] === '.') {
          const words = currentSentence.split(/\s+/);
          const lastWord = words[words.length - 1] || '';
          const commonAbbrs = ['mr', 'mrs', 'ms', 'dr', 'prof', 'rev', 'st', 'etc', 'vs', 'inc', 'ltd', 'co'];
          const wordWithoutDot = lastWord.slice(0, -1).toLowerCase();
          
          const nextChar = text[i + 1] || '';
          const isEndOfSentence = !commonAbbrs.includes(wordWithoutDot) && 
                                 (nextChar === ' ' && /[A-Z]/.test(text[i + 2] || ''));
          
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
    
    if (currentSentence.trim()) {
      sentences.push(currentSentence.trim());
    }
    
    if (sentences.length === 0 && text.trim()) {
      sentences.push(text.trim());
    }
    
    return sentences;
  };

  // ========== 渲染带悬浮句子选择按钮的文本 ==========
  const renderTextWithSentenceButtons = (text) => {
    if (!text) return null;
    
    const sentences = splitSentences(text);
    
    return (
      <Typography 
        variant="body1" 
        sx={{ 
          whiteSpace: 'pre-wrap', 
          lineHeight: 1.8, 
          fontSize: '1.1rem',
          position: 'relative'
        }}
      >
        {sentences.map((sentence, index) => (
          <Box
            key={`sentence-${index}`}
            component="span"
            sx={{
              display: 'inline',
              position: 'relative',
              '&:hover': {
                '& .sentence-add-button': {
                  opacity: 1,
                  visibility: 'visible',
                  transform: 'translate(-50%, -50%) scale(1)'
                }
              }
            }}
          >
            {/* 句子内容（可点击的单词） */}
            {renderClickableText(sentence, true)}
            
            {/* 句子选择按钮 - 绝对定位，悬浮在文本上方，不占用布局空间 */}
            <Tooltip title="选择这个句子">
              <IconButton
                className="sentence-add-button"
                size="small"
                onClick={(e) => handleSentenceSelect(sentence, e)}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: -12,
                  transform: 'translate(-50%, -50%) scale(0.8)',
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'opacity 0.2s, visibility 0.2s, transform 0.2s',
                  bgcolor: '#1a237e',
                  color: 'white',
                  width: 20,
                  height: 20,
                  zIndex: 10,
                  '&:hover': {
                    bgcolor: '#283593',
                    transform: 'translate(-50%, -50%) scale(1.1)'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: 14
                  }
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Typography>
    );
  };

  // ========== 渲染可点击的文本（原有功能） ==========
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
          title="点击翻译"
        >
          {word}
        </span>
      );
      
      lastIndex = match.index + word.length;
    }
    
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }
    
    return elements;
  };

  // ========== 格式化时间 ==========
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ========== 处理上一部分 ==========
  const handlePrevPart = () => {
    if (currentPart > 0) {
      setCurrentPart(currentPart - 1);
    }
  };

  // ========== 处理下一部分 ==========
  const handleNextPart = () => {
    if (passage?.content && currentPart < passage.content.length - 1) {
      setCurrentPart(currentPart + 1);
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

  const currentContent = passage.content?.[currentPart];
  const totalParts = passage.content?.length || 0;

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f5f5',
      overflow: 'hidden'
    }}>
      {/* ========== 固定的顶部导航栏 ========== */}
      <Paper 
        sx={{ 
          p: 1.5, 
          bgcolor: '#1a237e', 
          color: 'white',
          borderRadius: 0,
          boxShadow: 3,
          zIndex: 1100
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={3}>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={onBackToHome}
              sx={{ 
                borderRadius: 2, 
                borderColor: 'white', 
                color: 'white',
                '&:hover': {
                  borderColor: '#ffd700',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              首页
            </Button>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <BookIcon />
              <Typography variant="h6" noWrap>
                {passage.title || '阅读理解'}
              </Typography>
              <Chip 
                icon={<TimeIcon />} 
                label={formatTime(timeSpent)} 
                size="small" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
              />
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title="打开翻译器">
                <IconButton 
                  onClick={() => {
                    setTranslateWord('');
                    setShowTranslator(true);
                  }}
                  sx={{ 
                    color: 'white', 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <TranslateIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ========== 左右分栏主要内容 ========== */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        p: 2,
        gap: 2,
        overflow: 'hidden'
      }}>
        {/* ===== 左侧：图片区域 ===== */}
        <Paper 
          sx={{ 
            width: '45%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#f8f9fa',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ImageIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                插图 - 第 {currentPart + 1} 部分
              </Typography>
            </Box>
          </Box>

          <Box 
            sx={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              bgcolor: '#ffffff',
              cursor: currentContent?.image ? 'pointer' : 'default',
              position: 'relative',
              minHeight: 400
            }}
            onClick={() => {
              if (currentContent?.image) {
                handleImageClick(
                  currentContent.image, 
                  currentContent.alt, 
                  currentContent.title
                );
              }
            }}
          >
            {currentContent?.image ? (
              <>
                <img 
                  src={getImageUrl(currentContent.image)} 
                  alt={currentContent.alt || `Part ${currentPart + 1}`}
                  title={currentContent.title || currentContent.alt || `Part ${currentPart + 1}`}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
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
                    opacity: 0.8
                  }} 
                />
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <ImageIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                <Typography color="text.secondary">暂无图片</Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* ===== 右侧：文字区域 ===== */}
        <Paper 
          sx={{ 
            width: '55%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Part {currentPart + 1}
              </Typography>
              <Divider sx={{ flex: 1 }} />
              <Chip 
                label={`${currentPart + 1} / ${totalParts}`}
                size="small"
                color="primary"
              />
            </Box>
          </Box>

          {/* 文字内容 - 带悬浮句子选择按钮，不占用布局空间 */}
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            p: 3
          }}>
            {renderTextWithSentenceButtons(currentContent?.text || '暂无内容')}
          </Box>
        </Paper>
      </Box>

      {/* ========== 固定的底部导航栏 ========== */}
      <Paper 
        sx={{ 
          p: 1.5, 
          bgcolor: 'white',
          borderRadius: 0,
          borderTop: '1px solid #e0e0e0',
          boxShadow: 3,
          zIndex: 1100
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={3}>
            <Button
              fullWidth
              startIcon={<ArrowBackIcon />}
              onClick={handlePrevPart}
              disabled={currentPart === 0}
              variant="contained"
              sx={{ 
                bgcolor: currentPart === 0 ? '#e0e0e0' : '#1a237e',
                '&:hover': { 
                  bgcolor: currentPart === 0 ? '#e0e0e0' : '#283593' 
                }
              }}
            >
              上一部分
            </Button>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              justifyContent: 'center',
              overflow: 'auto'
            }}>
              {passage.content?.map((item, index) => (
                <Tooltip key={index} title={`第 ${index + 1} 部分`}>
                  <Button
                    size="small"
                    variant={currentPart === index ? "contained" : "outlined"}
                    onClick={() => setCurrentPart(index)}
                    sx={{
                      minWidth: 40,
                      height: 40,
                      bgcolor: currentPart === index ? '#1a237e' : 'transparent',
                      color: currentPart === index ? 'white' : '#1a237e',
                      borderColor: '#1a237e',
                      '&:hover': {
                        bgcolor: currentPart === index ? '#283593' : 'rgba(26,35,126,0.1)'
                      }
                    }}
                  >
                    {index + 1}
                  </Button>
                </Tooltip>
              ))}
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Button
              fullWidth
              endIcon={<ArrowForwardIcon />}
              onClick={handleNextPart}
              disabled={currentPart === totalParts - 1}
              variant="contained"
              sx={{ 
                bgcolor: currentPart === totalParts - 1 ? '#e0e0e0' : '#1a237e',
                '&:hover': { 
                  bgcolor: currentPart === totalParts - 1 ? '#e0e0e0' : '#283593' 
                }
              }}
            >
              下一部分
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={((currentPart + 1) / totalParts) * 100}
            sx={{ 
              height: 4, 
              borderRadius: 2,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#1a237e',
                borderRadius: 2
              }
            }}
          />
        </Box>
      </Paper>

      {/* ========== 悬浮的刷新按钮 ========== */}
      <Tooltip title="刷新">
        <Fab
          size="medium"
          onClick={onRefresh}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            bgcolor: '#ffd700',
            color: '#1a237e',
            '&:hover': { bgcolor: '#ffc107' },
            zIndex: 1200
          }}
        >
          <RefreshIcon />
        </Fab>
      </Tooltip>

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
        BackdropProps={{ timeout: 500 }}
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
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.95)'
            }}
          >
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
              <Paper sx={{ display: 'flex', gap: 0.5, p: 0.5 }}>
                <Tooltip title="缩小">
                  <IconButton onClick={handleZoomOut}>
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="放大">
                  <IconButton onClick={handleZoomIn}>
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="旋转">
                  <IconButton onClick={handleRotate}>
                    <RotateRightIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="重置">
                  <IconButton onClick={handleReset}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Paper>
              <IconButton onClick={handleCloseModal} sx={{ bgcolor: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4
              }}
            >
              <Box
                sx={{
                  transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                  transition: 'transform 0.2s ease',
                  maxWidth: '90%',
                  maxHeight: '90%'
                }}
              >
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  title={selectedImage.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default ReadingTest;