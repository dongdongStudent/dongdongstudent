// src/math_1_select/center_enhanced.js
// 增强版数学中心组件 - 完全服务器获取版，左右分栏布局

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Chip, Button, Container, Paper,
  LinearProgress, Alert, IconButton, Snackbar, Tabs, Tab, Tooltip,
  FormControl, Select, Avatar, Grid, Divider, Card, CardContent, Fade,
  MenuItem, CircularProgress, RadioGroup, Radio, FormControlLabel,
  Slider, TextField, List, ListItem, ListItemText, useMediaQuery, useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon, Home as HomeIcon, Storage as StorageIcon,
  MenuBook, Assessment, CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
  CloudSync as CloudSyncIcon, Add as AddIcon, Star as StarIcon, Casino as CasinoIcon,
  FilterList as FilterListIcon, Quiz as QuizIcon, DragHandle as DragHandleIcon,
  ViewList, PlayArrow, Close as CloseIcon, Shuffle as ShuffleIcon, SortByAlpha,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SingleChoiceTest from './test';
import QuestionMasterView from './review';
import { mathApi } from './api';
import { G_config } from '../config.js';

const serverAddress = G_config.G_server_address;

const DRAW_OPTIONS = [
  { value: 'new', label: '抽取新题', icon: <StarIcon sx={{ fontSize: 18 }} /> },
  { value: 'range', label: '范围抽取', icon: <StorageIcon sx={{ fontSize: 18 }} /> },
  { value: 'rangeRandom', label: '范围随机', icon: <CasinoIcon sx={{ fontSize: 18 }} /> },
  { value: 'category', label: '分类抽取', icon: <CategoryIcon sx={{ fontSize: 18 }} /> }
];

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && children}</div>
);

