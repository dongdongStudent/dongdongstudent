import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Paper, Typography, Button, Card,
  LinearProgress, Grid, IconButton, Stack, Chip, TextField,
  Dialog, DialogTitle, DialogContent, List, ListItem,
  ListItemText, Divider, Alert, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, DialogActions
} from '@mui/material';
import {
  ArrowBack, VolumeUp, Bolt, Replay, School, Bookmark,
  ListAlt, ExitToApp, CheckCircle, Cancel, KeyboardArrowDown,
  Save, CloudUpload
} from '@mui/icons-material';
import { F_speak } from "../Function/weisimin.js";
import { useNavigate } from "react-router-dom";
import { getToken } from "../config.js";
import {
  batchAddWordsToServer
} from '../word/wordReviewUtils.js';
import WordBook from "../word/wordReviewBook.js";

let G_jsonName = 'word_textbook_review';

const ListeningFinalMaster = () => {
  const [allWordData, setAllWordData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('renjiao');
  const [grade, setGrade] = useState('七上');
  const [category, setCategory] = useState('');
  const [ShowWordBook, setShowWordBook] = useState(false);

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
  const [showWordList, setShowWordList] = useState(false);
  const [range, setRange] = useState({ start: 1, end: 10 });
  const [repeatMode, setRepeatMode] = useState(true);
  const [savingWords, setSavingWords] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ total: 0, saved: 0, newWords: 0, existingWords: 0, failed: 0 });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => { }, onCancel: () => { } });

  const navigate = useNavigate();
  const timers = useRef({ repeat: null, live: null });
  const startTimeRef = useRef(null);

  const versions = [
    { id: 'renjiao', name: '人教版', file: '/wordMiddle.json' },
    { id: 'waiyan', name: '外研版', file: '/wordWaiyan.json' },
  ];

  useEffect(() => {
    const loadWordData = async () => {
      try {
        setLoading(true);
        const currentVersion = versions.find(v => v.id === version);
        const response = await fetch(currentVersion.file);
        if (!response.ok) throw new Error('加载单词数据失败');
        const data = await response.json();
        setAllWordData(data);
        if (data[grade]) {
          const units = Object.keys(data[grade]);
          if (units.length > 0) setCategory(units[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error('加载单词数据时出错:', error);
        setLoading(false);
      }
    };
    loadWordData();
  }, [version]);

  // 当年级改变时更新单元选择
  useEffect(() => {
    if (allWordData && allWordData[grade]) {
      const units = Object.keys(allWordData[grade]);
      if (units.length > 0) setCategory(units[0]);
    }
  }, [grade, allWordData]);

  const getCurrentUnitData = () => {
    if (!allWordData || !allWordData[grade] || !allWordData[grade][category]) return [];
    return allWordData[grade][category];
  };

  const stopAudio = () => {
    if (timers.current.repeat) clearInterval(timers.current.repeat);
    if (timers.current.live) clearInterval(timers.current.live);
    timers.current = { repeat: null, live: null };
  };

  const pickNext = (currentPool) => {
    if (!currentPool || currentPool.length === 0) return;
    stopAudio();
    setSelectedId(null); setIsCorrect(null);
    setFeedback({ text: '', color: '' });
    setLiveTime(0);

    const target = currentPool[0];
    const activeWords = getCurrentUnitData();
    const distractors = activeWords.filter(i => i.english !== target.english).sort(() => Math.random() - 0.5).slice(0, 3);

    setCurrentWord(target);
    setOptions([...distractors, target].sort(() => Math.random() - 0.5));

    F_speak(target.english);
    const sTime = Date.now();
    timers.current.live = setInterval(() => setLiveTime(((Date.now() - sTime) / 1000).toFixed(1)), 100);
    if (repeatMode) timers.current.repeat = setInterval(() => F_speak(target.english), 3500);
  };

  const startSession = () => {
    const fullData = getCurrentUnitData();
    if (!fullData.length) return;

    let start = Math.max(1, Math.min(parseInt(range.start) || 1, fullData.length));
    let end = Math.max(start, Math.min(parseInt(range.end) || fullData.length, fullData.length));
    setRange({ start, end });

    const selectedData = fullData.slice(start - 1, end);
    if (!selectedData.length) return;

    stopAudio();
    setShowWordList(false);
    setIsReviewPhase(false);
    setTestPool([...selectedData].sort(() => Math.random() - 0.5));
    setWrongPool([]);
    setTotalQuestions(selectedData.length);
    setStats({ correct: 0, wrong: 0, finished: 0 });
    startTimeRef.current = new Date();
    setGameState('playing');
    setTimeout(() => pickNext([...selectedData].sort(() => Math.random() - 0.5)), 150);
  };

  const handleAnswer = (option) => {
    if (selectedId) return;
    stopAudio();
    const correct = option.english === currentWord.english;
    setSelectedId(option.english);
    setIsCorrect(correct);
    if (correct) {
      setStats(s => ({ ...s, correct: isReviewPhase ? s.correct : s.correct + 1, finished: s.finished + 1 }));
      setFeedback({ text: '答对了！', color: '#4caf50' });
    } else {
      if (!isReviewPhase) {
        setStats(s => ({ ...s, wrong: s.wrong + 1, finished: s.finished + 1 }));
        setWrongPool(prev => [...prev, currentWord]);
      } else {
        setTestPool(prev => [...prev.slice(1), currentWord]);
        setFeedback({ text: '记错了，再听一遍', color: '#f44336' });
        return;
      }
      setFeedback({ text: '记错了！', color: '#f44336' });
    }
  };

  const handleNextAction = () => {
    if (!selectedId) return;
    const nextPool = testPool.slice(1);
    setTestPool(nextPool);
    if (nextPool.length === 0) {
      if (!isReviewPhase && wrongPool.length > 0) {
        setIsReviewPhase(true);
        setStats(s => ({ ...s, finished: 0 }));
        setTestPool([...wrongPool].sort(() => Math.random() - 0.5));
        pickNext([...wrongPool].sort(() => Math.random() - 0.5));
      } else {
        setGameState('summary');
      }
    } else {
      pickNext(nextPool);
    }
  };

  const handleSaveAndStart = async () => {
    const currentUnitData = getCurrentUnitData();
    const selectedWords = currentUnitData.slice(range.start - 1, range.end);
    setShowSaveDialog(true);
    setSavingWords(true);
    setSaveProgress({ total: selectedWords.length, saved: 0, newWords: 0, existingWords: 0, failed: 0 });
    
    const onProgress = (progress) => setSaveProgress(prev => ({ ...prev, ...progress }));
    const result = await batchAddWordsToServer(selectedWords, getToken, G_jsonName, onProgress);
    
    setSavingWords(false);
    setShowSaveDialog(false);
    setShowWordList(false);
    
    if (result.savedCount > 0) {
      let message = `✅ 保存成功！\n\n📥 新增: ${result.newWords} 个\n📋 已有: ${result.existingWords} 个`;
      if (result.failed > 0) message += `\n\n⚠️ 失败: ${result.failed} 个`;
      setConfirmDialog({
        open: true,
        title: '保存成功',
        message: message + '\n\n是否立即开始挑战？',
        onConfirm: () => { 
          setConfirmDialog(prev => ({ ...prev, open: false })); 
          setTimeout(startSession, 300); 
        },
        onCancel: () => setConfirmDialog(prev => ({ ...prev, open: false }))
      });
    } else alert('❌ 保存单词失败');
  };

  if (loading) return (
    <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress size={60} />
    </Container>
  );

  const currentUnitData = getCurrentUnitData();
  const units = allWordData?.[grade] ? Object.keys(allWordData[grade]) : [];

  // 菜单界面
  if (gameState === 'menu') return (
    <div>
      <Container maxWidth="md" sx={{ p: 2 }}>
        {/* 顶部导航栏 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate("/")} 
            sx={{ borderRadius: 3 }}
          >
            返回目录
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setShowWordBook(prev => !prev)} 
            sx={{ borderRadius: 3, ml: 1 }}
          >
            {ShowWordBook ? '关闭单词本' : '单词复习'}
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center', flex: 1 }}>
            🎧 听力大师
          </Typography>
        </Box>

        {/* 顶部状态栏 - 显示当前选择 */}
        <Paper sx={{ 
          p: 1.5, 
          mb: 3, 
          borderRadius: 3,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {versions.find(v => v.id === version)?.name} · {grade}
            </Typography>
          </Box>
          {category && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2">📖 {category}</Typography>
              <Typography variant="body2">📊 {currentUnitData.length}词</Typography>
            </Box>
          )}
        </Paper>

        {/* 版本和年级选择 */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>版本</InputLabel>
                <Select value={version} onChange={(e) => setVersion(e.target.value)} label="版本">
                  {versions.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>年级</InputLabel>
                <Select value={grade} onChange={(e) => setGrade(e.target.value)} label="年级">
                  {allWordData && Object.keys(allWordData).map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* 显示当前选择的详细信息 */}
          {grade && category && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #2196f3' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                📊 当前学习统计
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>教材版本:</strong> {versions.find(v => v.id === version)?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>年级:</strong> {grade}
                  </Typography>
                  <Typography variant="body2">
                    <strong>总单元数:</strong> {units.length} 个
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>当前单元:</strong> {category}
                  </Typography>
                  <Typography variant="body2">
                    <strong>单元词汇:</strong> {currentUnitData.length} 个
                  </Typography>
                </Grid>
              </Grid>
            
            </Box>
          )}

          {/* 当未选择单元时显示提示 */}
          {grade && !category && units.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              请在下拉菜单中选择一个单元开始练习
            </Alert>
          )}
        </Paper>

        {/* 单元选择区域 */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>选择单元</InputLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} label="选择单元">
              {units.map(unit => (
                <MenuItem key={unit} value={unit}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography>{unit}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {allWordData[grade][unit].length} 词
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {category && (
            <Button 
              fullWidth 
              variant="contained" 
              sx={{ mt: 2, py: 1.5 }} 
              startIcon={<Bookmark />} 
              onClick={() => { 
                setRange({ start: 1, end: currentUnitData.length }); 
                setShowWordList(true); 
              }}
            >
              自定义区间并开始挑战
            </Button>
          )}
        </Paper>
      </Container>

      {/* 范围设置对话框 */}
      <Dialog open={showWordList} onClose={() => !savingWords && setShowWordList(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <ListAlt sx={{ mr: 1, verticalAlign: 'middle' }} /> 选择练习范围
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>当前选择:</strong> {versions.find(v => v.id === version)?.name} {grade} - {category}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>总单词数:</strong> {currentUnitData.length} 个
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              请输入练习范围 (1-{currentUnitData.length})
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <TextField 
                type="number" 
                size="small" 
                label="起始" 
                value={range.start} 
                onChange={(e) => setRange({ ...range, start: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: currentUnitData.length }} 
                sx={{ flex: 1 }} 
              />
              <Typography sx={{ alignSelf: 'center' }}>至</Typography>
              <TextField 
                type="number" 
                size="small" 
                label="结束" 
                value={range.end}
                onChange={(e) => setRange({ ...range, end: parseInt(e.target.value) || currentUnitData.length })}
                inputProps={{ min: range.start, max: currentUnitData.length }} 
                sx={{ flex: 1 }} 
              />
            </Stack>
            
            <Typography sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main' }}>
              将练习 {Math.min(range.end, currentUnitData.length) - Math.max(range.start, 1) + 1} 个单词
            </Typography>
            
            <Button 
              fullWidth 
              variant="contained" 
              color="warning" 
              sx={{ mt: 2, py: 1.5 }} 
              startIcon={<Save />} 
              onClick={handleSaveAndStart} 
              disabled={savingWords}
            >
              保存到单词本并开始挑战
            </Button>
          </Box>

          {/* 单词预览 */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            单词预览:
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#fafafa', borderRadius: 1, p: 1 }}>
            {currentUnitData.slice(Math.max(0, range.start - 1), Math.min(range.end, currentUnitData.length)).map((w, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #eee' }}>
                <Typography variant="body2">{range.start + idx}. {w.english}</Typography>
                <Typography variant="caption" color="text.secondary">{w.chinese}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* 保存进度对话框 */}
      <Dialog open={showSaveDialog} maxWidth="xs" fullWidth>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            {savingWords ? (
              <>
                <CircularProgress size={50} sx={{ mb: 2 }} />
                <Typography>正在保存单词... {saveProgress.saved}/{saveProgress.total}</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(saveProgress.saved / saveProgress.total) * 100} 
                  sx={{ mt: 2, height: 6, borderRadius: 3 }} 
                />
              </>
            ) : null}
          </Box>
        </DialogContent>
      </Dialog>

      {/* 确认对话框 */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-line' }}>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDialog.onCancel}>取消</Button>
          <Button onClick={confirmDialog.onConfirm} color="primary" variant="contained">开始挑战</Button>
        </DialogActions>
      </Dialog>

      {ShowWordBook && <WordBook G_json={G_jsonName} onClose={() => setShowWordBook(false)} />}
    </div>
  );

  // 总结界面
  if (gameState === 'summary') {
    const timeSpent = startTimeRef.current ? Math.round((new Date() - startTimeRef.current) / 1000) : 0;
    const accuracy = Math.round(stats.correct / totalQuestions * 100) || 0;
    const formatTime = (s) => s > 60 ? `${Math.floor(s / 60)}分${s % 60}秒` : `${s}秒`;

    return (
      <Container maxWidth="sm" sx={{ mt: 3, p: 2 }}>
        <IconButton onClick={() => setGameState('menu')} sx={{ mb: 2 }}><ArrowBack /></IconButton>
        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2 }}>
            {versions.find(v => v.id === version)?.name} {grade} - {category}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            范围: 第{range.start}-{range.end}词 · 共{totalQuestions}题
          </Typography>
          
          <Typography variant="h1" sx={{ textAlign: 'center', color: accuracy >= 60 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
            {accuracy}<Typography component="span" variant="h4">分</Typography>
          </Typography>
          
          <Grid container spacing={2} sx={{ my: 3 }}>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                <CheckCircle sx={{ color: '#4caf50' }} />
                <Typography variant="h6">{stats.correct}</Typography>
                <Typography variant="caption">答对</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
                <Typography variant="h6">{formatTime(timeSpent)}</Typography>
                <Typography variant="caption">用时</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
                <Cancel sx={{ color: '#f44336' }} />
                <Typography variant="h6">{stats.wrong}</Typography>
                <Typography variant="caption">答错</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* 错题列表 */}
          {wrongPool.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff5f5', maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#f44336' }}>
                需要复习的错题 ({wrongPool.length})
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {wrongPool.map((word, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">{word.english}</Typography>
                  <Typography variant="caption" color="text.secondary">{word.chinese}</Typography>
                </Box>
              ))}
            </Paper>
          )}

          <Stack spacing={2}>
            <Button variant="contained" size="large" onClick={() => startSession()}>
              重新挑战
            </Button>
            {wrongPool.length > 0 && (
              <Button 
                variant="contained" 
                color="warning" 
                size="large"
                onClick={() => {
                  setTestPool([...wrongPool].sort(() => Math.random() - 0.5));
                  setWrongPool([]);
                  setStats({ correct: 0, wrong: 0, finished: 0 });
                  setIsReviewPhase(true);
                  setGameState('playing');
                  pickNext([...wrongPool].sort(() => Math.random() - 0.5));
                }}
              >
                复习错题 ({wrongPool.length})
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>
    );
  }

  // 游戏界面
  return (
    <Container maxWidth="lg" sx={{ mt: 1, px: 2, pb: 4 }} onClick={handleNextAction}>
      {/* 游戏标题 */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        bgcolor: 'primary.dark', 
        color: 'white', 
        textAlign: 'center',
        borderRadius: 3
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {versions.find(v => v.id === version)?.name} {grade} - {category}
        </Typography>
        <Typography variant="body2">
          {isReviewPhase ? '🔁 错题复习模式' : `📌 区间 ${range.start}-${range.end}`}
        </Typography>
      </Paper>

      {/* 控制栏 */}
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          color="error" 
          size="small" 
          startIcon={<ExitToApp />} 
          onClick={(e) => { e.stopPropagation(); stopAudio(); setGameState('menu'); }}
          sx={{ borderRadius: 2 }}
        >
          退出
        </Button>
        
        <Button 
          variant={repeatMode ? "contained" : "outlined"} 
          size="small"
          onClick={(e) => { 
            e.stopPropagation(); 
            setRepeatMode(!repeatMode); 
            stopAudio(); 
            if (!repeatMode && currentWord) F_speak(currentWord.english);
          }}
          sx={{ borderRadius: 2 }}
        >
          {repeatMode ? '🔁 循环中' : '▶️ 单次'}
        </Button>
        
        <Chip 
          label={`${Math.round(stats.correct / totalQuestions * 100) || 0}%`} 
          color="warning" 
          size="small"
        />
      </Stack>

      {/* 进度信息 */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.900', color: 'white', borderRadius: 3 }}>
        <Grid container justifyContent="space-around" alignItems="center">
          <Box>
            <Typography variant="caption">进度</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {stats.finished}/{isReviewPhase ? wrongPool.length : totalQuestions}
            </Typography>
          </Box>
          <Box sx={{ 
            px: 3, 
            py: 1, 
            border: '2px solid #00e5ff', 
            borderRadius: 2,
            bgcolor: 'black'
          }}>
            <Typography sx={{ color: '#00e5ff', fontWeight: 'bold' }}>{liveTime}s</Typography>
          </Box>
          <Box>
            <Typography variant="caption">对/错</Typography>
            <Typography variant="body1">
              <span style={{ color: '#4caf50' }}>{stats.correct}</span>/
              <span style={{ color: '#f44336' }}>{stats.wrong}</span>
            </Typography>
          </Box>
        </Grid>
      </Paper>

      {/* 进度条 */}
      <LinearProgress 
        variant="determinate" 
        value={isReviewPhase ? (stats.finished / (wrongPool.length || 1)) * 100 : (stats.finished / totalQuestions) * 100} 
        sx={{ 
          height: 12, 
          borderRadius: 6, 
          mb: 3,
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #4caf50, #2196f3)'
          }
        }} 
      />

      {/* 当前单词卡片 */}
      <Card 
        sx={{ 
          minHeight: 200, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          borderRadius: 4, 
          mb: 3,
          border: selectedId ? `6px solid ${isCorrect ? '#4caf50' : '#f44336'}` : '2px solid #1976d2',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onClick={(e) => { e.stopPropagation(); currentWord && F_speak(currentWord.english); }}
      >
        {selectedId ? (
          <Box textAlign="center" sx={{ p: 3 }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', color: isCorrect ? '#4caf50' : '#f44336' }}>
              {currentWord.english}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mt: 1 }}>
              {currentWord.chinese}
            </Typography>
          </Box>
        ) : (
          <Stack alignItems="center" spacing={2} sx={{ p: 3 }}>
            <VolumeUp sx={{ fontSize: 80, color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary">
              {repeatMode ? '正在循环播放...' : '点击喇叭重听'}
            </Typography>
          </Stack>
        )}
      </Card>

      {/* 选项按钮 */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {options.map((opt, i) => {
          const isSelected = selectedId === opt.english;
          const isCorrectOption = opt.english === currentWord?.english;
          
          let bgColor = 'primary.main';
          let textColor = 'white';
          
          if (selectedId) {
            if (isCorrectOption) {
              bgColor = '#4caf50';
            } else if (isSelected) {
              bgColor = '#f44336';
            } else {
              bgColor = '#f5f5f5';
              textColor = '#999';
            }
          }

          return (
            <Grid item xs={6} key={i}>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={(e) => { e.stopPropagation(); handleAnswer(opt); }} 
                disabled={!!selectedId}
                sx={{ 
                  py: 3, 
                  bgcolor: bgColor,
                  color: textColor,
                  '&:hover': !selectedId && { bgcolor: 'primary.light' },
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                {opt.chinese}
                {selectedId && isCorrectOption && <CheckCircle sx={{ ml: 1 }} />}
                {selectedId && isSelected && !isCorrectOption && <Cancel sx={{ ml: 1 }} />}
              </Button>
            </Grid>
          );
        })}
      </Grid>

      {/* 反馈提示 */}
      {feedback.text && (
        <Box sx={{ 
          position: 'fixed', 
          bottom: 50, 
          left: '50%', 
          transform: 'translateX(-50%)',
          bgcolor: feedback.color, 
          color: 'white', 
          px: 6, 
          py: 2, 
          borderRadius: 10,
          fontWeight: 'bold',
          zIndex: 10,
          boxShadow: 3
        }}>
          {feedback.text}
        </Box>
      )}
    </Container>
  );
};

export default ListeningFinalMaster;