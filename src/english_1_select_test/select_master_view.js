// src/pages/QuestionMasterView.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Button,
  Alert,
  Snackbar,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  TableSortLabel,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Search,
  Refresh,
  TrendingUp,
  TrendingDown,
  Timer,
  Clear,
  Article,
  PlayArrow,
  Close as CloseIcon,
  AutoGraph as AutoGraphIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  CheckCircle,
  Cancel,
  Help,
  Warning,
  School,
  MenuBook,
  Psychology,
  Star,
  Category
} from '@mui/icons-material';
import { questionApi } from './api';

const QuestionMasterView = ({ dataSource = 'master', questions: externalQuestions = [] }) => {
  // 状态管理
  const [questions, setQuestions] = useState([]);
  const [learningStats, setLearningStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(15);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterMastery, setFilterMastery] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [answerHistory, setAnswerHistory] = useState([]); // 答题历史
  
  // 分类列表
  const [categories, setCategories] = useState([]);
  
  // 排序状态
  const [sortConfig, setSortConfig] = useState({
    field: 'id',
    order: 'asc'
  });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 统计信息
  const [stats, setStats] = useState({
    total: 0,
    mastered: 0,
    new: 0,
    wrong: 0,
    attempted: 0,
    avgAccuracy: 0
  });

  // 监听数据源变化
  useEffect(() => {
    loadData();
  }, [dataSource, externalQuestions]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 如果外部传入了题目，直接使用
      if (externalQuestions && externalQuestions.length > 0) {
        console.log('【MasterView】使用外部传入的题目:', externalQuestions.length);
        processQuestionsData(externalQuestions);
        calculateStats(externalQuestions);
        setLearningStats({ totalQuestions: externalQuestions.length });
      } else {
        // 从API获取
        const response = await questionApi.getMasterQuestions(dataSource);
        if (response?.flag === 1) {
          let questionsData = [];
          if (response.content?.questions && Array.isArray(response.content.questions)) {
            questionsData = response.content.questions;
          } else if (response.questions && Array.isArray(response.questions)) {
            questionsData = response.questions;
          }
          if (questionsData.length > 0) {
            processQuestionsData(questionsData);
            calculateStats(questionsData);
            setLearningStats(response.content?.metadata || { totalQuestions: questionsData.length });
          }
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setSnackbar({ open: true, message: '加载数据失败', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 处理题目数据
  const processQuestionsData = (questionsData) => {
    const processedQuestions = questionsData.map(q => {
      const statsData = q.stats || {};
      const totalAttempts = statsData.total_attempts || (statsData.correct_count + statsData.wrong_count) || 0;
      const correctCount = statsData.correct_count || 0;
      const wrongCount = statsData.wrong_count || 0;
      const masteryLevel = statsData.mastery_level || 0;
      const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) : 0;
      
      let status = 'new';
      if (totalAttempts > 0) {
        if (accuracy >= 0.8) status = 'mastered';
        else if (accuracy >= 0.5) status = 'learning';
        else status = 'weak';
      }
      
      return {
        id: q.id,
        question: q.question,
        category: q.category || '未分类',
        difficulty: q.difficulty || 3,
        status: status,
        totalAttempts: totalAttempts,
        correctCount: correctCount,
        wrongCount: wrongCount,
        masteryLevel: masteryLevel,
        accuracy: Math.round(accuracy * 100),
        explanation: q.explanation,
        options: q.options,
        correct: q.correct,
        stats: statsData, // 保存原始统计信息，包含历史
        firstSeen: statsData.first_seen,
        lastExtracted: statsData.last_extracted
      };
    });
    
    setQuestions(processedQuestions);
    
    // 提取分类
    const uniqueCategories = [...new Set(processedQuestions.map(q => q.category).filter(Boolean))];
    setCategories(uniqueCategories);
    setPage(1);
  };

  // 计算统计信息
  const calculateStats = (questionsData) => {
    let masteredCount = 0;
    let newCount = 0;
    let wrongCount = 0;
    let attemptedCount = 0;
    let totalAccuracy = 0;
    
    questionsData.forEach(q => {
      const statsData = q.stats || {};
      const totalAttempts = statsData.total_attempts || 0;
      const accuracy = totalAttempts > 0 ? (statsData.correct_count / totalAttempts) : 0;
      
      if (totalAttempts > 0) {
        attemptedCount++;
        if (accuracy >= 0.8) masteredCount++;
        if (statsData.wrong_count > 0) wrongCount++;
        totalAccuracy += accuracy;
      } else {
        newCount++;
      }
    });
    
    setStats({
      total: questionsData.length,
      mastered: masteredCount,
      new: newCount,
      wrong: wrongCount,
      attempted: attemptedCount,
      avgAccuracy: attemptedCount > 0 ? Math.round((totalAccuracy / attemptedCount) * 100) : 0
    });
  };

  // 计算答题历史（按时间排序，最新的在最上面）
  const calculateAnswerHistory = (question) => {
    if (!question || !question.stats?.history || !Array.isArray(question.stats.history)) {
      return [];
    }
    
    // 复制历史记录
    const history = [...question.stats.history];
    
    // 按日期排序（从新到旧）
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 格式化历史记录
    return history.map((record, index) => ({
      number: history.length - index,
      date: record.date,
      result: record.result,
      time: record.time || 0
    }));
  };

  // 计算正确率趋势
  const calculateAccuracyTrend = (question) => {
    if (!question || !question.stats?.history || question.stats.history.length < 2) {
      return null;
    }
    
    const history = [...question.stats.history];
    const firstResult = history[0]?.result;
    const lastResult = history[history.length - 1]?.result;
    
    if (lastResult && !firstResult) return 'improved';
    if (!lastResult && firstResult) return 'declined';
    if (lastResult && firstResult) return 'stable';
    return 'unknown';
  };

  // 刷新数据
  const handleRefresh = async () => {
    await loadData();
  };

  // 处理预览题目
  const handleOpenPreview = (question) => {
    const history = calculateAnswerHistory(question);
    setAnswerHistory(history);
    setSelectedQuestion(question);
    setPreviewOpen(true);
  };

  // 处理表头点击排序
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 获取难度标签
  const getDifficultyLabel = (difficulty) => {
    const map = {
      1: { label: '1级 · 入门', color: 'success' },
      2: { label: '2级 · 基础', color: 'info' },
      3: { label: '3级 · 中等', color: 'warning' },
      4: { label: '4级 · 困难', color: 'error' },
      5: { label: '5级 · 挑战', color: 'error' }
    };
    return map[difficulty] || { label: `${difficulty || 0}级`, color: 'default' };
  };

  // 获取掌握程度标签
  const getMasteryInfo = (mastery) => {
    if (!mastery || mastery === 0) return { label: '未练', color: '#9e9e9e', chip: 'default' };
    if (mastery < 0.5) return { label: '薄弱', color: '#f44336', chip: 'error' };
    if (mastery < 0.8) return { label: '复习', color: '#ff9800', chip: 'warning' };
    return { label: '掌握', color: '#4caf50', chip: 'success' };
  };

  // 获取状态标签
  const getStatusChip = (status) => {
    switch (status) {
      case 'mastered':
        return <Chip icon={<CheckCircle />} label="已掌握" size="small" color="success" sx={{ fontSize: '0.7rem' }} />;
      case 'new':
        return <Chip icon={<Help />} label="新题" size="small" color="info" sx={{ fontSize: '0.7rem' }} />;
      case 'learning':
        return <Chip icon={<TrendingUp />} label="学习中" size="small" color="warning" sx={{ fontSize: '0.7rem' }} />;
      case 'weak':
        return <Chip icon={<Warning />} label="薄弱" size="small" color="error" sx={{ fontSize: '0.7rem' }} />;
      default:
        return <Chip icon={<Help />} label="未知" size="small" sx={{ fontSize: '0.7rem' }} />;
    }
  };

  // 过滤题目
  const filteredQuestions = questions.filter(q => {
    if (!q) return false;
    
    const matchesSearch = searchTerm === '' || 
      (q.question?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.category?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || q.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === parseInt(filterDifficulty);

    const mastery = q.masteryLevel || 0;
    const matchesMastery = 
      filterMastery === 'all' ||
      (filterMastery === 'never' && mastery === 0) ||
      (filterMastery === 'weak' && mastery > 0 && mastery < 0.5) ||
      (filterMastery === 'review' && mastery >= 0.5 && mastery < 0.8) ||
      (filterMastery === 'mastered' && mastery >= 0.8);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesMastery;
  });

  // 排序函数
  const sortQuestions = (list) => {
    if (!list.length) return [];
    
    return [...list].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.field) {
        case 'id':
          aVal = parseInt(a.id);
          bVal = parseInt(b.id);
          break;
        case 'question':
          aVal = a.question || '';
          bVal = b.question || '';
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        case 'difficulty':
          aVal = a.difficulty || 0;
          bVal = b.difficulty || 0;
          break;
        case 'totalAttempts':
          aVal = a.totalAttempts || 0;
          bVal = b.totalAttempts || 0;
          break;
        case 'accuracy':
          aVal = a.accuracy || 0;
          bVal = b.accuracy || 0;
          break;
        case 'masteryLevel':
          aVal = a.masteryLevel || 0;
          bVal = b.masteryLevel || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortConfig.order === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortConfig.order === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const sortedQuestions = sortQuestions(filteredQuestions);
  const totalPages = Math.ceil(sortedQuestions.length / rowsPerPage);
  const paginatedQuestions = sortedQuestions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // 格式化时间
  const formatDate = (dateStr) => {
    if (!dateStr) return '从未';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN');
    } catch {
      return '从未';
    }
  };

  // 格式化详细时间
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '未知';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '未知';
    }
  };

  // 趋势对比
  const renderTrendComparison = (question) => {
    const history = question?.stats?.history || [];
    if (history.length < 2) return null;
    
    const firstResult = history[0]?.result;
    const lastResult = history[history.length - 1]?.result;
    const firstCorrect = history.filter((_, idx) => idx === 0).length > 0;
    
    return (
      <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #ccc' }}>
        <Typography variant="caption" color="text.secondary">
          {lastResult && !firstResult ? (
            <TrendingUp fontSize="inherit" sx={{ color: '#4caf50', verticalAlign: 'middle', mr: 0.5 }} />
          ) : !lastResult && firstResult ? (
            <TrendingDown fontSize="inherit" sx={{ color: '#f44336', verticalAlign: 'middle', mr: 0.5 }} />
          ) : (
            <Timer fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          )}
          首次练习: {firstResult ? '正确' : '错误'} · 
          最近练习: {lastResult ? '正确' : '错误'}
        </Typography>
      </Box>
    );
  };

  // 表格视图
  const renderTable = () => (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', width: 70 }}>
              <TableSortLabel active={sortConfig.field === 'id'} direction={sortConfig.field === 'id' ? sortConfig.order : 'asc'} onClick={() => handleSort('id')}>题号</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
              <TableSortLabel active={sortConfig.field === 'question'} direction={sortConfig.field === 'question' ? sortConfig.order : 'asc'} onClick={() => handleSort('question')}>题目内容</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', width: 100 }}>
              <TableSortLabel active={sortConfig.field === 'category'} direction={sortConfig.field === 'category' ? sortConfig.order : 'asc'} onClick={() => handleSort('category')}>分类</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', width: 80 }} align="center">
              <TableSortLabel active={sortConfig.field === 'difficulty'} direction={sortConfig.field === 'difficulty' ? sortConfig.order : 'asc'} onClick={() => handleSort('difficulty')}>难度</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', width: 90 }} align="center">
              <TableSortLabel active={sortConfig.field === 'totalAttempts'} direction={sortConfig.field === 'totalAttempts' ? sortConfig.order : 'asc'} onClick={() => handleSort('totalAttempts')}>练习次数</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', width: 80 }} align="center">
              <TableSortLabel active={sortConfig.field === 'accuracy'} direction={sortConfig.field === 'accuracy' ? sortConfig.order : 'asc'} onClick={() => handleSort('accuracy')}>正确率</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', width: 100 }} align="center">
              <TableSortLabel active={sortConfig.field === 'masteryLevel'} direction={sortConfig.field === 'masteryLevel' ? sortConfig.order : 'asc'} onClick={() => handleSort('masteryLevel')}>掌握程度</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', width: 80 }} align="center">状态</TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', width: 70 }} align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedQuestions.map(q => {
            const difficulty = getDifficultyLabel(q.difficulty);
            const mastery = getMasteryInfo(q.masteryLevel);
            const hasPractice = q.totalAttempts > 0;
            
            return (
              <TableRow key={q.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f0f7ff' } }} onClick={() => handleOpenPreview(q)}>
                <TableCell><Typography variant="body2">{q.id}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.question?.substring(0, 60)}...
                  </Typography>
                </TableCell>
                <TableCell><Chip label={q.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                <TableCell align="center"><Chip label={difficulty.label} size="small" color={difficulty.color} variant="outlined" sx={{ fontSize: '0.7rem', minWidth: 50 }} /></TableCell>
                <TableCell align="center">
                  {hasPractice ? (
                    <Tooltip title={`练习 ${q.totalAttempts} 次`}>
                      <Chip label={q.totalAttempts} size="small" sx={{ fontSize: '0.7rem' }} />
                    </Tooltip>
                  ) : <Typography variant="body2" color="text.secondary">-</Typography>}
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" sx={{ color: q.accuracy >= 70 ? '#4caf50' : q.accuracy >= 40 ? '#ff9800' : '#f44336', fontWeight: 500 }}>
                    {q.accuracy}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <LinearProgress variant="determinate" value={q.masteryLevel * 100} sx={{ width: 60, height: 6, borderRadius: 3, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: mastery.color } }} />
                    <Tooltip title={`掌握程度: ${Math.round(q.masteryLevel * 100)}%`}>
                      <Typography variant="caption" sx={{ color: mastery.color, fontWeight: 500 }}>{Math.round(q.masteryLevel * 100)}%</Typography>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell align="center">{getStatusChip(q.status)}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenPreview(q); }}>
                    <PlayArrow fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* 统计卡片 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{stats.total}</Typography>
              <Typography variant="caption" color="text.secondary">总题数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#388e3c' }}>{stats.mastered}</Typography>
              <Typography variant="caption" color="text.secondary">已掌握</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f57c00' }}>{stats.new}</Typography>
              <Typography variant="caption" color="text.secondary">新题</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>{stats.wrong}</Typography>
              <Typography variant="caption" color="text.secondary">易错题</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 筛选栏 */}
      <Paper sx={{ p: 1, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="搜索题目、分类或ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search fontSize="small" sx={{ mr: 0.5, color: '#999' }} />,
            endAdornment: searchTerm && (<IconButton size="small" onClick={() => setSearchTerm('')}><Clear fontSize="small" /></IconButton>)
          }} sx={{ minWidth: 200 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} displayEmpty sx={{ fontSize: '0.875rem' }}>
            <MenuItem value="all">全部分类</MenuItem>
            {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 70 }}>
          <Select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} displayEmpty sx={{ fontSize: '0.875rem' }}>
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="1">1级</MenuItem><MenuItem value="2">2级</MenuItem><MenuItem value="3">3级</MenuItem>
            <MenuItem value="4">4级</MenuItem><MenuItem value="5">5级</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select value={filterMastery} onChange={(e) => setFilterMastery(e.target.value)} displayEmpty sx={{ fontSize: '0.875rem' }}>
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="never">未练</MenuItem><MenuItem value="weak">薄弱</MenuItem>
            <MenuItem value="review">复习</MenuItem><MenuItem value="mastered">掌握</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          <IconButton size="small" onClick={handleRefresh} disabled={loading}><Refresh fontSize="small" /></IconButton>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>共 {filteredQuestions.length} 题</Typography>
        </Box>
      </Paper>

      {/* 加载中 */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 表格视图 */}
      {!loading && (
        <>
          {paginatedQuestions.length > 0 ? renderTable() : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <MenuBook sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
              <Typography color="text.secondary">暂无题目数据</Typography>
            </Paper>
          )}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} size="small" color="primary" />
            </Box>
          )}
        </>
      )}

      {/* 预览对话框 - 包含答题历史 */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        {selectedQuestion && (
          <>
            <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white', py: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>题目 #{selectedQuestion.id}</Typography>
                <IconButton color="inherit" size="small" onClick={() => setPreviewOpen(false)}><CloseIcon fontSize="small" /></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 1.5, maxHeight: '70vh', overflow: 'auto' }}>
              {/* 基本信息 */}
              <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
                <Chip size="small" label={getDifficultyLabel(selectedQuestion.difficulty).label} />
                <Chip size="small" label={selectedQuestion.category} variant="outlined" />
                {selectedQuestion.totalAttempts > 0 && (
                  <>
                    <Chip size="small" icon={<AutoGraphIcon />} label={`掌握 ${Math.round(selectedQuestion.masteryLevel * 100)}%`} color={getMasteryInfo(selectedQuestion.masteryLevel).chip} />
                    <Chip size="small" icon={<Timer />} label={`练习 ${selectedQuestion.totalAttempts}次`} variant="outlined" />
                    <Chip size="small" icon={<CheckCircle />} label={`正确 ${selectedQuestion.correctCount}次`} color="success" variant="outlined" />
                    <Chip size="small" icon={<Cancel />} label={`错误 ${selectedQuestion.wrongCount}次`} color="error" variant="outlined" />
                  </>
                )}
              </Box>
              
              {/* 题目内容 */}
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                {selectedQuestion.question}
              </Typography>
              
              {/* 选项列表 */}
              {selectedQuestion.options && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>选项：</Typography>
                  <Grid container spacing={1}>
                    {selectedQuestion.options.map(opt => (
                      <Grid item xs={12} sm={6} key={opt.label}>
                        <Paper variant="outlined" sx={{ 
                          p: 1, 
                          bgcolor: opt.label === selectedQuestion.correct ? '#e8f5e9' : 'transparent',
                          borderColor: opt.label === selectedQuestion.correct ? '#4caf50' : '#ddd'
                        }}>
                          <Typography variant="body2">
                            <strong>{opt.label}.</strong> {opt.text}
                            {opt.label === selectedQuestion.correct && (
                              <CheckCircle sx={{ color: '#4caf50', fontSize: 14, ml: 1, verticalAlign: 'middle' }} />
                            )}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {/* 解析 */}
              {selectedQuestion.explanation && (
                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>解析：</strong> {selectedQuestion.explanation}
                  </Typography>
                </Alert>
              )}
              
              {/* 答题历史记录 - 参考 PassageBrowseView */}
              {answerHistory.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <HistoryIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>答题历史记录</Typography>
                  </Box>
                  
                  <Box sx={{ bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1 }}>
                    {answerHistory.map((record, index) => (
                      <Box key={index} sx={{ mb: index < answerHistory.length - 1 ? 1.5 : 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            第 {record.number} 次练习
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(record.date)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={record.result ? '正确' : '错误'}
                            size="small"
                            color={record.result ? 'success' : 'error'}
                            icon={record.result ? <CheckCircle /> : <Cancel />}
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {record.time > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              用时: {record.time}秒
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                    
                    {/* 趋势对比 */}
                    {renderTrendComparison(selectedQuestion)}
                  </Box>
                </Box>
              )}
              
              {/* 首次和上次练习时间 */}
              {selectedQuestion.totalAttempts > 0 && (
                <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    首次练习: {formatDate(selectedQuestion.firstSeen)}<br/>
                    上次练习: {formatDate(selectedQuestion.lastExtracted)}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 1.5 }}>
              <Button size="small" onClick={() => setPreviewOpen(false)}>关闭</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 提示 */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default QuestionMasterView;