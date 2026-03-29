import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Container, Paper, Typography, Button, Card,
  LinearProgress, Grid, IconButton, Stack, Chip,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import {
  ArrowBack, VolumeUp, Bolt, Replay, Close, CheckCircle, Cancel,
  TouchApp, Smartphone, Tablet
} from '@mui/icons-material';
import { F_speak } from "../Function/weisimin.js";
import { getToken } from "../config.js";
import {
  updateTestResultToServer, getWordCurrentStats
} from './wordReviewUtils.js';

// 默认单词数据
const defaultWordData = [
  { "english": "unit", "chinese": "单元" },
  { "english": "starter unit", "chinese": "过渡单元" },
  { "english": "section", "chinese": "部分；地区" },
  // ... 其他默认单词
];

// ==================== API 函数 ====================



// ==================== 主组件 ====================

const ListeningFinalMaster = ({
  open,
  onClose,
  wordData: externalWordData = null,
  onTestCompleted, // 测试完成后的回调函数
  targetFile_1
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // 根据设备类型调整样式
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

  // 如果外部传入了单词数据，就使用外部的，否则使用默认的
  const [currentWordData, setCurrentWordData] = useState(defaultWordData);

  // 游戏状态
  const [gameState, setGameState] = useState('menu');
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
  const [repeatMode, setRepeatMode] = useState(true);
  const [showResult, setShowResult] = useState(false);

  // 测试结果相关状态
  const [testResults, setTestResults] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStats, setUpdateStats] = useState({
    total: 0,
    success: 0,
    failed: 0
  });

  const timers = useRef({ repeat: null, live: null });
  const startTimeRef = useRef(null);
  const testEndTimeRef = useRef(null);

  // 消息提示状态
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 显示消息函数
  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 测试完成处理函数
  const handleTestCompleted = useCallback((results) => {
    if (onTestCompleted && typeof onTestCompleted === 'function') {
      onTestCompleted(results);
    }
  }, [onTestCompleted]);

  // 当外部传入的单词数据变化或对话框打开时更新
  useEffect(() => {
    if (externalWordData && externalWordData.length > 0) {
      setCurrentWordData(externalWordData);
    } else {
      setCurrentWordData(defaultWordData);
    }

    // 每次打开对话框时重置游戏
    if (open) {
      resetGame();
    }
  }, [open, externalWordData]);

  // 添加全局点击事件监听器
  useEffect(() => {
    const handleGlobalClick = () => {
      if (showResult) {
        handleNextAction();
      }
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [showResult]);

  // 清理音频和计时器
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (timers.current.repeat) {
      clearInterval(timers.current.repeat);
      timers.current.repeat = null;
    }
    if (timers.current.live) {
      clearInterval(timers.current.live);
      timers.current.live = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const resetGame = () => {
    stopAudio();
    setGameState('menu');
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
    setUpdateStats({
      total: 0,
      success: 0,
      failed: 0
    });
  };

  const startSession = () => {

    stopAudio();
    setGameState('playing');
    setIsReviewPhase(false);
    setFeedback({ text: '', color: '' });
    setShowResult(false);
    setTestResults([]);
    setIsUpdating(false);

    // 使用当前单词数据
    const wordsToUse = currentWordData;

    // 检查是否有足够的单词
    if (wordsToUse.length < 4) {
      showMessage('需要至少4个单词才能开始测试', 'warning');
      return;
    }

    // 复制并打乱单词数据
    const initialPool = [...wordsToUse].sort(() => Math.random() - 0.5);
    setTestPool(initialPool);
    setWrongPool([]);
    setTotalQuestions(initialPool.length);
    setStats({ correct: 0, wrong: 0, finished: 0 });

    // 记录开始时间
    startTimeRef.current = new Date();

    // 开始第一个单词
    setTimeout(() => { pickNext(initialPool); }, 150);
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

    // 从当前所有单词数据中生成干扰项
    const distractors = currentWordData
      .filter(i => i.english !== target.english)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    setCurrentWord(target);
    setOptions([...distractors, target].sort(() => Math.random() - 0.5));

    // 播放当前单词
    F_speak(target.english);

    // 计时器
    const sTime = Date.now();
    timers.current.live = setInterval(() => {
      setLiveTime(((Date.now() - sTime) / 1000).toFixed(1));
    }, 100);

    // 循环播放
    if (repeatMode) {
      timers.current.repeat = setInterval(() => F_speak(target.english), 3500);
    }
  };

  const handleAnswer = async (option) => {
    if (selectedId || showResult) return;

    stopAudio();
    const correct = option.english === currentWord.english;
    setSelectedId(option.english);
    setIsCorrect(correct);

    // 创建测试结果记录
    const testResult = {
      word: currentWord.english,
      chinese: currentWord.chinese,
      isCorrect: correct,
      timestamp: new Date().toISOString(),
      userAnswer: option.chinese,
      correctAnswer: currentWord.chinese,
      timeSpent: parseFloat(liveTime)
    };

    // 添加到测试结果列表
    setTestResults(prev => [...prev, testResult]);

    // 更新服务器（无论对错）
    if (currentWord && currentWord.english) {
      setIsUpdating(true);
      try {
        // 获取当前单词的数据
        const currentStats = await getWordCurrentStats(currentWord.english, getToken(), targetFile_1);
        console.log('当前状态', currentStats)
        // 更新到服务器
        const success = await updateTestResultToServer(
          currentWord.english,
          currentWord.chinese,
          correct,
          currentStats,
          targetFile_1 || 'me_word_index',  // 使用传入的targetFile_1，默认为'me_word_index'
          getToken()
        );

        if (success) {
          console.log(`单词 "${currentWord.english}" 测试结果已同步: ${correct ? '正确' : '错误'}`);
          testResult.serverUpdated = true;

          // 更新统计
          setUpdateStats(prev => ({
            ...prev,
            total: prev.total + 1,
            success: prev.success + 1
          }));
        } else {
          console.warn(`单词 "${currentWord.english}" 测试结果同步失败`);
          testResult.serverUpdated = false;

          setUpdateStats(prev => ({
            ...prev,
            total: prev.total + 1,
            failed: prev.failed + 1
          }));
        }
      } catch (error) {
        console.error('同步测试结果失败:', error);
        testResult.serverUpdated = false;

        setUpdateStats(prev => ({
          ...prev,
          total: prev.total + 1,
          failed: prev.failed + 1
        }));
      } finally {
        setIsUpdating(false);
      }
    }

    // 更新本地状态
    if (correct) {
      setStats(s => ({
        ...s,
        correct: isReviewPhase ? s.correct : s.correct + 1,
        finished: s.finished + 1
      }));
      setFeedback({
        text: '🎉 答对了！',
        color: '#4caf50'
      });
    } else {
      if (!isReviewPhase) {
        setStats(s => ({
          ...s,
          wrong: s.wrong + 1,
          finished: s.finished + 1
        }));
        setWrongPool(prev => [...prev, currentWord]);
      } else {
        // 错题复习模式下，将当前单词放回池子末尾
        setTestPool(prev => [...prev.slice(1), currentWord]);
        setFeedback({
          text: '❌ 答错了！',
          color: '#f44336'
        });
        setShowResult(true);
        return;
      }
      setFeedback({
        text: '❌ 答错了！',
        color: '#f44336'
      });
    }

    // 设置显示结果状态
    setTimeout(() => {
      setShowResult(true);
    }, 100);
  };

  const handleNextAction = () => {
    if (!selectedId) return;

    const nextPool = testPool.slice(1);
    setTestPool(nextPool);

    if (nextPool.length === 0) {
      if (!isReviewPhase && wrongPool.length > 0) {
        // 进入错题复习阶段
        setIsReviewPhase(true);
        setStats(s => ({ ...s, finished: 0 }));
        const newReviewPool = [...wrongPool].sort(() => Math.random() - 0.5);
        setTestPool(newReviewPool);
        pickNext(newReviewPool);
      } else {
        // 测试完成，记录结束时间
        testEndTimeRef.current = new Date();

        // 计算测试统计
        const testStats = {
          totalQuestions: totalQuestions,
          correctAnswers: stats.correct,
          wrongAnswers: stats.wrong,
          accuracy: totalQuestions > 0 ? Math.round((stats.correct / totalQuestions) * 100) : 0,
          timeSpent: testEndTimeRef.current ?
            Math.round((testEndTimeRef.current - startTimeRef.current) / 1000) : 0,
          testResults: testResults,
          updateStats: updateStats
        };

        // 调用回调函数通知主组件
        handleTestCompleted(testStats);

        setGameState('completed');
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
    if (onClose) onClose();
  };

  // ========== 菜单界面 ==========
  const renderMenu = () => (
    <Box sx={{
      height: '100%',
      overflow: 'auto',
      p: isMobile ? 1 : 2
    }}>
      <Box sx={{
        textAlign: 'center',
        mb: responsiveStyles.spacing.medium,
        p: isMobile ? 1 : 2
      }}>
        <Typography variant="h4" sx={{
          fontWeight: '900',
          color: 'primary.main',
          fontSize: responsiveStyles.fontSize.h3,
          mb: 2
        }}>
          🎧 听力测试
        </Typography>

        {isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <Smartphone fontSize="small" />
            <Typography variant="caption" color="text.secondary">
              移动端优化
            </Typography>
          </Box>
        )}
      </Box>

      <Paper sx={{
        p: responsiveStyles.cardPadding,
        borderRadius: 3,
        mb: responsiveStyles.spacing.medium
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Typography variant="h6" sx={{
            fontWeight: 'bold',
            fontSize: responsiveStyles.fontSize.h5
          }}>
            单词列表 ({currentWordData.length}个)
          </Typography>

          {isMobile && (
            <Chip
              size="small"
              label="轻触选择"
              color="info"
              variant="outlined"
              icon={<TouchApp fontSize="small" />}
            />
          )}
        </Box>

        <Box sx={{
          maxHeight: isMobile ? 150 : 200,
          overflow: 'auto',
          border: '1px solid #ddd',
          borderRadius: 2,
          p: isMobile ? 1 : 2,
          mb: responsiveStyles.spacing.medium
        }}>
          {currentWordData.map((word, index) => (
            <Box key={index} sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: isMobile ? 0.5 : 1,
              borderBottom: index < currentWordData.length - 1 ? '1px solid #f0f0f0' : 'none'
            }}>
              <Typography variant="body2" sx={{ fontSize: responsiveStyles.fontSize.body2 }}>
                {word.english}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: responsiveStyles.fontSize.caption }}>
                {word.chinese}
              </Typography>
            </Box>
          ))}
        </Box>

        <Button
          fullWidth
          variant="contained"
          size={responsiveStyles.buttonSize}
          startIcon={<Bolt />}
          onClick={startSession}
          disabled={currentWordData.length < 4}
          sx={{
            py: isMobile ? 1 : 1.5,
            borderRadius: 2,
            fontWeight: 'bold',
            fontSize: responsiveStyles.fontSize.body1,
            '&:disabled': {
              opacity: 0.7
            },
            '&:active': {
              transform: isMobile ? 'scale(0.98)' : 'none'
            }
          }}
        >
          {currentWordData.length < 4 ? '需要至少4个单词' : '开始听力测试'}
        </Button>

        {isMobile && (
          <Typography variant="caption" color="text.secondary" sx={{
            mt: 2,
            display: 'block',
            textAlign: 'center',
            fontSize: responsiveStyles.fontSize.caption
          }}>
            点击按钮开始测试，长按喇叭图标可重复播放
          </Typography>
        )}
      </Paper>

      {/* 设备提示 */}
      {!isDesktop && (
        <Paper sx={{
          p: isMobile ? 1 : 2,
          borderRadius: 3,
          bgcolor: '#f5f7fa'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {isMobile ? <Smartphone /> : <Tablet />}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {isMobile ? '移动端' : '平板端'}优化
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            • 大按钮设计，方便触摸操作<br />
            • 自适应布局，充分利用屏幕空间<br />
            • 语音播放优化，提升听力体验<br />
            • 简洁界面，专注学习内容
          </Typography>
        </Paper>
      )}
    </Box>
  );

  // ========== 游戏界面 ==========
  const renderGame = () => {
    const currentProgress = isReviewPhase
      ? (stats.finished / (wrongPool.length || 1)) * 100
      : (stats.finished / totalQuestions) * 100;

    return (
      <Box sx={{
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        p: isMobile ? 1 : 0
      }}>
        {/* 顶部信息栏 */}
        <Paper elevation={1} sx={{
          p: isMobile ? 1 : 2,
          mb: responsiveStyles.spacing.small,
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{
            fontWeight: 'bold',
            fontSize: responsiveStyles.fontSize.h6
          }}>
            听力测试 {isReviewPhase && "(错题复习)"}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: responsiveStyles.fontSize.body2 }}>
            进度: {stats.finished + 1}/{isReviewPhase ? wrongPool.length : totalQuestions}
          </Typography>
        </Paper>

        {/* 进度条 */}
        <LinearProgress
          variant="determinate"
          value={currentProgress}
          sx={{
            height: isMobile ? 8 : 10,
            borderRadius: 5,
            mb: responsiveStyles.spacing.medium
          }}
        />

        {/* 控制栏 */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{
          mb: responsiveStyles.spacing.medium,
          px: isMobile ? 0.5 : 0
        }}>
          <Button
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            startIcon={<ArrowBack />}
            onClick={() => {
              resetGame();
            }}
            disabled={selectedId && !showResult}
            sx={{
              fontSize: responsiveStyles.fontSize.caption
            }}
          >
            退出
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
            <Typography variant="body2" sx={{ fontSize: responsiveStyles.fontSize.body2 }}>
              用时: {liveTime}s
            </Typography>
            <Chip
              size="small"
              label={`${stats.finished > 0 ? Math.round(stats.correct / stats.finished * 100) : 0}% 正确`}
              color="primary"
              sx={{ fontSize: responsiveStyles.fontSize.caption }}
            />
            {isUpdating && <CircularProgress size={isMobile ? 14 : 16} />}
          </Box>
        </Stack>

        {/* 当前单词区域 */}
        <Card sx={{
          minHeight: isMobile ? 120 : isTablet ? 150 : 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 3,
          mb: responsiveStyles.spacing.medium,
          cursor: (!selectedId && !showResult) ? 'pointer' : 'default',
          border: selectedId ? `3px solid ${isCorrect ? '#4caf50' : '#f44336'}` : '2px solid #1976d2',
          backgroundColor: selectedId ? (isCorrect ? '#f1f8e9' : '#ffebee') : 'white',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          userSelect: 'none',
          '&:active': (!selectedId && !showResult) ? {
            backgroundColor: '#f5f5f5',
            transform: 'scale(0.99)'
          } : {}
        }}
          onClick={() => {
            if (!selectedId && !showResult && currentWord) {
              F_speak(currentWord.english);
            }
          }}
          onTouchStart={(e) => {
            if (!selectedId && !showResult && currentWord) {
              // 触摸反馈
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.backgroundColor = selectedId ?
              (isCorrect ? '#f1f8e9' : '#ffebee') : 'white';
          }}
        >
          {selectedId ? (
            <Box textAlign="center" sx={{ p: responsiveStyles.cardPadding }}>
              <Typography variant={isMobile ? "h4" : "h3"} fontWeight="bold" sx={{
                mb: 1,
                color: isCorrect ? '#4caf50' : '#f44336',
                fontSize: isMobile ? responsiveStyles.fontSize.h3 : responsiveStyles.fontSize.h2
              }}>
                {selectedId}
              </Typography>
              <Typography variant={isMobile ? "body1" : "h5"} color="text.secondary" sx={{
                fontSize: responsiveStyles.fontSize.body1
              }}>
                {options.find(opt => opt.english === selectedId)?.chinese}
              </Typography>
              {!isCorrect && currentWord && (
                <>
                  <Typography variant={isMobile ? "body1" : "h5"} color="success.main" sx={{
                    mt: 2,
                    fontWeight: 'bold',
                    fontSize: responsiveStyles.fontSize.body1
                  }}>
                    正确答案: {currentWord.english}
                  </Typography>
                  <Typography variant="body1" color="success.main" sx={{
                    fontSize: responsiveStyles.fontSize.body2
                  }}>
                    {currentWord.chinese}
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <Stack alignItems="center" spacing={isMobile ? 1 : 2} sx={{ p: responsiveStyles.cardPadding }}>
              <VolumeUp sx={{
                fontSize: isMobile ? 40 : isTablet ? 50 : 60,
                color: 'primary.main'
              }} />
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: responsiveStyles.fontSize.caption,
                textAlign: 'center'
              }}>
                {isMobile ? '点击或长按重听' : '点击喇叭重听单词'}
              </Typography>
            </Stack>
          )}
        </Card>

        {/* 选项按钮 */}
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 4 }}>
          {options.map((opt, i) => {
            const isSelected = selectedId === opt.english;
            const isCorrectOption = opt.english === currentWord?.english;
            let bgcolor = '#fff';
            let color = '#333';

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
                <Button
                  fullWidth
                  variant="contained"
                  size={responsiveStyles.buttonSize}
                  onClick={() => {
                    if (!selectedId && !showResult) {
                      handleAnswer(opt);
                    }
                  }}
                  disabled={!!selectedId || showResult || isUpdating}
                  sx={{
                    height: responsiveStyles.optionButtonHeight,
                    minHeight: responsiveStyles.optionButtonHeight,
                    borderRadius: 2,
                    fontSize: isMobile ? responsiveStyles.fontSize.caption : responsiveStyles.fontSize.body2,
                    fontWeight: 'bold',
                    bgcolor,
                    color,
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'scale(0.98)' : 'scale(1)',
                    touchAction: 'manipulation',
                    '&:active': (!selectedId && !showResult && !isUpdating) ? {
                      transform: 'scale(0.96)',
                      transition: 'transform 0.1s ease'
                    } : {},
                    '&:hover': (!selectedId && !showResult && !isUpdating) ? {
                      bgcolor: 'primary.main',
                      color: 'white',
                      transform: 'scale(1.02)'
                    } : {},
                    '&:disabled': { bgcolor, color }
                  }}
                  onTouchStart={(e) => {
                    if (!selectedId && !showResult && !isUpdating) {
                      e.currentTarget.style.transform = 'scale(0.96)';
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (!selectedId && !showResult && !isUpdating) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <Box sx={{
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {opt.chinese}
                  </Box>
                  {selectedId && isCorrectOption && !isSelected && (
                    <Typography
                      component="span"
                      sx={{
                        ml: 0.5,
                        fontWeight: 'bold',
                        color: 'inherit',
                        fontSize: '1.2em'
                      }}
                    >
                      ✓
                    </Typography>
                  )}
                </Button>
              </Grid>
            );
          })}
        </Grid>

        {/* 服务器更新状态 */}
        {updateStats.total > 0 && (
          <Paper sx={{
            p: isMobile ? 1 : 2,
            borderRadius: 2,
            mb: responsiveStyles.spacing.medium,
            bgcolor: '#e8f5e9'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" sx={{
                  fontWeight: 'bold',
                  color: 'success.main',
                  fontSize: responsiveStyles.fontSize.body2
                }}>
                  服务器更新状态
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{
                  fontSize: responsiveStyles.fontSize.caption
                }}>
                  实时同步测试结果中...
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${updateStats.success}/${updateStats.total}`}
                color={updateStats.success === updateStats.total ? "success" : "warning"}
                sx={{ fontSize: responsiveStyles.fontSize.caption }}
              />
            </Box>
          </Paper>
        )}

        {/* 错题列表 */}
        {wrongPool.length > 0 && (
          <Paper sx={{
            p: isMobile ? 1 : 2,
            borderRadius: 2,
            bgcolor: '#fff5f5',
            mb: responsiveStyles.spacing.medium
          }}>
            <Typography variant="subtitle2" sx={{
              fontWeight: 'bold',
              mb: 1,
              color: 'error.main',
              fontSize: responsiveStyles.fontSize.body2
            }}>
              错题列表 ({wrongPool.length})
            </Typography>
            <Box sx={{
              maxHeight: isMobile ? 80 : 150,
              overflow: 'auto'
            }}>
              {wrongPool.map((word, idx) => (
                <Box key={idx} sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  borderBottom: idx < wrongPool.length - 1 ? '1px solid #ffcdd2' : 'none'
                }}>
                  <Typography variant="body2" sx={{ fontSize: responsiveStyles.fontSize.body2 }}>
                    {word.english}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: responsiveStyles.fontSize.body2 }}>
                    {word.chinese}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* 阶段1: 选择后的立即反馈 */}
        {selectedId && !showResult && (
          <Box
            sx={{
              position: 'fixed',
              bottom: isMobile ? 10 : 20,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: isCorrect ? '#4caf50' : '#f44336',
              color: '#fff',
              px: isMobile ? 2 : 4,
              py: isMobile ? 1.5 : 2,
              borderRadius: 2,
              fontWeight: 'bold',
              textAlign: 'center',
              zIndex: 1000,
              boxShadow: 3,
              minWidth: isMobile ? 280 : 300,
              maxWidth: '90vw',
              // animation: 'fadeIn 0.3s ease-in-out',
            }}
          >
            <Typography variant={isMobile ? "body1" : "h5"} sx={{ fontSize: responsiveStyles.fontSize.body1 }}>
              {feedback.text}
            </Typography>
            <Typography variant="caption" sx={{
              mt: 0.5,
              opacity: 0.9,
              fontSize: responsiveStyles.fontSize.caption
            }}>
              {isUpdating ? '正在同步到服务器...' :
                isCorrect ? '正在加载下一题...' : '显示正确答案...'}
            </Typography>
          </Box>
        )}

        {/* 阶段2: 可以继续的提示 */}
        {showResult && (
          <Box
            sx={{
              position: 'fixed',
              bottom: isMobile ? 10 : 20,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: isCorrect ? '#4caf50' : '#f44336',
              color: '#fff',
              px: isMobile ? 2 : 4,
              py: isMobile ? 1.5 : 2,
              borderRadius: 2,
              fontWeight: 'bold',
              textAlign: 'center',
              zIndex: 1000,
              boxShadow: 3,
              minWidth: isMobile ? 280 : 300,
              maxWidth: '90vw',
              animation: 'pulseContinue 1.5s infinite',
              cursor: 'pointer',
              '&:active': {
                opacity: 0.95,
                transform: 'translateX(-50%) scale(0.98)'
              }
            }}
            onClick={handleNextAction}
          // onTouchStart={(e) => {
          //   e.currentTarget.style.transform = 'translateX(-50%) scale(0.98)';
          // }}
          // onTouchEnd={(e) => {
          //   e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          // }}
          >
            <Typography variant={isMobile ? "body1" : "h5"} sx={{ fontSize: responsiveStyles.fontSize.body1 }}>
              {feedback.text}
            </Typography>
            <Typography variant="caption" sx={{
              mt: 0.5,
              opacity: 0.9,
              fontSize: responsiveStyles.fontSize.caption
            }}>
              {isMobile ? '轻触继续下一题 →' : '点击任意位置继续下一题 →'}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // ========== 测试完成界面 ==========
  const renderCompleted = () => {
    const accuracy = totalQuestions > 0 ? Math.round((stats.correct / totalQuestions) * 100) : 0;
    const timeSpent = testEndTimeRef.current ?
      Math.round((testEndTimeRef.current - startTimeRef.current) / 1000) : 0;
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    const timeStr = currentDate.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const grade = accuracy >= 90 ? { text: '优秀', color: '#4caf50', emoji: '🎉' } :
      accuracy >= 70 ? { text: '良好', color: '#2196f3', emoji: '👍' } :
        accuracy >= 60 ? { text: '及格', color: '#ff9800', emoji: '✅' } :
          { text: '加油', color: '#f44336', emoji: '💪' };

    // 去重：获取所有刷过的单词（包括正确的和错误的）
    const allReviewedWords = [...new Set(testResults.map(r => r.word))];

    // 获取刷过的单词的详细信息
    const reviewedWordsDetails = allReviewedWords.map(word => {
      const wordResults = testResults.filter(r => r.word === word);
      const lastResult = wordResults[wordResults.length - 1];
      const correctCount = wordResults.filter(r => r.isCorrect).length;
      const totalCount = wordResults.length;
      const accuracyRate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

      return {
        word,
        chinese: lastResult?.chinese || '',
        correct: correctCount,
        total: totalCount,
        accuracyRate: accuracyRate,
        isFinalCorrect: lastResult?.isCorrect || false
      };
    });

    // 根据设备确定网格行列数
    const getGridConfig = () => {
      if (isMobile) {
        // 手机上：4列，行数根据单词数量计算
        const columns = 4;
        const rows = Math.ceil(reviewedWordsDetails.length / columns);
        return { columns, rows };
      } else if (isTablet) {
        // 平板上：5-6列
        const columns = 5;
        const rows = Math.ceil(reviewedWordsDetails.length / columns);
        return { columns, rows };
      } else {
        // 桌面：6-7列
        const columns = 6;
        const rows = Math.ceil(reviewedWordsDetails.length / columns);
        return { columns, rows };
      }
    };

    const gridConfig = getGridConfig();


    return (
      <Box sx={{
        height: '100%',
        overflow: 'hidden',
        p: isMobile ? 0.5 : 1
      }}>
        <Paper elevation={1} sx={{
          p: isMobile ? 1.5 : 2,
          borderRadius: 2,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 顶部标题和时间 */}
          <Box sx={{
            textAlign: 'center',
            mb: isMobile ? 1 : 1.5,
            flexShrink: 0
          }}>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{
              fontWeight: 'bold',
              mb: 0.5,
              fontSize: isMobile ? '1.1rem' : '1.3rem'
            }}>
              📊 2_听力测试报告
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{
              fontSize: isMobile ? '0.7rem' : '0.8rem'
            }}>
              {dateStr} {timeStr}
            </Typography>
          </Box>

          {/* 第一行：核心统计数据 */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: isMobile ? 0.5 : 1,
            mb: isMobile ? 1 : 1.5,
            flexShrink: 0
          }}>
            {/* 正确率卡片 */}
            <Box sx={{
              gridColumn: 'span 1',
              textAlign: 'center',
              p: isMobile ? 0.5 : 1,
              border: `2px solid ${grade.color}`,
              borderRadius: 1.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{
                fontWeight: 'bold',
                color: grade.color,
                fontSize: isMobile ? '1.3rem' : '1.6rem',
                lineHeight: 1
              }}>
                {accuracy}%
              </Typography>
              <Typography variant="caption" sx={{
                fontWeight: 'bold',
                color: grade.color,
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                mt: 0.25
              }}>
                {grade.emoji} {grade.text}
              </Typography>
            </Box>

            {/* 其他统计项 */}
            {[
              { label: '答对', value: stats.correct, color: '#4caf50' },
              { label: '答错', value: stats.wrong, color: '#f44336' },
              { label: '总词数', value: allReviewedWords.length, color: '#2196f3' }
            ].map((item, index) => (
              <Box key={index} sx={{
                textAlign: 'center',
                p: isMobile ? 0.5 : 1,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant={isMobile ? "body2" : "body1"} sx={{
                  fontWeight: 'bold',
                  color: item.color,
                  fontSize: isMobile ? '0.85rem' : '1rem'
                }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  mt: 0.25
                }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* 第二行：详细测试信息 */}
          <Box sx={{
            mb: isMobile ? 1 : 1.5,
            flexShrink: 0
          }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0.5
            }}>
              {[
                { label: '总题数', value: totalQuestions },
                { label: '总用时', value: `${timeSpent}秒` },
                { label: '平均用时', value: `${(timeSpent / totalQuestions).toFixed(1)}秒/题` },
                { label: '测试次数', value: testResults.length }
              ].map((item, index) => (
                <Box key={index} sx={{
                  p: isMobile ? 0.5 : 0.75,
                  border: '1px solid #f0f0f0',
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="caption" sx={{
                    fontWeight: 'bold',
                    fontSize: isMobile ? '0.65rem' : '0.75rem',
                    display: 'block'
                  }}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{
                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                    display: 'block'
                  }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* 刷过的单词网格显示 */}
          <Box sx={{
            mb: isMobile ? 1 : 1.5,
            flex: 1,
            minHeight: 0
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5
            }}>
              <Typography variant="subtitle2" sx={{
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>
                📝 刷过的单词 ({allReviewedWords.length}个)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: isMobile ? '0.65rem' : '0.75rem'
              }}>
                正确率: {accuracy}%
              </Typography>
            </Box>

            {/* 单词网格容器 */}
            <Box sx={{
              height: 'calc(100% - 25px)',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              overflow: 'hidden'
            }}>
              {/* 网格标题 */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: 0,
                borderBottom: '1px solid #e0e0e0',
                bgcolor: '#f8f9fa'
              }}>
                {Array.from({ length: gridConfig.columns }).map((_, colIndex) => (
                  <Box key={colIndex} sx={{
                    p: 0.5,
                    borderRight: colIndex === gridConfig.columns - 1 ? 'none' : '1px solid #e0e0e0',
                    textAlign: 'center'
                  }}>
                    <Typography variant="caption" sx={{
                      fontWeight: 'bold',
                      fontSize: isMobile ? '0.6rem' : '0.7rem'
                    }}>
                      单词 {colIndex + 1}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* 单词网格内容 */}
              <Box sx={{
                height: 'calc(100% - 30px)',
                overflow: 'auto'
              }}>
                {/* 创建网格行 */}
                {Array.from({ length: gridConfig.rows }).map((_, rowIndex) => {
                  const startIndex = rowIndex * gridConfig.columns;
                  const rowWords = reviewedWordsDetails.slice(startIndex, startIndex + gridConfig.columns);

                  return (
                    <Box
                      key={rowIndex}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
                        gap: 0,
                        borderBottom: rowIndex === gridConfig.rows - 1 ? 'none' : '1px solid #f0f0f0',
                        minHeight: isMobile ? '28px' : '32px'
                      }}
                    >
                      {/* 每行的单元格 */}
                      {Array.from({ length: gridConfig.columns }).map((_, colIndex) => {
                        const wordInfo = rowWords[colIndex];
                        const cellIndex = startIndex + colIndex;

                        if (!wordInfo) {
                          return (
                            <Box
                              key={colIndex}
                              sx={{
                                p: 0.5,
                                borderRight: colIndex === gridConfig.columns - 1 ? 'none' : '1px solid #f0f0f0',
                                minHeight: '100%'
                              }}
                            />
                          );
                        }

                        return (
                          <Box
                            key={cellIndex}
                            sx={{
                              p: 0.5,
                              borderRight: colIndex === gridConfig.columns - 1 ? 'none' : '1px solid #f0f0f0',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              minHeight: '100%',
                              position: 'relative',
                              bgcolor: cellIndex % 2 === 0 ? '#ffffff' : '#fafafa',
                              '&:hover': {
                                bgcolor: '#f0f7ff'
                              }
                            }}
                          >
                            {/* 单词 */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.25 }}>
                              <Box sx={{
                                width: 2,
                                height: 2,
                                borderRadius: '50%',
                                bgcolor: wordInfo.isFinalCorrect ? '#4caf50' : '#f44336',
                                mt: 0.5,
                                flexShrink: 0
                              }} />
                              <Box sx={{ overflow: 'hidden', flex: 1 }}>
                                <Typography variant="caption" sx={{
                                  fontWeight: 'bold',
                                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                  lineHeight: 1.2
                                }}>
                                  {wordInfo.word}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{
                                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                  lineHeight: 1.2
                                }}>
                                  {wordInfo.chinese}
                                </Typography>
                              </Box>
                            </Box>

                            {/* 正确率标签 */}
                            <Box sx={{
                              position: 'absolute',
                              top: 1,
                              right: 1
                            }}>
                              <Box sx={{
                                px: 0.25,
                                py: 0.1,
                                borderRadius: 1,
                                bgcolor: wordInfo.accuracyRate === 100 ? '#e8f5e9' :
                                  wordInfo.accuracyRate >= 70 ? '#e3f2fd' :
                                    wordInfo.accuracyRate >= 50 ? '#fff3e0' : '#ffebee',
                                border: `0.5px solid ${wordInfo.accuracyRate === 100 ? '#4caf50' :
                                  wordInfo.accuracyRate >= 70 ? '#2196f3' :
                                    wordInfo.accuracyRate >= 50 ? '#ff9800' : '#f44336'}`
                              }}>
                                <Typography variant="caption" sx={{
                                  fontWeight: 'bold',
                                  color: wordInfo.accuracyRate === 100 ? '#2e7d32' :
                                    wordInfo.accuracyRate >= 70 ? '#1565c0' :
                                      wordInfo.accuracyRate >= 50 ? '#ef6c00' : '#c62828',
                                  fontSize: isMobile ? '0.5rem' : '0.55rem',
                                  lineHeight: 1
                                }}>
                                  {wordInfo.accuracyRate}%
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* 底部：错误单词和操作按钮 */}
          <Box sx={{
            flexShrink: 0
          }}>
            {/* 错误单词提醒 */}
            {wrongPool.length > 0 && (
              <Box sx={{
                mb: 1,
                p: 1,
                border: '1px solid #ffccbc',
                borderRadius: 1,
                bgcolor: '#fff8f7'
              }}>
                <Typography variant="caption" sx={{
                  fontWeight: 'bold',
                  color: '#d84315',
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  mb: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25
                }}>
                  ⚠️ 需要复习 ({wrongPool.length}个):
                </Typography>
                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  alignItems: 'center'
                }}>
                  {wrongPool.slice(0, 8).map((word, idx) => (
                    <Box key={idx} sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: '#fff',
                      border: '1px solid #ffccbc'
                    }}>
                      <Typography variant="caption" sx={{
                        fontWeight: 'bold',
                        color: '#d84315',
                        fontSize: isMobile ? '0.6rem' : '0.7rem'
                      }}>
                        {word.english}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{
                        fontSize: isMobile ? '0.55rem' : '0.65rem',
                        ml: 0.25
                      }}>
                        ({word.chinese})
                      </Typography>
                    </Box>
                  ))}
                  {wrongPool.length > 8 && (
                    <Typography variant="caption" color="text.secondary" sx={{
                      fontSize: isMobile ? '0.6rem' : '0.7rem'
                    }}>
                      等{wrongPool.length}个单词
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* 服务器状态 */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
              p: 0.5,
              border: '1px solid #e0e0e0',
              borderRadius: 1
            }}>
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: isMobile ? '0.6rem' : '0.7rem'
              }}>
                同步状态: {updateStats.success}/{updateStats.total} 成功
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: isMobile ? '0.6rem' : '0.7rem'
              }}>
                下次复习: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}
              </Typography>
            </Box>

            {/* 操作按钮 */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0.5
            }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size={isMobile ? "small" : "medium"}
                startIcon={<ArrowBack />}
                onClick={() => {
                  resetGame();
                  if (onClose) onClose();
                }}
                sx={{
                  py: isMobile ? 0.5 : 0.75,
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.7rem' : '0.8rem'
                }}
              >
                完成测试
              </Button>

              {wrongPool.length > 0 && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  size={isMobile ? "small" : "medium"}
                  startIcon={<Replay />}
                  onClick={() => {
                    setTestPool([...wrongPool].sort(() => Math.random() - 0.5));
                    setWrongPool([]);
                    setStats({ correct: 0, wrong: 0, finished: 0 });
                    setGameState('playing');
                    setIsReviewPhase(true);
                    setFeedback({ text: '', color: '' });
                    setShowResult(false);
                  }}
                  sx={{
                    py: isMobile ? 0.5 : 0.75,
                    fontWeight: 'bold',
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    borderWidth: 1.5
                  }}
                >
                  复习错题
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderContent = () => {
    switch (gameState) {
      case 'menu':
        return renderMenu();
      case 'playing':
        return renderGame();
      case 'completed':
        return renderCompleted();
      default:
        return null;
    }
  };

  return (
    <>
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
            minHeight: isMobile ? 'auto' : (isTablet ? '500px' : '600px'),
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
            <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold" sx={{
              fontSize: isMobile ? responsiveStyles.fontSize.h6 : responsiveStyles.fontSize.h5
            }}>
              英语听力测试
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              color: 'white',
              p: isMobile ? 0.5 : 1
            }}
            size={isMobile ? "small" : "medium"}
          >
            <Close fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{
          p: isMobile ? 1 : 3,
          height: '100%',
          overflow: 'hidden'
        }}>
          <Box sx={{ height: '100%' }}>
            {renderContent()}
          </Box>
        </DialogContent>

        <DialogActions sx={{
          borderTop: '1px solid #eee',
          justifyContent: 'space-between',
          px: isMobile ? 1 : 3,
          py: isMobile ? 1 : 2
        }}>
          <Typography variant="caption" color="text.secondary" sx={{
            fontSize: responsiveStyles.fontSize.caption
          }}>
            总单词数: {currentWordData.length} |
            {gameState === 'playing' && ` 进度: ${stats.finished}/${totalQuestions}`}
            {gameState === 'completed' && ` 正确率: ${Math.round((stats.correct / totalQuestions) * 100)}%`}
          </Typography>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{
          vertical: isMobile ? 'bottom' : 'top',
          horizontal: 'center'
        }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            fontSize: responsiveStyles.fontSize.body2
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};


export default ListeningFinalMaster;