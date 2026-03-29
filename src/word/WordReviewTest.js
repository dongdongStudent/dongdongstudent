import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Card,
  LinearProgress, Grid, Stack, Chip,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Snackbar, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import {
  ArrowBack, VolumeUp, Close, CheckCircle, Cancel, Replay, PlayArrow
} from '@mui/icons-material';
import { F_speak } from "../Function/weisimin.js";
import { getToken } from "../config.js";
import {
  updateTestResultToServer, getWordCurrentStats
} from './wordReviewUtils.js';

const ListeningFinalMaster = ({
  open,
  onClose,
  wordData: externalWordData = null,
  onTestCompleted,
  targetFile_1
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const responsiveStyles = {
    dialogHeight: isMobile ? '90vh' : isTablet ? '85vh' : '80vh',
    dialogWidth: isMobile ? '95vw' : isTablet ? '90vw' : 'md',
    fontSize: {
      h1: isMobile ? '2.5rem' : isTablet ? '3rem' : '4rem',
      h2: isMobile ? '1.8rem' : isTablet ? '2rem' : '2.5rem',
      h3: isMobile ? '1.5rem' : isTablet ? '1.8rem' : '2rem',
      h4: isMobile ? '1.3rem' : isTablet ? '1.5rem' : '1.8rem',
      h5: isMobile ? '1.1rem' : isTablet ? '1.2rem' : '1.3rem',
      h6: isMobile ? '1rem' : isTablet ? '1.1rem' : '1.2rem',
      body1: isMobile ? '0.9rem' : isTablet ? '1rem' : '1rem',
      body2: isMobile ? '0.8rem' : isTablet ? '0.9rem' : '1rem',
      caption: isMobile ? '0.7rem' : isTablet ? '0.8rem' : '0.9rem'
    },
    spacing: {
      small: isMobile ? 1 : isTablet ? 1.5 : 2,
      medium: isMobile ? 2 : isTablet ? 2.5 : 3,
      large: isMobile ? 3 : isTablet ? 3.5 : 4
    },
    buttonSize: isMobile ? 'small' : isTablet ? 'medium' : 'large',
    cardPadding: isMobile ? 1 : isTablet ? 2 : 3,
    optionButtonHeight: isMobile ? 60 : isTablet ? 70 : 80
  };

  const [currentWordData, setCurrentWordData] = useState([]);
  const [originalWordData, setOriginalWordData] = useState([]);
  const [gameState, setGameState] = useState('welcome');
  const [stats, setStats] = useState({ correct: 0, wrong: 0, finished: 0 });
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [testPool, setTestPool] = useState([]);
  const [wrongPool, setWrongPool] = useState([]);
  const [isReviewPhase, setIsReviewPhase] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedback, setFeedback] = useState({ text: '', color: '' });
  const [liveTime, setLiveTime] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);
  const [testCount, setTestCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStats, setUpdateStats] = useState({ total: 0, success: 0, failed: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showGoldenCup, setShowGoldenCup] = useState(false);

  const timers = useRef({ repeat: null, live: null });
  const startTimeRef = useRef(null);
  const testEndTimeRef = useRef(null);

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTestCompleted = useCallback((results) => {
    if (onTestCompleted && typeof onTestCompleted === 'function') {
      onTestCompleted(results);
    }
  }, [onTestCompleted]);

  useEffect(() => {
    if (externalWordData && externalWordData.length > 0) {
      setCurrentWordData(externalWordData);
      setOriginalWordData([...externalWordData]);
      resetGame();
      setGameState('welcome');
      setTestCount(0);
    }
  }, [externalWordData]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (showResult) handleNextAction();
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [showResult]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const stopAudio = () => {
    if (timers.current.repeat) clearInterval(timers.current.repeat);
    if (timers.current.live) clearInterval(timers.current.live);
    timers.current = { repeat: null, live: null };
    setRepeatCount(0);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const speakWordWithRepeat = (word, times = 2) => {
    if (!word) return;
    
    if (timers.current.repeat) clearInterval(timers.current.repeat);
    
    F_speak(word);
    setRepeatCount(1);
    
    if (times > 1) {
      let currentCount = 1;
      timers.current.repeat = setInterval(() => {
        if (currentCount < times) {
          F_speak(word);
          currentCount++;
          setRepeatCount(currentCount);
        } else {
          clearInterval(timers.current.repeat);
          timers.current.repeat = null;
        }
      }, 3500);
    }
  };

  const resetGame = () => {
    stopAudio();
    setTestPool([]);
    setWrongPool([]);
    setCurrentWord(null);
    setSelectedId(null);
    setStats({ correct: 0, wrong: 0, finished: 0 });
    setTotalQuestions(0);
    setLiveTime(0);
    setFeedback({ text: '', color: '' });
    setShowResult(false);
    setTestResults([]);
    setIsUpdating(false);
    setUpdateStats({ total: 0, success: 0, failed: 0 });
    setRepeatCount(0);
    setShowGoldenCup(false);
  };

  const handleStartTest = () => {
    if (currentWordData.length >= 4) {
      setGameState('playing');
      setTestCount(prev => prev + 1);
      startSession(currentWordData);
    } else {
      showMessage('需要至少4个单词才能开始测试', 'warning');
    }
  };

  const handleRestartTest = () => {
    if (originalWordData.length > 0) {
      setCurrentWordData(originalWordData);
      resetGame();
      setGameState('welcome');
    }
  };

  const startSession = (wordsToUse) => {
    stopAudio();
    setIsReviewPhase(false);
    setFeedback({ text: '', color: '' });
    setShowResult(false);
    setTestResults([]);
    setIsUpdating(false);

    const initialPool = [...wordsToUse].sort(() => Math.random() - 0.5);
    setTestPool(initialPool);
    setWrongPool([]);
    setTotalQuestions(initialPool.length);
    setStats({ correct: 0, wrong: 0, finished: 0 });
    startTimeRef.current = new Date();
    setTimeout(() => pickNext(initialPool), 150);
  };

  const pickNext = (currentPool) => {
    if (!currentPool || currentPool.length === 0) return;

    stopAudio();
    setSelectedId(null);
    setIsCorrect(null);
    setFeedback({ text: '', color: '' });
    setShowResult(false);
    setLiveTime(0);

    const target = currentPool[0];
    const distractors = currentWordData
      .filter(i => i.english !== target.english)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    setCurrentWord(target);
    setOptions([...distractors, target].sort(() => Math.random() - 0.5));

    speakWordWithRepeat(target.english, 2);
    
    const sTime = Date.now();
    timers.current.live = setInterval(() => {
      setLiveTime(((Date.now() - sTime) / 1000).toFixed(1));
    }, 100);
  };

  const handleAnswer = async (option) => {
    if (selectedId || showResult) return;

    stopAudio();
    const correct = option.english === currentWord.english;
    setSelectedId(option.english);
    setIsCorrect(correct);

    const testResult = {
      word: currentWord.english,
      chinese: currentWord.chinese,
      isCorrect: correct,
      timestamp: new Date().toISOString(),
      userAnswer: option.chinese,
      correctAnswer: currentWord.chinese,
      timeSpent: parseFloat(liveTime)
    };
    setTestResults(prev => [...prev, testResult]);

    if (currentWord && currentWord.english) {
      setIsUpdating(true);
      try {
        const currentStats = await getWordCurrentStats(currentWord.english, getToken(), targetFile_1);
        const success = await updateTestResultToServer(
          currentWord.english, currentWord.chinese, correct, currentStats,
          targetFile_1 || 'me_word_index', getToken()
        );
        if (success) {
          setUpdateStats(prev => ({ ...prev, total: prev.total + 1, success: prev.success + 1 }));
        } else {
          setUpdateStats(prev => ({ ...prev, total: prev.total + 1, failed: prev.failed + 1 }));
        }
      } catch (error) {
        console.error('同步失败:', error);
        setUpdateStats(prev => ({ ...prev, total: prev.total + 1, failed: prev.failed + 1 }));
      } finally {
        setIsUpdating(false);
      }
    }

    if (correct) {
      setStats(s => ({ ...s, correct: isReviewPhase ? s.correct : s.correct + 1, finished: s.finished + 1 }));
      setFeedback({ text: '🎉 答对了！', color: '#4caf50' });
    } else {
      if (!isReviewPhase) {
        setStats(s => ({ ...s, wrong: s.wrong + 1, finished: s.finished + 1 }));
        setWrongPool(prev => [...prev, currentWord]);
      } else {
        setTestPool(prev => [...prev.slice(1), currentWord]);
        setFeedback({ text: '❌ 答错了！', color: '#f44336' });
        setShowResult(true);
        return;
      }
      setFeedback({ text: '❌ 答错了！', color: '#f44336' });
    }

    setTimeout(() => setShowResult(true), 100);
  };

  const handleNextAction = () => {
    if (!selectedId) return;

    const nextPool = testPool.slice(1);
    setTestPool(nextPool);

    if (nextPool.length === 0) {
      if (!isReviewPhase && wrongPool.length > 0) {
        setIsReviewPhase(true);
        setStats(s => ({ ...s, finished: 0 }));
        const newReviewPool = [...wrongPool].sort(() => Math.random() - 0.5);
        setTestPool(newReviewPool);
        pickNext(newReviewPool);
      } else {
        testEndTimeRef.current = new Date();
        const testStats = {
          totalQuestions,
          correctAnswers: stats.correct,
          wrongAnswers: stats.wrong,
          accuracy: totalQuestions > 0 ? Math.round((stats.correct / totalQuestions) * 100) : 0,
          timeSpent: testEndTimeRef.current ? Math.round((testEndTimeRef.current - startTimeRef.current) / 1000) : 0,
          testResults,
          updateStats,
          testCount
        };
        handleTestCompleted(testStats);
        setGameState('completed');
        
        // 检查是否全对，显示金色圣杯
        const isPerfect = stats.wrong === 0 && totalQuestions > 0;
        if (isPerfect) {
          setShowGoldenCup(true);
          // 3秒后自动关闭圣杯弹窗
          setTimeout(() => setShowGoldenCup(false), 3000);
        }
      }
    } else {
      pickNext(nextPool);
    }

    setFeedback({ text: '', color: '' });
    setShowResult(false);
  };

  const handleClose = () => {
    stopAudio();
    resetGame();
    setTestCount(0);
    if (onClose) onClose();
  };

  const handleReplay = (word) => {
    if (word) {
      speakWordWithRepeat(word, 2);
    }
  };

  const handleCloseGoldenCup = () => {
    setShowGoldenCup(false);
  };

  // ========== 欢迎界面 ==========
  const renderWelcome = () => (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      p: 3 
    }}>
      <VolumeUp sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
        📋 准备就绪
      </Typography>
      <Typography variant="body1" sx={{ mb: 1, color: 'text.secondary' }}>
        共 <strong>{currentWordData.length}</strong> 个单词
      </Typography>
      {testCount > 0 && (
        <Typography variant="caption" color="info.main" sx={{ mb: 1 }}>
          已进行 <strong>{testCount}</strong> 次测试
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>
        每个单词将播放2次，点击下方按钮开始测试
      </Typography>
      <Button 
        variant="contained" 
        size="large" 
        onClick={handleStartTest} 
        startIcon={<PlayArrow />}
        sx={{ px: 4, py: 1.5, fontWeight: 'bold', borderRadius: 3 }}
      >
        开始听力测试
      </Button>
    </Box>
  );

  // ========== 游戏界面 ==========
  const renderGame = () => {
    const currentProgress = isReviewPhase
      ? (stats.finished / (wrongPool.length || 1)) * 100
      : (stats.finished / totalQuestions) * 100;

    return (
      <Box sx={{ height: '100%', overflow: 'auto', position: 'relative', p: isMobile ? 1 : 0 }}>
        <Paper elevation={1} sx={{ p: isMobile ? 1 : 2, mb: responsiveStyles.spacing.small, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 'bold' }}>
            听力测试 {isReviewPhase && "(错题复习)"}
          </Typography>
          <Typography variant="body2">
            进度: {stats.finished + 1}/{isReviewPhase ? wrongPool.length : totalQuestions}
            {repeatCount > 0 && ` · 播放${repeatCount}/2次`}
          </Typography>
        </Paper>

        <LinearProgress variant="determinate" value={currentProgress} sx={{ height: isMobile ? 8 : 10, borderRadius: 5, mb: responsiveStyles.spacing.medium }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: responsiveStyles.spacing.medium }}>
          <Button variant="outlined" size={isMobile ? "small" : "medium"} startIcon={<ArrowBack />} onClick={handleClose} disabled={selectedId && !showResult}>
            退出
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
            <Typography variant="body2">用时: {liveTime}s</Typography>
            <Chip size="small" label={`${stats.finished > 0 ? Math.round(stats.correct / stats.finished * 100) : 0}%`} color="primary" />
            {isUpdating && <CircularProgress size={isMobile ? 14 : 16} />}
          </Box>
        </Stack>

        <Card sx={{
          minHeight: isMobile ? 120 : isTablet ? 150 : 180,
          display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, mb: responsiveStyles.spacing.medium,
          cursor: (!selectedId && !showResult) ? 'pointer' : 'default',
          border: selectedId ? `3px solid ${isCorrect ? '#4caf50' : '#f44336'}` : '2px solid #1976d2',
          backgroundColor: selectedId ? (isCorrect ? '#f1f8e9' : '#ffebee') : 'white'
        }} onClick={() => { if (!selectedId && !showResult && currentWord) handleReplay(currentWord.english); }}>
          {selectedId ? (
            <Box textAlign="center" sx={{ p: responsiveStyles.cardPadding }}>
              <Typography 
                variant={isMobile ? "h4" : "h3"} 
                fontWeight="bold" 
                sx={{ 
                  color: isCorrect ? '#4caf50' : '#f44336',
                  fontSize: isCorrect 
                    ? (isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem')
                    : (isMobile ? '0.9rem' : isTablet ? '1rem' : '1.1rem')
                }}
              >
                {selectedId}
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h5"} 
                color="text.secondary"
                sx={{ 
                  fontSize: isCorrect 
                    ? (isMobile ? '1rem' : isTablet ? '1.2rem' : '1.3rem')
                    : (isMobile ? '0.75rem' : isTablet ? '0.85rem' : '0.9rem')
                }}
              >
                {options.find(opt => opt.english === selectedId)?.chinese}
              </Typography>
              {!isCorrect && currentWord && (
                <>
                  <Box sx={{ 
                    mt: 2, 
                    p: 1.5, 
                    bgcolor: '#e8f5e9', 
                    borderRadius: 2,
                    border: '2px solid #4caf50',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                  }}>
                    <Typography 
                      variant={isMobile ? "h6" : "h5"} 
                      color="success.main" 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: (isMobile ? '1.2rem' : isTablet ? '1.4rem' : '1.6rem')
                      }}
                    >
                      正确答案: 
                    </Typography>
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      color="success.main" 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: (isMobile ? '1.5rem' : isTablet ? '1.8rem' : '2rem')
                      }}
                    >
                      {currentWord.english}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="success.main"
                      sx={{ 
                        fontSize: (isMobile ? '1rem' : isTablet ? '1.2rem' : '1.3rem')
                      }}
                    >
                      {currentWord.chinese}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          ) : (
            <Stack alignItems="center" spacing={isMobile ? 1 : 2} sx={{ p: responsiveStyles.cardPadding }}>
              <VolumeUp sx={{ fontSize: isMobile ? 40 : isTablet ? 50 : 60, color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary">
                {repeatCount > 0 ? `正在播放第${repeatCount}次...` : '点击喇叭重听'}
              </Typography>
            </Stack>
          )}
        </Card>

        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 4 }}>
          {options.map((opt, i) => {
            const isSelected = selectedId === opt.english;
            const isCorrectOption = opt.english === currentWord?.english;
            let bgcolor = '#fff', color = '#333';
            if (selectedId) {
              if (isCorrectOption) { 
                bgcolor = '#4caf50'; 
                color = '#fff'; 
              } else if (isSelected) { 
                bgcolor = '#f44336'; 
                color = '#fff'; 
              } else { 
                bgcolor = '#f5f5f5'; 
                color = '#999'; 
              }
            }
            return (
              <Grid item xs={6} key={i}>
                <Button fullWidth variant="contained" size={responsiveStyles.buttonSize}
                  onClick={() => { if (!selectedId && !showResult) handleAnswer(opt); }}
                  disabled={!!selectedId || showResult || isUpdating}
                  sx={{ 
                    height: responsiveStyles.optionButtonHeight, 
                    borderRadius: 2, 
                    fontWeight: 'bold', 
                    bgcolor, 
                    color,
                    fontSize: selectedId && isCorrectOption 
                      ? (isMobile ? '1rem' : '1.1rem')
                      : selectedId && !isCorrectOption && isSelected
                      ? (isMobile ? '0.8rem' : '0.9rem')
                      : (isMobile ? '0.9rem' : '1rem')
                  }}>
                  <Box sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', lineHeight: 1.2 }}>
                    {opt.chinese}
                  </Box>
                </Button>
              </Grid>
            );
          })}
        </Grid>

        {wrongPool.length > 0 && (
          <Paper sx={{ p: isMobile ? 1 : 2, borderRadius: 2, bgcolor: '#fff5f5', mb: responsiveStyles.spacing.medium }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'error.main' }}>错题列表 ({wrongPool.length})</Typography>
            <Box sx={{ maxHeight: isMobile ? 80 : 150, overflow: 'auto' }}>
              {wrongPool.map((word, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">{word.english}</Typography>
                  <Typography variant="caption" color="text.secondary">{word.chinese}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {selectedId && !showResult && (
          <Box sx={{
            position: 'fixed', bottom: isMobile ? 10 : 20, left: '50%', transform: 'translateX(-50%)',
            bgcolor: isCorrect ? '#4caf50' : '#f44336', color: '#fff', px: isMobile ? 2 : 4, py: isMobile ? 1.5 : 2,
            borderRadius: 2, fontWeight: 'bold', textAlign: 'center', zIndex: 1000, boxShadow: 3,
            minWidth: isMobile ? 280 : 300, maxWidth: '90vw'
          }}>
            <Typography variant={isMobile ? "body1" : "h5"}>{feedback.text}</Typography>
            <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.9 }}>
              {isUpdating ? '正在同步到服务器...' : isCorrect ? '正在加载下一题...' : '显示正确答案...'}
            </Typography>
          </Box>
        )}

        {showResult && (
          <Box sx={{
            position: 'fixed', bottom: isMobile ? 10 : 20, left: '50%', transform: 'translateX(-50%)',
            bgcolor: isCorrect ? '#4caf50' : '#f44336', color: '#fff', px: isMobile ? 2 : 4, py: isMobile ? 1.5 : 2,
            borderRadius: 2, fontWeight: 'bold', textAlign: 'center', zIndex: 1000, boxShadow: 3, cursor: 'pointer'
          }} onClick={handleNextAction}>
            <Typography variant={isMobile ? "body1" : "h5"}>{feedback.text}</Typography>
            <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.9 }}>
              {isMobile ? '轻触继续下一题 →' : '点击任意位置继续下一题 →'}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // ========== 完成界面 ==========
  const renderCompleted = () => {
    const accuracy = totalQuestions > 0 ? Math.round((stats.correct / totalQuestions) * 100) : 0;
    const timeSpent = testEndTimeRef.current ? Math.round((testEndTimeRef.current - startTimeRef.current) / 1000) : 0;
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const timeStr = currentDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formatTime = (s) => s > 60 ? `${Math.floor(s / 60)}分${s % 60}秒` : `${s}秒`;
    const allReviewedWords = [...new Set(testResults.map(r => r.word))];
    const isPerfect = stats.wrong === 0 && totalQuestions > 0;

    return (
      <Box sx={{ height: '100%', overflow: 'auto', p: isMobile ? 0.5 : 1 }}>
        {/* 全对金色圣杯弹窗 */}
        {showGoldenCup && (
          <Dialog
            open={true}
            onClose={handleCloseGoldenCup}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: 'linear-gradient(135deg, #fff9e6 0%, #fff0cc 100%)',
                border: '2px solid #ffd700',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.6)',
                animation: 'glow 1.5s ease-in-out infinite'
              }
            }}
          >
            <style>
              {`
                @keyframes glow {
                  0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
                  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8); }
                  100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
                }
                @keyframes bounce {
                  0%, 100% { transform: translateY(0) scale(1); }
                  50% { transform: translateY(-20px) scale(1.1); }
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
            <DialogContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ animation: 'bounce 0.8s ease-in-out' }}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: isMobile ? '4rem' : '6rem',
                    animation: 'spin 2s ease-in-out',
                    display: 'inline-block',
                    mb: 2
                  }}
                >
                  🏆
                </Typography>
              </Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#ff8c00',
                  textShadow: '2px 2px 4px rgba(255, 215, 0, 0.5)',
                  mb: 2,
                  animation: 'glow 1s ease-in-out infinite'
                }}
              >
                完美通关！
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#b8860b' }}>
                🎉 恭喜你！全部答对！ 🎉
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 1, 
                mb: 2,
                flexWrap: 'wrap'
              }}>
                <Chip 
                  icon={<span>⭐</span>} 
                  label="听力大师" 
                  color="warning" 
                  variant="filled"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip 
                  icon={<span>🏅</span>} 
                  label="金牌得主" 
                  color="warning" 
                  variant="filled"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                你已获得金色圣杯成就！
              </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button 
                variant="contained" 
                color="warning" 
                onClick={handleCloseGoldenCup}
                sx={{ 
                  bgcolor: '#ffd700', 
                  color: '#b8860b',
                  '&:hover': { bgcolor: '#ffed4e' },
                  fontWeight: 'bold'
                }}
              >
                太棒了！
              </Button>
            </DialogActions>
          </Dialog>
        )}

        <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: isMobile ? 1 : 1.5 }}>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {isPerfect ? '🏆 完美通关！🏆' : '📊 听力测试报告'}
            </Typography>
            <Typography variant="caption" color="text.secondary">{dateStr} {timeStr}</Typography>
            {testCount > 0 && (
              <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                🔄 本次是第 <strong>{testCount}</strong> 次测试
              </Typography>
            )}
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: isMobile ? 0.5 : 1, 
            mb: isMobile ? 1 : 1.5,
            border: isPerfect ? '3px solid #ffd700' : 'none',
            borderRadius: 2,
            p: isPerfect ? 1 : 0,
            bgcolor: isPerfect ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
          }}>
            {[
              { label: '正确率', value: `${accuracy}%`, color: accuracy >= 60 ? '#4caf50' : '#f44336' },
              { label: '答对', value: stats.correct, color: '#4caf50' },
              { label: '答错', value: stats.wrong, color: '#f44336' }
            ].map((item, index) => (
              <Box key={index} sx={{ 
                textAlign: 'center', 
                p: isMobile ? 0.5 : 1, 
                border: `2px solid ${item.color}`,
                borderRadius: 2,
                bgcolor: isPerfect && item.label === '正确率' ? 'rgba(255, 215, 0, 0.2)' : 'transparent'
              }}>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: isPerfect && item.label === '正确率' ? '#ff8c00' : item.color,
                    fontSize: isPerfect && item.label === '正确率' ? (isMobile ? '2rem' : '2.5rem') : undefined
                  }}
                >
                  {item.value}
                </Typography>
                <Typography variant="caption">{item.label}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5, mb: isMobile ? 1 : 1.5 }}>
            {[
              { label: '总题数', value: totalQuestions },
              { label: '总用时', value: formatTime(timeSpent) },
              { label: '平均用时', value: `${(timeSpent / totalQuestions).toFixed(1)}秒` },
              { label: '总词数', value: allReviewedWords.length }
            ].map((item, index) => (
              <Box key={index} sx={{ p: isMobile ? 0.5 : 0.75, border: '1px solid #e0e0e0', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>{item.value}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
              </Box>
            ))}
          </Box>

          {wrongPool.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff5f5', maxHeight: 150, overflow: 'auto', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#f44336' }}>📖 需要复习的错题 ({wrongPool.length})</Typography>
              {wrongPool.map((word, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: idx < wrongPool.length - 1 ? '1px solid #ffcdd2' : 'none' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{word.english}</Typography>
                  <Typography variant="caption" color="text.secondary">{word.chinese}</Typography>
                </Box>
              ))}
            </Paper>
          )}

          {isPerfect && (
            <Box sx={{ 
              textAlign: 'center', 
              mb: 2, 
              p: 2, 
              background: 'linear-gradient(135deg, #fff9e6 0%, #fff0cc 100%)',
              borderRadius: 2,
              border: '2px solid #ffd700'
            }}>
              <Typography variant="h2" sx={{ fontSize: isMobile ? '3rem' : '4rem', animation: 'float 2s ease-in-out infinite' }}>
                🏆
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#b8860b', mt: 1 }}>
                🌟 金色圣杯成就 🌟
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                完美通关！听力大师！
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, p: 0.5, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="caption">同步状态: {updateStats.success}/{updateStats.total} 成功</Typography>
            <Typography variant="caption">下次复习: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}</Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Button variant="contained" color="primary" size={isMobile ? "small" : "medium"} startIcon={<Replay />} onClick={handleRestartTest}>
              重新测试
            </Button>
            {wrongPool.length > 0 && (
              <Button variant="contained" color="warning" size={isMobile ? "small" : "medium"} startIcon={<Replay />} onClick={() => {
                setTestPool([...wrongPool].sort(() => Math.random() - 0.5));
                setWrongPool([]);
                setStats({ correct: 0, wrong: 0, finished: 0 });
                setGameState('playing');
                setIsReviewPhase(true);
                setFeedback({ text: '', color: '' });
                setShowResult(false);
              }}>复习错题 ({wrongPool.length})</Button>
            )}
          </Box>

          <Box sx={{ 
            mt: 2, 
            p: 1, 
            bgcolor: isPerfect ? 'linear-gradient(135deg, #fff9e6 0%, #fff0cc 100%)' : '#f5f5f5', 
            borderRadius: 2, 
            textAlign: 'center',
            border: isPerfect ? '1px solid #ffd700' : 'none'
          }}>
            <Typography variant="caption" color="text.secondary">
              {isPerfect ? '🏆 完美！你获得了金色圣杯！ 🏆' :
               accuracy >= 90 ? '🎉 太棒了！继续保持！' :
               accuracy >= 70 ? '👍 不错哦，再接再厉！' :
               accuracy >= 60 ? '💪 有进步空间，继续努力！' :
               '📚 多练习几次，会越来越好的！'}
            </Typography>
          </Box>
        </Paper>

        <style>
          {`
            @keyframes glow {
              0% { text-shadow: 0 0 5px #ffd700, 0 0 10px #ffd700; }
              50% { text-shadow: 0 0 20px #ffd700, 0 0 30px #ffa500; }
              100% { text-shadow: 0 0 5px #ffd700, 0 0 10px #ffd700; }
            }
            @keyframes float {
              0% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-10px) rotate(5deg); }
              100% { transform: translateY(0px) rotate(0deg); }
            }
          `}
        </style>
      </Box>
    );
  };

  const renderContent = () => {
    switch (gameState) {
      case 'welcome':
        return renderWelcome();
      case 'playing':
        return renderGame();
      case 'completed':
        return renderCompleted();
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={responsiveStyles.dialogWidth}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : responsiveStyles.dialogHeight,
          maxHeight: isMobile ? '100%' : (isTablet ? '700px' : '800px'),
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
          m: isMobile ? 0 : 2
        }
      }}
    >
      <DialogTitle sx={{
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'white',
        py: isMobile ? 1.5 : 2,
        px: isMobile ? 2 : 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VolumeUp fontSize={isMobile ? "small" : "medium"} />
          <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">英语听力测试</Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white', p: isMobile ? 0.5 : 1 }} size={isMobile ? "small" : "medium"}>
          <Close fontSize={isMobile ? "small" : "medium"} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 1 : 3, height: '100%', overflow: 'hidden' }}>
        <Box sx={{ height: '100%' }}>{renderContent()}</Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #eee', justifyContent: 'space-between', px: isMobile ? 1 : 3, py: isMobile ? 1 : 2 }}>
        <Typography variant="caption" color="text.secondary">
          总单词数: {currentWordData.length} |
          {gameState === 'playing' && ` 进度: ${stats.finished}/${totalQuestions}`}
          {gameState === 'completed' && ` 正确率: ${Math.round((stats.correct / totalQuestions) * 100)}%`}
        </Typography>
      </DialogActions>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ListeningFinalMaster;