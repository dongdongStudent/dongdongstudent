import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Fade,
  useTheme,
  useMediaQuery,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Stack,
  Card,
  CardContent,
  Zoom,
  LinearProgress
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Cancel,
  Lightbulb,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Translate as TranslateIcon,
  Send as SendIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import passageClozeApi from './api';
import WordTranslator from '../translator/translator.js';

const PassageClozeTest = ({ 
  passageData = null,
  loading = false,
  error = null,
  onRefresh,
  onAnswerChange,
  onSubmit,
  readOnly = false,
  externalAnswers = {},
  externalExplanations = {},
  fullscreen = false,
  onFullscreenToggle,
  confirmedAnswers = {},
  onConfirmAnswer,
  dataSource = 'default',
  G_word_name = 'word_english_test_study',
  getToken
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 内部状态管理
  const [answers, setAnswers] = useState(externalAnswers);
  const [explanations, setExplanations] = useState(externalExplanations);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showExplanations, setShowExplanations] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [fetchingExplanation, setFetchingExplanation] = useState(false);
  const [activeBlank, setActiveBlank] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState({});
  
  // 翻译相关状态
  const [showTranslator, setShowTranslator] = useState(false);
  const [translateWord, setTranslateWord] = useState('');
  
  const containerRef = useRef(null);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenStatus = !!document.fullscreenElement;
      setIsFullscreen(fullscreenStatus);
      if (onFullscreenToggle) {
        onFullscreenToggle(fullscreenStatus);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onFullscreenToggle]);

  useEffect(() => {
    setIsFullscreen(fullscreen);
  }, [fullscreen]);

  useEffect(() => {
    setAnswers(externalAnswers);
  }, [externalAnswers]);

  useEffect(() => {
    setExplanations(externalExplanations);
  }, [externalExplanations]);

  // ========== 计算已使用的单词 ==========
  const usedWords = useMemo(() => {
    if (!passageData?.givenWords) return [];
    
    // 获取所有已填写的答案（非空）
    const filledAnswers = Object.values(answers).filter(ans => ans && ans.trim() !== '');
    
    // 找出在 givenWords 中且已被使用的单词
    return passageData.givenWords.filter(word => 
      filledAnswers.some(ans => ans.toLowerCase().trim() === word.toLowerCase().trim())
    );
  }, [answers, passageData?.givenWords]);

  // ========== 单词点击翻译功能 ==========
  const handleWordClick = (word, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}]$/g, "").trim();
    
    if (cleanedWord && /^[a-zA-Z'\-]+$/.test(cleanedWord) && cleanedWord.length >= 2) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
    }
  };

  // 渲染可点击的文本 - 移除了点状下划线
  const renderClickableText = (text, stopPropagation = true) => {
    if (!text) return text;
    
    const parts = text.split(/(\b[a-zA-Z'\-]+\b)/g);
    
    return parts.map((part, index) => {
      if (/^[a-zA-Z'\-]+$/.test(part) && part.length >= 2) {
        return (
          <span
            key={index}
            style={{
              cursor: 'pointer',
              color: '#1a237e',
              fontWeight: 500,
              padding: '0 2px',
              borderRadius: '4px',
              transition: 'all 0.2s',
              display: 'inline-block'
            }}
            onClick={(e) => {
              if (stopPropagation) {
                e.stopPropagation();
              }
              handleWordClick(part, e);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(26, 35, 126, 0.1)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="点击翻译"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // 处理答案变更
  const handleAnswerChange = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    if (onAnswerChange) {
      onAnswerChange(questionId, value, newAnswers);
    }
  };

  // 提交所有答案
  const handleSubmit = async () => {
    if (!passageData) return;
    
    // 检查是否所有题目都已作答
    const unanswered = passageData.questions.filter(q => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      setSnackbar({
        open: true,
        message: `还有 ${unanswered.length} 个空格未填写`,
        severity: 'warning'
      });
      return;
    }
    
    setSubmitLoading(true);
    
    try {
      const timeSpent = 60;
      
      if (onSubmit) {
        // 计算每道题的对错
        const resultMap = {};
        let correct = 0;
        
        passageData.questions.forEach(q => {
          const userAnswer = answers[q.id]?.toLowerCase().trim() || '';
          const correctAnswer = explanations[q.id]?.correct?.toLowerCase().trim() || '';
          const isCorrect = userAnswer === correctAnswer;
          
          resultMap[q.id] = {
            isCorrect,
            userAnswer: answers[q.id],
            correctAnswer: explanations[q.id]?.correct
          };
          
          if (isCorrect) correct++;
        });
        
        setResults(resultMap);
        
        const total = passageData.questions.length;
        const accuracy = Math.round((correct / total) * 100);
        
        const result = await onSubmit(answers, timeSpent, { total, correct, accuracy });
        
        if (result && result.success) {
          setSnackbar({
            open: true,
            message: result.message || `提交成功！正确率: ${accuracy}% (${correct}/${total})`,
            severity: 'success'
          });
        }
        
        // 提交后自动显示所有解析
        const allExplanations = {};
        passageData.questions.forEach(q => {
          allExplanations[q.id] = true;
        });
        setShowExplanations(allExplanations);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('提交失败:', error);
      setSnackbar({
        open: true,
        message: '提交失败：' + (error.message || '未知错误'),
        severity: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // 切换解析显示
  const toggleExplanation = (questionId) => {
    setShowExplanations(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // 切换全屏
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('全屏切换失败:', error);
      setSnackbar({
        open: true,
        message: '全屏切换失败',
        severity: 'error'
      });
    }
  };

  // 渲染文章内容，将填空替换为输入框（React组件方式）
  const renderContentWithBlanks = () => {
    if (!passageData) {
      return <Typography variant="body1">文章数据加载中...</Typography>;
    }

    // 如果没有 content，但有 questions，则构建一个简单的文章内容
    if (!passageData.content && passageData.questions && passageData.questions.length > 0) {
      const sortedQuestions = [...passageData.questions].sort((a, b) => a.number - b.number);
      const simpleContent = sortedQuestions.map(q => q.sentence).join('\n\n');
      passageData.content = simpleContent;
    }

    if (!passageData.content) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            文章内容为空
          </Typography>
        </Box>
      );
    }

    if (!passageData.questions || !Array.isArray(passageData.questions)) {
      return <Typography variant="body1">题目数据加载中...</Typography>;
    }

    const sortedQuestions = [...passageData.questions].sort((a, b) => a.number - b.number);
    let content = passageData.content;
    
    // 按段落分割内容
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, paraIdx) => {
      const paragraphParts = [];
      let paraLastIndex = 0;
      
      // 在段落开头添加缩进占位符 - 所有段落都添加，实现首行空两格
      paragraphParts.push(
        <span key={`para-${paraIdx}-indent`} style={{ display: 'inline-block', width: '2em' }}>&nbsp;</span>
      );

      // 处理当前段落中的填空
      sortedQuestions.forEach((q, qIdx) => {
        // 多种可能的填空模式
        const patterns = [
          `___${q.number}___`,           // 格式: ___1___
          `______${q.number}______`,      // 格式: ______1______
          `___ ${q.number} ___`,          // 格式: ___ 1 ___
          `______ ${q.number} ______`,    // 格式: ______ 1 ______
          new RegExp(`_{3,}\\s*${q.number}\\s*_{3,}`) // 正则匹配：任意数量下划线 + 空格 + 数字 + 空格 + 任意数量下划线
        ];
        
        let index = -1;
        let matchedPattern = null;
        
        // 尝试每种模式
        for (const pattern of patterns) {
          if (typeof pattern === 'string') {
            index = paragraph.indexOf(pattern, paraLastIndex);
            if (index !== -1) {
              matchedPattern = pattern;
              break;
            }
          } else {
            // 正则表达式
            const regex = new RegExp(pattern.source, 'g');
            regex.lastIndex = paraLastIndex;
            const match = regex.exec(paragraph);
            if (match) {
              index = match.index;
              matchedPattern = match[0];
              break;
            }
          }
        }
        
        if (index !== -1) {
          // 添加填空前的文本
          if (index > paraLastIndex) {
            const textBefore = paragraph.substring(paraLastIndex, index);
            if (textBefore) {
              paragraphParts.push(
                <span key={`para-${paraIdx}-text-${qIdx}-pre`}>
                  {renderClickableText(textBefore)}
                </span>
              );
            }
          }

          // 找到匹配的模式长度
          const patternLength = matchedPattern ? matchedPattern.length : `___${q.number}___`.length;

          // 添加填空组件
          const answer = answers[q.id] || '';
          const isActive = activeBlank === q.id;
          const result = results[q.id];
          const isSubmitted = submitted;
          const hasAnswer = answer.trim() !== '';
          
          // 根据状态决定输入框样式
          let borderColor = '#1a237e';
          let bgColor = '#fff';
          let textColor = 'inherit';
          
          if (isSubmitted && result) {
            borderColor = result.isCorrect ? '#4caf50' : '#f44336';
            bgColor = result.isCorrect ? '#e8f5e9' : '#ffebee';
            textColor = result.isCorrect ? '#2e7d32' : '#c62828';
          } else if (hasAnswer) {
            borderColor = '#4caf50';
            bgColor = '#e8f5e9';
            textColor = '#2e7d32';
          } else if (isActive) {
            borderColor = '#ffd700';
            bgColor = '#fff8e1';
          } else {
            borderColor = '#bdbdbd';
            bgColor = '#f5f5f5';
            textColor = '#9e9e9e';
          }

          paragraphParts.push(
            <Box
              key={`para-${paraIdx}-blank-${q.id}`}
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                mx: 0.5,
                my: 0.5,
                verticalAlign: 'middle',
                position: 'relative',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s'
              }}
            >
              <TextField
                size="small"
                placeholder={`${q.number}`}
                value={answer}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                disabled={submitted}
                onFocus={() => !submitted && setActiveBlank(q.id)}
                onBlur={() => setActiveBlank(null)}
                sx={{
                  width: 80,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: bgColor,
                    transition: 'all 0.2s',
                    '& fieldset': {
                      borderColor: borderColor,
                      borderWidth: isSubmitted ? 2 : (hasAnswer ? 2 : (isActive ? 2 : 1)),
                    },
                    '&:hover fieldset': {
                      borderColor: isSubmitted ? borderColor : (hasAnswer ? '#4caf50' : '#1a237e'),
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'center',
                    fontWeight: isSubmitted ? 600 : (hasAnswer ? 600 : 400),
                    color: textColor
                  }
                }}
              />
              
              {isSubmitted && result && (
                <Box sx={{ ml: 0.5, display: 'inline-flex' }}>
                  {result.isCorrect ? (
                    <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                  ) : (
                    <Cancel sx={{ color: '#f44336', fontSize: 20 }} />
                  )}
                </Box>
              )}
            </Box>
          );

          paraLastIndex = index + patternLength;
        }
      });

      // 添加段落剩余文本
      if (paraLastIndex < paragraph.length) {
        const remainingText = paragraph.substring(paraLastIndex);
        if (remainingText) {
          paragraphParts.push(
            <span key={`para-${paraIdx}-last`}>
              {renderClickableText(remainingText)}
            </span>
          );
        }
      }

      // 返回段落
      return (
        <Typography 
          key={`paragraph-${paraIdx}`}
          variant="body1" 
          paragraph
          sx={{ 
            lineHeight: 2.2,
            fontSize: '1.1rem',
            color: '#2c3e50',
            marginBottom: '1rem'
          }}
        >
          {paragraphParts}
        </Typography>
      );
    });
  };

  // 计算统计
  const stats = useMemo(() => {
    if (!passageData?.questions) {
      return { total: 0, answered: 0, correct: 0 };
    }
    const total = passageData.questions.length;
    const answered = Object.keys(answers).filter(id => answers[id]?.trim()).length;
    let correct = 0;
    
    if (submitted) {
      passageData.questions.forEach(q => {
        if (results[q.id]?.isCorrect) {
          correct++;
        }
      });
    }
    
    return { total, answered, correct };
  }, [passageData, answers, results, submitted]);

  const progress = stats.total > 0 ? (stats.answered / stats.total) * 100 : 0;

  if (loading) {
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
          <Button variant="contained" onClick={onRefresh} startIcon={<Refresh />}>
            重试
          </Button>
        )}
      </Box>
    );
  }

  if (!passageData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Alert severity="info">暂无文章</Alert>
        {onRefresh && (
          <Button variant="contained" onClick={onRefresh} startIcon={<Refresh />} sx={{ mt: 2 }}>
            加载
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f8f9fa',
        position: 'relative'
      }}
    >
      {/* 头部 */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 2, 
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          borderRadius: 0
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {passageData.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              size="small" 
              label={`${stats.answered}/${stats.total}`} 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
            />
            {submitted && stats.correct > 0 && (
              <Chip 
                size="small" 
                label={`✓ ${stats.correct}`} 
                sx={{ bgcolor: '#4caf50', color: 'white' }} 
              />
            )}
            <Tooltip title="打开翻译器">
              <IconButton 
                size="small" 
                onClick={() => {
                  setTranslateWord('');
                  setShowTranslator(true);
                }}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <TranslateIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
              <IconButton size="small" onClick={toggleFullscreen} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 所给词 - 根据是否已使用改变颜色 */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mb: 2, 
            bgcolor: 'rgba(255,255,255,0.1)',
            borderColor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            所给词
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {passageData.givenWords?.map((word, idx) => {
              const isUsed = usedWords.some(w => w.toLowerCase().trim() === word.toLowerCase().trim());
              
              return (
                <Chip
                  key={idx}
                  label={word}
                  size="small"
                  sx={{ 
                    bgcolor: isUsed ? 'rgba(255,255,255,0.05)' : 'rgba(255,215,0,0.15)',
                    color: isUsed ? 'rgba(255,255,255,0.3)' : '#ffd700',
                    border: '1px solid',
                    borderColor: isUsed ? 'rgba(255,255,255,0.1)' : 'rgba(255,215,0,0.3)',
                    fontWeight: isUsed ? 400 : 600,
                    opacity: isUsed ? 0.6 : 1,
                    '& .MuiChip-label': {
                      px: 2
                    }
                  }}
                />
              );
            })}
          </Box>
        </Paper>

        {/* 进度信息 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            答题进度
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {stats.answered}/{stats.total} 题 {submitted && `• 正确 ${stats.correct} 题`}
          </Typography>
        </Box>

        {/* 进度条 */}
        <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 4 }}>
          <Box 
            sx={{ 
              width: `${progress}%`, 
              height: 8, 
              background: 'linear-gradient(90deg, #ffd700 0%, #ffb300 100%)',
              borderRadius: 4,
              transition: 'width 0.3s ease'
            }} 
          />
        </Box>
      </Paper>

      {/* 文章内容 */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 2 }}>
        <Card 
          elevation={2}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {renderContentWithBlanks()}
          </CardContent>
        </Card>

        {/* 解析区域 - 提交后显示 */}
        {submitted && passageData.questions.map((q) => {
          if (!showExplanations[q.id] || !explanations[q.id]) return null;
          
          const result = results[q.id];
          const isCorrect = result?.isCorrect;
          
          return (
            <Zoom in={true} key={q.id}>
              <Paper 
                sx={{ 
                  p: 3, 
                  mt: 2, 
                  bgcolor: isCorrect ? '#e8f5e9' : '#fff3e0',
                  borderLeft: '4px solid',
                  borderColor: isCorrect ? '#4caf50' : '#ff9800',
                  borderRadius: 1,
                  position: 'relative'
                }}
              >
                <IconButton 
                  size="small" 
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => toggleExplanation(q.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PsychologyIcon sx={{ color: isCorrect ? '#4caf50' : '#ff9800' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isCorrect ? '#2e7d32' : '#ef6c00' }}>
                    第 {q.number} 题解析
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#2c3e50' }}>
                  {renderClickableText(explanations[q.id].explanation)}
                </Typography>

                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: isCorrect ? '#a5d6a7' : '#ffb74d' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    您的答案: <span style={{ color: isCorrect ? '#2e7d32' : '#c62828' }}>{result?.userAnswer || '未作答'}</span>
                  </Typography>
                  {!isCorrect && (
                    <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 500, mt: 0.5 }}>
                      正确答案: {result?.correctAnswer}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Zoom>
          );
        })}

        {/* 提交按钮 - 只要所有题都填写了就显示 */}
        {!submitted && stats.answered === stats.total && stats.total > 0 && (
          <Fade in={true}>
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleSubmit}
                disabled={submitLoading}
                startIcon={submitLoading ? <CircularProgress size={20} /> : <SendIcon />}
                sx={{ 
                  px: 6, 
                  py: 1.8,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                  }
                }}
              >
                {submitLoading ? '提交中...' : '提交答案'}
              </Button>
            </Box>
          </Fade>
        )}

        {/* 提示还有未填写的题目 */}
        {!submitted && stats.answered < stats.total && stats.total > 0 && (
          <Paper sx={{ p: 2, mt: 3, bgcolor: '#fff3e0', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#ed6c02' }}>
              ⚠️ 还有 {stats.total - stats.answered} 个空格未填写
            </Typography>
          </Paper>
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
      </Container>

      {/* 翻译组件 */}
      <WordTranslator
        open={showTranslator}
        onClose={() => setShowTranslator(false)}
        word={translateWord}
        G_word_name={G_word_name}
        getToken={getToken}
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={2000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, boxShadow: 3 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PassageClozeTest;