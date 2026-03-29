import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Paper, Typography, Button, Card,
  LinearProgress, Grid, IconButton, Stack, Chip, Divider, List, ListItem, ListItemText, Avatar, TextField, Alert
} from '@mui/material';
import { 
  ArrowBack, EmojiEvents, VolumeUp, Timer, CalendarMonth, 
  AccessTime, Bolt, CalendarViewWeek, DeleteOutline, School, Settings, Refresh, Replay, CheckCircle, Cancel
} from '@mui/icons-material';

const ListeningFinalMaster = () => {
  // --- 状态管理 ---
  const [gameState, setGameState] = useState('menu'); 
  const [category, setCategory] = useState('');
  const [isPractice, setIsPractice] = useState(false);
  const [isReviewPhase, setIsReviewPhase] = useState(false); 
  const [practiceCount, setPracticeCount] = useState(5); 
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // 统计数据
  const [stats, setStats] = useState({ correct: 0, wrong: 0, finished: 0 });
  const [originalPool, setOriginalPool] = useState([]); 
  const [testPool, setTestPool] = useState([]); 
  const [wrongAnswers, setWrongAnswers] = useState([]); 
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedback, setFeedback] = useState({ text: '', color: '', earned: null, timeDisplay: '' });
  
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [liveTime, setLiveTime] = useState(0);

  const timers = useRef({ repeat: null, live: null });

  const stopAudio = () => {
    if (timers.current.repeat) clearInterval(timers.current.repeat);
    if (timers.current.live) clearInterval(timers.current.live);
    window.speechSynthesis.cancel(); 
  };

  const speak = (text, isFirstTime = false) => {
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.85;
    u.onend = () => {
      if (isFirstTime) {
        const start = Date.now();
        setStartTime(start);
        timers.current.live = setInterval(() => {
          setLiveTime(((Date.now() - start) / 1000).toFixed(1));
        }, 50);
      }
    };
    window.speechSynthesis.speak(u);
  };

  const startGame = (type, mode = 'challenge', customPool = null) => {
    const data = getGameData(type);
    const isPrac = mode === 'practice';
    
    let initialPool;
    if (customPool) {
      initialPool = [...customPool];
    } else {
      let fullData = [...data].sort(() => Math.random() - 0.5);
      initialPool = isPrac ? fullData.slice(0, Math.min(practiceCount, data.length)) : fullData;
    }

    setCategory(type);
    setIsPractice(isPrac);
    setIsReviewPhase(false);
    setOriginalPool(initialPool);
    setTotalQuestions(initialPool.length);
    setStats({ correct: 0, wrong: 0, finished: 0 }); // 重置统计
    setWrongAnswers([]);
    setScore(0);
    setGameState('playing');
    pickNextFromPool(initialPool, type);
  };

  const pickNextFromPool = (currentPool, currentCat) => {
    if (currentPool.length === 0) return;
    stopAudio();
    setSelectedId(null);
    setIsCorrect(null);
    setFeedback({ text: '', color: '', earned: null, timeDisplay: '' });
    setStartTime(0);
    setLiveTime(0);

    const randomIndex = Math.floor(Math.random() * currentPool.length);
    const target = currentPool[randomIndex];
    const allItems = getGameData(currentCat || category);
    const distractors = allItems.filter(i => i.id !== target.id).sort(() => Math.random() - 0.5).slice(0, 3);
    
    setTestPool(currentPool);
    setCurrentWord(target);
    setOptions([...distractors, target].sort(() => Math.random() - 0.5));
    
    speak(target.english, true);
    timers.current.repeat = setInterval(() => speak(target.english, false), 4000); 
  };

  const handleAnswer = (option) => {
    if (selectedId) return;
    stopAudio();
    const now = Date.now();
    const timeTaken = startTime > 0 ? now - startTime : 0;
    const correct = option.id === currentWord.id;
    setSelectedId(option.id);
    setIsCorrect(correct);

    if (correct) {
      setStats(s => ({ ...s, correct: s.correct + 1, finished: s.finished + 1 }));
      const earned = timeTaken < 1500 ? 300 : (timeTaken < 4000 ? 200 : 100);
      setScore(s => s + earned);
      setFeedback({ text: '太棒了! ✨', color: '#4caf50', timeDisplay: `${(timeTaken/1000).toFixed(1)}s` });

      const newPool = testPool.filter(item => item.id !== currentWord.id);
      setTimeout(() => {
        if (newPool.length === 0) {
          if (isPractice && !isReviewPhase && wrongAnswers.length > 0) {
            setIsReviewPhase(true);
            setTotalQuestions(wrongAnswers.length);
            setStats(s => ({ ...s, finished: 0 })); // 强化阶段进度条清零
            pickNextFromPool([...wrongAnswers]);
          } else {
            setGameState('summary');
          }
        } else {
          pickNextFromPool(newPool);
        }
      }, 1200);
    } else {
      setStats(s => ({ ...s, wrong: s.wrong + 1 }));
      if (isPractice && !wrongAnswers.find(i => i.id === currentWord.id)) {
        setWrongAnswers(prev => [...prev, currentWord]);
      }
      setFeedback({ text: `记一下：${currentWord.chinese}`, color: '#f44336' });
      setTimeout(() => pickNextFromPool(testPool), 2500);
    }
  };

  const getGameData = (type) => {
    if (type === 'weeks') return [{ id: 'w1', english: "Monday", chinese: "星期一" }, { id: 'w2', english: "Tuesday", chinese: "星期二" }, { id: 'w3', english: "Wednesday", chinese: "星期三" }, { id: 'w4', english: "Thursday", chinese: "星期四" }, { id: 'w5', english: "Friday", chinese: "星期五" }, { id: 'w6', english: "Saturday", chinese: "星期六" }, { id: 'w7', english: "Sunday", chinese: "星期日" }];
    if (type === 'months') return [{ id: 'm1', english: "January", chinese: "一月" }, { id: 'm2', english: "February", chinese: "二月" }, { id: 'm3', english: "March", chinese: "三月" }, { id: 'm4', english: "April", chinese: "四月" }, { id: 'm5', english: "May", chinese: "五月" }, { id: 'm6', english: "June", chinese: "六月" }, { id: 'm7', english: "July", chinese: "七月" }, { id: 'm8', english: "August", chinese: "八月" }, { id: 'm9', english: "September", chinese: "九月" }, { id: 'm10', english: "October", chinese: "十月" }, { id: 'm11', english: "November", chinese: "十一月" }, { id: 'm12', english: "December", chinese: "十二月" }];
    if (type === 'time') return [{ id: 't1', english: "What time is it?", chinese: "现在几点？" }, { id: 't2', english: "It's one o'clock.", chinese: "1点整" }, { id: 't3', english: "It's half past one.", chinese: "1点半" }, { id: 't4', english: "It's a quarter past two.", chinese: "2点一刻" }];
    return [];
  };

  if (gameState === 'menu') return (
    <Container maxWidth="xs" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="900" textAlign="center" gutterBottom color="primary">听力大师 Pro</Typography>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 4, bgcolor: '#f0f7ff', border: '2px dashed #2196f3' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
          <Settings color="primary" />
          <Typography fontWeight="bold">练习题数:</Typography>
          <TextField type="number" size="small" variant="standard" value={practiceCount} onChange={(e) => setPracticeCount(Math.max(1, parseInt(e.target.value) || 1))} inputProps={{ style: { textAlign: 'center', fontWeight: 'bold', width: '60px' } }} />
        </Stack>
      </Paper>
      <Stack spacing={2}>
        {['weeks', 'months', 'time'].map((type) => (
          <Button key={type} fullWidth variant="contained" size="large" onClick={() => startGame(type, 'practice')} sx={{ py: 2, borderRadius: 4, fontSize: '1.1rem' }}>
            开始练习：{type === 'weeks' ? '星期' : type === 'months' ? '月份' : '时间'}
          </Button>
        ))}
      </Stack>
    </Container>
  );

  if (gameState === 'summary') return (
    <Container maxWidth="xs" sx={{ mt: 10, textAlign: 'center' }}>
      <Paper elevation={12} sx={{ p: 4, borderRadius: 6 }}>
        <EmojiEvents sx={{ fontSize: 80, color: 'gold' }} />
        <Typography variant="h4" fontWeight="bold">练习总结</Typography>
        <Typography variant="h2" color="primary" sx={{ my: 2, fontWeight: 900 }}>{score}</Typography>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
           <Chip label={`正确: ${stats.correct}`} color="success" />
           <Chip label={`错误: ${stats.wrong}`} color="error" />
        </Stack>
        <Button variant="outlined" fullWidth startIcon={<Replay />} onClick={() => startGame(category, 'practice', originalPool)} sx={{ py: 1.5, mb: 2, borderRadius: 4, color: 'orange', borderColor: 'orange' }}>
          原样单词重练一遍
        </Button>
        <Button variant="contained" fullWidth onClick={() => setGameState('menu')} sx={{ py: 1.5, borderRadius: 4 }}>返回首页</Button>
      </Paper>
    </Container>
  );

  return (
    <Container maxWidth="xs" sx={{ mt: 2 }}>
      {/* 顶部统计仪表盘 */}
      <Paper elevation={4} sx={{ p: 1.5, mb: 2, borderRadius: 4, bgcolor: '#1a1a1a', color: '#fff' }}>
        <Grid container alignItems="center" justifyContent="space-around">
          <Grid item textAlign="center">
            <Typography variant="caption" sx={{ opacity: 0.7 }}>进度</Typography>
            <Typography variant="h6" fontWeight="bold">{stats.finished}/{totalQuestions}</Typography>
          </Grid>
          <Grid item>
            <Box sx={{ bgcolor: '#333', px: 2, py: 0.5, borderRadius: 2, border: '2px solid #0ef' }}>
              <Typography sx={{ color: '#0ef', fontFamily: 'monospace', fontSize: '1.6rem', fontWeight: '900', textShadow: '0 0 5px #0ef' }}>
                {liveTime}s
              </Typography>
            </Box>
          </Grid>
          <Grid item textAlign="center">
            <Stack direction="row" spacing={1}>
              <Box>
                <Typography variant="caption" sx={{ color: '#4caf50' }}>对</Typography>
                <Typography variant="h6" fontWeight="bold" color="#4caf50">{stats.correct}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#f44336' }}>错</Typography>
                <Typography variant="h6" fontWeight="bold" color="#f44336">{stats.wrong}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <LinearProgress variant="determinate" value={(stats.finished / totalQuestions) * 100} sx={{ height: 12, borderRadius: 6, mb: 1 }} />
      <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', fontWeight: 'bold', color: 'text.secondary', mb: 2 }}>
        还剩 {totalQuestions - stats.finished} 个单词
      </Typography>

      <Box sx={{ height: 60, textAlign: 'center' }}>
        {feedback.text && (
          <Typography variant="h5" fontWeight="900" sx={{ color: feedback.color, animation: 'popIn 0.3s' }}>
            {feedback.text} {feedback.timeDisplay && <span style={{ fontSize: '1rem', opacity: 0.7 }}>({feedback.timeDisplay})</span>}
          </Typography>
        )}
      </Box>

      <Card sx={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, mb: 3, border: isCorrect === false ? '5px solid #f44336' : (isCorrect === true ? '5px solid #4caf50' : '1px solid #eee'), transition: 'all 0.2s' }}>
        <Box textAlign="center">
          {selectedId ? (
            <Box sx={{ animation: 'popIn 0.2s' }}>
              <Typography variant="h3" fontWeight="bold">{currentWord.english}</Typography>
              {!isCorrect && <Typography variant="h5" color="error" sx={{ mt: 1 }}>{currentWord.chinese}</Typography>}
            </Box>
          ) : (
            <VolumeUp sx={{ fontSize: 80, color: startTime > 0 ? 'primary.main' : '#ccc', animation: startTime > 0 ? 'pulse 1.5s infinite' : 'none' }} />
          )}
        </Box>
      </Card>
      
      <Grid container spacing={2}>
        {options.map(opt => (
          <Grid item xs={6} key={opt.id}>
            <Button fullWidth variant="contained" onClick={() => handleAnswer(opt)} disabled={!!selectedId} sx={{ py: 3, borderRadius: 4, fontSize: '1.2rem', fontWeight: 'bold', bgcolor: selectedId ? (opt.id === currentWord.id ? '#4caf50' : (selectedId === opt.id ? '#f44336' : '#fff')) : '#fff', color: !selectedId ? '#333' : '#fff', border: '2px solid #ddd', '&:disabled': { color: '#fff' } }}>
              {opt.chinese}
            </Button>
          </Grid>
        ))}
      </Grid>

      {isReviewPhase && <Alert severity="warning" icon={<Refresh />} sx={{ mt: 3, borderRadius: 3 }}>强化环节：重考刚才错误的单词</Alert>}
      <style>{` @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } } @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } } `}</style>
    </Container>
  );
};

export default ListeningFinalMaster;