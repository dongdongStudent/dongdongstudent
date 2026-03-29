import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Grid,
  Collapse,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Badge,
  Zoom,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Lightbulb as LightbulbIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  EmojiEvents as EmojiEventsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  MenuBook as MenuBookIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Flag as FlagIcon,
  Psychology as PsychologyIcon,
  ViewSidebar as ViewSidebarIcon,
  Splitscreen as SplitscreenIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

const ClozeTestView = ({
  questions,
  currentIndex,
  currentQuestion,
  isConfirmed,
  answers,
  confirmedAnswers,
  showExplanation,
  practiceStats,
  progress,
  isFullscreen,
  onSetAnswers,
  onConfirm,
  onModify,
  onPrev,
  onNext,
  onSetCurrentIndex,
  onSubmit,
  onToggleFullscreen,
  checkAnswer,
  loading,
  bank,
  onSetShowExplanation
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentBlankIndex, setCurrentBlankIndex] = useState(0);
  const [blankConfirmed, setBlankConfirmed] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [answersPanelOpen, setAnswersPanelOpen] = useState(true);

  useEffect(() => {
    setCurrentBlankIndex(0);
    setBlankConfirmed({});
    if (onSetShowExplanation && currentQuestion) {
      onSetShowExplanation(prev => ({ ...prev, [currentQuestion.id]: false }));
    }
  }, [currentQuestion, onSetShowExplanation]);

  useEffect(() => {
    const blanks = currentQuestion?.blanks || [];
    window.handleBlankClick = (blank) => {
      const index = blanks.indexOf(blank);
      if (index !== -1) {
        setCurrentBlankIndex(index);
      }
    };
    return () => {
      delete window.handleBlankClick;
    };
  }, [currentQuestion]);

  const allBlanksConfirmed = currentQuestion?.blanks?.every(blank => blankConfirmed[blank]) || false;

  useEffect(() => {
    if (allBlanksConfirmed && !isConfirmed && currentQuestion) {
      onConfirm();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  }, [allBlanksConfirmed, isConfirmed, currentQuestion, onConfirm]);

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

  if (questions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card sx={{ maxWidth: 500, p: 3, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <MenuBookIcon sx={{ fontSize: 80, color: '#1a237e', mb: 2, opacity: 0.5 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, color: '#1a237e' }}>
            暂无阅读题目
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            点击下方按钮开始您的七选五练习之旅
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<SchoolIcon />}
            sx={{ 
              bgcolor: '#1a237e',
              '&:hover': { bgcolor: '#283593' },
              px: 4,
              py: 1.5
            }}
          >
            开始练习
          </Button>
        </Card>
      </Box>
    );
  }

  const currentAnswers = answers[currentQuestion?.id] || {};
  const blanks = currentQuestion?.blanks || [];
  const currentBlank = blanks[currentBlankIndex];
  const isBlankConfirmed = blankConfirmed[currentBlank] || false;
  const currentBlankAnswer = currentAnswers[currentBlank] || '';

  // 处理文章内容，实现首行缩进和减小段落间距
  const formatContent = (content) => {
    if (!content) return '';
    
    // 按段落分割
    const paragraphs = content.split('\n\n');
    
    // 处理每个段落
    const formattedParagraphs = paragraphs.map(para => {
      if (!para.trim()) return '';
      
      // 处理段落中的空格占位
      let processedPara = para;
      blanks.forEach(blank => {
        const pattern = new RegExp(`___${blank}___`, 'g');
        const isCurrent = blank === currentBlank;
        const isAnswered = currentAnswers[blank];
        
        let bgColor, borderColor, textColor;
        
        if (isCurrent) {
          bgColor = '#fff8e1';
          borderColor = '#ffb300';
          textColor = '#1a237e';
        } else if (isAnswered) {
          bgColor = '#e8f5e9';
          borderColor = '#4caf50';
          textColor = '#2e7d32';
        } else {
          bgColor = '#f5f5f5';
          borderColor = '#bdbdbd';
          textColor = '#757575';
        }
        
        const replacement = `<span style="
          display: inline-block;
          padding: 2px 8px;
          margin: 0 2px;
          border-radius: 12px;
          background: ${bgColor};
          border: 2px solid ${borderColor};
          color: ${textColor};
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        " onclick="window.handleBlankClick('${blank}')"
        onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'"
        onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'">${blank}</span>`;
        
        processedPara = processedPara.replace(pattern, replacement);
      });
      
      // 返回带缩进的段落
      return `<p style="
        text-indent: 2em;
        margin: 0 0 8px 0;
        line-height: 1.6;
      ">${processedPara}</p>`;
    });
    
    return formattedParagraphs.join('');
  };

  const getUsedOptions = () => {
    const used = new Set();
    blanks.forEach(blank => {
      if (blank !== currentBlank && currentAnswers[blank]) {
        used.add(currentAnswers[blank]);
      }
    });
    return used;
  };

  const usedOptions = getUsedOptions();

  const handleOptionSelect = (optionKey) => {
    if (isBlankConfirmed) return;
    if (usedOptions.has(optionKey)) return;
    onSetAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        [currentBlank]: optionKey
      }
    }));
  };

  const handleConfirmBlank = () => {
    if (!currentBlankAnswer) return;
    setBlankConfirmed(prev => ({ ...prev, [currentBlank]: true }));
  };

  const handleModifyBlank = () => {
    setBlankConfirmed(prev => ({ ...prev, [currentBlank]: false }));
  };

  const handleNextBlank = () => {
    if (currentBlankIndex < blanks.length - 1) {
      setCurrentBlankIndex(prev => prev + 1);
    }
  };

  const handlePrevBlank = () => {
    if (currentBlankIndex > 0) {
      setCurrentBlankIndex(prev => prev - 1);
    }
  };

  // 点击空格圆点直接跳转
  const handleBlankClick = (index) => {
    setCurrentBlankIndex(index);
  };

  const getQuestionStatus = (index) => {
    const q = questions[index];
    if (!q) return 'pending';
    if (confirmedAnswers[q.id]) {
      const isCorrect = checkAnswer(q, answers[q.id] || {});
      return isCorrect ? 'correct' : 'wrong';
    }
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const handleSubmitClick = () => {
    const questionIds = questions.map(q => q.id);
    const answerValues = questions.map(q => answers[q.id] || {});
    onSubmit({ questionIds, answers: answerValues, timeSpent: 0, bank });
  };

  const toggleExplanation = () => {
    onSetShowExplanation(prev => ({ 
      ...prev, 
      [currentQuestion.id]: !prev[currentQuestion.id] 
    }));
  };

  const toggleAnswersPanel = () => {
    setAnswersPanelOpen(prev => !prev);
  };

  // 精简后的答案区
  const renderAnswersContent = () => (
    <Box>
      {/* 当前空格标题 - 精简 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon sx={{ color: '#ffb300', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            空格 {currentBlank}
          </Typography>
        </Box>
        <Chip 
          label={`${currentBlankIndex + 1}/${blanks.length}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* 选项列表 - 精简卡片 */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {currentQuestion.options?.map((opt) => {
          const isUsed = usedOptions.has(opt.key);
          const isSelected = currentBlankAnswer === opt.key;
          
          return (
            <Grid item xs={12} sm={6} key={opt.key}>
              <Paper
                onClick={() => !isUsed && !isBlankConfirmed && handleOptionSelect(opt.key)}
                sx={{
                  p: 1.5,
                  bgcolor: isSelected ? '#e8f5e9' : isUsed ? '#ffebee' : '#ffffff',
                  border: '2px solid',
                  borderColor: isSelected ? '#4caf50' : isUsed ? '#ef5350' : '#e0e0e0',
                  borderRadius: 1.5,
                  cursor: isUsed || isBlankConfirmed ? 'not-allowed' : 'pointer',
                  opacity: isUsed ? 0.6 : 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: !isUsed && !isBlankConfirmed ? 'translateY(-2px)' : 'none',
                    boxShadow: !isUsed && !isBlankConfirmed ? 2 : 0
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: isSelected ? '#4caf50' : isUsed ? '#ef5350' : '#1a237e',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {opt.key}
                  </Avatar>
                  <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                    {opt.text}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* 确认/修改按钮 - 精简 */}
      {isBlankConfirmed ? (
        <Paper 
          sx={{ 
            p: 1.5, 
            mb: 2,
            bgcolor: alpha('#4caf50', 0.1),
            border: '1px solid #4caf50',
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon color="success" sx={{ fontSize: 18 }} />
            <Typography variant="body2">
              已选 <strong>{currentBlankAnswer}</strong>
            </Typography>
          </Box>
          <Button
            size="small"
            color="warning"
            onClick={handleModifyBlank}
          >
            修改
          </Button>
        </Paper>
      ) : (
        <Button
          fullWidth
          variant="contained"
          size="medium"
          onClick={handleConfirmBlank}
          disabled={!currentBlankAnswer}
          sx={{ mb: 2, bgcolor: '#1a237e' }}
        >
          确认
        </Button>
      )}

      {/* 空格导航 - 精简 */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          onClick={handlePrevBlank}
          disabled={currentBlankIndex === 0}
          startIcon={<NavigateBeforeIcon />}
        >
          上一个
        </Button>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          onClick={handleNextBlank}
          disabled={currentBlankIndex === blanks.length - 1 || !isBlankConfirmed}
          endIcon={<NavigateNextIcon />}
        >
          下一个
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', position: 'relative', px: { xs: 1, sm: 2 } }}>
      {/* 庆祝动画 */}
      <Zoom in={showCelebration} unmountOnExit>
        <Paper
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            p: 2,
            bgcolor: 'success.main',
            color: 'white',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
            textAlign: 'center'
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 40, mb: 0.5 }} />
          <Typography variant="h6">恭喜完成！</Typography>
        </Paper>
      </Zoom>

      {/* 头部 - 精简 */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 1.5, 
          mb: 2, 
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon sx={{ fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>七选五</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`${practiceStats.answered}/${practiceStats.total}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', height: 24 }}
            />
            <IconButton size="small" onClick={onToggleFullscreen} sx={{ color: 'white', p: 0.5 }}>
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>

        {/* 进度条 - 精简 */}
        <Box sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
          <Box sx={{ width: `${progress}%`, height: 4, bgcolor: '#ffd700', borderRadius: 2 }} />
        </Box>
      </Paper>

      {/* 左右分栏 */}
      {currentQuestion && (
        <Box 
          id="split-container"
          sx={{ 
            display: 'flex',
            position: 'relative',
            minHeight: 'calc(100vh - 250px)',
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          {/* 左侧 - 文章区 */}
          <Box
            sx={{
              width: isMobile ? '100%' : `${leftWidth}%`,
              overflow: 'auto',
              bgcolor: 'white',
              p: 2
            }}
          >
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
              {/* 文章内容 - 首行缩进，段落间距8px */}
              <Box 
                sx={{ 
                  '& p': {
                    margin: '0 0 8px 0',
                    textIndent: '2em',
                    lineHeight: 1.6
                  }
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: formatContent(currentQuestion.content) }} />
              </Box>
            </Paper>

            {/* 空格进度 - 点击跳转 */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
              {blanks.map((blank, index) => {
                const isCurrent = index === currentBlankIndex;
                const isCompleted = blankConfirmed[blank];
                const selected = currentAnswers[blank];
                
                return (
                  <Tooltip key={blank} title={`点击回答空格 ${blank}`}>
                    <Badge
                      badgeContent={selected || ''}
                      color={isCompleted ? 'success' : 'default'}
                      invisible={!selected}
                    >
                      <Box
                        onClick={() => handleBlankClick(index)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: isCurrent ? '#ffd700' : isCompleted ? '#4caf50' : '#e0e0e0',
                          color: isCurrent ? '#1a237e' : isCompleted ? 'white' : '#757575',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          border: isCurrent ? '3px solid #1a237e' : '2px solid',
                          borderColor: isCurrent ? '#1a237e' : isCompleted ? '#4caf50' : '#bdbdbd',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }
                        }}
                      >
                        {blank}
                      </Box>
                    </Badge>
                  </Tooltip>
                );
              })}
            </Box>

            {/* 提示文字 */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              点击上方圆点可直接跳转到对应空格
            </Typography>
          </Box>

          {/* 分割线 */}
          {!isMobile && (
            <Box
              sx={{
                width: '4px',
                cursor: 'col-resize',
                bgcolor: isDragging ? '#ffb300' : '#e0e0e0',
                '&:hover': { bgcolor: '#ffb300' }
              }}
              onMouseDown={() => setIsDragging(true)}
            />
          )}

          {/* 右侧 - 精简答案区 */}
          {(!isMobile || answersPanelOpen) && (
            <Box
              sx={{
                width: isMobile ? '100%' : `${100 - leftWidth}%`,
                overflow: 'auto',
                bgcolor: '#f8f9fa',
                p: 2
              }}
            >
              {renderAnswersContent()}
            </Box>
          )}

          {/* 移动端展开按钮 */}
          {isMobile && !answersPanelOpen && (
            <IconButton
              sx={{
                position: 'fixed',
                right: 16,
                bottom: 16,
                bgcolor: '#ffb300',
                color: '#1a237e'
              }}
              onClick={toggleAnswersPanel}
            >
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>
      )}

      {/* 解析 - 精简 */}
      {currentQuestion && isConfirmed && (
        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<LightbulbIcon />}
            onClick={toggleExplanation}
            sx={{ mb: 1, borderColor: '#ffb300', color: '#ff8f00' }}
          >
            {showExplanation[currentQuestion.id] ? '隐藏' : '查看'}解析
          </Button>

          <Collapse in={showExplanation[currentQuestion.id]}>
            <Paper sx={{ p: 2, bgcolor: '#fff8e1', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>{currentQuestion.explanation}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(currentQuestion.correctAnswers || {}).map(([blank, ans]) => {
                  const userAns = currentAnswers[blank];
                  const isCorrect = userAns === ans;
                  return (
                    <Chip
                      key={blank}
                      size="small"
                      label={`${blank}: ${ans}${userAns ? ` (您:${userAns})` : ''}`}
                      color={isCorrect ? 'success' : 'error'}
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </Paper>
          </Collapse>
        </Box>
      )}

      {/* 底部导航 - 精简 */}
      <Paper sx={{ p: 1, mt: 2, display: 'flex', gap: 1 }}>
        <Button size="small" fullWidth variant="outlined" onClick={onPrev} disabled={currentIndex === 0}>
          上一篇
        </Button>
        <Button size="small" fullWidth variant="outlined" onClick={onNext} disabled={currentIndex === questions.length - 1 || !isConfirmed}>
          下一篇
        </Button>
      </Paper>

      {/* 提交按钮 */}
      {practiceStats.answered === practiceStats.total && practiceStats.total > 0 && (
        <Button
          fullWidth
          variant="contained"
          color="success"
          size="large"
          onClick={handleSubmitClick}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? '提交中...' : `提交 (正确率 ${practiceStats.accuracy}%)`}
        </Button>
      )}
    </Box>
  );
};

export default ClozeTestView;