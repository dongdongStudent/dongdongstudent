import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, Grid, IconButton, Button, LinearProgress, Snackbar,
  Stack, Alert, Radio, FormControlLabel, RadioGroup, FormControl, CardMedia,
  Chip, Tooltip, Slider, Modal, Backdrop, Fade, Divider, Select, MenuItem, InputLabel
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
  School as SchoolIcon, Home as HomeIcon, Replay as ReplayIcon, Settings as SettingsIcon,
  Close as CloseIcon, Hearing as HearingIcon, Translate as TranslateIcon,
  Image as ImageIcon, EmojiEvents as EmojiEventsIcon, ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon, RotateRight as RotateRightIcon, Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { wordMemoryApi } from './api';
import { F_speak } from '../Function/weisimin.js';

const StyledCard = styled(Paper)({ borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' });

const WordTest = ({ onBack, currentBank }) => {
  // 基础状态
  const [testType, setTestType] = useState('picture');
  const [wordData, setWordData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 索引状态
  const [pictureIndex, setPictureIndex] = useState(0);
  const [en2zhIndex, setEn2zhIndex] = useState(0);
  const [listenIndex, setListenIndex] = useState(0);
  
  // 掌握列表
  const [masteredPicture, setMasteredPicture] = useState([]);
  const [masteredEn2zh, setMasteredEn2zh] = useState([]);
  const [masteredListen, setMasteredListen] = useState([]);
  
  // 可用单元列表
  const [availableUnits, setAvailableUnits] = useState([]);
  
  // 测试会话
  const [testSession, setTestSession] = useState({
    questions: [], current: 0, results: [], showResult: false,
    correctCount: 0, startTime: null, totalQuestions: 0
  });

  // 抽取范围设置（只保留五个选项）
  const [rangeType, setRangeType] = useState('all');
  const [rangeValue, setRangeValue] = useState([1, 10]);
  const [selectedUnit, setSelectedUnit] = useState(0);
  const [questionCount, setQuestionCount] = useState(5);
  
  // 自动播放设置
  const [autoPlay, setAutoPlay] = useState(true);
  
  // UI状态
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState('');
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [options, setOptions] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  
  // 图片放大状态
  const [modalOpen, setModalOpen] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const hasAutoPlayedRef = useRef(false);
  const playTimerRef = useRef(null);

  // ========== 辅助函数 ==========
  const getCurrentIndex = () => {
    switch(testType) {
      case 'picture': return pictureIndex;
      case 'en2zh': return en2zhIndex;
      case 'listen': return listenIndex;
      default: return 0;
    }
  };

  const setCurrentIndex = (index) => {
    switch(testType) {
      case 'picture': setPictureIndex(index); break;
      case 'en2zh': setEn2zhIndex(index); break;
      case 'listen': setListenIndex(index); break;
      default: break;
    }
  };

  const getAllMasteredIds = () => {
    switch(testType) {
      case 'picture': return masteredPicture;
      case 'en2zh': return masteredEn2zh;
      case 'listen': return masteredListen;
      default: return [];
    }
  };

  const getTestProgress = () => {
    if (!testSession.totalQuestions) return 0;
    return ((testSession.current + 1) / testSession.totalQuestions) * 100;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('./')) return `https://www.ddstudent.xyz/server/src/1_english/resource/english_book_1_work/${imagePath.substring(2)}`;
    return imagePath;
  };

  const getWordImage = (word) => {
    if (!word) return '';
    if (word.image) return getImageUrl(word.image);
    if (word.images?.length > 0) return getImageUrl(word.images[0].url);
    return '';
  };

  const getWordTranslation = (word) => {
    if (!word) return '';
    return typeof word.translation === 'string' ? word.translation : word.translation?.[0] || '';
  };

  // ========== 判断单词在特定模式下是否已掌握（只需最近一次正确） ==========
  const isWordMasteredInMode = (word, mode) => {
    if (!word.stats?.recent_results?.[mode]) return false;
    const recent = word.stats.recent_results[mode];
    return recent.length >= 1 && recent.slice(-1)[0] === true;
  };

  // ========== 核心筛选逻辑 ==========
  const getUnitFilteredWords = () => {
    if (selectedUnit === 0) return wordData;
    return wordData.filter(word => word.unit === selectedUnit);
  };

  const getFilteredWords = () => {
    const unitWords = getUnitFilteredWords();
    
    if (rangeType === 'all') return unitWords;
    if (rangeType === 'mastered') {
      const masteredIds = getAllMasteredIds();
      return unitWords.filter(word => masteredIds.includes(word.id));
    }
    if (rangeType === 'unmastered') {
      const masteredIds = getAllMasteredIds();
      return unitWords.filter(word => !masteredIds.includes(word.id));
    }
    if (rangeType === 'custom') {
      const start = rangeValue[0] - 1;
      const end = rangeValue[1];
      return unitWords.slice(start, end);
    }
    if (rangeType === 'random') {
      return unitWords; // 随机抽取由 startTest 处理
    }
    return unitWords;
  };

  const getAvailableCount = () => getFilteredWords().length;

  const getModeStats = () => {
    const unitWords = getUnitFilteredWords();
    const total = unitWords.length;
    const masteredIds = getAllMasteredIds();
    const mastered = unitWords.filter(word => masteredIds.includes(word.id)).length;
    return { total, mastered, unmastered: total - mastered, percentage: total ? Math.round((mastered / total) * 100) : 0 };
  };

  // ========== 语音 ==========
  const speak = (word) => {
    setIsPlaying(true);
    F_speak(word);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => setIsPlaying(false), 1500);
  };

  // ========== 加载单词 ==========
  const loadWords = async () => {
    setLoading(true);
    try {
      const res = await wordMemoryApi.getWords();
      if (res.flag === 1) {
        const words = res.content.words || [];
        setWordData(words);
        
        const units = [...new Set(words.map(word => word.unit).filter(u => u))].sort((a, b) => a - b);
        setAvailableUnits(units);
        
        const masteredPic = [], masteredEn = [], masteredLis = [];
        words.forEach(word => {
          if (isWordMasteredInMode(word, 'picture')) masteredPic.push(word.id);
          if (isWordMasteredInMode(word, 'en2zh')) masteredEn.push(word.id);
          if (isWordMasteredInMode(word, 'listen')) masteredLis.push(word.id);
        });
        
        setMasteredPicture(masteredPic);
        setMasteredEn2zh(masteredEn);
        setMasteredListen(masteredLis);
        
        console.log('📊 掌握情况统计:', {
          看图: masteredPic.length,
          英译中: masteredEn.length,
          听力: masteredLis.length,
          总单词数: words.length
        });
      }
    } catch (error) {
      console.error('加载单词失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== 开始测试 ==========
  const startTest = () => {
    const available = getFilteredWords();
    if (available.length === 0) {
      alert('当前范围内没有可用的单词');
      return;
    }

    const actualCount = Math.min(questionCount, available.length);
    
    // 根据不同的抽取范围选择单词
    let selectedWords;
    
    if (rangeType === 'random') {
      // 随机抽取
      selectedWords = [...available].sort(() => 0.5 - Math.random()).slice(0, actualCount);
    } else if (rangeType === 'mastered') {
      // 已掌握模式：随机抽取已掌握的单词
      selectedWords = [...available].sort(() => 0.5 - Math.random()).slice(0, actualCount);
    } else {
      // 原有的逻辑：基于掌握程度排序后选择（未掌握优先）
      const wordsWithMastery = available.map(word => {
        const stat = word.stats;
        const correctCount = stat?.correct_count || 0;
        const totalCount = stat?.extract_count || 0;
        const mastery = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
        return { ...word, mastery };
      });
      
      // 按掌握程度排序（低掌握优先）
      wordsWithMastery.sort((a, b) => a.mastery - b.mastery);
      selectedWords = wordsWithMastery.slice(0, actualCount);
    }

    const questions = selectedWords.map(word => {
      const correct = testType === 'en2zh' || testType === 'listen' ? word.translation : word.word;
      const otherWords = wordData
        .filter(w => w.id !== word.id)
        .map(w => testType === 'en2zh' || testType === 'listen' ? w.translation : w.word)
        .filter((v, i, a) => a.indexOf(v) === i);
      
      let options = [correct, ...otherWords.slice(0, 3)];
      while (options.length < 4) options.push('未知');
      options = options.sort(() => 0.5 - Math.random());

      return { 
        id: word.id, 
        word: word.word, 
        translation: word.translation, 
        unit: word.unit,
        correct, 
        options 
      };
    });

    setTestSession({
      questions, current: 0, results: [], showResult: false,
      correctCount: 0, startTime: Date.now(), totalQuestions: questions.length
    });

    if (questions.length > 0) {
      const idx = wordData.findIndex(w => w.id === questions[0].id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    }

    setSelected('');
    setAnswered(false);
    setFeedback(null);
    setShowSettings(false);
    hasAutoPlayedRef.current = false;
  };

  // ========== 提交数据 ==========
  const submitLearningData = async () => {
    try {
      const submitData = {
        testType,
        results: testSession.results.map(r => ({
          wordId: r.wordId, userAnswer: r.userAnswer, correct: r.correct,
          isCorrect: r.isCorrect, responseTime: r.responseTime || 0
        })),
        timeSpent: testSession.startTime ? Math.round((Date.now() - testSession.startTime) / 1000) : 0
      };

      const res = await wordMemoryApi.submitTest(submitData);
      if (res.flag === 1) {
        setSnackbar({ open: true, message: '✅ 学习记录已保存', severity: 'success' });
        await loadWords();
      }
    } catch (error) {
      setSnackbar({ open: true, message: '❌ 提交失败', severity: 'error' });
    }
  };

  // ========== 处理答案 ==========
  const handleAnswer = (option) => {
    if (answered || !testSession.questions.length) return;
    
    const correctWord = currentWord.word;
    const correctTranslation = getWordTranslation(currentWord);
    const correct = testType === 'en2zh' || testType === 'listen' 
      ? correctTranslation : correctWord;
    const isCorrect = option === correct;

    setSelected(option);
    setAnswered(true);
    setFeedback({ 
      isCorrect, 
      correct,
      correctWord,
      correctTranslation 
    });

    const newResult = {
      wordId: currentWord.id, word: currentWord.word,
      userAnswer: option, correct, isCorrect,
      responseTime: Math.round((Date.now() - testSession.startTime) / 1000),
      testType
    };

    const newResults = [...testSession.results, newResult];
    const newCorrectCount = testSession.correctCount + (isCorrect ? 1 : 0);

    setTestSession(prev => ({
      ...prev,
      results: newResults,
      correctCount: newCorrectCount
    }));

    if (isCorrect && newCorrectCount === testSession.totalQuestions) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  // ========== 点击屏幕任意位置进入下一题 ==========
  const handleScreenClick = () => {
    if (answered && testSession.questions.length && !testSession.showResult) {
      if (testSession.current + 1 >= testSession.totalQuestions) {
        submitLearningData();
        setTestSession(prev => ({ ...prev, showResult: true }));
      } else {
        const next = testSession.current + 1;
        const nextWord = testSession.questions[next];
        setTestSession(prev => ({ ...prev, current: next }));
        setCurrentIndex(wordData.findIndex(w => w.id === nextWord.id));
        setSelected('');
        setAnswered(false);
        setFeedback(null);
        hasAutoPlayedRef.current = false;
      }
    }
  };

  // ========== 自动播放 ==========
  const currentIndex = getCurrentIndex();
  const currentWord = wordData[currentIndex] || wordData[0];
  const totalWordsCount = getUnitFilteredWords().length;
  const masteredCount = getAllMasteredIds().filter(id => getUnitFilteredWords().some(w => w.id === id)).length;
  const progress = totalWordsCount ? Math.round((masteredCount / totalWordsCount) * 100) : 0;
  const modeStats = getModeStats();

  useEffect(() => {
    if (autoPlay && currentWord && !answered && !isPlaying && !hasAutoPlayedRef.current && testSession.questions.length && !testSession.showResult) {
      hasAutoPlayedRef.current = true;
      setTimeout(() => speak(currentWord.word), 100);
    }
  }, [currentIndex, autoPlay, answered, isPlaying, currentWord, testSession.questions.length, testSession.showResult]);

  // ========== 获取选项 ==========
  useEffect(() => {
    if (currentWord && testSession.questions.length && !testSession.showResult) {
      const correct = testType === 'en2zh' || testType === 'listen' ? currentWord.translation : currentWord.word;
      const others = wordData
        .filter(w => w.id !== currentWord.id)
        .map(w => testType === 'en2zh' || testType === 'listen' ? w.translation : w.word)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 3);
      
      let opts = [correct, ...others];
      while (opts.length < 4) opts.push('未知');
      setOptions(opts.sort(() => 0.5 - Math.random()));
    }
  }, [currentIndex, testType, testSession.questions.length, testSession.showResult, wordData]);

  // ========== 初始加载 ==========
  useEffect(() => { loadWords(); }, [currentBank]);

  if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}><LinearProgress /><Typography sx={{ mt: 2 }}>加载中...</Typography></Box>;
  if (!wordData.length) return <Box sx={{ p: 3 }}><Alert severity="warning">暂无单词数据</Alert><Button variant="contained" onClick={onBack} sx={{ mt: 2 }}>返回</Button></Box>;

  return (
    <Box 
      ref={containerRef}
      onClick={handleScreenClick}
      sx={{ 
        maxWidth: isFullscreen ? '100%' : 600, 
        mx: 'auto', 
        p: isFullscreen ? 3 : 2,
        minHeight: '100vh',
        cursor: answered ? 'pointer' : 'default',
        width: '100%'
      }}
    >
      {/* 头部 */}
      <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center"><SchoolIcon /><Typography variant="subtitle1">单词测试</Typography></Stack>
          <Stack direction="row" spacing={1}>
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏模式"}>
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                if (!document.fullscreenElement) containerRef.current.requestFullscreen();
                else document.exitFullscreen();
              }} sx={{ color: 'white' }}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            {testSession.totalQuestions > 0 && !testSession.showResult ? (
              <Box sx={{ width: 80 }}><LinearProgress variant="determinate" value={getTestProgress()} sx={{ bgcolor: 'rgba(255,255,255,0.3)', height: 4 }} /></Box>
            ) : (
              <Box sx={{ width: 80 }}><LinearProgress variant="determinate" value={progress} sx={{ bgcolor: 'rgba(255,255,255,0.3)', height: 4 }} /></Box>
            )}
          </Stack>
        </Stack>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.9 }}>
          {testType === 'picture' && '📷 看图'} 
          {testType === 'en2zh' && '📖 英译中'} 
          {testType === 'listen' && '👂 听力'}
          {selectedUnit !== 0 ? ` - 第${selectedUnit}单元` : ''} ｜ 已掌握 {masteredCount}/{totalWordsCount}
        </Typography>
      </Paper>

      {/* 测试类型选择 */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button 
          size="small" 
          variant={testType === 'picture' ? 'contained' : 'outlined'} 
          onClick={(e) => { 
            e.stopPropagation(); 
            setTestSession({ ...testSession, questions: [] }); 
            setTestType('picture'); 
            setShowSettings(true); 
          }} 
          startIcon={<ImageIcon />}
        >
          看图 ({masteredPicture.length}/{wordData.length})
        </Button>
        <Button 
          size="small" 
          variant={testType === 'en2zh' ? 'contained' : 'outlined'} 
          onClick={(e) => { 
            e.stopPropagation(); 
            setTestSession({ ...testSession, questions: [] }); 
            setTestType('en2zh'); 
            setShowSettings(true); 
          }} 
          startIcon={<TranslateIcon />}
        >
          英译中 ({masteredEn2zh.length}/{wordData.length})
        </Button>
        <Button 
          size="small" 
          variant={testType === 'listen' ? 'contained' : 'outlined'} 
          onClick={(e) => { 
            e.stopPropagation(); 
            setTestSession({ ...testSession, questions: [] }); 
            setTestType('listen'); 
            setShowSettings(true); 
          }} 
          startIcon={<HearingIcon />}
        >
          听力 ({masteredListen.length}/{wordData.length})
        </Button>
        {!testSession.showResult && (
          <Tooltip title="设置">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* 内容区域 */}
      {showSettings ? (
        <StyledCard sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle1">⚙️ 抽取设置</Typography>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setShowSettings(false); }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          
          {/* 统计 */}
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              {testType === 'picture' && '📷 看图'} 
              {testType === 'en2zh' && '📖 英译中'} 
              {testType === 'listen' && '👂 听力'}
              {selectedUnit !== 0 ? ` - 第${selectedUnit}单元` : ' - 全部单元'} 统计
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight={500}>{modeStats.total}</Typography>
                  <Typography variant="caption">总单词</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                  <Typography variant="body2" fontWeight={500} color="success.main">{modeStats.mastered}</Typography>
                  <Typography variant="caption">已掌握</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: '#fff3e0' }}>
                  <Typography variant="body2" fontWeight={500} color="warning.main">{modeStats.unmastered}</Typography>
                  <Typography variant="caption">未掌握</Typography>
                </Paper>
              </Grid>
            </Grid>
            <LinearProgress variant="determinate" value={modeStats.percentage} sx={{ mt: 1, height: 6, borderRadius: 3 }} />
          </Box>
          
          {/* 单元选择 */}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>选择单元</InputLabel>
            <Select 
              value={selectedUnit} 
              label="选择单元" 
              onChange={(e) => setSelectedUnit(e.target.value)} 
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem value={0}>📚 全部单元 ({wordData.length}个)</MenuItem>
              {availableUnits.map(unit => {
                const cnt = wordData.filter(w => w.unit === unit).length;
                return <MenuItem key={unit} value={unit}>第 {unit} 单元 ({cnt}个)</MenuItem>;
              })}
            </Select>
          </FormControl>

          {/* 抽取范围 - 只保留五个选项 */}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>抽取范围</InputLabel>
            <Select 
              value={rangeType} 
              label="抽取范围" 
              onChange={(e) => setRangeType(e.target.value)} 
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem value="all">📚 全部单词 ({modeStats.total}个)</MenuItem>
              <MenuItem value="unmastered">🎯 未掌握单词 ({modeStats.unmastered}个)</MenuItem>
              <MenuItem value="mastered">⭐ 已掌握单词 ({modeStats.mastered}个)</MenuItem>
              <MenuItem value="custom">📏 自定义范围</MenuItem>
              <MenuItem value="random">🎲 随机抽取</MenuItem>
            </Select>
          </FormControl>

          {/* 自定义范围滑块 */}
          {rangeType === 'custom' && (
            <Box sx={{ mb: 2 }} onClick={(e) => e.stopPropagation()}>
              <Typography variant="body2" gutterBottom color="text.secondary">
                第 {rangeValue[0]} - 第 {rangeValue[1]} 个单词 (共 {modeStats.total} 个)
              </Typography>
              <Slider
                value={rangeValue}
                onChange={(e, newValue) => setRangeValue(newValue)}
                min={1}
                max={modeStats.total}
                step={1}
                valueLabelDisplay="auto"
                size="small"
              />
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />
          
          {/* 题目数量 */}
          <Box sx={{ mb: 1 }} onClick={(e) => e.stopPropagation()}>
            <Typography variant="body2" gutterBottom>
              题目数量: {questionCount} / {getAvailableCount()}
            </Typography>
            <Slider 
              value={questionCount} 
              onChange={(e, val) => setQuestionCount(val)} 
              min={1} 
              max={getAvailableCount()} 
              step={1} 
              size="small" 
            />
          </Box>

          <FormControlLabel 
            control={
              <input 
                type="checkbox" 
                checked={autoPlay} 
                onChange={(e) => setAutoPlay(e.target.checked)} 
                onClick={(e) => e.stopPropagation()} 
              />
            } 
            label={<Typography variant="body2">自动播放发音</Typography>} 
            sx={{ mb: 2 }} 
          />

          <Button 
            variant="contained" 
            fullWidth 
            onClick={(e) => { e.stopPropagation(); startTest(); }} 
            size="large"
          >
            {rangeType === 'mastered' ? '⭐ 复习已掌握单词' : '开始测试'}
          </Button>
        </StyledCard>
      ) : testSession.showResult ? (
        <StyledCard sx={{ p: 2 }}>
          <Typography variant="h6" align="center" gutterBottom>测试完成</Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                <Typography variant="h5" color="success.main">
                  {testSession.totalQuestions ? Math.round((testSession.correctCount / testSession.totalQuestions) * 100) : 0}%
                </Typography>
                <Typography variant="caption">正确率</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                <Typography variant="h5" color="primary">{testSession.correctCount}/{testSession.totalQuestions}</Typography>
                <Typography variant="caption">答对题数</Typography>
              </Paper>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button 
              size="small" 
              variant="contained" 
              startIcon={<ReplayIcon />} 
              onClick={(e) => { e.stopPropagation(); setTestSession({ ...testSession, questions: [], showResult: false }); setShowSettings(true); }}
            >
              再练一次
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<HomeIcon />} 
              onClick={(e) => { e.stopPropagation(); onBack(); }}
            >
              返回
            </Button>
          </Stack>
        </StyledCard>
      ) : testSession.questions.length ? (
        <StyledCard sx={{ p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="body2">
                {testType === 'picture' && '📷 看图选英文'}
                {testType === 'en2zh' && '📖 英文选中文'}
                {testType === 'listen' && '👂 听力选中文'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip 
                  label={`ID: ${currentWord?.id || ''}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6rem' }} 
                />
                <Chip label={`${testSession.current + 1}/${testSession.totalQuestions}`} size="small" />
              </Stack>
            </Stack>
            <LinearProgress variant="determinate" value={getTestProgress()} sx={{ height: 4 }} />
          </Box>

          {/* 单词信息 */}
          <Paper sx={{ p: 1, mb: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Stack direction="row" spacing={2} justifyContent="center" divider={<Divider orientation="vertical" flexItem />}>
              <Typography variant="caption">单元: {currentWord?.unit || '无'}</Typography>
              <Typography variant="caption">ID: {currentWord?.id || '无'}</Typography>
              <Typography variant="caption">难度: {currentWord?.difficulty || 1}</Typography>
            </Stack>
          </Paper>

          <Box sx={{ textAlign: 'center', mb: 2 }}>
            {testType === 'picture' && (
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Box onClick={(e) => { e.stopPropagation(); setModalOpen(true); }} sx={{ cursor: 'pointer' }}>
                  <CardMedia 
                    component="img" 
                    height={isFullscreen ? "320" : "240"} 
                    image={getWordImage(currentWord)} 
                    sx={{ borderRadius: 2, maxWidth: isFullscreen ? 280 : 180, mx: 'auto' }} 
                  />
                </Box>
                <Paper sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0,0,0,0.7)', 
                  color: 'white', 
                  px: 2, 
                  py: 0.5,
                  borderRadius: 4,
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  {getWordTranslation(currentWord)}
                </Paper>
                <Tooltip title="播放发音">
                  <IconButton 
                    onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }} 
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      animation: isPlaying ? 'pulse 1s infinite' : 'none'
                    }}
                  >
                    <VolumeUpIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            {testType === 'en2zh' && (
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4">{currentWord.word}</Typography>
                </Paper>
                <Tooltip title="播放发音">
                  <IconButton 
                    onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }} 
                    sx={{ 
                      position: 'absolute', 
                      top: -10, 
                      right: -10, 
                      bgcolor: 'primary.main', 
                      color: 'white' 
                    }}
                  >
                    <VolumeUpIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            {testType === 'listen' && (
              <Box>
                <IconButton 
                  onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }} 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white', 
                    width: 56, 
                    height: 56, 
                    animation: isPlaying ? 'pulse 1s infinite' : 'none' 
                  }}
                >
                  <VolumeUpIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup value={selected}>
              <Grid container spacing={1}>
                {options.map((opt, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Paper 
                      sx={{ 
                        p: 1, 
                        cursor: answered ? 'default' : 'pointer', 
                        border: selected === opt ? '2px solid #2196f3' : '1px solid #e0e0e0',
                        bgcolor: answered ? (opt === feedback?.correct ? '#e8f5e8' : (selected === opt ? '#ffebee' : 'white')) : 'white'
                      }} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        !answered && handleAnswer(opt); 
                      }}
                    >
                      <FormControlLabel 
                        value={opt} 
                        control={<Radio size="small" />} 
                        label={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">{opt}</Typography>
                            {answered && opt === feedback?.correct && <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />}
                            {answered && selected === opt && !feedback?.isCorrect && <CancelIcon sx={{ fontSize: 16, color: '#f44336' }} />}
                          </Stack>
                        } 
                        disabled={answered} 
                        sx={{ m: 0 }} 
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </FormControl>

          {feedback && (
            <Alert 
              severity={feedback.isCorrect ? 'success' : 'error'} 
              sx={{ mt: 2, borderRadius: 2 }}
              icon={feedback.isCorrect ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
            >
              {feedback.isCorrect 
                ? `✓ 正确 - ${feedback.correctWord} ${feedback.correctTranslation}` 
                : `✗ 正确答案: ${feedback.correctWord} - ${feedback.correctTranslation}`}
            </Alert>
          )}

          {answered && (
            <Paper sx={{ mt: 2, p: 1, bgcolor: '#e3f2fd', textAlign: 'center' }}>
              <Typography variant="caption" color="primary">
                👆 点击屏幕任意位置继续下一题
              </Typography>
            </Paper>
          )}
        </StyledCard>
      ) : (
        <StyledCard sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>请先设置测试题目</Typography>
          <Button variant="contained" size="small" onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}>去设置</Button>
        </StyledCard>
      )}

      {/* 全对庆祝 */}
      {showCelebration && (
        <Paper sx={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          p: 2, 
          bgcolor: 'success.main', 
          color: 'white', 
          zIndex: 9999 
        }}>
          <EmojiEventsIcon sx={{ fontSize: 36, mb: 0.5 }} />
          <Typography>全对！</Typography>
        </Paper>
      )}

      {/* 图片放大 */}
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        closeAfterTransition 
        BackdropComponent={Backdrop} 
        BackdropProps={{ timeout: 500, sx: { backgroundColor: 'rgba(0,0,0,0.95)' } }}
      >
        <Fade in={modalOpen}>
          <Box sx={{ 
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
            justifyContent: 'center' 
          }}>
            <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 1 }}>
              <Paper sx={{ display: 'flex', gap: 0.5, p: 0.5, bgcolor: 'rgba(0,0,0,0.6)' }}>
                <Tooltip title="缩小">
                  <IconButton onClick={() => setImageScale(s => Math.max(s - 0.25, 0.5))} sx={{ color: 'white' }}>
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="放大">
                  <IconButton onClick={() => setImageScale(s => Math.min(s + 0.25, 3))} sx={{ color: 'white' }}>
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="旋转">
                  <IconButton onClick={() => setImageRotation(r => (r + 90) % 360)} sx={{ color: 'white' }}>
                    <RotateRightIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="重置">
                  <IconButton onClick={() => { setImageScale(1); setImageRotation(0); }} sx={{ color: 'white' }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Paper>
              <IconButton onClick={() => setModalOpen(false)} sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ transform: `scale(${imageScale}) rotate(${imageRotation}deg)`, transition: 'transform 0.2s ease' }}>
              <img 
                src={getWordImage(currentWord)} 
                alt={currentWord?.word || ''} 
                style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} 
              />
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* 提示 */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <style>{`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }`}</style>
    </Box>
  );
};

export default WordTest;