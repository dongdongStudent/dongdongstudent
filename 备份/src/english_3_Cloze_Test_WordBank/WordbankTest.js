// src/pages/WordbankTestSimple.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Chip,Stack,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  MobileStepper,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  LinearProgress
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
  Translate as TranslateIcon,
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  KeyboardReturn as KeyboardReturnIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import WordTranslator from '../translator/translator.js';
import { wordbankApi } from './wordbankApi.js';

const WordbankTestSimple = ({ 
  questions = [],                 // 改为接收题目数组
  currentIndex = 0,               // 当前题目索引
  onIndexChange,                  // 索引变化回调
  loading = false,
  error = null,
  onRefresh,
  onSubmit,
  externalAnswers = {},
  externalExplanations = {},
  readOnly = false,
  confirmedAnswers = {},
  onConfirmAnswer,
  onModifyAnswer,
  dataSource = '中考',
  G_word_name = 'word_english_test_study',
  getToken,
  fullscreen = false,
  onFullscreenToggle
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // ========== 状态管理 ==========
  const [answers, setAnswers] = useState(externalAnswers);
  const [explanations, setExplanations] = useState(externalExplanations);
  const [internalIndex, setInternalIndex] = useState(currentIndex);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [fetchingExplanation, setFetchingExplanation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [showHistory, setShowHistory] = useState({});
  const [submitResult, setSubmitResult] = useState(null);
  
  // 计时器相关
  const [startTime, setStartTime] = useState(Date.now());
  
  // 翻译相关
  const [showTranslator, setShowTranslator] = useState(false);
  const [translateWord, setTranslateWord] = useState('');

  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // 当前使用的索引（受控或非受控）
  const activeIndex = onIndexChange !== undefined ? currentIndex : internalIndex;
  
  // ========== 初始化计时器 ==========
  useEffect(() => {
    // 当题目变化时重置开始时间
    setStartTime(Date.now());
  }, [questions]);

  // ========== 计算统计 ==========
  const stats = useMemo(() => {
    if (!questions || questions.length === 0) {
      return { total: 0, answered: 0, correct: 0, incorrect: 0, accuracy: 0 };
    }
    
    const total = questions.length;
    const answered = Object.keys(confirmedAnswers).length;
    let correct = 0;
    let incorrect = 0;
    
    questions.forEach(q => {
      if (confirmedAnswers[q.id] && explanations[q.id]) {
        const userAnswer = answers[q.id] || '';
        if (userAnswer.toLowerCase().trim() === explanations[q.id].correct.toLowerCase().trim()) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });
    
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    
    return { total, answered, correct, incorrect, accuracy };
  }, [questions, confirmedAnswers, answers, explanations]);

  // 当前题目
  const currentQuestion = questions[activeIndex];
  const isConfirmed = currentQuestion ? confirmedAnswers[currentQuestion.id] === true : false;
  const currentExplanation = currentQuestion ? explanations[currentQuestion.id] : null;

  // ========== 获取当前题目的历史记录 ==========
  const getCurrentQuestionHistory = () => {
    if (!currentQuestion?.stats?.history) return [];
    return currentQuestion.stats.history;
  };

  // ========== 计算历史记录统计 ==========
  const calculateHistoryStats = (history) => {
    if (!history || history.length === 0) {
      return { total: 0, correct: 0, wrong: 0, accuracy: 0 };
    }
    
    const total = history.length;
    const correct = history.filter(h => h.result).length;
    const wrong = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { total, correct, wrong, accuracy };
  };

  // ========== 切换历史记录显示 ==========
  const toggleHistory = (questionId) => {
    if (!isConfirmed) {
      setSnackbar({ 
        open: true, 
        message: '请先确认答案后再查看历史记录', 
        severity: 'info' 
      });
      return;
    }
    setShowHistory(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // ========== 渲染历史记录统计卡片 ==========
  const renderHistoryStats = (history) => {
    const stats = calculateHistoryStats(history);
    
    if (stats.total === 0) return null;
    
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 1.5, 
          mb: 2, 
          bgcolor: '#f0f4fa',
          borderRadius: 2,
          border: '1px solid #1a237e'
        }}
      >
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#1a237e' }}>
          <AssessmentIcon fontSize="small" />
          历史统计
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mb: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              总练习次数
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {stats.correct}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              正确次数
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">
              {stats.wrong}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              错误次数
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ width: '100%', mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              历史正确率
            </Typography>
            <Typography variant="caption" fontWeight="bold" color={stats.accuracy >= 80 ? 'success.main' : stats.accuracy >= 60 ? 'warning.main' : 'error.main'}>
              {stats.accuracy}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={stats.accuracy} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                bgcolor: stats.accuracy >= 80 ? '#4caf50' : stats.accuracy >= 60 ? '#ff9800' : '#f44336'
              }
            }}
          />
        </Box>
      </Paper>
    );
  };

  // ========== 渲染历史记录 ==========
  const renderHistory = (question) => {
    if (!question?.stats?.history || question.stats.history.length === 0) {
      return null;
    }

    const history = question.stats.history;
    const show = showHistory[question.id];
    const historyStats = calculateHistoryStats(history);

    return (
      <Box sx={{ mt: 2 }}>
        <Button
          size="small"
          startIcon={<HistoryIcon />}
          endIcon={show ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => toggleHistory(question.id)}
          sx={{ 
            mb: 1, 
            color: '#1a237e',
            '&:hover': { bgcolor: alpha('#1a237e', 0.1) }
          }}
          disabled={!isConfirmed}
        >
          查看历史记录 ({history.length}次练习, 正确率 {historyStats.accuracy}%)
        </Button>
        
        <Collapse in={show}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            {/* 历史统计卡片 */}
            {renderHistoryStats(history)}
            
            <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mt: 1 }}>
              详细记录：
            </Typography>
            <List dense disablePadding>
              {history.slice().reverse().map((record, index) => {
                const date = new Date(record.date).toLocaleString('zh-CN', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {record.result ? (
                        <CheckCircle color="success" fontSize="small" />
                      ) : (
                        <Cancel color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                            {date}
                          </Typography>
                          <Chip
                            size="small"
                            label={record.result ? '正确' : '错误'}
                            color={record.result ? 'success' : 'error'}
                            sx={{ minWidth: 50, height: 24 }}
                          />
                          {!record.result && record.userAnswer && (
                            <Typography variant="body2" color="error">
                              您的答案: "{record.userAnswer}"
                            </Typography>
                          )}
                          {record.correctAnswer && (
                            <Typography variant="body2" color="success.main">
                              正确答案: "{record.correctAnswer}"
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            用时: {record.time}秒
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Collapse>
      </Box>
    );
  };

  // ========== 回车逻辑 ==========
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Enter') return;
      if (showTranslator) return;
      if (!currentQuestion) return;
      
      const activeElement = document.activeElement;
      
      if (activeElement === inputRef.current) {
        e.preventDefault();
        
        if (!confirmedAnswers[currentQuestion.id]) {
          const answer = inputRef.current?.value?.trim();
          if (!answer) {
            setSnackbar({ open: true, message: '请输入答案', severity: 'warning' });
            return;
          }
          handleConfirm();
        } else if (activeIndex < stats.total - 1) {
          handleNext();
        }
        return;
      }
      
      e.preventDefault();
      
      if (!confirmedAnswers[currentQuestion.id]) {
        inputRef.current?.focus();
      } else if (activeIndex < stats.total - 1) {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, confirmedAnswers, activeIndex, stats.total, showTranslator]);

  // ========== 监听全屏变化 ==========
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

  // ========== 预获取所有题目的解析 ==========
  useEffect(() => {
    if (questions.length > 0 && Object.keys(explanations).length === 0 && !fetchingExplanation) {
      fetchAllExplanations();
    }
  }, [questions]);

  // ========== 当切换题目时，更新输入框并自动聚焦 ==========
  useEffect(() => {
    if (currentQuestion) {
      setInputValue(answers[currentQuestion.id] || '');
      setTimeout(() => {
        if (inputRef.current && !isConfirmed) {
          inputRef.current.focus();
        }
      }, 100);
      
      if (isConfirmed && currentExplanation) {
        setShowExplanation(true);
      } else {
        setShowExplanation(false);
      }
    }
  }, [activeIndex, currentQuestion, answers, isConfirmed, currentExplanation]);

  // ========== 获取所有解析 ==========
  const fetchAllExplanations = async () => {
    if (!questions.length) return;
    
    setFetchingExplanation(true);
    try {
      const explanationsMap = {};
      
      // 由于是句子结构，每个题目独立，需要单独获取每个题目的解析
      await Promise.all(questions.map(async (question) => {
        const response = await wordbankApi.getQuestionDetails(question.id, dataSource);
        if (response?.flag === 1 && response.content?.question) {
          const q = response.content.question;
          explanationsMap[q.id] = {
            correct: q.correctForm,
            explanation: q.explanation || '暂无解析',
            givenWord: q.givenWord
          };
        }
      }));
      
      setExplanations(explanationsMap);
    } catch (error) {
      console.error('预获取解析失败:', error);
    } finally {
      setFetchingExplanation(false);
    }
  };

  // ========== 获取单个题目的解析 ==========
  const fetchQuestionExplanation = async (questionId) => {
    try {
      const response = await wordbankApi.getQuestionDetails(questionId, dataSource);
      if (response?.flag === 1 && response.content?.question) {
        const q = response.content.question;
        setExplanations(prev => ({
          ...prev,
          [questionId]: {
            correct: q.correctForm,
            explanation: q.explanation || '暂无解析',
            givenWord: q.givenWord
          }
        }));
        return q;
      }
    } catch (error) {
      console.error('获取解析失败:', error);
    }
    return null;
  };

  // ========== 单词点击翻译 ==========
  const handleWordClick = (word, e) => {
    if (e) e.stopPropagation();
    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}]$/g, "").trim();
    if (cleanedWord && /^[a-zA-Z'\-]+$/.test(cleanedWord) && cleanedWord.length >= 2) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
    }
  };

  // ========== 渲染可点击的文本 ==========
  const renderClickableText = (text, stopPropagation = true) => {
    if (!text) return text;
    const parts = text.split(/(\b[a-zA-Z'\-]+\b)/g);
    return parts.map((part, index) => {
      if (/^[a-zA-Z'\-]+$/.test(part) && part.length >= 2) {
        return (
          <span
            key={index}
            onClick={(e) => {
              if (stopPropagation) e.stopPropagation();
              handleWordClick(part, e);
            }}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline dotted #1a237e',
              textUnderlineOffset: '3px',
              color: '#1a237e',
              fontWeight: 500
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

  // ========== 渲染题目句子 ==========
  const renderQuestionSentence = () => {
    if (!currentQuestion) return null;
    
    // 从句子中提取填空部分并高亮
    const sentence = currentQuestion.sentence;
    const pattern = new RegExp(`_{3,}\\s*\\(${currentQuestion.givenWord}\\)`, 'g');
    
    const hasAnswer = !!answers[currentQuestion.id];
    const answerText = hasAnswer ? answers[currentQuestion.id] : '_____';
    
    // 根据状态设置颜色
    let bgColor = '#f8f9fa';
    let borderColor = '#dee2e6';
    let textColor = '#495057';
    
    if (isConfirmed && currentExplanation) {
      const isCorrect = (answers[currentQuestion.id] || '').toLowerCase().trim() === currentExplanation.correct.toLowerCase().trim();
      if (isCorrect) {
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
        style={{
          display: 'inline-block',
          minWidth: isMobile ? '60px' : '70px',
          padding: isMobile ? '2px 6px' : '4px 8px',
          margin: '0 4px',
          borderRadius: '16px',
          backgroundColor: bgColor,
          border: `2px solid ${borderColor}`,
          color: textColor,
          fontWeight: 600,
          textAlign: 'center',
          fontSize: isMobile ? '0.9rem' : '1rem',
        }}
      >
        {answerText}
        {isConfirmed && <Lock sx={{ fontSize: 12, ml: 0.5, verticalAlign: 'middle' }} />}
      </span>
    );
    
    // 替换填空部分
    if (pattern.test(sentence)) {
      const parts = sentence.split(pattern);
      return (
        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
          {parts[0]}
          {blankComponent}
          {parts[1]}
        </Typography>
      );
    }
    
    return (
      <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
        {renderClickableText(sentence)}
      </Typography>
    );
  };

  // ========== 处理输入变化 ==========
  const handleInputChange = (e) => {
    if (isConfirmed) return;
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: newValue
      }));
    }
  };

  // ========== 确认答案函数 ==========
  const handleConfirm = () => {
    if (!currentQuestion) return;
    
    if (isConfirmed) {
      setSnackbar({ open: true, message: '答案已锁定，不能修改', severity: 'info' });
      return;
    }

    const currentAnswer = inputRef.current?.value?.trim() || '';
    
    if (!currentAnswer) {
      setSnackbar({ open: true, message: '请输入答案', severity: 'warning' });
      return;
    }

    setInputValue(currentAnswer);

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: currentAnswer
    }));

    if (onConfirmAnswer) {
      onConfirmAnswer(currentQuestion.id);
    }

    if (explanations[currentQuestion.id]) {
      const isCorrect = currentAnswer.toLowerCase().trim() === explanations[currentQuestion.id].correct.toLowerCase().trim();
      setSnackbar({ 
        open: true, 
        message: isCorrect ? '✓ 回答正确！' : `✗ 回答错误，正确答案是：${explanations[currentQuestion.id].correct}`, 
        severity: isCorrect ? 'success' : 'error' 
      });
      setShowExplanation(true);
    } else {
      setSnackbar({ open: true, message: '答案已锁定', severity: 'info' });
      
      fetchQuestionExplanation(currentQuestion.id).then(fullQuestion => {
        if (fullQuestion) {
          const correctAns = fullQuestion.correctForm;
          const isCorrect = currentAnswer.toLowerCase().trim() === correctAns.toLowerCase().trim();
          setSnackbar({ 
            open: true, 
            message: isCorrect ? '✓ 回答正确！' : `✗ 回答错误，正确答案是：${correctAns}`, 
            severity: isCorrect ? 'success' : 'error' 
          });
          setShowExplanation(true);
        }
      });
    }
  };

  // ========== 切换解析显示 ==========
  const toggleExplanation = () => {
    if (isConfirmed && currentExplanation) {
      setShowExplanation(prev => !prev);
    }
  };

  // ========== 提交所有答案 ==========
  const handleSubmit = async () => {
    if (!questions.length) return;

    if (stats.answered !== stats.total) {
      setSnackbar({ 
        open: true, 
        message: `还有 ${stats.total - stats.answered} 题未完成`, 
        severity: 'warning' 
      });
      return;
    }

    // 计算实际用时（秒）
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // ========== 详细的日志输出 ==========
    console.log('=================================');
    console.log('【提交答案 - 开始】');
    console.log('时间戳:', new Date().toLocaleString());
    console.log('=================================');
    
    console.log('【基本信息】');
    console.log('- 题目总数:', questions.length);
    console.log('- 已答题数:', stats.answered);
    console.log('- 正确数:', stats.correct);
    console.log('- 错误数:', stats.incorrect);
    console.log('- 正确率:', stats.accuracy + '%');
    console.log('- 用时:', timeSpent, '秒');
    
    console.log('【题目数据】');
    console.log('- questions 数组:', questions);
    
    console.log('【答案数据】');
    console.log('- answers 对象:', answers);
    console.log('- answers 键(questionIds):', Object.keys(answers));
    console.log('- answers 值(answerValues):', Object.values(answers));
    
    console.log('【确认答案状态】');
    console.log('- confirmedAnswers:', confirmedAnswers);
    
    console.log('【解析数据】');
    console.log('- explanations:', explanations);
    
    // 详细列出每道题的答案和正确情况
    console.log('【每道题详细情况】');
    questions.forEach((q, index) => {
      const userAnswer = answers[q.id] || '(未答)';
      const isConfirmed = confirmedAnswers[q.id] || false;
      const correctAnswer = explanations[q.id]?.correct || '(未知)';
      const isCorrect = isConfirmed && explanations[q.id] && 
        userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      
      console.log(`  第 ${index + 1} 题 [${q.id}]:`);
      console.log(`    - 原词: ${q.givenWord}`);
      console.log(`    - 用户答案: ${userAnswer}`);
      console.log(`    - 正确答案: ${correctAnswer}`);
      console.log(`    - 已确认: ${isConfirmed}`);
      console.log(`    - 是否正确: ${isCorrect ? '✓' : '✗'}`);
    });
    
    // **重要：只提交已确认的答案，而不是所有 answers**
    // 因为后端需要的是用户实际确认提交的答案
    const submittedQuestionIds = [];
    const submittedAnswerValues = [];
    
    questions.forEach(q => {
      if (confirmedAnswers[q.id]) {
        submittedQuestionIds.push(q.id);
        submittedAnswerValues.push(answers[q.id] || '');
      }
    });
    
    console.log('【提交数据 - 只提交已确认的答案】');
    console.log('- submittedQuestionIds:', submittedQuestionIds);
    console.log('- submittedAnswerValues:', submittedAnswerValues);
    console.log('- timeSpent:', timeSpent);
    console.log('- bank:', dataSource);
    
    const submitData = {
      questionIds: submittedQuestionIds,
      answers: submittedAnswerValues,
      timeSpent,
      bank: dataSource  // 添加 bank 字段，后端需要这个
    };
    console.log('- 最终提交格式:', submitData);
    
    console.log('=================================');

    // 检查是否有数据提交
    if (submittedQuestionIds.length === 0) {
      setSnackbar({ 
        open: true, 
        message: '没有已确认的答案可提交', 
        severity: 'warning' 
      });
      return;
    }

    setSubmitLoading(true);
    try {
      if (onSubmit) {
        const result = await onSubmit(submitData);
        
        console.log('【提交结果】');
        console.log('- result:', result);
        
        if (result?.success) {
          console.log('- 提交成功!');
          setSubmitResult(result);
          setSnackbar({ 
            open: true, 
            message: result.message || `提交成功！正确率：${result.accuracy}%`, 
            severity: 'success' 
          });
          
          // 提交成功后重置计时器（可选）
          setStartTime(Date.now());
        } else {
          console.log('- 提交失败:', result);
          setSnackbar({ 
            open: true, 
            message: result?.message || '提交失败', 
            severity: 'error' 
          });
        }
        
        console.log('=================================');
      }
    } catch (error) {
      console.error('【提交错误】');
      console.error('- error:', error);
      console.error('- error message:', error.message);
      console.error('- error stack:', error.stack);
      console.log('=================================');
      
      setSnackbar({ 
        open: true, 
        message: '提交失败：' + (error.message || '网络错误'), 
        severity: 'error' 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // ========== 上一题/下一题 ==========
  const handlePrev = () => {
    if (activeIndex > 0) {
      const newIndex = activeIndex - 1;
      if (onIndexChange) {
        onIndexChange(newIndex);
      } else {
        setInternalIndex(newIndex);
      }
    }
  };

  const handleNext = () => {
    if (activeIndex < stats.total - 1) {
      const newIndex = activeIndex + 1;
      if (onIndexChange) {
        onIndexChange(newIndex);
      } else {
        setInternalIndex(newIndex);
      }
    }
  };

  // ========== 跳转到指定题 ==========
  const handleJumpTo = (index) => {
    if (onIndexChange) {
      onIndexChange(index);
    } else {
      setInternalIndex(index);
    }
  };

  // ========== 切换全屏 ==========
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

  // ========== 进度 ==========
  const progress = stats.total > 0 ? (stats.answered / stats.total) * 100 : 0;

  // ========== 渲染加载中 ==========
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>加载题目中...</Typography>
      </Box>
    );
  }

  // ========== 渲染错误 ==========
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500, mx: 'auto' }}>{error}</Alert>
        {onRefresh && (
          <Button variant="contained" onClick={onRefresh} startIcon={<Refresh />}>
            重试
          </Button>
        )}
      </Box>
    );
  }

  // ========== 渲染无数据 ==========
  if (!questions.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto' }}>暂无题目</Alert>
        {onRefresh && (
          <Button variant="contained" onClick={onRefresh} startIcon={<Refresh />} sx={{ mt: 2 }}>
            加载题目
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        maxWidth: isFullscreen ? '100%' : 900,
        mx: 'auto', 
        p: { xs: 1, sm: 2, md: 3 },
        position: 'relative',
        minHeight: '100vh',
        bgcolor: '#fff',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 头部信息 */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 2, 
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            词汇变形练习
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`${stats.answered}/${stats.total}`} 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} 
            />
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏模式"}>
              <IconButton 
                size="small" 
                onClick={toggleFullscreen}
                sx={{ color: 'white' }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* 进度条 */}
        <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 4, mb: 1 }}>
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

        {/* 统计信息 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} /> 正确: {stats.correct}
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Cancel sx={{ fontSize: 16, color: '#f44336' }} /> 错误: {stats.incorrect}
            </Typography>
          </Box>
          {stats.answered > 0 && (
            <Chip
              size="small"
              icon={<TrendingUpIcon />}
              label={`正确率 ${stats.accuracy}%`}
              sx={{ 
                bgcolor: stats.accuracy >= 80 ? '#4caf50' : stats.accuracy >= 60 ? '#ff9800' : '#f44336',
                color: 'white',
                fontWeight: 600
              }}
            />
          )}
        </Box>
      </Paper>

      {/* 题目进度指示器 */}
      <Box sx={{ mb: 2 }}>
        <MobileStepper
          variant="progress"
          steps={stats.total}
          position="static"
          activeStep={activeIndex}
          sx={{ 
            maxWidth: '100%', 
            flexGrow: 1,
            bgcolor: 'transparent',
            '& .MuiMobileStepper-progress': {
              width: '100%',
              height: 8,
              borderRadius: 4
            }
          }}
          nextButton={<Box />}
          backButton={<Box />}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
          第 {activeIndex + 1} 题 / 共 {stats.total} 题
        </Typography>
      </Box>

      {/* 当前题目 */}
      {currentQuestion && (
        <Zoom in={true}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mb: 2,
              border: isConfirmed ? '2px solid' : 'none',
              borderColor: currentExplanation ? (
                (answers[currentQuestion.id] || '').toLowerCase().trim() === currentExplanation.correct.toLowerCase().trim() 
                  ? '#4caf50' 
                  : '#f44336'
              ) : '#1a237e',
              transition: 'all 0.3s ease'
            }}
          >
            {/* 题目头部 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {isConfirmed && (
                  <Chip 
                    icon={<Lock />} 
                    label="已锁定" 
                    size="small" 
                    color={currentExplanation ? (
                      (answers[currentQuestion.id] || '').toLowerCase().trim() === currentExplanation.correct.toLowerCase().trim() 
                        ? 'success' 
                        : 'error'
                    ) : 'default'}
                    onDelete={onModifyAnswer ? () => onModifyAnswer(currentQuestion.id) : undefined}
                  />
                )}
                {currentQuestion.source?.category && (
                  <Chip 
                    label={currentQuestion.source.category} 
                    size="small" 
                    variant="outlined"
                  />
                )}
                {currentQuestion.source?.difficulty && (
                  <Chip 
                    label={`难度 ${currentQuestion.source.difficulty}级`} 
                    size="small" 
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Box>
                <Tooltip title="打开翻译器">
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setTranslateWord('');
                      setShowTranslator(true);
                    }}
                    sx={{ color: '#1a237e', mr: 1 }}
                  >
                    <TranslateIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={showExplanation ? "隐藏解析" : "显示解析"}>
                  <IconButton 
                    size="small" 
                    onClick={toggleExplanation}
                    color={showExplanation ? "warning" : "default"}
                    disabled={!isConfirmed || !currentExplanation}
                  >
                    <Lightbulb />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* 题目句子 */}
            <Box sx={{ mb: 3 }}>
              {renderQuestionSentence()}
            </Box>

            {/* 原词提示 */}
            <Box sx={{ mb: 2, p: 2, bgcolor: '#e8eaf6', borderRadius: 1, border: '1px dashed #1a237e' }}>
              <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon fontSize="small" />
                <span>原词: <strong style={{ fontSize: '1.1rem' }}>{currentQuestion.givenWord}</strong></span>
              </Typography>
            </Box>

            {/* 输入框 */}
            <TextField
              inputRef={inputRef}
              fullWidth
              variant="outlined"
              placeholder="请输入正确形式..."
              value={inputValue}
              onChange={handleInputChange}
              disabled={isConfirmed}
              size="medium"
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: !isConfirmed && (
                  <Button
                    variant="contained"
                    onClick={handleConfirm}
                    color="primary"
                    size="small"
                    startIcon={<SendIcon />}
                    sx={{ minWidth: 80, borderRadius: 20 }}
                  >
                    确认
                  </Button>
                ),
                sx: {
                  bgcolor: isConfirmed ? '#f5f5f5' : '#fff',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: isConfirmed ? (
                        currentExplanation && (answers[currentQuestion.id] || '').toLowerCase().trim() === currentExplanation.correct.toLowerCase().trim()
                          ? '#4caf50'
                          : '#f44336'
                      ) : '#1a237e',
                      borderWidth: isConfirmed ? 2 : 1
                    }
                  }
                }
              }}
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
              {isConfirmed 
                ? (activeIndex < stats.total - 1 ? '↵ 回车进入下一题' : '已是最后一题') 
                : '↵ 回车确认答案'}
            </Typography>

            {/* 历史记录 - 只在锁定后显示 */}
            {isConfirmed && renderHistory(currentQuestion)}
          </Paper>
        </Zoom>
      )}

      {/* 答案解析悬浮层 */}
      {isConfirmed && currentExplanation && showExplanation && (
        <Paper 
          variant="outlined" 
          sx={{ 
            position: 'fixed',
            bottom: isMobile ? 100 : 120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: isMobile ? '90%' : 500,
            maxWidth: 500,
            p: isMobile ? 1.5 : 2.5,
            bgcolor: (answers[currentQuestion.id] || '').toLowerCase().trim() === currentExplanation.correct.toLowerCase().trim() 
              ? '#d4edda' 
              : '#fff3cd',
            borderRadius: 2,
            border: '2px solid',
            borderColor: (answers[currentQuestion.id] || '').toLowerCase().trim() === currentExplanation.correct.toLowerCase().trim() 
              ? '#28a745' 
              : '#ffc107',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 20,
            animation: 'slideUp 0.3s ease',
            '@keyframes slideUp': {
              '0%': { 
                opacity: 0, 
                transform: 'translateX(-50%) translateY(20px)'
              },
              '100%': { 
                opacity: 1, 
                transform: 'translateX(-50%) translateY(0)'
              }
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant={isMobile ? "caption" : "subtitle2"} sx={{ fontWeight: 600, color: '#1a237e' }}>
              答案解析
            </Typography>
            <IconButton size="small" onClick={() => setShowExplanation(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Divider sx={{ my: 1 }} />
          
          <Typography variant={isMobile ? "caption" : "body2"} sx={{ mb: 1, fontWeight: 500 }}>
            正确答案: <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{currentExplanation.correct}</span>
          </Typography>
          
          <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {renderClickableText(currentExplanation.explanation)}
          </Typography>
        </Paper>
      )}

      {/* 底部导航 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          startIcon={<NavigateBefore />}
          size="large"
          sx={{ py: 1.5, borderColor: '#1a237e', color: '#1a237e' }}
        >
          上一题
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleNext}
          disabled={activeIndex === stats.total - 1}
          endIcon={<NavigateNext />}
          size="large"
          sx={{ py: 1.5, borderColor: '#1a237e', color: '#1a237e' }}
        >
          下一题
        </Button>
      </Box>

      {/* 题目快速导航 */}
      {stats.total > 5 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 2 }}>
          {questions.map((q, index) => {
            const isCurrent = index === activeIndex;
            const isAnswered = !!confirmedAnswers[q.id];
            const isCorrect = isAnswered && explanations[q.id] && 
              (answers[q.id] || '').toLowerCase().trim() === explanations[q.id].correct.toLowerCase().trim();
            
            return (
              <Tooltip key={q.id} title={`第 ${index + 1} 题 - ${isAnswered ? (isCorrect ? '正确' : '错误') : '未答'}`}>
                <Button
                  size="small"
                  variant={isCurrent ? "contained" : "outlined"}
                  onClick={() => handleJumpTo(index)}
                  sx={{
                    minWidth: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: isCurrent ? '#1a237e' : isAnswered ? (isCorrect ? '#4caf50' : '#f44336') : 'transparent',
                    color: isCurrent ? 'white' : isAnswered ? 'white' : '#1a237e',
                    borderColor: '#1a237e',
                    '&:hover': {
                      bgcolor: isCurrent ? '#283593' : alpha('#1a237e', 0.1)
                    }
                  }}
                >
                  {index + 1}
                </Button>
              </Tooltip>
            );
          })}
        </Box>
      )}

      {/* 提交按钮 */}
      {stats.answered === stats.total && stats.total > 0 && (
        <Fade in={stats.answered === stats.total}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            onClick={handleSubmit}
            disabled={submitLoading}
            startIcon={submitLoading ? <CircularProgress size={20} /> : <EmojiEventsIcon />}
            sx={{ 
              py: 1.5, 
              fontSize: '1rem', 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #2e7d32 30%, #388e3c 90%)'
            }}
          >
            {submitLoading ? '提交中...' : `提交答案 (正确率 ${stats.accuracy}%)`}
          </Button>
        </Fade>
      )}

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

export default WordbankTestSimple;