const MathLearningCenterEnhanced = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [dataSource, setDataSource] = useState('math_master');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [mathBanks, setMathBanks] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [testKey, setTestKey] = useState(0);
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [newQuestionStats, setNewQuestionStats] = useState({
    total: 0, newCount: 0, masteredCount: 0, weakCount: 0, reviewCount: 0
  });
  const [serverStatus, setServerStatus] = useState({
    isConnected: true, lastCheck: null, error: null, serverVersion: null
  });

  const fetchMathBanks = async () => {
    setIsLoadingBanks(true);
    try {
      const response = await fetch(`${serverAddress}/math/banks`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.flag === 1 && data.content?.banks) {
          setMathBanks(data.content.banks);
          const currentBankExists = data.content.banks.some(bank => bank.id === dataSource);
          if (!currentBankExists && data.content.banks.length > 0) {
            setDataSource(data.content.banks[0].id);
          }
        }
      }
    } catch (error) { console.error('获取题库列表失败:', error);
    } finally { setIsLoadingBanks(false); }
  };

  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await fetch(`${serverAddress}/math/banks`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
        setServerStatus({ isConnected: response.ok, lastCheck: new Date().toISOString(), error: response.ok ? null : `HTTP ${response.status}`, serverVersion: null });
        if (response.ok) await fetchMathBanks();
      } catch (error) {
        setServerStatus({ isConnected: false, lastCheck: new Date().toISOString(), error: error.message, serverVersion: null });
      }
    };
    checkServerConnection();
  }, []);

  useEffect(() => { if (dataSource) fetchAllQuestions(); }, [dataSource]);

  const fetchAllQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const response = await mathApi.getFullBankQuestions(dataSource);
      if (response.flag === 1) {
        let questions = response.content?.questions || [];
        const sortedQuestions = [...questions].sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setAllQuestions(sortedQuestions);
        updateNewQuestionStats(sortedQuestions);
        setSnackbar({ open: true, message: `成功加载 ${sortedQuestions.length} 道数学题目`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: response.message || '加载失败', severity: 'error' });
        setAllQuestions([]);
      }
    } catch (error) {
      console.error('获取所有数学题目失败:', error);
      setSnackbar({ open: true, message: '网络错误', severity: 'warning' });
      setAllQuestions([]);
    } finally { setIsLoadingQuestions(false); }
  };

  const updateNewQuestionStats = (questions) => {
    let newCount = 0, masteredCount = 0, weakCount = 0, reviewCount = 0;
    questions.forEach(q => {
      const mastery = q.stats?.mastery_level || 0;
      const attempts = q.stats?.total_attempts || 0;
      if (attempts === 0 || mastery === 0) newCount++;
      else if (mastery >= 0.8) masteredCount++;
      else if (mastery >= 0.5) reviewCount++;
      else weakCount++;
    });
    setNewQuestionStats({ total: questions.length, newCount, masteredCount, weakCount, reviewCount });
  };

  const handleStartTest = () => {
    setDrawDialogOpen(false);
    setShowTest(true);
    setCurrentTab(0);
  };

  const handleTestComplete = () => {
    setShowTest(false);
    setCurrentQuestions([]);
    fetchAllQuestions();
  };

  const handleRedraw = () => setCurrentQuestions([]);
  const handleCloseDialog = () => setDrawDialogOpen(false);
  const handleOpenDialog = () => { setDrawDialogOpen(true); setShowTest(false); };

  const fetchCategoryQuestions = async (category, count, sortType) => {
    setIsLoadingQuestions(true);
    try {
      let filteredQuestions = allQuestions.filter(q => q.category === category);
      if (filteredQuestions.length === 0) {
        setSnackbar({ open: true, message: `分类"${category}"下没有题目`, severity: 'warning' });
        setCurrentQuestions([]);
        setIsLoadingQuestions(false);
        return;
      }
      let selectedQuestions = [...filteredQuestions];
      if (sortType === 'random') {
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }
      } else {
        selectedQuestions.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      }
      const finalQuestions = selectedQuestions.slice(0, Math.min(count, selectedQuestions.length));
      setCurrentQuestions([...finalQuestions]);
      setTestKey(prev => prev + 1);
      setSnackbar({ open: true, message: `成功从"${category}"分类中抽取 ${finalQuestions.length} 道题`, severity: 'success' });
    } catch (error) {
      console.error('分类抽取失败:', error);
      setSnackbar({ open: true, message: '分类抽取失败', severity: 'error' });
      setCurrentQuestions([]);
    } finally { setIsLoadingQuestions(false); }
  };

  const fetchNewQuestions = async (settings) => {
    setIsLoadingQuestions(true);
    try {
      let filteredQuestions = [];
      const drawSubType = settings.drawSubType || 'new';
      switch (drawSubType) {
        case 'new': filteredQuestions = allQuestions.filter(q => (q.stats?.total_attempts || 0) === 0); break;
        case 'weak': filteredQuestions = allQuestions.filter(q => { const a = q.stats?.total_attempts || 0, m = q.stats?.mastery_level || 0; return a > 0 && m < 0.5; }); break;
        case 'review': filteredQuestions = allQuestions.filter(q => { const a = q.stats?.total_attempts || 0, m = q.stats?.mastery_level || 0; return a > 0 && m >= 0.5 && m < 0.8; }); break;
        default: filteredQuestions = [...allQuestions];
      }
      if (filteredQuestions.length === 0) {
        let message = { 'new': '没有新题可抽', 'weak': '没有薄弱题', 'review': '没有复习题' }[drawSubType] || '没有题目';
        setSnackbar({ open: true, message, severity: 'warning' });
        setIsLoadingQuestions(false);
        return;
      }
      let selectedQuestions = [...filteredQuestions];
      if (settings.sortType === 'random') {
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }
      } else {
        selectedQuestions.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      }
      const finalQuestions = selectedQuestions.slice(0, Math.min(settings.count, selectedQuestions.length));
      setCurrentQuestions([...finalQuestions]);
      setTestKey(prev => prev + 1);
      const typeText = { 'new': '新题', 'weak': '薄弱题', 'review': '复习题', 'all': '全部题目' }[drawSubType];
      setSnackbar({ open: true, message: `成功抽取 ${finalQuestions.length} 道${typeText}`, severity: 'success' });
    } catch (error) {
      console.error('抽取失败:', error);
      setSnackbar({ open: true, message: '抽取失败', severity: 'error' });
    } finally { setIsLoadingQuestions(false); }
  };

  const fetchRangeQuestions = async (start, end) => {
    setIsLoadingQuestions(true);
    try {
      const filteredQuestions = allQuestions.filter(q => { const id = parseInt(q.id); return id >= start && id <= end; });
      const sortedQuestions = [...filteredQuestions].sort((a, b) => parseInt(a.id) - parseInt(b.id));
      if (sortedQuestions.length === 0) {
        setSnackbar({ open: true, message: `第 ${start}-${end} 题范围内没有题目`, severity: 'warning' });
        setCurrentQuestions([]);
      } else {
        setCurrentQuestions([...sortedQuestions]);
        setTestKey(prev => prev + 1);
        setSnackbar({ open: true, message: `成功从第 ${start}-${end} 题中抽取 ${sortedQuestions.length} 道题`, severity: 'success' });
      }
    } catch (error) {
      console.error('范围抽取异常:', error);
      setSnackbar({ open: true, message: '范围抽取失败', severity: 'error' });
      setCurrentQuestions([]);
    } finally { setIsLoadingQuestions(false); }
  };

  const fetchRangeRandomQuestions = async (start, end, count) => {
    setIsLoadingQuestions(true);
    try {
      const availableQuestions = allQuestions.filter(q => { const id = parseInt(q.id); return id >= start && id <= end; });
      if (availableQuestions.length === 0) {
        setSnackbar({ open: true, message: `第 ${start}-${end} 题范围内没有题目`, severity: 'warning' });
        setCurrentQuestions([]);
        setIsLoadingQuestions(false);
        return;
      }
      const actualCount = Math.min(count, availableQuestions.length);
      if (actualCount < count) setSnackbar({ open: true, message: `范围内只有 ${availableQuestions.length} 道题，将抽取全部`, severity: 'warning' });
      const shuffled = [...availableQuestions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const finalQuestions = shuffled.slice(0, actualCount);
      setCurrentQuestions([...finalQuestions]);
      setTestKey(prev => prev + 1);
      setSnackbar({ open: true, message: `成功从第 ${start}-${end} 题中随机抽取 ${actualCount} 道题`, severity: 'success' });
    } catch (error) {
      console.error('范围随机抽取异常:', error);
      setSnackbar({ open: true, message: '范围随机抽取失败', severity: 'error' });
      setCurrentQuestions([]);
    } finally { setIsLoadingQuestions(false); }
  };

  const handleConfirmDraw = (type, params) => {
    if (type === 'range') fetchRangeQuestions(params.start, params.end);
    else if (type === 'rangeRandom') fetchRangeRandomQuestions(params.start, params.end, params.count);
    else if (type === 'new') fetchNewQuestions(params);
    else if (type === 'category') fetchCategoryQuestions(params.category, params.count, params.sortType);
  };

  const handleBackToHome = () => navigate('/');
  const handleRefresh = async () => { setLoading(true); await fetchAllQuestions(); setLoading(false); };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button variant="outlined" startIcon={<HomeIcon />} onClick={handleBackToHome} sx={{ borderRadius: 2, borderColor: '#4CAF50', color: '#4CAF50' }}>返回目录</Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#4CAF50', width: 32, height: 32 }}><span style={{ fontSize: '1.2rem' }}>🧮</span></Avatar>
              <Typography sx={{ fontWeight: 'bold' }}>数学单项选择（服务器获取）</Typography>
            </Box>
            {mathBanks.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select value={dataSource} onChange={(e) => setDataSource(e.target.value)} displayEmpty sx={{ bgcolor: 'white' }}>
                  {mathBanks.map((bank) => (
                    <MenuItem key={bank.id} value={bank.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorageIcon fontSize="small" />
                        <Box><Typography variant="body2">{bank.name}</Typography><Typography variant="caption" color="text.secondary">{bank.totalQuestions}题</Typography></Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {serverStatus.isConnected ? <Tooltip title="服务器连接正常"><CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 16 }} /></Tooltip> : <Tooltip title={`服务器连接失败: ${serverStatus.error}`}><CancelIcon sx={{ color: '#f44336', fontSize: 16 }} /></Tooltip>}
            <Tooltip title="检查服务器连接"><IconButton size="small" onClick={async () => { try { const res = await fetch(`${serverAddress}/math/banks`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } }); setServerStatus({ isConnected: res.ok, lastCheck: new Date().toISOString(), error: res.ok ? null : `HTTP ${res.status}`, serverVersion: null }); setSnackbar({ open: true, message: res.ok ? '服务器连接正常' : `连接失败: HTTP ${res.status}`, severity: res.ok ? 'success' : 'error' }); } catch (e) { setServerStatus({ isConnected: false, lastCheck: new Date().toISOString(), error: e.message, serverVersion: null }); setSnackbar({ open: true, message: `连接失败: ${e.message}`, severity: 'error' }); } }} disabled={loading}><CloudSyncIcon fontSize="small" /></IconButton></Tooltip>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog} disabled={isLoadingQuestions || allQuestions.length === 0} sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388e3c' } }}>抽取题目</Button>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab icon={<MenuBook />} iconPosition="start" label="练习模式" sx={{ textTransform: 'none' }} />
            <Tab icon={<Assessment />} iconPosition="start" label="统计与题库管理" sx={{ textTransform: 'none' }} />
          </Tabs>
          <Tooltip title="刷新题库"><IconButton size="small" onClick={handleRefresh} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
        </Toolbar>
      </AppBar>
      {(loading || isLoadingQuestions) && <LinearProgress />}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <TabPanel value={currentTab} index={0}>
          {showTest && currentQuestions.length > 0 ? (
            <Fade in={showTest}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}><Button variant="outlined" onClick={() => setShowTest(false)} startIcon={<CloseIcon />} size="small">返回</Button></Box>
                <SingleChoiceTest key={`test-${testKey}`} dataSource={dataSource} questions={currentQuestions} drawType="custom" onComplete={handleTestComplete} />
              </Box>
            </Fade>
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #eaeaea', minHeight: 400 }}>
              <Box sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }}>🧮</Box>
              <Typography variant="h5" color="text.secondary" gutterBottom>数学选择题练习</Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>开始练习</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>点击右上角"抽取题目"按钮开始练习</Typography>
              {!serverStatus.isConnected && <Alert severity="warning" sx={{ mt: 3 }}>服务器连接失败，可能无法获取最新题目。请检查网络连接。</Alert>}
            </Paper>
          )}
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <QuestionMasterView dataSource={dataSource} questions={allQuestions} />
        </TabPanel>
      </Container>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
      <FloatingDrawDialog key={`draw-${allQuestions.length}`} open={drawDialogOpen} onClose={handleCloseDialog} currentSource={{ name: '数学选择题库', icon: '🧮', color: '#4CAF50' }} allQuestions={allQuestions} newQuestionStats={newQuestionStats} onConfirm={handleConfirmDraw} loading={isLoadingQuestions} questions={currentQuestions} onStartTest={handleStartTest} onRedraw={handleRedraw} />
    </Box>
  );
};

