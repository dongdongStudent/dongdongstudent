import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Fade,
  useTheme,
  useMediaQuery,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Cancel,
  NavigateBefore,
  NavigateNext,
  Lightbulb,
  Lock,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { clozeApi } from './api.js';
import WordTranslator from '../translator/index.js';
import "./cloze_test.css"

const ClozeTestSimple = ({ 
  passageData = null,
  loading = false,
  error = null,
  onRefresh,
  onAnswerChange,
  onSubmit,
  onQuestionClick,
  readOnly = false,
  externalAnswers = {},
  externalExplanations = {},
  initialQuestionIndex = 0,
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
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // 内部状态管理
  const [answers, setAnswers] = useState(externalAnswers);
  const [explanations, setExplanations] = useState(externalExplanations);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [fetchingExplanation, setFetchingExplanation] = useState(false);
  
  // 翻译相关状态
  const [showTranslator, setShowTranslator] = useState(false);
  const [translateWord, setTranslateWord] = useState('');
  
  const contentRef = useRef(null);
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

  // 当外部fullscreen属性变化时更新内部状态
  useEffect(() => {
    setIsFullscreen(fullscreen);
  }, [fullscreen]);

  // 根据屏幕大小计算选项列数
  const getOptionColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return currentQuestion?.options.length === 3 ? 3 : 2;
  };

  // 当外部数据变化时更新内部状态
  useEffect(() => {
    setAnswers(externalAnswers);
  }, [externalAnswers]);

  useEffect(() => {
    setExplanations(externalExplanations);
  }, [externalExplanations]);

  useEffect(() => {
    setCurrentQuestionIndex(initialQuestionIndex);
  }, [initialQuestionIndex]);

  // 组件加载时预获取所有题目的解析
  useEffect(() => {
    if (passageData && Object.keys(explanations).length === 0 && !fetchingExplanation) {
      fetchAllExplanations();
    }
  }, [passageData]);

  // ========== 单词点击翻译功能 ==========
  const handleWordClick = (word, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    // 清理单词：去掉标点符号，只保留单词本身
    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}]$/g, "").trim();
    
    // 验证是否是有效的英文单词
    if (cleanedWord && /^[a-zA-Z'\-]+$/.test(cleanedWord) && cleanedWord.length >= 2) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
    }
  };

  // 渲染可点击的文本
  const renderClickableText = (text, stopPropagation = true) => {
    if (!text) return text;
    
    // 使用正则表达式分割文本，将单词分离出来
    const parts = text.split(/(\b[a-zA-Z'\-]+\b)/g);
    
    return parts.map((part, index) => {
      // 判断是否是英文单词（长度>=2，只包含字母、连字符和撇号）
      if (/^[a-zA-Z'\-]+$/.test(part) && part.length >= 2) {
        // 为每个单词添加点击事件，显示下划线样式
        return (
          <span
            key={index}
            className="clickable-word"
            onClick={(e) => {
              if (stopPropagation) {
                e.stopPropagation();
              }
              handleWordClick(part, e);
            }}
            title="点击翻译"
          >
            {part}
          </span>
        );
      }
      return part; // 非单词部分直接返回
    });
  };

  // 预获取所有题目的解析
  const fetchAllExplanations = async () => {
    if (!passageData) return;
    
    setFetchingExplanation(true);
    try {
      const response = await clozeApi.getPassageDetails(passageData.id, dataSource);
      if (response?.flag === 1) {
        const explanationsMap = {};
        response.content.passage.questions.forEach(q => {
          explanationsMap[q.id] = {
            correct: q.correct,
            explanation: q.explanation
          };
        });
        setExplanations(explanationsMap);
        
        // 如果有解析，自动显示解析
        setShowExplanation(true);
      }
    } catch (error) {
      console.error('预获取解析失败:', error);
    } finally {
      setFetchingExplanation(false);
    }
  };

  // 获取单个题目的解析
  const fetchQuestionExplanation = async (questionId) => {
    if (!passageData) return null;
    
    try {
      const response = await clozeApi.getPassageDetails(passageData.id, dataSource);
      if (response?.flag === 1) {
        const fullQuestion = response.content.passage.questions.find(q => q.id === questionId);
        if (fullQuestion) {
          setExplanations(prev => ({
            ...prev,
            [questionId]: {
              correct: fullQuestion.correct,
              explanation: fullQuestion.explanation
            }
          }));
          
          // 自动显示解析
          setShowExplanation(true);
          
          return fullQuestion;
        }
      }
    } catch (error) {
      console.error('获取解析失败:', error);
    }
    return null;
  };

  // 计算答题统计
  const stats = useMemo(() => {
    if (!passageData?.questions) {
      return { total: 0, answered: 0, correct: 0, incorrect: 0 };
    }
    const total = passageData.questions.length;
    const answered = Object.keys(confirmedAnswers).length;
    let correct = 0;
    let incorrect = 0;
    
    passageData.questions.forEach(q => {
      if (confirmedAnswers[q.id] && explanations[q.id]) {
        if (answers[q.id] === explanations[q.id].correct) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });
    
    return { total, answered, correct, incorrect };
  }, [passageData, confirmedAnswers, answers, explanations]);

  // 处理答案选择 - 点击后锁定答案并显示解析
  const handleAnswerSelect = (questionId, value) => {
    if (readOnly) return;
    
    // 如果题目已经锁定，不处理
    if (confirmedAnswers[questionId]) {
      return;
    }
    
    // 【步骤1】立即更新本地答案状态
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // 【步骤2】立即通知父组件锁定答案
    if (onConfirmAnswer) {
      onConfirmAnswer(questionId);
    }
    
    // 【步骤3】通知父组件答案变更
    if (onAnswerChange) {
      onAnswerChange(questionId, value, newAnswers);
    }
    
    // 【步骤4】自动显示解析
    setShowExplanation(true);
    
    // 【步骤5】如果有解析，立即显示对错反馈
    if (explanations[questionId]) {
      const isCorrect = value === explanations[questionId].correct;
      setSnackbar({
        open: true,
        message: isCorrect ? '✓ 回答正确！' : '✗ 回答错误',
        severity: isCorrect ? 'success' : 'error'
      });
    } else {
      // 如果没有解析，先显示答案已锁定
      setSnackbar({
        open: true,
        message: '答案已锁定',
        severity: 'info'
      });
      
      // 异步获取解析（不影响UI锁定）
      fetchQuestionExplanation(questionId).then(fullQuestion => {
        if (fullQuestion) {
          const isCorrect = value === fullQuestion.correct;
          // 更新解析后显示对错
          setSnackbar({
            open: true,
            message: isCorrect ? '✓ 回答正确！' : '✗ 回答错误',
            severity: isCorrect ? 'success' : 'error'
          });
        }
      });
    }
  };

  // 上一题
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      
      // 切换题目时自动显示解析（如果当前题目已答）
      const nextQuestion = passageData?.questions[newIndex];
      if (nextQuestion && confirmedAnswers[nextQuestion.id]) {
        setShowExplanation(true);
      }
      
      if (onQuestionClick) {
        onQuestionClick(newIndex);
      }
    }
  };

  // 下一题
  const handleNext = () => {
    if (passageData && currentQuestionIndex < passageData.questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      
      // 切换题目时自动显示解析（如果当前题目已答）
      const nextQuestion = passageData?.questions[newIndex];
      if (nextQuestion && confirmedAnswers[nextQuestion.id]) {
        setShowExplanation(true);
      }
      
      if (onQuestionClick) {
        onQuestionClick(newIndex);
      }
    }
  };

  // 跳转到指定题
  const handleJumpTo = (index) => {
    setCurrentQuestionIndex(index);
    
    // 跳转时自动显示解析（如果该题已答）
    const targetQuestion = passageData?.questions[index];
    if (targetQuestion && confirmedAnswers[targetQuestion.id]) {
      setShowExplanation(true);
    }
    
    if (onQuestionClick) {
      onQuestionClick(index);
    }
  };

  // ========== 提交答案 ==========
  const handleSubmit = async () => {
    if (!passageData || readOnly) return;
    
    const unanswered = passageData.questions.filter(q => !confirmedAnswers[q.id]);
    if (unanswered.length > 0) {
      setSnackbar({
        open: true,
        message: `还有 ${unanswered.length} 道题未作答`,
        severity: 'warning'
      });
      return;
    }
    
    setSubmitLoading(true);
    
    try {
      const timeSpent = 60; // 简化处理，实际应该计算真实用时
      
      if (onSubmit) {
        const result = await onSubmit(answers, timeSpent, stats);
        
        if (result && result.success) {
          setSnackbar({
            open: true,
            message: result.message || `提交成功！正确率: ${result.accuracy}% (${result.correctCount}/${result.totalCount})`,
            severity: 'success'
          });
        } else if (result && result.error) {
          setSnackbar({
            open: true,
            message: result.error,
            severity: 'error'
          });
        } else {
          setSnackbar({
            open: true,
            message: '提交成功！',
            severity: 'success'
          });
        }
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
  const toggleExplanation = () => {
    setShowExplanation(prev => !prev);
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

  // ========== 文章渲染函数 - 支持首行缩进和单词点击翻译 ==========
  const renderPassageWithAnswers = () => {
    if (!passageData) return null;
    
    const sortedQuestions = [...passageData.questions].sort((a, b) => a.number - b.number);
    let content = passageData.content;
    
    // 创建一个映射，将每个填空位置替换为唯一的占位符
    const blankComponents = [];
    
    sortedQuestions.forEach((q, index) => {
      const pattern = new RegExp(`___${q.number}___`, 'g');
      const hasAnswer = !!answers[q.id];
      const isConfirmed = !!confirmedAnswers[q.id];
      const answerText = hasAnswer ? answers[q.id] : '___';
      const isCurrent = index === currentQuestionIndex;
      
      let bgColor = '#f8f9fa';
      let borderColor = '#dee2e6';
      let textColor = '#495057';
      
      if (isConfirmed && explanations[q.id]) {
        if (answers[q.id] === explanations[q.id].correct) {
          bgColor = '#d4edda';
          borderColor = '#28a745';
          textColor = '#155724';
        } else {
          bgColor = '#f8d7da';
          borderColor = '#dc3545';
          textColor = '#721c24';
        }
      } else if (hasAnswer) {
        bgColor = '#cce5ff';
        borderColor = '#007bff';
        textColor = '#004085';
      }
      
      // 创建填空组件
      const blankComponent = (
        <span
          key={`blank-${q.id}`}
          data-question-id={q.id}
          data-number={q.number}
          data-index={index}
          onClick={() => handleJumpTo(index)}
          style={{
            display: 'inline-block',
            minWidth: isMobile ? '50px' : '60px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            margin: '0 4px',
            borderRadius: '30px',
            backgroundColor: isCurrent ? '#fff3cd' : bgColor,
            border: `2px solid ${isCurrent ? '#856404' : borderColor}`,
            color: isCurrent ? '#856404' : textColor,
            fontWeight: 600,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isCurrent ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
            transform: isCurrent ? 'scale(1.02)' : 'scale(1)',
            fontSize: isMobile ? '0.9rem' : '1rem',
          }}
          title={isConfirmed ? '已锁定' : `点击跳转到第 ${q.number} 题`}
        >
          {answerText}
        </span>
      );
      
      blankComponents.push({ pattern, component: blankComponent });
    });
    
    // 将内容按段落分割
    const paragraphs = content.split('\n').filter(p => p.trim());
    
    return (
      <div ref={contentRef}>
        {paragraphs.map((paragraph, paraIndex) => {
          // 先处理这个段落中的所有填空
          let processedText = paragraph;
          const placeholders = [];
          
          blankComponents.forEach(({ pattern, component }, blankIndex) => {
            if (pattern.test(processedText)) {
              // 用唯一的占位符替换
              const placeholder = `%%%BLANK_${blankIndex}%%%`;
              processedText = processedText.replace(pattern, placeholder);
              placeholders.push({
                placeholder,
                component,
                index: blankIndex
              });
            }
          });
          
          // 将处理后的文本拆分为可点击的部分
          const textParts = processedText.split(/(%%%BLANK_\d+%%%)/g);
          
          return (
            <Typography 
              key={paraIndex} 
              variant="body1" 
              paragraph 
              sx={{ lineHeight: 1.8, fontSize: isMobile ? '1rem' : '1.1rem' }}
            >
              {/* 添加两个空格占位实现首行缩进 */}
              <span style={{ display: 'inline-block', width: '2em' }}>&nbsp;</span>
              
              {textParts.map((part, partIndex) => {
                // 如果是占位符，替换为对应的填空组件
                const placeholderMatch = part.match(/%%%BLANK_(\d+)%%%/);
                if (placeholderMatch) {
                  const blankIndex = parseInt(placeholderMatch[1]);
                  const blankComponent = placeholders.find(p => p.index === blankIndex)?.component;
                  return blankComponent || part;
                }
                
                // 如果是普通文本，使用 renderClickableText 处理
                return renderClickableText(part, false);
              })}
            </Typography>
          );
        })}
      </div>
    );
  };

  const currentQuestion = passageData?.questions[currentQuestionIndex];
  const currentExplanation = currentQuestion ? explanations[currentQuestion.id] : null;
  const isCurrentConfirmed = currentQuestion ? !!confirmedAnswers[currentQuestion.id] : false;
  const progress = stats.total > 0 ? (stats.answered / stats.total) * 100 : 0;

  // 加载中
  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography sx={{ ml: 2, color: 'text.secondary' }}>加载文章中...</Typography>
      </Box>
    );
  }

  // 错误
  if (error) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        {onRefresh && (
          <Button variant="contained" onClick={onRefresh} startIcon={<Refresh />}>
            重试
          </Button>
        )}
      </Box>
    );
  }

  // 无文章
  if (!passageData) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: isFullscreen ? '1400px' : '100%',
        margin: '0 auto',
        bgcolor: '#fff',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* 简约头部 */}
      <Box sx={{ 
        px: isMobile ? 2 : 3,
        py: isMobile ? 1.5 : 2,
        borderBottom: '1px solid #e9ecef',
        bgcolor: '#fff'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 600, color: '#1a237e' }}>
            {passageData.title}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip size="small" label={`${stats.answered}/${stats.total}`} sx={{ bgcolor: '#e9ecef', fontWeight: 600 }} />
            {stats.correct > 0 && (
              <Chip size="small" label={`✓ ${stats.correct}`} sx={{ bgcolor: '#d4edda', color: '#155724', fontWeight: 600 }} />
            )}
            {/* 显示当前文章练习次数 */}
            {passageData.stats?.extract_count > 0 && (
              <Chip size="small" label={`练习${passageData.stats.extract_count}次`} variant="outlined" sx={{ fontWeight: 500 }} />
            )}
            {/* 添加翻译按钮 */}
            <Tooltip title="打开翻译器">
              <IconButton 
                size="small" 
                onClick={() => {
                  setTranslateWord('');
                  setShowTranslator(true);
                }}
                sx={{ color: '#1a237e' }}
              >
                <TranslateIcon />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={toggleFullscreen} sx={{ color: '#1a237e' }}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ width: '100%', height: isMobile ? 4 : 6, bgcolor: '#e9ecef', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ width: `${progress}%`, height: '100%', bgcolor: '#1a237e', transition: 'width 0.3s ease', borderRadius: 3 }} />
        </Box>
      </Box>

      {/* 文章内容区域 - 支持单词点击翻译 */}
      <Box sx={{ flex: 1, overflow: 'auto', px: isMobile ? 2 : 3, py: isMobile ? 1.5 : 2, bgcolor: '#f8f9fa' }}>
        <Paper elevation={0} sx={{ p: isMobile ? 2 : 3, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e9ecef' }}>
          <Typography variant="body1" component="div">
            {renderPassageWithAnswers()}
          </Typography>
        </Paper>
      </Box>

      {/* 底部固定区域 - 题目和选项支持单词点击翻译 */}
      <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #e9ecef', px: isMobile ? 2 : 3, py: isMobile ? 1.5 : 2 }}>
        {/* 当前题目 */}
        {currentQuestion && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 1 : 0, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ fontWeight: 600, color: '#1a237e' }}>
                  第 {currentQuestion.number} 题
                </Typography>
                {isCurrentConfirmed && (
                  <Chip size="small" icon={<Lock sx={{ fontSize: 14 }} />} label="已锁定" sx={{ bgcolor: '#e9ecef', height: 24 }} />
                )}
                {isCurrentConfirmed && currentExplanation && (
                  <Chip
                    size="small"
                    icon={answers[currentQuestion.id] === currentExplanation.correct ? <CheckCircle /> : <Cancel />}
                    label={answers[currentQuestion.id] === currentExplanation.correct ? "正确" : "错误"}
                    color={answers[currentQuestion.id] === currentExplanation.correct ? "success" : "error"}
                    sx={{ height: 24 }}
                  />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small" 
                  onClick={toggleExplanation} 
                  startIcon={<Lightbulb />} 
                  variant={showExplanation ? "contained" : "text"} 
                  color="warning" 
                  sx={{ borderRadius: 20 }}
                >
                  {showExplanation ? '隐藏解析' : '显示解析'}
                </Button>
              </Box>
            </Box>

            {/* 题目文本 - 支持单词点击翻译 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {renderClickableText(currentQuestion.question)}
              </Typography>
            </Box>

            {/* 选项 - 支持单词点击翻译 */}
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${getOptionColumns()}, 1fr)`, gap: isMobile ? 1 : 1.5 }}>
                {currentQuestion.options.map((option) => {
                  const [label, ...textParts] = option.split('. ');
                  const text = textParts.join('. ');
                  const isSelected = answers[currentQuestion.id] === label;
                  const disabled = isCurrentConfirmed;
                  
                  let bgColor = '#fff';
                  let borderColor = '#dee2e6';
                  let textColor = '#212529';
                  
                  if (isSelected) {
                    if (isCurrentConfirmed) {
                      const isCorrect = currentExplanation && label === currentExplanation.correct;
                      bgColor = isCorrect ? '#d4edda' : '#f8d7da';
                      borderColor = isCorrect ? '#28a745' : '#dc3545';
                      textColor = isCorrect ? '#155724' : '#721c24';
                    } else {
                      bgColor = '#cce5ff';
                      borderColor = '#007bff';
                      textColor = '#004085';
                    }
                  }
                  
                  return (
                    <Paper
                      key={label}
                      variant="outlined"
                      sx={{
                        p: isMobile ? 1 : 1.5,
                        bgcolor: bgColor,
                        border: '2px solid',
                        borderColor: borderColor,
                        borderRadius: 2,
                        cursor: disabled ? 'default' : 'pointer',
                        opacity: disabled && !isSelected ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                        '&:hover': disabled ? {} : {
                          borderColor: '#1a237e',
                          bgcolor: alpha('#1a237e', 0.05)
                        }
                      }}
                      onClick={() => !disabled && handleAnswerSelect(currentQuestion.id, label)}
                    >
                      <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontWeight: isSelected ? 600 : 400, color: textColor, lineHeight: 1.4 }}>
                        <strong>{label}.</strong> {renderClickableText(text)}
                        {isSelected && isCurrentConfirmed && (
                          <Lock fontSize="inherit" sx={{ ml: 0.5, verticalAlign: 'middle', fontSize: '0.8rem' }} />
                        )}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            </FormControl>
          </Box>
        )}

        {/* 导航按钮 */}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1.5, mb: stats.answered === stats.total ? 2 : 0 }}>
          <Button fullWidth variant="outlined" onClick={handlePrev} disabled={currentQuestionIndex === 0} startIcon={<NavigateBefore />} size={isMobile ? "medium" : "large"} sx={{ py: isMobile ? 1 : 1.5, borderColor: '#1a237e', color: '#1a237e' }}>
            上一题
          </Button>
          <Button fullWidth variant="contained" onClick={handleNext} disabled={currentQuestionIndex === passageData.questions.length - 1} endIcon={<NavigateNext />} size={isMobile ? "medium" : "large"} sx={{ py: isMobile ? 1 : 1.5, bgcolor: '#1a237e' }}>
            下一题
          </Button>
        </Box>

        {/* 提交按钮 */}
        {!readOnly && stats.answered === stats.total && (
          <Fade in={stats.answered === stats.total}>
            <Button 
              fullWidth 
              variant="contained" 
              color="success" 
              size={isMobile ? "medium" : "large"} 
              onClick={handleSubmit} 
              disabled={submitLoading} 
              startIcon={submitLoading ? <CircularProgress size={20} /> : <CheckCircle />} 
              sx={{ py: isMobile ? 1 : 1.5, mt: 1, fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 600, bgcolor: '#28a745' }}
            >
              {submitLoading ? '提交中...' : '提交答案'}
            </Button>
          </Fade>
        )}
      </Box>

      {/* 解析悬浮层 - 支持单词点击翻译 ✅ 自动显示 */}
      {answers[currentQuestion?.id] && currentExplanation && showExplanation && (
        <Paper variant="outlined" sx={{ position: 'absolute', bottom: isMobile ? 180 : (stats.answered === stats.total ? 240 : 200), left: isMobile ? 8 : 16, right: isMobile ? 8 : 16, maxWidth: 500, margin: '0 auto', p: isMobile ? 1.5 : 2.5, bgcolor: answers[currentQuestion.id] === currentExplanation.correct ? '#d4edda' : '#fff3cd', borderRadius: 2, borderColor: answers[currentQuestion.id] === currentExplanation.correct ? '#28a745' : '#ffc107', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 20, mx: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant={isMobile ? "caption" : "subtitle2"} sx={{ fontWeight: 600 }}>正确答案：{currentExplanation.correct}</Typography>
            <IconButton size="small" onClick={() => setShowExplanation(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
            {renderClickableText(currentExplanation.explanation)}
          </Typography>
        </Paper>
      )}

      {/* 翻译组件 */}
      <WordTranslator
        open={showTranslator}
        onClose={() => setShowTranslator(false)}
        word={translateWord}
        G_word_name={G_word_name}
        getToken={getToken}
      />

      {/* 悬浮翻译按钮（在小屏幕上提供快速访问） */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000
          }}
        >
          <Tooltip title="打开翻译器">
            <Button
              variant="contained"
              onClick={() => {
                setTranslateWord('');
                setShowTranslator(true);
              }}
              sx={{
                minWidth: '48px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#1a237e',
                '&:hover': {
                  backgroundColor: '#283593'
                }
              }}
            >
              <TranslateIcon />
            </Button>
          </Tooltip>
        </Box>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ClozeTestSimple;