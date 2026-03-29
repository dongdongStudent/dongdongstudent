// src/pages/select_test.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Radio,
  RadioGroup,
  FormControl,
  Alert,
  Divider,
  LinearProgress,
  Snackbar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Zoom
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  MenuBook,
  History,
  Translate,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  CheckCircleOutline,
  Lightbulb,
  Close as CloseIcon,
  Star,
  EmojiEvents,
  FullscreenExit
} from '@mui/icons-material';
import { questionApi } from './api.js';
import SingleChoiceResult from './select_test_result.js';
import WordTranslator from '../translator/translator.js';

const SingleChoiceTest = ({
  dataSource = 'default',
  fullscreen = false,
  questions: externalQuestions = [],
  drawType = 'custom',
  questionCount = 10,
  rangeStart = null,
  rangeEnd = null,
  onComplete,
  onExitFullscreen,
  // 新增 props - 用于父组件控制
  externalAnswers = null,
  externalCurrentIndex = null,
  onAnswerChange,
  onIndexChange,
  onSubmitComplete
}) => {
  // 状态管理
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serverStats, setServerStats] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [questionMastery, setQuestionMastery] = useState({});
  const [loadingMastery, setLoadingMastery] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [translateWord, setTranslateWord] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRedoMode, setIsRedoMode] = useState(false);
  
  // 保存原始模式信息，用于错题重做后恢复
  const [originalDrawType, setOriginalDrawType] = useState(drawType);
  const [originalRangeStart, setOriginalRangeStart] = useState(rangeStart);
  const [originalRangeEnd, setOriginalRangeEnd] = useState(rangeEnd);
  const [originalQuestionCount, setOriginalQuestionCount] = useState(questionCount);

  const containerRef = useRef(null);

  // 同步外部传入的答案
  useEffect(() => {
    if (externalAnswers && Object.keys(externalAnswers).length > 0) {
      setAnswers(externalAnswers);
    }
  }, [externalAnswers]);

  // 同步外部传入的索引
  useEffect(() => {
    if (externalCurrentIndex !== null && externalCurrentIndex !== undefined && externalCurrentIndex !== currentIndex) {
      setCurrentIndex(externalCurrentIndex);
    }
  }, [externalCurrentIndex]);

  // 当外部传入题目时，设置到本地状态
  useEffect(() => {
    if (externalQuestions && externalQuestions.length > 0) {
      console.log('【测试组件】接收到题目:', externalQuestions.length);
      
      // 检查是否是错题重做模式（通过额外属性判断）
      const isRedo = externalQuestions.some(q => q._redoMode === true);
      setIsRedoMode(isRedo);
      
      if (isRedo) {
        console.log('【测试组件】进入错题重做模式，不上传结果到服务器');
      }
      
      const questionsWithMeta = externalQuestions.map((q, idx) => ({
        ...q,
        displayIndex: idx + 1,
        originalNumber: idx + 1
      }));
      setQuestions(questionsWithMeta);
      // 如果有外部答案则保留，否则清空
      if (!externalAnswers || Object.keys(externalAnswers).length === 0) {
        setAnswers({});
      }
      setCurrentIndex(0);
      setTestStartTime(new Date());
      setShowResult(false);
      setInitialLoading(false);
      setServerStats(null);
    } else if (externalQuestions && externalQuestions.length === 0) {
      setQuestions([]);
      setInitialLoading(false);
      setIsRedoMode(false);
    }
  }, [externalQuestions]);

  // 保存原始模式信息
  useEffect(() => {
    setOriginalDrawType(drawType);
    setOriginalRangeStart(rangeStart);
    setOriginalRangeEnd(rangeEnd);
    setOriginalQuestionCount(questionCount);
  }, [drawType, rangeStart, rangeEnd, questionCount]);

  // 获取题目历史掌握程度
  useEffect(() => {
    if (questions.length > 0 && !isRedoMode) {
      fetchQuestionsMastery();
    }
  }, [questions, isRedoMode]);

  const fetchQuestionsMastery = async () => {
    if (questions.length === 0 || isRedoMode) return;
    setLoadingMastery(true);
    try {
      const questionIds = questions.map(q => q.id);
      const response = await questionApi.getBatchQuestionStats(questionIds, dataSource);
      if (response && response.flag === 1 && response.content?.stats) {
        const masteryData = {};
        response.content.stats.forEach(stat => {
          if (stat && stat.questionId) {
            masteryData[stat.questionId] = {
              mastery_level: stat.mastery_level || 0,
              correct_count: stat.correct_count || 0,
              wrong_count: stat.wrong_count || 0,
              total_attempts: stat.total_attempts || 0,
              streak: stat.streak || { current_correct: 0, current_wrong: 0 },
              time_stats: stat.time_stats || { avg_time: 0 },
              history: stat.history || []
            };
          }
        });
        setQuestionMastery(masteryData);
      }
    } catch (error) {
      console.error('获取题目掌握程度失败:', error);
    } finally {
      setLoadingMastery(false);
    }
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || showResult || openDialog || showTranslator || questions.length === 0) return;
      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      const key = e.key;
      
      // 数字键 1-4：选择答案（仅当未答题时）
      if (key >= '1' && key <= '4') {
        if (answers[currentQ.id]) {
          setSnackbar({ open: true, message: '答案已选择，不能修改', severity: 'warning', autoHideDuration: 1500 });
          return;
        }
        const optionIndex = parseInt(key) - 1;
        const options = currentQ.options;
        if (optionIndex < options.length) {
          handleAnswerChange(currentQ.id, options[optionIndex].label);
          setSnackbar({ open: true, message: `已选择选项 ${options[optionIndex].label}`, severity: 'info', autoHideDuration: 1000 });
        }
      }
      
      // ESC键：退出全屏
      if (key === 'Escape' && fullscreen && onExitFullscreen) {
        e.preventDefault();
        onExitFullscreen();
      }
      
      // Enter键：如果有答案且不是最后一题则跳转，否则提示
      if (key === 'Enter') {
        e.preventDefault();
        if (answers[currentQ.id]) {
          if (currentIndex < questions.length - 1) {
            handleNext();
          } else {
            setSnackbar({ open: true, message: '已是最后一题，请点击提交按钮', severity: 'info', autoHideDuration: 1500 });
          }
        } else {
          setSnackbar({ open: true, message: '请先选择答案', severity: 'warning', autoHideDuration: 1500 });
        }
      }
      
      // 左箭头：上一题（始终可用）
      if (key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) handlePrev();
      }
      
      // 右箭头：下一题（始终可用）
      if (key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < questions.length - 1) handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, answers, loading, showResult, openDialog, showTranslator, fullscreen]);

  const getDataSourceName = () => {
    const names = { 'default': '默认题库', 'master': '默认题库', '中考': '中考真题库', '高考': '高考真题库', '专项': '语法专项库' };
    return names[dataSource] || dataSource;
  };

  const getDrawTypeText = (type) => {
    const map = { 'new': '抽取新题', 'custom': '智能抽取', 'range': '范围抽取', 'redo': '错题重做' };
    return map[type] || '智能抽取';
  };

  const checkAnswer = (question) => answers[question.id] === question.correct;

  // 修改 handleAnswerChange 以通知父组件
  const handleAnswerChange = (questionId, value) => {
    if (answers[questionId]) {
      setSnackbar({ open: true, message: '答案已选择，不能修改', severity: 'warning', autoHideDuration: 1500 });
      return;
    }
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    // 通知父组件答案已更新
    if (onAnswerChange) {
      onAnswerChange(newAnswers);
    }
    setShowExplanation(true);
  };

  const handleWordClick = (word, e) => {
    if (e) e.stopPropagation();
    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}\s]$/g, "").trim();
    if (cleanedWord && /^[a-zA-Z'\-]+$/.test(cleanedWord) && cleanedWord.length >= 2) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('./')) {
      return `https://www.ddstudent.xyz/server/src/1_english/resource/english_test_select_master/${imagePath.substring(2)}`;
    }
    if (imagePath.startsWith('/pic/')) {
      return `https://www.ddstudent.xyz/server/src/1_english/resource/english_test_select_master/${imagePath.substring(1)}`;
    }
    return imagePath;
  };

  const renderClickableText = (text) => {
    if (!text) return text;
    const parts = text.split(/(\b[a-zA-Z'\-]+\b)/g);
    return parts.map((part, index) => {
      if (/^[a-zA-Z'\-]+$/.test(part) && part.length >= 2) {
        return (
          <span key={index} onClick={(e) => handleWordClick(part, e)} style={{ cursor: 'pointer', color: '#000000', display: 'inline-block' }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // 获取选项完整文本（字母+内容）
  const getFullOptionText = (question, optionLabel) => {
    const option = question.options?.find(opt => opt.label === optionLabel);
    if (option) {
      return `${option.label}. ${option.text}`;
    }
    return optionLabel;
  };

  // 修改 handlePrev 和 handleNext 以通知父组件
  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      if (onIndexChange) onIndexChange(newIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      if (onIndexChange) onIndexChange(newIndex);
    }
  };

  const handleJumpTo = (index) => {
    setCurrentIndex(index);
    if (onIndexChange) onIndexChange(index);
  };

  // 提交答案
  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      setSnackbar({ open: true, message: `还有 ${unanswered.length} 道题未作答`, severity: 'warning' });
      return;
    }

    setLoading(true);
    const totalSeconds = Math.round((new Date() - testStartTime) / 1000);

    try {
      if (isRedoMode) {
        console.log('错题重做模式：本地练习，不上传结果');
        
        const correctCount = questions.filter(q => {
          const userAnswer = answers[q.id] || '';
          return userAnswer === q.correct;
        }).length;
        
        const localStats = {
          totalAttempts: 0,
          accuracy: correctCount / questions.length,
          weakCount: questions.length - correctCount,
          isRedoMode: true
        };
        
        setTimeSpent(totalSeconds);
        setServerStats(localStats);
        setShowResult(true);
        
        // 通知父组件完成
        if (onSubmitComplete) {
          onSubmitComplete(answers, totalSeconds);
        }
        console.log('错题重做完成，显示本地结果');
      } else {
        console.log('正常模式：提交答案到服务器');
        const response = await questionApi.submitAnswers(answers, totalSeconds, dataSource);
        console.log('提交响应:', response);
        
        if (response.flag === 1) {
          setTimeSpent(totalSeconds);
          setServerStats(response.content?.stats || null);
          setShowResult(true);
          
          // 通知父组件完成
          if (onSubmitComplete) {
            onSubmitComplete(answers, totalSeconds);
          }
          console.log('设置结果显示状态为 true');
        } else {
          setSnackbar({ open: true, message: response.message || '提交失败', severity: 'error' });
        }
      }
    } catch (error) {
      console.error('提交失败:', error);
      setSnackbar({ open: true, message: '网络错误，请稍后重试', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 重新挑战 - 重新做当前所选题目
  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setTestStartTime(new Date());
    setShowResult(false);
    setServerStats(null);
    setShowExplanation(true);
    
    // 通知父组件答案已重置
    if (onAnswerChange) {
      onAnswerChange({});
    }
    if (onIndexChange) {
      onIndexChange(0);
    }
    
    if (onComplete) {
      if (originalDrawType === 'range') {
        onComplete('range', null, {
          start: originalRangeStart,
          end: originalRangeEnd
        });
      } else if (originalDrawType === 'new') {
        onComplete('new');
      } else if (originalDrawType === 'custom') {
        onComplete('custom');
      } else {
        onComplete(originalDrawType);
      }
    }
  };

  const handleViewDetail = (question) => {
    if (!answers[question.id]) {
      setSnackbar({ open: true, message: '请先回答本题再查看详情', severity: 'info' });
      return;
    }
    setSelectedQuestion(question);
    setOpenDialog(true);
  };

  const handleBack = () => {
    setShowResult(false);
    setCurrentIndex(0);
  };

  const toggleExplanation = () => setShowExplanation(prev => !prev);

  // 处理错题重做
  const handleRedoWrongQuestions = (wrongQuestions) => {
    if (onComplete) {
      const redoQuestions = wrongQuestions.map(q => ({
        ...q,
        _redoMode: true
      }));
      onComplete('redo', redoQuestions);
    }
  };

  // 处理换一批
  const handleNewBatch = () => {
    if (onComplete) {
      if (originalDrawType === 'range') {
        onComplete('range', null, {
          start: originalRangeStart,
          end: originalRangeEnd
        });
      } else if (originalDrawType === 'new') {
        onComplete('new');
      } else {
        onComplete(originalDrawType);
      }
    }
  };

  const getLearningAdvice = (question) => {
    const adviceMap = {
      '名词复数': '名词复数规则：一般加s，以s/x/ch/sh加es，辅音+y变ies，f/fe变ves',
      '形容词': '形容词用于描述名词，注意比较级和最高级的用法',
      '动词': '注意动词的时态变化和主谓一致',
      '语法': '建议复习相关语法规则',
      '情态动词': 'can(能力), must(必须), may(可能)'
    };
    return adviceMap[question.category] || '建议复习相关知识点，多做类似题目';
  };

  const getMasteryInfo = (masteryLevel) => {
    if (masteryLevel >= 0.8) return { text: '已掌握', color: '#4caf50', icon: <EmojiEvents sx={{ fontSize: 16 }} /> };
    if (masteryLevel >= 0.5) return { text: '复习中', color: '#ff9800', icon: <Refresh sx={{ fontSize: 16 }} /> };
    if (masteryLevel > 0) return { text: '薄弱', color: '#f44336', icon: <Lightbulb sx={{ fontSize: 16 }} /> };
    return { text: '新题', color: '#2196f3', icon: <Star sx={{ fontSize: 16 }} /> };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '暂无';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const currentMastery = currentQuestion ? questionMastery[currentQuestion.id] : null;
  const isCurrentAnswered = currentQuestion ? !!answers[currentQuestion.id] : false;
  const isCurrentCorrect = currentQuestion && isCurrentAnswered ? checkAnswer(currentQuestion) : false;

  const formatAnswerText = (text) => text?.replace(/;(\S)/g, '; $1');

  const getCurrentAnswerText = () => {
    if (!currentQuestion || !answers[currentQuestion.id]) return '';
    const option = currentQuestion.options.find(opt => opt.label === answers[currentQuestion.id]);
    return option ? `${option.label}. ${formatAnswerText(option.text)}` : answers[currentQuestion.id];
  };

  const hasValidRange = drawType === 'range' && rangeStart && rangeEnd && rangeEnd >= rangeStart;

  // 初始加载中
  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={40} sx={{ color: '#000000' }} />
        <Typography sx={{ ml: 2, color: '#666666' }}>等待题目加载...</Typography>
      </Box>
    );
  }

  // 无题目
  if (questions.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid #eaeaea' }}>
          <Typography variant="body1" gutterBottom>暂无题目，请返回选择抽取模式</Typography>
        </Paper>
      </Box>
    );
  }

  // 结果显示
  if (showResult) {
    console.log('显示结果页面，题目数量:', questions.length);
    return (
      <SingleChoiceResult
        questions={questions}
        answers={answers}
        timeSpent={timeSpent}
        serverStats={serverStats}
        testTitle={`${getDataSourceName()} - ${hasValidRange ? `第 ${rangeStart}-${rangeEnd} 题` : getDrawTypeText(drawType)}${isRedoMode ? ' (错题重做)' : ''}`}
        onRestart={handleRestart}
        onBack={handleBack}
        onNewBatch={handleNewBatch}
        onRedoWrongQuestions={handleRedoWrongQuestions}
        dataSource={dataSource}
        drawType={isRedoMode ? 'redo' : drawType}
        questionCount={originalQuestionCount}
        startRange={originalRangeStart}
        endRange={originalRangeEnd}
        isRedoMode={isRedoMode}
      />
    );
  }

  // 答题界面
  return (
    <Box ref={containerRef} sx={{ height: fullscreen ? '100%' : 'auto', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
      {/* 顶部信息栏 - 添加键盘使用说明 */}
      <Box sx={{ px: 2, py: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: '#666666' }}>
            {isRedoMode ? '📌 错题重做模式' : (hasValidRange ? `📌 第 ${rangeStart}-${rangeEnd} 题 (${questions.length}题)` : `📌 模式: ${getDrawTypeText(drawType)} · ${questionCount}题`)}
          </Typography>
          
          {/* 键盘使用说明 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
              ⌨️
            </Typography>
            <Chip 
              label="1 2 3 4" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#fff' }}
            />
            <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>= 选答案</Typography>
            <Chip 
              label="Enter" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#fff' }}
            />
            <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>= 下一题</Typography>
            <Chip 
              label="← →" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#fff' }}
            />
            <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>= 切换题目</Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#666666' }}>{getDataSourceName()}</Typography>
          {fullscreen && onExitFullscreen && (
            <Tooltip title="退出全屏 (ESC)">
              <IconButton size="small" onClick={onExitFullscreen} sx={{ color: '#666666' }}>
                <FullscreenExit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* 进度条 */}
      <LinearProgress variant="determinate" value={progress} sx={{ height: 2, bgcolor: '#eaeaea', '& .MuiLinearProgress-bar': { bgcolor: '#000000' } }} />

      {/* 主要内容 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, sm: 3 } }}>
        {currentQuestion && (
          <Zoom in={true} key={currentIndex}>
            <Card elevation={0} sx={{ border: 'none' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                {/* 题目标题 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ color: '#888888' }}>
                      第 {currentIndex + 1}/{questions.length} 题
                    </Typography>
                    {currentQuestion.category && (
                      <Chip label={currentQuestion.category} size="small" sx={{ borderRadius: 0, bgcolor: '#f5f5f5', height: 20 }} />
                    )}
                    {!isRedoMode && currentMastery?.total_attempts > 0 && (
                      <Tooltip title={`掌握程度: ${Math.round(currentMastery.mastery_level * 100)}%`}>
                        <Chip icon={<History sx={{ fontSize: 12 }} />} label={`${Math.round(currentMastery.mastery_level * 100)}%`} size="small" />
                      </Tooltip>
                    )}
                    {isCurrentAnswered && (
                      <Chip 
                        label={isCurrentCorrect ? "已答✓" : "已答✗"} 
                        size="small" 
                        color={isCurrentCorrect ? "success" : "error"}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => { setTranslateWord(''); setShowTranslator(true); }} sx={{ color: '#000000' }}>
                      <Translate />
                    </IconButton>
                    <Button size="small" onClick={toggleExplanation} startIcon={<Lightbulb />} variant={showExplanation ? "contained" : "text"}
                      sx={{ borderRadius: 0, bgcolor: showExplanation ? '#000000' : 'transparent', color: showExplanation ? '#ffffff' : '#666666' }}>
                      解析
                    </Button>
                  </Box>
                </Box>

                {/* 题目内容 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#666666' }}>题目：</Typography>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, lineHeight: 1.8, fontWeight: 400 }}>
                    {renderClickableText(currentQuestion.question)}
                  </Typography>
                </Box>

                {/* 选项区域 */}
                <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                  <RadioGroup value={answers[currentQuestion.id] || ''} onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}>
                    <Grid container spacing={1.5}>
                      {currentQuestion.options.map((option) => {
                        const isSelected = answers[currentQuestion.id] === option.label;
                        const isDisabled = !!answers[currentQuestion.id];
                        return (
                          <Grid item xs={12} key={option.label}>
                            <Paper variant="outlined" sx={{
                              p: 2, 
                              bgcolor: isDisabled ? '#f9f9f9' : '#ffffff', 
                              borderColor: isSelected ? '#000000' : '#dddddd', 
                              borderWidth: isSelected ? 2 : 1,
                              cursor: isDisabled ? 'not-allowed' : 'pointer', 
                              opacity: isDisabled ? 0.8 : 1,
                              '&:hover': { 
                                borderColor: isDisabled ? '#dddddd' : '#000000', 
                                bgcolor: isDisabled ? '#f9f9f9' : '#f5f5f5' 
                              }
                            }} 
                            onClick={() => !isDisabled && handleAnswerChange(currentQuestion.id, option.label)}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  borderRadius: '50%', 
                                  border: `2px solid ${isSelected ? '#000000' : '#cccccc'}`, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  bgcolor: isSelected ? '#000000' : 'transparent' 
                                }}>
                                  {isSelected && <CheckCircleOutline sx={{ color: '#ffffff', fontSize: 16 }} />}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body1" sx={{ color: '#333333' }}>
                                    <Box component="span" sx={{ fontWeight: 500, mr: 1 }}>{option.label}.</Box>
                                    {!option.image?.url && renderClickableText(option.text)}
                                  </Typography>
                                  {option.image?.url && (
                                    <Box sx={{ mt: 1 }}>
                                      <img src={getImageUrl(option.image.url)} alt={option.image.alt || option.text} style={{ maxWidth: '150px', maxHeight: '100px', borderRadius: '4px' }} />
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </RadioGroup>
                </FormControl>
                <Box sx={{ height: 120 }} />
              </CardContent>
            </Card>
          </Zoom>
        )}
      </Box>

      {/* 底部导航栏 */}
      <Paper elevation={0} sx={{ position: 'sticky', bottom: 0, borderTop: '1px solid #eaeaea', bgcolor: '#ffffff', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 'lg', mx: 'auto' }}>
          <Button variant="outlined" onClick={handlePrev} disabled={currentIndex === 0 || loading} startIcon={<KeyboardArrowLeft />} sx={{ minWidth: 100 }}>上一题</Button>
          <IconButton onClick={() => handleViewDetail(currentQuestion)} disabled={!answers[currentQuestion?.id]} sx={{ color: '#000000' }}><MenuBook /></IconButton>
          {currentIndex === questions.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit} disabled={loading || Object.keys(answers).length !== questions.length} sx={{ bgcolor: '#000000', minWidth: 100 }}>{loading ? '提交中' : '提交'}</Button>
          ) : (
            <Button variant="contained" onClick={handleNext} endIcon={<KeyboardArrowRight />} sx={{ bgcolor: '#000000', minWidth: 100 }}>下一题</Button>
          )}
        </Box>

        {/* 题号圆点 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
          {questions.map((_, index) => {
            const isAnswered = answers[questions[index]?.id];
            const isCurrent = index === currentIndex;
            let bgColor = '#e0e0e0';
            if (isAnswered) bgColor = answers[questions[index]?.id] === questions[index]?.correct ? '#4caf50' : '#f44336';
            return (
              <Box 
                key={index} 
                onClick={() => handleJumpTo(index)} 
                sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: isCurrent ? '#000000' : bgColor, 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.2)' }
                }} 
              />
            );
          })}
        </Box>
      </Paper>

      {/* 解析悬浮层 */}
      {isCurrentAnswered && showExplanation && (
        <Paper variant="outlined" sx={{
          position: 'fixed', bottom: 120, left: { xs: 8, sm: 16 }, right: { xs: 8, sm: 16 }, maxWidth: 700, mx: 'auto', p: 2.5,
          bgcolor: isCurrentCorrect ? '#f0f9f0' : '#fff5f5', border: `2px solid ${isCurrentCorrect ? '#4caf50' : '#f44336'}`, zIndex: 30,
          maxHeight: '50vh', overflow: 'auto'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isCurrentCorrect ? <CheckCircle sx={{ color: '#4caf50' }} /> : <Cancel sx={{ color: '#f44336' }} />}
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{isCurrentCorrect ? '回答正确' : '回答错误'}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowExplanation(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          
          {/* 你的答案 */}
          <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              你的回答：
            </Typography>
            <Typography variant="body2" sx={{ color: '#d32f2f' }}>
              {getCurrentAnswerText()}
            </Typography>
          </Box>
          
          {/* 正确答案 */}
          <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              正确答案：
            </Typography>
            <Typography variant="body2" sx={{ color: '#2e7d32' }}>
              {getFullOptionText(currentQuestion, currentQuestion.correct)}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          {/* 题目解析 */}
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>解析：</strong> {renderClickableText(currentQuestion.explanation)}
          </Typography>
          
          {!isCurrentCorrect && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff3e0', borderRadius: 1 }}>
              <Typography variant="caption">💡 {getLearningAdvice(currentQuestion)}</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* 题目详情对话框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>题目详解</DialogTitle>
        <DialogContent>
          {selectedQuestion && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>{renderClickableText(selectedQuestion.question)}</Typography>
              <Typography variant="subtitle2">正确答案：{getFullOptionText(selectedQuestion, selectedQuestion.correct)}</Typography>
              <Typography variant="body2" sx={{ mt: 2 }}><strong>解析：</strong> {renderClickableText(selectedQuestion.explanation)}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>关闭</Button></DialogActions>
      </Dialog>

      <WordTranslator open={showTranslator} onClose={() => setShowTranslator(false)} word={translateWord} />

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SingleChoiceTest;