// 悬浮抽取+题目预览对话框组件
const FloatingDrawDialog = ({ open, onClose, currentSource, allQuestions, newQuestionStats, onConfirm, loading, questions, onStartTest, onRedraw }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: Math.max(20, (window.innerWidth - (isMobile ? 350 : 900)) / 2), y: Math.max(20, (window.innerHeight - (isMobile ? 500 : 600)) / 2) });
  const [drawType, setDrawType] = useState('new');
  const [drawSettings, setDrawSettings] = useState({
    drawSubType: 'new', sortType: 'random', count: 10, rangeStart: 1, rangeEnd: allQuestions.length || 20,
    randomCount: 10, selectedCategory: '', categoryCount: 10, categorySortType: 'random'
  });
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(allQuestions.length || 20);
  const [tempStart, setTempStart] = useState('1');
  const [tempEnd, setTempEnd] = useState(String(allQuestions.length || 20));
  const [renderKey, setRenderKey] = useState(0);
  const panelRef = useRef(null);
  const categories = [...new Set(allQuestions.map(q => q.category).filter(Boolean))];
  const getCategoryQuestionCount = (category) => category ? allQuestions.filter(q => q.category === category).length : 0;

  useEffect(() => { if (allQuestions.length > 0) { const maxEnd = allQuestions.length; setRangeEnd(maxEnd); setTempEnd(String(maxEnd)); setDrawSettings(prev => ({ ...prev, rangeEnd: maxEnd, rangeStart: 1 })); } }, [allQuestions]);
  useEffect(() => { const handleResize = () => setPosition(prev => ({ x: Math.min(Math.max(20, prev.x), window.innerWidth - (isMobile ? 370 : 920)), y: Math.min(Math.max(20, prev.y), window.innerHeight - (isMobile ? 520 : 620)) })); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, [isMobile]);
  useEffect(() => { setRenderKey(prev => prev + 1); }, [questions]);
  useEffect(() => { if (open) { setDrawType('new'); setDrawSettings({ drawSubType: 'new', sortType: 'random', count: 10, rangeStart: 1, rangeEnd: allQuestions.length || 20, randomCount: 10, selectedCategory: categories[0] || '', categoryCount: 10, categorySortType: 'random' }); setRangeStart(1); setRangeEnd(allQuestions.length || 20); setTempStart('1'); setTempEnd(String(allQuestions.length || 20)); } }, [open, allQuestions.length]);

  const handleMouseDown = (e) => { if (e.target.closest('.drag-handle')) { setIsDragging(true); setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y }); } };
  const handleMouseMove = (e) => { if (isDragging) setPosition({ x: Math.min(Math.max(20, e.clientX - dragOffset.x), window.innerWidth - (isMobile ? 370 : 920)), y: Math.min(Math.max(20, e.clientY - dragOffset.y), window.innerHeight - (isMobile ? 520 : 620)) }); };
  const handleMouseUp = () => setIsDragging(false);
  useEffect(() => { if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; } }, [isDragging, dragOffset]);

  const handleNewQuestionSettingsChange = (key, value) => setDrawSettings(prev => ({ ...prev, [key]: value }));
  const getAvailableCount = () => {
    if (drawType === 'new') return { new: newQuestionStats.newCount, weak: newQuestionStats.weakCount, review: newQuestionStats.reviewCount }[drawSettings.drawSubType] || newQuestionStats.total;
    if (drawType === 'range') return allQuestions.filter(q => { const id = parseInt(q.id); return id >= rangeStart && id <= rangeEnd; }).length;
    if (drawType === 'rangeRandom') return allQuestions.filter(q => { const id = parseInt(q.id); return id >= rangeStart && id <= rangeEnd; }).length;
    if (drawType === 'category') return getCategoryQuestionCount(drawSettings.selectedCategory);
    return 0;
  };
  const getMaxCount = () => {
    if (drawType === 'new') return { new: newQuestionStats.newCount, weak: newQuestionStats.weakCount, review: newQuestionStats.reviewCount }[drawSettings.drawSubType] || newQuestionStats.total;
    if (drawType === 'range') return rangeEnd - rangeStart + 1;
    if (drawType === 'rangeRandom') return getAvailableCount();
    if (drawType === 'category') return getCategoryQuestionCount(drawSettings.selectedCategory);
    return 0;
  };
  const handleDraw = () => {
    if (drawType === 'range') onConfirm(drawType, { start: rangeStart, end: rangeEnd });
    else if (drawType === 'rangeRandom') onConfirm(drawType, { start: rangeStart, end: rangeEnd, count: drawSettings.randomCount });
    else if (drawType === 'new') onConfirm(drawType, drawSettings);
    else if (drawType === 'category') onConfirm(drawType, { category: drawSettings.selectedCategory, count: drawSettings.categoryCount, sortType: drawSettings.categorySortType });
  };
  const hasQuestions = questions && Array.isArray(questions) && questions.length > 0;

  return (
    <Paper key={renderKey} ref={panelRef} elevation={12} sx={{ position: 'fixed', left: position.x, top: position.y, width: isMobile ? '95vw' : 900, maxWidth: '95vw', maxHeight: isMobile ? '90vh' : '85vh', backgroundColor: '#fff', borderRadius: 3, overflow: 'hidden', zIndex: 1400, cursor: isDragging ? 'grabbing' : 'default', boxShadow: '0 12px 48px rgba(0,0,0,0.25)', display: open ? 'flex' : 'none', flexDirection: 'column' }}>
      {/* 拖拽标题栏 */}
      <Box className="drag-handle" onMouseDown={handleMouseDown} sx={{ p: 1.5, bgcolor: '#4CAF50', color: 'white', cursor: 'grab', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, '&:active': { cursor: 'grabbing' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DragHandleIcon sx={{ fontSize: 20 }} /><Typography variant="h6" sx={{ fontWeight: 600 }}>抽取题目 - 数学选择题库</Typography></Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* 左侧设置面板 - 添加滚动条 */}
        <Box sx={{
          width: isMobile ? '100%' : '40%',
          minWidth: isMobile ? 'auto' : 280,
          borderRight: isMobile ? 'none' : '1px solid #eaeaea',
          borderBottom: isMobile ? '1px solid #eaeaea' : 'none',
          overflow: 'auto',  // 添加滚动条
          p: 2,
          maxHeight: isMobile ? '50%' : '100%',
          // 美化滚动条
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
          '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '3px', '&:hover': { background: '#a8a8a8' } }
        }}>
          <Box sx={{ mb: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}><Avatar sx={{ bgcolor: '#4CAF50', width: 32, height: 32 }}><span style={{ fontSize: '1.2rem' }}>🧮</span></Avatar><Box><Typography variant="h6" sx={{ fontWeight: 600 }}>{currentSource?.name}</Typography><Typography variant="caption" color="text.secondary">服务器获取方案</Typography></Box></Box></Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2 }}><Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>题库统计</Typography><Grid container spacing={1}><Grid item xs={3}><Card variant="outlined" sx={{ bgcolor: '#e8f5e9', textAlign: 'center', py: 1 }}><Typography variant="caption">新题</Typography>: <span style={{ fontWeight: 'bold', color: '#388e3c' }}>{newQuestionStats.newCount}</span></Card></Grid><Grid item xs={3}><Card variant="outlined" sx={{ bgcolor: '#fff3e0', textAlign: 'center', py: 1 }}><Typography variant="caption">复习</Typography>: <span style={{ fontWeight: 'bold', color: '#f57c00' }}>{newQuestionStats.reviewCount}</span></Card></Grid><Grid item xs={3}><Card variant="outlined" sx={{ bgcolor: '#ffebee', textAlign: 'center', py: 1 }}><Typography variant="caption">薄弱</Typography>: <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>{newQuestionStats.weakCount}</span></Card></Grid><Grid item xs={3}><Card variant="outlined" sx={{ bgcolor: '#e3f2fd', textAlign: 'center', py: 1 }}><Typography variant="caption">总计</Typography>: <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{newQuestionStats.total}</span></Card></Grid></Grid></Box>
          <Divider sx={{ my: 2 }} />
          <Box><Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}><FilterListIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />抽取设置</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>{DRAW_OPTIONS.map(opt => (<Button key={opt.value} variant={drawType === opt.value ? 'contained' : 'outlined'} onClick={() => setDrawType(opt.value)} startIcon={opt.icon} size="small" sx={{ flex: 1, minWidth: '100px', bgcolor: drawType === opt.value ? '#4CAF50' : 'transparent' }}>{opt.label}</Button>))}</Box>
            {drawType === 'new' && (<Box sx={{ mb: 2 }}><Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>题目类型</Typography><RadioGroup value={drawSettings.drawSubType} onChange={(e) => handleNewQuestionSettingsChange('drawSubType', e.target.value)} row sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}><FormControlLabel value="new" control={<Radio size="small" />} label={`新题(${newQuestionStats.newCount})`} /><FormControlLabel value="weak" control={<Radio size="small" />} label={`薄弱(${newQuestionStats.weakCount})`} /><FormControlLabel value="review" control={<Radio size="small" />} label={`复习(${newQuestionStats.reviewCount})`} /><FormControlLabel value="all" control={<Radio size="small" />} label={`全部(${newQuestionStats.total})`} /></RadioGroup><Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>排序方式</Typography><RadioGroup value={drawSettings.sortType} onChange={(e) => handleNewQuestionSettingsChange('sortType', e.target.value)} row sx={{ mb: 2 }}><FormControlLabel value="random" control={<Radio size="small" />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><ShuffleIcon fontSize="small" />随机</Box>} /><FormControlLabel value="sequential" control={<Radio size="small" />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SortByAlpha fontSize="small" />顺序</Box>} /></RadioGroup><Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>抽取数量</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Slider value={drawSettings.count} onChange={(e, val) => handleNewQuestionSettingsChange('count', val)} min={1} max={Math.min(50, getMaxCount())} valueLabelDisplay="auto" size="small" sx={{ flex: 1 }} /><TextField type="number" value={drawSettings.count} onChange={(e) => handleNewQuestionSettingsChange('count', Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))} size="small" sx={{ width: 70 }} /><Typography variant="body2">题</Typography></Box></Box>)}
            {drawType === 'range' && (<Box sx={{ mb: 2 }}><Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>题号范围 (1-{allQuestions.length || 20})</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><TextField type="number" label="起始" value={tempStart} onChange={(e) => { setTempStart(e.target.value); const val = parseInt(e.target.value); if (!isNaN(val) && val >= 1) setRangeStart(val); }} onBlur={() => { const maxVal = allQuestions.length || 20; let val = parseInt(tempStart); if (isNaN(val)) val = 1; val = Math.min(Math.max(val, 1), maxVal); setRangeStart(val); setTempStart(String(val)); }} size="small" sx={{ width: 100 }} /><Typography>—</Typography><TextField type="number" label="结束" value={tempEnd} onChange={(e) => { setTempEnd(e.target.value); const val = parseInt(e.target.value); if (!isNaN(val) && val >= 1) setRangeEnd(val); }} onBlur={() => { const maxVal = allQuestions.length || 20; let val = parseInt(tempEnd); if (isNaN(val)) val = 20; val = Math.min(Math.max(val, 1), maxVal); setRangeEnd(val); setTempEnd(String(val)); }} size="small" sx={{ width: 100 }} /></Box><Alert severity="info" sx={{ mt: 2, py: 0 }}><Typography variant="caption">将抽取范围内所有题目（共{getAvailableCount()}题）</Typography></Alert></Box>)}
            {drawType === 'rangeRandom' && (<Box sx={{ mb: 2 }}><Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>题号范围 (1-{allQuestions.length || 20})</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}><TextField type="number" label="起始" value={tempStart} onChange={(e) => { setTempStart(e.target.value); const val = parseInt(e.target.value); if (!isNaN(val) && val >= 1) setRangeStart(val); }} onBlur={() => { const maxVal = allQuestions.length || 20; let val = parseInt(tempStart); if (isNaN(val)) val = 1; val = Math.min(Math.max(val, 1), maxVal); setRangeStart(val); setTempStart(String(val)); }} size="small" sx={{ width: 100 }} /><Typography>—</Typography><TextField type="number" label="结束" value={tempEnd} onChange={(e) => { setTempEnd(e.target.value); const val = parseInt(e.target.value); if (!isNaN(val) && val >= 1) setRangeEnd(val); }} onBlur={() => { const maxVal = allQuestions.length || 20; let val = parseInt(tempEnd); if (isNaN(val)) val = 20; val = Math.min(Math.max(val, 1), maxVal); setRangeEnd(val); setTempEnd(String(val)); }} size="small" sx={{ width: 100 }} /></Box><Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>随机抽取数量</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}><Slider value={drawSettings.randomCount} onChange={(e, val) => handleNewQuestionSettingsChange('randomCount', val)} min={1} max={Math.min(50, getMaxCount())} valueLabelDisplay="auto" size="small" sx={{ flex: 1 }} /><TextField type="number" value={drawSettings.randomCount} onChange={(e) => handleNewQuestionSettingsChange('randomCount', Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))} size="small" sx={{ width: 70 }} /><Typography variant="body2">题</Typography></Box><Alert severity="info" sx={{ mb: 2, py: 0 }}><Typography variant="caption">范围内共有{getAvailableCount()}题，将从中随机抽取{drawSettings.randomCount}题</Typography></Alert></Box>)}
            {drawType === 'category' && categories.length > 0 && (<Box sx={{ mb: 2 }}><Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>选择分类</Typography><FormControl fullWidth size="small" sx={{ mb: 2, position: 'relative' }}><Select value={drawSettings.selectedCategory || categories[0]} onChange={(e) => handleNewQuestionSettingsChange('selectedCategory', e.target.value)} MenuProps={{ disablePortal: false, container: document.body, sx: { zIndex: 10000 } }}>{categories.map(cat => (<MenuItem key={cat} value={cat}><Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}><span>{cat}</span><Typography variant="caption" color="text.secondary">({getCategoryQuestionCount(cat)}题)</Typography></Box></MenuItem>))}</Select></FormControl><Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>排序方式</Typography><RadioGroup value={drawSettings.categorySortType} onChange={(e) => handleNewQuestionSettingsChange('categorySortType', e.target.value)} row sx={{ mb: 2 }}><FormControlLabel value="random" control={<Radio size="small" />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><ShuffleIcon fontSize="small" />随机</Box>} /><FormControlLabel value="sequential" control={<Radio size="small" />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SortByAlpha fontSize="small" />顺序</Box>} /></RadioGroup><Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>抽取数量</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Slider value={drawSettings.categoryCount} onChange={(e, val) => handleNewQuestionSettingsChange('categoryCount', val)} min={1} max={Math.min(50, getMaxCount())} valueLabelDisplay="auto" size="small" sx={{ flex: 1 }} /><TextField type="number" value={drawSettings.categoryCount} onChange={(e) => handleNewQuestionSettingsChange('categoryCount', Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))} size="small" sx={{ width: 70 }} /><Typography variant="body2">题</Typography></Box><Alert severity="info" sx={{ mt: 2, py: 0 }}><Typography variant="caption">分类"{drawSettings.selectedCategory || categories[0]}"中共有{getAvailableCount()}题</Typography></Alert></Box>)}
            {drawType === 'category' && categories.length === 0 && (<Alert severity="warning" sx={{ mt: 2 }}>当前题库没有分类数据</Alert>)}
            <Alert severity="info" sx={{ mt: 1, mb: 2, py: 0 }}><Typography variant="caption">可抽取: {getAvailableCount()} 题</Typography></Alert>
            <Button fullWidth variant="contained" onClick={handleDraw} disabled={loading || getAvailableCount() === 0 || (drawType === 'category' && categories.length === 0)} sx={{ bgcolor: '#4CAF50', py: 1.5, '&:hover': { bgcolor: '#388e3c' } }}>{loading ? <CircularProgress size={24} color="inherit" /> : '开始抽取'}</Button>
          </Box>
        </Box>

        {/* 右侧题目列表 */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 2, bgcolor: '#fafafa', maxHeight: isMobile ? '50%' : '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}><ViewList fontSize="small" />已抽取题目 {hasQuestions ? `(${questions.length}题)` : '(0题)'}</Typography>
          {!hasQuestions ? (<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 200, color: '#999' }}><QuizIcon sx={{ fontSize: 64, mb: 2, color: '#ccc' }} /><Typography variant="body1" color="text.secondary" align="center">暂无抽取题目<br />请在左侧设置抽取条件并点击"开始抽取"</Typography></Box>) : (<><List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, mb: 2, flex: 1, overflow: 'auto' }}>{questions.map((q, idx) => (<ListItem key={q.id} divider sx={{ py: 1.5, borderRadius: 1, '&:hover': { bgcolor: '#f5f5f5' } }}><Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}><Box sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: '#4CAF50', color: 'white', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 }}>{idx + 1}</Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, wordBreak: 'break-word' }}>{q.question.length > 60 ? q.question.substring(0, 60) + '...' : q.question}</Typography>{q.category && <Chip label={q.category} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />}</Box></Box></ListItem>))}</List><Divider sx={{ my: 1 }} /><Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}><Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={onRedraw} size="medium">重新抽取</Button><Button fullWidth variant="contained" startIcon={<PlayArrow />} onClick={onStartTest} sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }} size="medium">开始测试 ({questions.length}题)</Button></Box></>)}
        </Box>
      </Box>
    </Paper>
  );
};

export default MathLearningCenterEnhanced;