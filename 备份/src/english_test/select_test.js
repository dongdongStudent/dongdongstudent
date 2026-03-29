// src/pages/select_test.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
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
  Fade,
  Zoom
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  Help,
  MenuBook,
  History,
  Translate,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  CheckCircleOutline,
  Lightbulb,
  Close as CloseIcon,
  RadioButtonUnchecked,
  AccessTime,
  TrendingUp,
  Star,
  EmojiEvents
} from '@mui/icons-material';
import { questionApi } from './api';
import SingleChoiceResult from './select_test_result';
import WordTranslator from '../translator/translator.js';

const SingleChoiceTest = ({
  dataSource = 'default',
  fullscreen = false,
  onUnfinishedWork,
  // 新增参数
  drawType = 'smart',
  questionCount = 10,
  startRange = null,  // 改为 null 而不是 1
  endRange = null,    // 改为 null 而不是 10
  isCustomRange = false
}) => {
  // 状态管理
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [serverStats, setServerStats] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [currentDrawType, setCurrentDrawType] = useState(drawType);
  const [currentQuestionCount, setCurrentQuestionCount] = useState(questionCount);
  const [currentIsCustomRange, setCurrentIsCustomRange] = useState(isCustomRange);
  const [currentStartRange, setCurrentStartRange] = useState(startRange);
  const [currentEndRange, setCurrentEndRange] = useState(endRange);
  const [availableCount, setAvailableCount] = useState(0); // 实际可用的题目数量

  // 题目历史掌握程度数据
  const [questionMastery, setQuestionMastery] = useState({});
  const [loadingMastery, setLoadingMastery] = useState(false);

  // 翻译相关状态
  const [showTranslator, setShowTranslator] = useState(false);
  const [translateWord, setTranslateWord] = useState('');

  const containerRef = useRef(null);

  // 监听父组件传递的参数变化
  useEffect(() => {
    console.log('【调试】参数变化:', { drawType, questionCount, isCustomRange, startRange, endRange, dataSource });

    // 更新本地状态
    setCurrentDrawType(drawType);
    setCurrentQuestionCount(questionCount);
    setCurrentIsCustomRange(isCustomRange);
    setCurrentStartRange(startRange);
    setCurrentEndRange(endRange);

    // 重新获取题目
    resetAllStates();
    
    // 判断是否有有效的范围
    const hasValidRange = isCustomRange && 
                         startRange !== null && 
                         endRange !== null && 
                         startRange > 0 && 
                         endRange > 0 && 
                         endRange >= startRange;
    
    if (hasValidRange) {
      // 有范围限制，调用范围API
      fetchQuestionsByRange(startRange, endRange);
    } else {
      // 没有范围限制，调用普通API
      fetchQuestionsByType(drawType, questionCount);
    }

    setSnackbar({
      open: true,
      message: `已切换到 ${getDrawTypeText(drawType)} 模式，正在加载题目...`,
      severity: 'info'
    });

    return () => {
      saveCurrentState();
    };
  }, [dataSource, drawType, questionCount, isCustomRange, startRange, endRange]);

  useEffect(() => {
    if (questions.length > 0) {
      fetchQuestionsMastery();
    }
  }, [questions]);

  // 获取题目历史掌握程度
  const fetchQuestionsMastery = async () => {
    if (questions.length === 0) return;

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
              accuracy: stat.accuracy || 0,
              last_practiced: stat.last_practiced || null,
              last_result: stat.last_result || null,
              streak: stat.streak || {
                current_correct: 0,
                current_wrong: 0,
                max_correct: 0,
                max_wrong: 0
              },
              time_stats: stat.time_stats || {
                avg_time: 0,
                fastest: 0,
                slowest: 0
              },
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

  const resetAllStates = () => {
    setQuestions([]);
    setAnswers({});
    setShowResult(false);
    setCurrentIndex(0);
    setTestStartTime(null);
    setTimeSpent(0);
    setServerStats(null);
    setShowAnswer(false);
    setError(null);
    setInitialLoading(true);
    setQuestionMastery({});
    setShowExplanation(true);
    setAvailableCount(0);
  };

  const saveCurrentState = () => {
    if (Object.keys(answers).length > 0 && !showResult) {
      const state = {
        dataSource,
        questions,
        answers,
        currentIndex,
        testStartTime,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('unfinishedTest', JSON.stringify(state));
      if (onUnfinishedWork) onUnfinishedWork();
    }
  };

  // 根据类型获取题目
  const fetchQuestionsByType = async (type, count) => {
    setLoading(true);
    setError(null);

    try {
      console.log('【调试】按类型获取题目:', { type, count, dataSource });
      const response = await questionApi.getQuestions(type, count, dataSource);

      if (response.flag === 1) {
        const newQuestions = response.content?.questions || [];
        console.log(`【调试】按类型获取到 ${newQuestions.length} 题`);
        
        // 为每个题目添加显示信息
        const questionsWithMeta = newQuestions.map((q, idx) => ({
          ...q,
          displayIndex: idx + 1, // 当前批次的序号
          originalNumber: parseInt(q.id?.split('_')[0] || '0') // 从ID中提取原始序号
        }));
        
        setQuestions(questionsWithMeta);
        setAnswers({});
        setCurrentIndex(0);
        setTestStartTime(new Date());
        setServerStats(response.content?.stats || null);
        setShowAnswer(false);
        setShowExplanation(true);
        setQuestionMastery({});
        setAvailableCount(newQuestions.length);

        localStorage.removeItem('unfinishedTest');

        setSnackbar({
          open: true,
          message: `成功获取 ${newQuestions.length} 道${getDrawTypeText(type)}`,
          severity: 'success'
        });
      } else {
        setError(response.message || '获取题目失败');
      }
    } catch (error) {
      console.error('获取题目失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // 根据范围获取题目 - 增强版（支持数量限制）
  const fetchQuestionsByRange = async (start, end) => {
    setLoading(true);
    setError(null);

    try {
      console.log('【调试】按范围获取题目:', { 
        start, 
        end, 
        dataSource, 
        drawType: currentDrawType,
        requestedCount: currentQuestionCount 
      });
      
      // 调用后端API，传入范围、抽取类型和题库
      const response = await questionApi.getQuestionsByRange(
        start, 
        end, 
        dataSource,  // bank
        currentDrawType  // type
      );

      console.log('【调试】API响应:', response);

      if (response.flag === 1) {
        // 从响应中获取题目 - 兼容不同的响应格式
        let selectedQuestions = [];
        
        // 尝试从不同的路径获取题目
        if (response.questions && Array.isArray(response.questions)) {
          selectedQuestions = response.questions;
        } else if (response.content?.questions && Array.isArray(response.content.questions)) {
          selectedQuestions = response.content.questions;
        } else if (Array.isArray(response)) {
          selectedQuestions = response;
        }
        
        console.log(`【调试】后端返回 ${selectedQuestions.length} 题`);
        
        // 如果符合条件的题目数量为0
        if (selectedQuestions.length === 0) {
          console.log('【调试】没有符合条件的题目，设置为空数组');
          setQuestions([]);
          setAnswers({});
          setCurrentIndex(0);
          
          setSnackbar({
            open: true,
            message: `第 ${start}-${end} 题范围内没有符合条件的${getDrawTypeText(currentDrawType)}`,
            severity: 'warning'
          });
          
          setLoading(false);
          setInitialLoading(false);
          return;
        }
        
        // 如果后端返回的题目数量超过请求数量，随机抽取请求数量
        if (selectedQuestions.length > currentQuestionCount) {
          console.log(`【调试】后端返回 ${selectedQuestions.length} 题，需要抽取 ${currentQuestionCount} 题`);
          
          // 随机打乱并取前 currentQuestionCount 个
          const shuffled = [...selectedQuestions].sort(() => 0.5 - Math.random());
          selectedQuestions = shuffled.slice(0, currentQuestionCount);
          
          console.log(`【调试】随机抽取后: ${selectedQuestions.length} 题`);
        }
        
        // 为每个题目添加显示信息
        const questionsWithMeta = selectedQuestions.map((q, idx) => ({
          ...q,
          displayIndex: idx + 1,
          originalNumber: parseInt(q.id?.split('_')[0] || '0')
        }));
        
        setQuestions(questionsWithMeta);
        setAnswers({});
        setCurrentIndex(0);
        setTestStartTime(new Date());
        
        // 从 response 中获取 stats
        const serverStats = response.stats || response.content?.stats || null;
        setServerStats(serverStats);
        
        setShowAnswer(false);
        setShowExplanation(true);
        setQuestionMastery({});

        localStorage.removeItem('unfinishedTest');

        // 根据抽取数量与请求数量的关系显示不同提示
        if (selectedQuestions.length < currentQuestionCount) {
          setSnackbar({
            open: true,
            message: `第 ${start}-${end} 题范围内只有 ${selectedQuestions.length} 道${getDrawTypeText(currentDrawType)}，已全部加载`,
            severity: 'info'
          });
        } else {
          setSnackbar({
            open: true,
            message: `成功从第 ${start}-${end} 题中抽取 ${selectedQuestions.length} 道${getDrawTypeText(currentDrawType)}`,
            severity: 'success'
          });
        }
      } else {
        setError(response.message || '获取题目失败');
      }
    } catch (error) {
      console.error('获取题目范围失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const getDataSourceName = () => {
    const names = {
      'default': '默认题库',
      'master': '默认题库',
      '中考': '中考真题库',
      '高考': '高考真题库',
      '专项': '语法专项库'
    };
    return names[dataSource] || dataSource;
  };

  const getDrawTypeText = (type) => {
    const map = {
      'smart': '智能推荐',
      'weak': '薄弱题目',
      'new': '新题目',
      'review': '复习题目',
      'mastered': '已掌握',
      'random': '随机抽取',
      'custom': '自定义范围'
    };
    return map[type] || '智能推荐';
  };

  const checkAnswer = (question) => answers[question.id] === question.correct;

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    setShowAnswer(true);
    setShowExplanation(true);

    setTimeout(() => saveCurrentState(), 500);
  };

  const handleWordClick = (word, e) => {
    if (e) e.stopPropagation();

    const cleanedWord = word.replace(/[.,!?;:"()\[\]{}]$/g, "").trim();
    if (cleanedWord && /^[a-zA-Z'\-]+$/.test(cleanedWord) && cleanedWord.length >= 2) {
      setTranslateWord(cleanedWord);
      setShowTranslator(true);
    }
  };

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
              borderBottom: '1px solid #000000',
              transition: 'border-bottom 0.2s',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => e.target.style.borderBottom = '2px solid #000000'}
            onMouseLeave={(e) => e.target.style.borderBottom = '1px solid #000000'}
            title="点击翻译"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      setSnackbar({
        open: true,
        message: `还有 ${unanswered.length} 道题未作答`,
        severity: 'warning'
      });
      return;
    }

    setLoading(true);

    const endTime = new Date();
    const totalSeconds = Math.round((endTime - testStartTime) / 1000);

    try {
      const response = await questionApi.submitAnswers(answers, totalSeconds, dataSource);

      if (response.flag === 1) {
        setTimeSpent(totalSeconds);
        setServerStats(response.content?.stats || null);
        setShowResult(true);
        localStorage.removeItem('unfinishedTest');
      } else {
        setSnackbar({ open: true, message: response.message || '提交失败', severity: 'error' });
      }
    } catch (error) {
      console.error('提交失败:', error);
      setSnackbar({ open: true, message: '网络错误，请稍后重试', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    // 判断是否有有效的范围
    const hasValidRange = currentIsCustomRange && 
                         currentStartRange !== null && 
                         currentEndRange !== null && 
                         currentStartRange > 0 && 
                         currentEndRange > 0 && 
                         currentEndRange >= currentStartRange;
    
    if (hasValidRange) {
      fetchQuestionsByRange(currentStartRange, currentEndRange);
    } else {
      fetchQuestionsByType(currentDrawType, currentQuestionCount);
    }
    setShowResult(false);
  };

  const handleRefresh = () => {
    // 判断是否有有效的范围
    const hasValidRange = currentIsCustomRange && 
                         currentStartRange !== null && 
                         currentEndRange !== null && 
                         currentStartRange > 0 && 
                         currentEndRange > 0 && 
                         currentEndRange >= currentStartRange;
    
    if (hasValidRange) {
      fetchQuestionsByRange(currentStartRange, currentEndRange);
    } else {
      fetchQuestionsByType(currentDrawType, currentQuestionCount);
    }
    setShowResult(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(!!answers[questions[currentIndex - 1]?.id]);
      setShowExplanation(!!answers[questions[currentIndex - 1]?.id]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(!!answers[questions[currentIndex + 1]?.id]);
      setShowExplanation(!!answers[questions[currentIndex + 1]?.id]);
    }
  };

  const handleJumpTo = (index) => {
    setCurrentIndex(index);
    setShowAnswer(!!answers[questions[index]?.id]);
    setShowExplanation(!!answers[questions[index]?.id]);
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

  const toggleExplanation = () => {
    setShowExplanation(prev => !prev);
  };

  const getLearningAdvice = (question) => {
    const category = question.category;
    const tags = question.tags || [];

    const adviceMap = {
      '名词复数': '名词复数规则：一般加s，以s/x/ch/sh加es，辅音+y变ies，f/fe变ves',
      '形容词': '形容词用于描述名词，注意比较级和最高级的用法',
      '动词': '注意动词的时态变化和主谓一致',
      '语法': '建议复习相关语法规则',
      '固定搭配': '固定搭配需要记忆，可以制作闪卡复习',
      '动词短语': '动词短语是高频考点，注意介词的选择',
      '疑问词': 'what(什么), where(哪里), why(为什么), when(何时), who(谁), how(如何)',
      '宾语从句': '宾语从句要注意语序和引导词的选择',
      '情态动词': 'can(能力), must(必须), may(可能)',
      '代词': '分清主格、宾格、物主代词'
    };

    if (adviceMap[category]) return adviceMap[category];
    if (tags.includes('不规则变化')) return '这是不规则变化，需要特别记忆';
    if (tags.includes('语境理解')) return '需要结合上下文理解，多读几遍句子';
    return '建议复习相关知识点，多做类似题目';
  };

  // 获取掌握程度文本和颜色
  const getMasteryInfo = (masteryLevel) => {
    if (masteryLevel >= 0.8) {
      return { text: '已掌握', color: '#4caf50', icon: <EmojiEvents sx={{ fontSize: 16 }} /> };
    } else if (masteryLevel >= 0.5) {
      return { text: '复习中', color: '#ff9800', icon: <Refresh sx={{ fontSize: 16 }} /> };
    } else if (masteryLevel > 0) {
      return { text: '薄弱', color: '#f44336', icon: <Lightbulb sx={{ fontSize: 16 }} /> };
    } else {
      return { text: '新题', color: '#2196f3', icon: <Star sx={{ fontSize: 16 }} /> };
    }
  };

  // 格式化时间
  const formatTime = (seconds) => {
    if (!seconds) return '暂无数据';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '暂无';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const correctCount = questions.filter(q => checkAnswer(q)).length;
  const currentMastery = currentQuestion ? questionMastery[currentQuestion.id] : null;
  const isCurrentAnswered = currentQuestion ? !!answers[currentQuestion.id] : false;
  const isCurrentCorrect = currentQuestion && isCurrentAnswered ? checkAnswer(currentQuestion) : false;

  // 获取当前用户的答案文本
  const getCurrentAnswerText = () => {
    if (!currentQuestion || !answers[currentQuestion.id]) return '';
    const answerLabel = answers[currentQuestion.id];
    const option = currentQuestion.options.find(opt => opt.label === answerLabel);
    return option ? `${answerLabel}. ${option.text}` : answerLabel;
  };

  // 判断是否有有效的范围
  const hasValidRange = currentIsCustomRange && 
                       currentStartRange !== null && 
                       currentEndRange !== null && 
                       currentStartRange > 0 && 
                       currentEndRange > 0 && 
                       currentEndRange >= currentStartRange;

  // 初始加载中显示
  if (initialLoading) {
    return (
      <Box sx={{
        height: fullscreen ? '100%' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8
      }}>
        <CircularProgress size={40} sx={{ color: '#000000' }} />
        <Typography sx={{ ml: 2, color: '#666666' }}>
          {hasValidRange
            ? `正在从第 ${currentStartRange}-${currentEndRange} 题中筛选${getDrawTypeText(currentDrawType)}...`
            : `正在加载 ${getDrawTypeText(currentDrawType)}...`}
        </Typography>
      </Box>
    );
  }

  // 错误显示
  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid #eaeaea' }}>
          <Typography variant="body1" gutterBottom>{error}</Typography>
          <Button variant="outlined" onClick={handleRefresh} startIcon={<Refresh />} sx={{ mt: 2 }}>
            重试
          </Button>
        </Paper>
      </Box>
    );
  }

  // 结果显示页面
  if (showResult) {
    return (
      <SingleChoiceResult
        questions={questions}
        answers={answers}
        timeSpent={timeSpent}
        serverStats={serverStats}
        testTitle={`${getDataSourceName()} - ${hasValidRange ? `第 ${currentStartRange}-${currentEndRange} 题中的 ${questions.length} 道${getDrawTypeText(currentDrawType)}` : getDrawTypeText(currentDrawType)}`}
        onRestart={handleRestart}
        onBack={handleBack}
        onNewBatch={handleRefresh}
        dataSource={dataSource}
        startTime={testStartTime}
        drawType={currentDrawType}
        questionCount={currentQuestionCount}
        startRange={currentStartRange}
        endRange={currentEndRange}
        isCustomRange={hasValidRange}
      />
    );
  }

  // 如果没有题目
  if (questions.length === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid #eaeaea' }}>
          <Typography variant="body1" gutterBottom>
            {hasValidRange
              ? `第 ${currentStartRange}-${currentEndRange} 题范围内没有符合条件的${getDrawTypeText(currentDrawType)}`
              : `暂无符合条件的${getDrawTypeText(currentDrawType)}`}
          </Typography>
          <Button variant="outlined" onClick={handleRefresh} startIcon={<Refresh />} sx={{ mt: 2 }}>
            重新加载
          </Button>
        </Paper>
      </Box>
    );
  }

  // 沉浸式答题界面
  return (
    <Box
      ref={containerRef}
      sx={{
        height: fullscreen ? '100%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        position: 'relative'
      }}
    >
      {/* 顶部信息栏 - 显示当前抽取模式 */}
      <Box sx={{
        px: 2,
        py: 1,
        bgcolor: '#f5f5f5',
        borderBottom: '1px solid #eaeaea',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="caption" sx={{ color: '#666666' }}>
          {hasValidRange
            ? `📌 第 ${currentStartRange}-${currentEndRange} 题中的 ${questions.length} 道${getDrawTypeText(currentDrawType)}`
            : `📌 抽取模式: ${getDrawTypeText(currentDrawType)} · 每次 ${currentQuestionCount} 题`}
        </Typography>
        <Typography variant="caption" sx={{ color: '#666666' }}>
          {getDataSourceName()}
        </Typography>
      </Box>

      {/* 顶部进度条 */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: '#ffffff',
        borderBottom: '1px solid #eaeaea'
      }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 2,
            bgcolor: '#eaeaea',
            '& .MuiLinearProgress-bar': { bgcolor: '#000000' }
          }}
        />
      </Box>

      {/* 主要内容区 */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: { xs: 2, sm: 3 }
      }}>
        {currentQuestion && (
          <Zoom in={true} key={currentIndex}>
            <Card elevation={0} sx={{ border: 'none' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                {/* 题目标题 - 显示序号 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ color: '#888888' }}>
                      第 {currentIndex + 1}/{questions.length} 题
                      {currentQuestion.originalNumber > 0 && (
                        <span style={{ marginLeft: '8px', color: '#999', fontSize: '0.9em' }}>
                          (原题号: {currentQuestion.originalNumber})
                        </span>
                      )}
                    </Typography>
                    {currentQuestion.category && (
                      <Chip
                        label={currentQuestion.category}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          bgcolor: '#f5f5f5',
                          height: 20,
                          '& .MuiChip-label': { fontSize: '0.7rem', px: 1 }
                        }}
                      />
                    )}
                    {currentMastery?.total_attempts > 0 && (
                      <Tooltip title={`历史掌握程度: ${Math.round(currentMastery.mastery_level * 100)}%`}>
                        <Chip
                          icon={<History sx={{ fontSize: 12 }} />}
                          label={`${Math.round(currentMastery.mastery_level * 100)}%`}
                          size="small"
                          sx={{
                            borderRadius: 0,
                            bgcolor: '#f0f0f0',
                            height: 20,
                            '& .MuiChip-label': { fontSize: '0.7rem', px: 1 }
                          }}
                        />
                      </Tooltip>
                    )}
                    {hasValidRange && (
                      <Chip
                        label={`从第 ${currentStartRange}-${currentEndRange} 题中筛选`}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          bgcolor: '#e0e0e0',
                          height: 20,
                          '& .MuiChip-label': { fontSize: '0.7rem', px: 1 }
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="翻译">
                      <IconButton
                        size="small"
                        onClick={() => { setTranslateWord(''); setShowTranslator(true); }}
                        sx={{ color: '#000000' }}
                      >
                        <Translate />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      onClick={toggleExplanation}
                      startIcon={<Lightbulb />}
                      variant={showExplanation ? "contained" : "text"}
                      sx={{
                        borderRadius: 0,
                        bgcolor: showExplanation ? '#000000' : 'transparent',
                        color: showExplanation ? '#ffffff' : '#666666',
                        '&:hover': {
                          bgcolor: showExplanation ? '#333333' : '#f5f5f5'
                        }
                      }}
                    >
                      解析
                    </Button>
                  </Box>
                </Box>

                {/* 题目内容 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#666666' }}>
                    题目：
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      lineHeight: 1.8,
                      fontWeight: 400
                    }}
                  >
                    {renderClickableText(currentQuestion.question)}
                  </Typography>
                </Box>

                {/* 选项区域 - 无颜色变化 */}
                <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  >
                    <Grid container spacing={1.5}>
                      {currentQuestion.options.map((option) => {
                        const isSelected = answers[currentQuestion.id] === option.label;

                        return (
                          <Grid item xs={12} key={option.label}>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                bgcolor: '#ffffff',
                                borderColor: isSelected ? '#000000' : '#dddddd',
                                borderWidth: isSelected ? 2 : 1,
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                  borderColor: '#000000',
                                  bgcolor: '#f5f5f5'
                                }
                              }}
                              onClick={() => !showAnswer && handleAnswerChange(currentQuestion.id, option.label)}
                            >
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
                                  {isSelected && (
                                    <CheckCircleOutline sx={{ color: '#ffffff', fontSize: 16 }} />
                                  )}
                                </Box>
                                <Typography variant="body1" sx={{ flex: 1, color: '#333333' }}>
                                  <Box component="span" sx={{ fontWeight: 500, mr: 1 }}>
                                    {option.label}.
                                  </Box>
                                  {renderClickableText(option.text)}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </RadioGroup>
                </FormControl>

                {/* 空白区域 */}
                <Box sx={{ height: 120 }} />
              </CardContent>
            </Card>
          </Zoom>
        )}
      </Box>

      {/* 底部导航栏 - 题号圆点颜色区分 */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid #eaeaea',
          bgcolor: '#ffffff',
          p: 2,
          zIndex: 20
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 'lg',
          mx: 'auto'
        }}>
          <Button
            variant="outlined"
            onClick={handlePrev}
            disabled={currentIndex === 0 || loading}
            startIcon={<KeyboardArrowLeft />}
            sx={{
              borderRadius: 0,
              borderColor: '#dddddd',
              color: '#333333',
              minWidth: 100
            }}
          >
            上一题
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="查看详情">
              <IconButton
                onClick={() => handleViewDetail(currentQuestion)}
                disabled={!answers[currentQuestion?.id]}
                sx={{ color: '#000000' }}
              >
                <MenuBook />
              </IconButton>
            </Tooltip>
          </Box>

          {currentIndex === questions.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || Object.keys(answers).length !== questions.length}
              sx={{
                borderRadius: 0,
                bgcolor: '#000000',
                '&:hover': { bgcolor: '#333333' },
                minWidth: 100
              }}
            >
              {loading ? '提交中' : '提交'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1 || loading}
              endIcon={<KeyboardArrowRight />}
              sx={{
                borderRadius: 0,
                bgcolor: '#000000',
                '&:hover': { bgcolor: '#333333' },
                minWidth: 100
              }}
            >
              下一题
            </Button>
          )}
        </Box>

        {/* 题号导航 - 小圆点 - 正确绿色，错误红色，未答灰色 */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1.5,
          mt: 2,
          flexWrap: 'wrap'
        }}>
          {questions.map((_, index) => {
            const isAnswered = answers[questions[index]?.id];
            const isCurrent = index === currentIndex;

            // 根据答题状态设置颜色
            let bgColor = '#e0e0e0'; // 默认灰色（未答题）
            if (isAnswered) {
              const isCorrect = answers[questions[index]?.id] === questions[index]?.correct;
              bgColor = isCorrect ? '#4caf50' : '#f44336'; // 正确绿色，错误红色
            }

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
                  '&:hover': {
                    transform: 'scale(1.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }
                }}
              />
            );
          })}
        </Box>
      </Paper>

      {/* 固定解析悬浮层 - 添加个人回答信息和历史记录 */}
      {isCurrentAnswered && showExplanation && (
        <Paper
          variant="outlined"
          sx={{
            position: 'fixed',
            bottom: 120,
            left: { xs: 8, sm: 16 },
            right: { xs: 8, sm: 16 },
            maxWidth: 700,
            margin: '0 auto',
            p: 2.5,
            bgcolor: isCurrentCorrect ? '#f0f9f0' : '#fff5f5',
            border: `2px solid ${isCurrentCorrect ? '#4caf50' : '#f44336'}`,
            borderRadius: 1,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 30,
            mx: 'auto'
          }}
        >
          {/* 头部 - 回答状态和正确答案 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {isCurrentCorrect ? (
                <>
                  <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                    回答正确
                  </Typography>
                </>
              ) : (
                <>
                  <Cancel sx={{ color: '#f44336', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                    回答错误
                  </Typography>
                </>
              )}
              <Chip
                size="small"
                label={`正确答案：${currentQuestion.correct}`}
                sx={{
                  bgcolor: isCurrentCorrect ? '#c8e6c9' : '#ffcdd2',
                  color: isCurrentCorrect ? '#2e7d32' : '#d32f2f',
                  fontWeight: 500,
                  height: 24
                }}
              />
            </Box>
            <IconButton size="small" onClick={() => setShowExplanation(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* 个人回答信息 */}
          <Box sx={{
            mb: 2,
            p: 1.5,
            bgcolor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: 1
          }}>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666666', mb: 0.5 }}>
              <History sx={{ fontSize: 14 }} /> 你的回答
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#333333' }}>
              {getCurrentAnswerText()}
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: isCurrentCorrect ? '#4caf50' : '#f44336', opacity: 0.3 }} />

          {/* 解析内容 */}
          <Typography variant="body2" sx={{ lineHeight: 1.8, color: '#333333', mb: 2 }}>
            <strong>解析：</strong> {renderClickableText(currentQuestion.explanation)}
          </Typography>

          {/* 历史掌握程度信息 - 仅在有过历史记录时显示 */}
          {currentMastery && currentMastery.total_attempts > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />

              {/* 历史统计数据 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666666', mb: 1 }}>
                  <TrendingUp sx={{ fontSize: 14 }} /> 历史统计数据
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#888888' }}>掌握程度</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {getMasteryInfo(currentMastery.mastery_level).icon}
                        <Typography variant="body2" sx={{ fontWeight: 600, color: getMasteryInfo(currentMastery.mastery_level).color }}>
                          {Math.round(currentMastery.mastery_level * 100)}%
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#666666', fontSize: '0.65rem' }}>
                        {getMasteryInfo(currentMastery.mastery_level).text}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#888888' }}>练习次数</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {currentMastery.total_attempts}次
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#4caf50' }}>
                          正: {currentMastery.correct_count || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#f44336' }}>
                          误: {currentMastery.wrong_count || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#888888' }}>正确率</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {currentMastery.total_attempts > 0
                          ? Math.round((currentMastery.correct_count / currentMastery.total_attempts) * 100)
                          : 0}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={currentMastery.total_attempts > 0
                          ? (currentMastery.correct_count / currentMastery.total_attempts) * 100
                          : 0}
                        sx={{
                          height: 2,
                          mt: 0.5,
                          bgcolor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' }
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#888888' }}>连续记录</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#4caf50' }}>✓</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {currentMastery.streak?.current_correct || 0}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#f44336' }}>✗</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {currentMastery.streak?.current_wrong || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* 最近答题记录 */}
              {currentMastery.history && currentMastery.history.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666666', mb: 1 }}>
                    <AccessTime sx={{ fontSize: 14 }} /> 最近答题记录
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {currentMastery.history.slice(-5).reverse().map((record, idx) => (
                      <Tooltip
                        key={idx}
                        title={`${formatDate(record.date)} - ${record.result ? '正确' : '错误'}${record.time ? ` (${record.time}秒)` : ''}`}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: record.result ? '#4caf50' : '#f44336',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          {record.result ? (
                            <CheckCircle sx={{ color: '#ffffff', fontSize: 14 }} />
                          ) : (
                            <Cancel sx={{ color: '#ffffff', fontSize: 14 }} />
                          )}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 用时统计 */}
              {currentMastery.time_stats && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-around', bgcolor: '#fafafa', p: 1, borderRadius: 1 }}>
                  {currentMastery.time_stats.avg_time > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 14, color: '#666666' }} />
                      <Typography variant="caption">平均: {currentMastery.time_stats.avg_time}秒</Typography>
                    </Box>
                  )}
                  {currentMastery.time_stats.fastest > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CheckCircle sx={{ fontSize: 14, color: '#4caf50' }} />
                      <Typography variant="caption">最快: {currentMastery.time_stats.fastest}秒</Typography>
                    </Box>
                  )}
                  {currentMastery.time_stats.slowest > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Cancel sx={{ fontSize: 14, color: '#f44336' }} />
                      <Typography variant="caption">最慢: {currentMastery.time_stats.slowest}秒</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}

          {/* 学习建议 - 只在答错时显示 */}
          {!isCurrentCorrect && (
            <Box sx={{
              mt: 2,
              p: 1.5,
              bgcolor: '#fff3e0',
              border: '1px solid #ff9800',
              borderRadius: 1
            }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#e65100', mb: 0.5 }}>
                <Lightbulb sx={{ fontSize: 14 }} />
                学习建议
              </Typography>
              <Typography variant="body2" sx={{ color: '#e65100' }}>
                {getLearningAdvice(currentQuestion)}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* 题目详情对话框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eaeaea' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBook /> 题目详解
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedQuestion && (
            <>
              <Typography variant="body1" sx={{ mb: 3 }}>{renderClickableText(selectedQuestion.question)}</Typography>
              <Typography variant="subtitle2" gutterBottom>正确答案</Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedQuestion.correct}. {
                  selectedQuestion.options.find(opt => opt.label === selectedQuestion.correct)?.text
                }
              </Typography>
              <Typography variant="subtitle2" gutterBottom>详细解析</Typography>
              <Typography variant="body1">
                {renderClickableText(selectedQuestion.explanation)}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 翻译组件 */}
      <WordTranslator
        open={showTranslator}
        onClose={() => setShowTranslator(false)}
        word={translateWord}
      />

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            borderRadius: 0,
            border: '1px solid #000000',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SingleChoiceTest;