import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Paper, Typography, Box, Button,
  Stack, Chip, Grid, LinearProgress, Zoom,
  IconButton,
  Alert, useMediaQuery, useTheme
} from '@mui/material';
import {
  ArrowBack, Translate,
  AccessTime
} from '@mui/icons-material';
import { F_speak } from "../Function/weisimin.js";

/**
 * 翻译拼写核心练习组件
 * @param {Object} props
 * @param {Array} props.questions - 题目数据数组，格式: [{ english: "I am a student", chinese: "我是一名学生" }]
 * @param {string} props.title - 练习标题
 * @param {string} props.subtitle - 练习副标题
 * @param {Function} props.onComplete - 完成时的回调函数，参数: { score, totalQuestions, totalWords, timeSpent, accuracy, results }
 * @param {Function} props.onExit - 退出时的回调函数
 * @param {boolean} props.autoStart - 是否自动开始，默认true
 * @param {Object} props.sx - 自定义样式
 * @param {string|number} props.minHeight - 最小高度，默认 '400px'
 * @param {string|number} props.maxHeight - 最大高度，默认 '1080px'
 */
const TranslationPracticeCore = ({
  questions = [],
  title = "翻译拼写练习",
  subtitle = "",
  onComplete,
  onExit,
  autoStart = true,
  sx = {},
  minHeight = '400px',
  maxHeight = '1080px'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // --- 状态控制 ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userWords, setUserWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [score, setScore] = useState(100);
  const [hasFailed, setHasFailed] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isInitialized, setIsInitialized] = useState(false);
  const [contentHeight, setContentHeight] = useState('auto');

  // 添加开始时间记录
  const startTimeRef = useRef(null);
  const contentRef = useRef(null);

  // 实时时间刷新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 自适应高度
  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        setContentHeight(`${height}px`);
      }
    };

    updateHeight();
    // 当内容变化时更新高度
    const observer = new ResizeObserver(updateHeight);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => observer.disconnect();
  }, [currentIndex, userWords, availableWords, showAnswer]);

  // 初始化练习
  useEffect(() => {
    if (autoStart && questions.length > 0 && !isInitialized) {
      startPractice();
    }
  }, [questions, autoStart, isInitialized]);

  // 初始化题目逻辑
  const initSentence = useCallback((idx, data) => {
    const item = data[idx];
    if (!item) return;

    const wordsArray = item.english.split(' ').filter(w => w.trim().length > 0);
    const wordsObjects = wordsArray.map((w, i) => ({
      uid: `${idx}-${i}-${Math.random()}`,
      val: w
    }));

    setAvailableWords([...wordsObjects].sort(() => 0.5 - Math.random()));
    setUserWords([]);
    setShowAnswer(false);
  }, []);

  // 开始练习
  const startPractice = () => {
    if (questions.length === 0) {
      console.error('没有题目数据');
      return;
    }
    setCurrentIndex(0);
    setScore(100);
    setShowAnswer(false);
    initSentence(0, questions);
    startTimeRef.current = new Date();
    setIsInitialized(true);
  };

  // 重新开始
  const restartPractice = () => {
    setCurrentIndex(0);
    setScore(100);
    setShowAnswer(false);
    initSentence(0, questions);
    startTimeRef.current = new Date();
  };

  // 单词点击核验逻辑
  const handleWordClick = (wordObj) => {
    const targetWords = questions[currentIndex].english.split(' ').filter(w => w.trim().length > 0);

    if (wordObj.val === targetWords[userWords.length]) {
      const newWords = [...userWords, wordObj.val];
      setUserWords(newWords);
      setAvailableWords(prev => prev.filter(w => w.uid !== wordObj.uid));

      if (newWords.length === targetWords.length) {
        setTimeout(() => {
          if (currentIndex < questions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            initSentence(nextIdx, questions);
          } else {
            // 练习完成
            handlePracticeComplete();
          }
        }, 800);
      }
    } else {
      const totalWords = questions.reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0);
      const deductionPerWord = 100 / totalWords;
      const newScore = Math.max(0, score - deductionPerWord);
      setScore(Math.round(newScore * 100) / 100);
      setHasFailed(true);
      setTimeout(() => setHasFailed(false), 300);
    }
  };

  // 查看答案的扣分逻辑
  const handleShowAnswer = () => {
    if (!showAnswer) {
      const totalWords = questions.reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0);
      const deductionPerWord = 100 / totalWords;
      const targetWords = questions[currentIndex].english.split(' ').filter(w => w.trim().length > 0);
      const remainingWords = targetWords.length - userWords.length;
      const totalDeduction = deductionPerWord * remainingWords;
      const newScore = Math.max(0, score - totalDeduction);
      setScore(Math.round(newScore * 100) / 100);
      setShowAnswer(true);
    }
  };

  // 练习完成处理
  const handlePracticeComplete = () => {
    const endTime = new Date();
    const timeSpent = startTimeRef.current ? Math.round((endTime - startTimeRef.current) / 1000) : 0;

    const totalWords = questions.reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0);
    const totalErrors = Math.round((100 - score) / (100 / totalWords));
    const correctAnswers = totalWords - totalErrors;
    const accuracy = Math.round((correctAnswers / totalWords) * 100);

    // 准备结果数据
    const results = {
      score,
      totalQuestions: questions.length,
      totalWords,
      timeSpent,
      accuracy,
      correctAnswers,
      totalErrors,
      questions: questions.map((q, idx) => ({
        ...q,
        isCorrect: idx < currentIndex // 简化：实际应该记录每个句子的对错
      }))
    };

    if (onComplete) {
      onComplete(results);
    }
  };

  // 格式化时间
  const formatTime = (date) => date.toLocaleTimeString('zh-CN', { hour12: false });

  // 计算统计信息
  const totalWords = questions.reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0);
  const deductionPerWord = totalWords > 0 ? 100 / totalWords : 0;
  const currentSentenceWords = questions[currentIndex]?.english.split(' ').filter(w => w.trim().length > 0).length || 0;
  const remainingWords = currentSentenceWords - userWords.length;
  const hintDeduction = remainingWords * deductionPerWord;

  // 计算已答对单词数
  const totalAnsweredCorrectly = questions.slice(0, currentIndex).reduce((sum, q) => sum + q.english.split(' ').filter(w => w.trim().length > 0).length, 0) + userWords.length;

  // 计算错误次数
  const totalErrors = Math.round((100 - score) / deductionPerWord);

  // 如果没有题目数据
  if (questions.length === 0) {
    return (
      <Container 
        maxWidth="md" 
        sx={{ 
          mt: 5, 
          textAlign: 'center',
          minHeight: minHeight,
          maxHeight: maxHeight,
          height: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx 
        }}
      >
        <Paper sx={{ p: 4, borderRadius: 3, width: '100%' }}>
          <Typography variant="h5" color="error" gutterBottom>
            没有题目数据
          </Typography>
          <Button
            variant="contained"
            onClick={onExit}
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            返回
          </Button>
        </Paper>
      </Container>
    );
  }

  // 如果未初始化
  if (!isInitialized) {
    return (
      <Container 
        maxWidth="md" 
        sx={{ 
          mt: 5, 
          textAlign: 'center',
          minHeight: minHeight,
          maxHeight: maxHeight,
          height: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx 
        }}
      >
        <Paper sx={{ p: 4, borderRadius: 3, width: '100%' }}>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          )}
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            共 {questions.length} 个句子，{totalWords} 个单词
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={startPractice}
            size="large"
          >
            开始练习
          </Button>
          {onExit && (
            <Button
              variant="outlined"
              onClick={onExit}
              sx={{ ml: 2 }}
            >
              返回
            </Button>
          )}
        </Paper>
      </Container>
    );
  }

  return (
    <Container 
      ref={contentRef}
      maxWidth="md" 
      sx={{
        p: isMobile ? 1 : 2,
        minHeight: minHeight,
        maxHeight: maxHeight,
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        ...sx
      }}
    >
      {/* 头部信息栏 */}
      <Paper 
        variant="outlined" 
        sx={{
          mb: isMobile ? 0.5 : 0.75,
          p: isMobile ? 0.75 : 1,
          borderRadius: 2,
          border: '2px solid #1a237e',
          bgcolor: '#fafafa'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'nowrap' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" fontWeight="bold" color="#666" sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
              <AccessTime sx={{ fontSize: isMobile ? 9 : 10, verticalAlign: 'middle', mr: 0.3 }} />
              {formatTime(currentTime)}
            </Typography>
            <Typography variant={isMobile ? "caption" : "body2"} fontWeight="900" color="#1a237e" sx={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {title} {subtitle && `· ${subtitle}`}
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" spacing={isMobile ? 0.3 : 0.5}>
            <Chip
              icon={<Translate fontSize="small" />}
              label={showAnswer ? "已提示" : `提示-${hintDeduction.toFixed(1)}分`}
              onClick={handleShowAnswer}
              disabled={showAnswer}
              color="warning"
              variant={showAnswer ? "outlined" : "filled"}
              size="small"
              sx={{
                fontWeight: 'bold',
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                cursor: showAnswer ? 'default' : 'pointer',
                height: isMobile ? 24 : 28,
                '& .MuiChip-label': { px: 0.75 }
              }}
            />

            <Box sx={{
              textAlign: 'center',
              px: isMobile ? 0.75 : 1,
              py: isMobile ? 0.1 : 0.2,
              bgcolor: '#1a237e',
              borderRadius: 1.5,
              minWidth: isMobile ? 45 : 55
            }}>
              <Typography variant={isMobile ? "body1" : "h6"} fontWeight="900" color="#fff" sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                {score.toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#cfd8dc', display: 'block', fontSize: isMobile ? '0.5rem' : '0.55rem' }}>
                SCORE
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* 统计信息 */}
      <Box sx={{ mb: isMobile ? 0.5 : 0.75 }}>
        <Grid container spacing={0.3}>
          <Grid item xs={3}>
            <Paper sx={{
              p: isMobile ? 0.3 : 0.5,
              textAlign: 'center',
              borderRadius: 1.5,
              backgroundColor: '#e8f5e9',
              border: '1px solid #4caf50',
              height: isMobile ? 35 : 40,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="caption" sx={{
                color: '#2e7d32',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                mb: 0.1
              }}>
                已答对
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"} sx={{
                color: '#2e7d32',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>
                {totalAnsweredCorrectly}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{
              p: isMobile ? 0.3 : 0.5,
              textAlign: 'center',
              borderRadius: 1.5,
              backgroundColor: '#ffebee',
              border: '1px solid #f44336',
              height: isMobile ? 35 : 40,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="caption" sx={{
                color: '#c62828',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                mb: 0.1
              }}>
                错误数
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"} sx={{
                color: '#c62828',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>
                {totalErrors}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{
              p: isMobile ? 0.3 : 0.5,
              textAlign: 'center',
              borderRadius: 1.5,
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              height: isMobile ? 35 : 40,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="caption" sx={{
                color: '#1565c0',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                mb: 0.1
              }}>
                总单词
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"} sx={{
                color: '#1565c0',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>
                {totalWords}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{
              p: isMobile ? 0.3 : 0.5,
              textAlign: 'center',
              borderRadius: 1.5,
              backgroundColor: '#fff3e0',
              border: '1px solid #ff9800',
              height: isMobile ? 35 : 40,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="caption" sx={{
                color: '#ef6c00',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                mb: 0.1
              }}>
                错一个扣
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"} sx={{
                color: '#ef6c00',
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>
                {deductionPerWord.toFixed(1)}分
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* 进度控制 */}
      <Stack direction="row" alignItems="center" spacing={isMobile ? 0.3 : 0.5} sx={{ mb: isMobile ? 0.5 : 0.75 }}>
        <Button
          variant="contained"
          onClick={onExit}
          startIcon={<ArrowBack />}
          size="small"
          sx={{
            bgcolor: '#424242',
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            px: isMobile ? 0.5 : 0.75,
            py: isMobile ? 0.2 : 0.3,
            minWidth: 'auto',
            '& .MuiButton-startIcon': {
              mr: 0.3,
              '& svg': {
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }
            }
          }}
        >
          返回
        </Button>

        <Box sx={{ flexGrow: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(currentIndex / questions.length) * 100}
            sx={{
              height: isMobile ? 4 : 6,
              borderRadius: 4,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': { bgcolor: '#00bcd4' }
            }}
          />
        </Box>

        <Typography variant="caption" fontWeight="900" color="#424242" sx={{ fontSize: isMobile ? '0.6rem' : '0.65rem', minWidth: '35px', textAlign: 'right' }}>
          {currentIndex + 1}/{questions.length}
        </Typography>
      </Stack>

      {/* 当前句子信息 */}
      <Box sx={{
        mb: isMobile ? 0.5 : 0.75,
        p: isMobile ? 0.5 : 0.75,
        bgcolor: '#f5f5f5',
        borderRadius: 1.5,
        border: '1px solid #bdbdbd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: 'bold',
        color: '#616161'
      }}>
        <span>📝 {currentIndex + 1}/{questions.length}: {currentSentenceWords}词</span>
        <span>🎯 {userWords.length}/{currentSentenceWords}</span>
      </Box>

      {/* 核心答题区域 - 自适应高度 */}
      <Paper 
        elevation={4} 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          border: hasFailed ? '3px solid #d32f2f' : '3px solid #e0e0e0',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 2,
          p: isMobile ? 1 : 1.5,
          mb: 1
        }}
      >
        {/* 中文展示区 */}
        <Box sx={{
          mb: isMobile ? 1 : 1.5,
          p: isMobile ? 1 : 1.5,
          bgcolor: '#e8eaf6',
          borderRadius: 1.5,
          border: '1px solid #c5cae9'
        }}>
          <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" color="#1a237e" sx={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>
            {questions[currentIndex]?.chinese}
          </Typography>
        </Box>

        {/* 英文待填区 */}
        <Box sx={{
          mb: isMobile ? 1 : 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? 0.5 : 0.75,
          px: isMobile ? 0.3 : 0.5
        }}>
          {questions[currentIndex]?.english.split(' ').map((w, i) => (
            <Box key={i} sx={{
              borderBottom: '2px solid #cfd8dc',
              minWidth: isMobile ? 35 : 45,
              px: isMobile ? 0.3 : 0.5,
              py: isMobile ? 0.5 : 0.75,
              fontSize: isMobile ? '1rem' : '1.2rem',
              fontWeight: 'bold',
              color: (i < userWords.length || showAnswer) ? (showAnswer && i >= userWords.length ? '#d32f2f' : '#1a237e') : 'transparent',
              backgroundColor: (i < userWords.length || showAnswer) ? '#f5f5f5' : 'transparent',
              borderRadius: 0.5,
              boxShadow: (i < userWords.length || showAnswer) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
              {w}
            </Box>
          ))}
        </Box>

        {/* 乱序单词池 */}
        <Box sx={{
          px: isMobile ? 0.3 : 0.5,
          py: isMobile ? 0.5 : 1
        }}>
          <Grid container spacing={0.5} justifyContent="center">
            {availableWords.map((word) => (
              <Grid item key={word.uid} xs={isMobile ? 6 : 'auto'}>
                <Zoom in={true} style={{ transitionDelay: '0ms' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleWordClick(word)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 1.5,
                      borderWidth: 1.5,
                      fontWeight: 'bold',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      color: '#424242',
                      padding: isMobile ? '4px 2px' : '6px 8px',
                      borderColor: '#cfd8dc',
                      minWidth: isMobile ? 65 : 80,
                      minHeight: isMobile ? 28 : 32,
                      width: isMobile ? '100%' : 'auto',
                      '&:hover': {
                        borderWidth: 1.5,
                        borderColor: '#1a237e',
                        bgcolor: '#f5f5f5',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    {word.val}
                  </Button>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default TranslationPracticeCore;