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
  TableSortLabel
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
  History as HistoryIcon
} from '@mui/icons-material';
import { clozeApi } from './api';

const PassageBrowseView = ({ dataSource = 'default', onSelectPassage }) => {
  // 状态管理
  const [passages, setPassages] = useState([]);
  const [learningStats, setLearningStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(15);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterMastery, setFilterMastery] = useState('all');
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [extractHistory, setExtractHistory] = useState([]);
  
  // 分类列表
  const [categories, setCategories] = useState([]);
  
  // 排序状态
  const [sortConfig, setSortConfig] = useState({
    field: 'extract_count',
    order: 'desc'
  });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 监听数据源变化
  useEffect(() => {
    loadData();
  }, [dataSource]);

  // 加载所有数据
  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await loadLearningStats();

      await loadPassages(stats);
    } catch (error) {
      console.error('加载数据失败:', error);
      setSnackbar({ open: true, message: '加载数据失败', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 获取学习统计
  const loadLearningStats = async () => {
    try {
      console.log('11111111',dataSource)
      const response = await clozeApi.getReport(dataSource);
      console.log('22222222',response)
      if (response?.flag === 1) {
        setLearningStats(response.content);
        return response.content;
      }
      return null;
    } catch (error) {
      console.error('获取学习统计失败:', error);
      return null;
    }
  };

  // 加载文章列表
  const loadPassages = async () => {
    try {
      const response = await clozeApi.getPassage('all', dataSource);
      console.log('33333',response)
      if (response?.flag === 1) {
        let passagesList = [];
        
        if (response.content?.passages) {
          passagesList = response.content.passages;
        } else if (Array.isArray(response.content)) {
          passagesList = response.content;
        } else if (response.content?.passage) {
          passagesList = [response.content.passage];
        }
        
        const mergedPassages = passagesList.map(passage => {
          const passageStats = passage.stats || {};
          return {
            ...passage,
            stats: {
              extract_count: passageStats.extract_count || 0,
              answer_count: passageStats.answer_count || 0,
              correct_count: passageStats.correct_count || 0,
              wrong_count: passageStats.wrong_count || 0,
              accuracy: passageStats.accuracy || 0,
              avg_mastery: passageStats.avg_mastery || 0,
              attempted_questions: passageStats.attempted_questions || 0,
              last_practiced: passageStats.last_practiced || null,
              first_seen: passageStats.first_seen || null
            }
          };
        });
        
        setPassages(mergedPassages);
        
        // 提取分类
        const uniqueCategories = [...new Set(mergedPassages.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
        setPage(1);
      }
    } catch (error) {
      console.error('加载异常:', error);
      setSnackbar({ open: true, message: '加载失败', severity: 'error' });
    }
  };

  // ========== 【修改】计算文章的历史正确率，最新的显示在上面 ==========
  const calculateExtractHistory = (passage) => {
    if (!passage || !passage.questions) return [];
    
    const allAnswers = [];
    
    passage.questions.forEach(question => {
      if (question.stats?.history && Array.isArray(question.stats.history)) {
        question.stats.history.forEach((record) => {
          allAnswers.push({
            date: record.date,
            result: record.result,
            questionId: question.id
          });
        });
      }
    });
    
    // 按日期排序（从旧到新）
    allAnswers.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const questionsPerPassage = passage.questions.length;
    const extracts = [];
    
    for (let i = 0; i < allAnswers.length; i += questionsPerPassage) {
      const extractAnswers = allAnswers.slice(i, i + questionsPerPassage);
      if (extractAnswers.length === 0) continue;
      
      const correctCount = extractAnswers.filter(a => a.result).length;
      const accuracy = (correctCount / extractAnswers.length) * 100;
      
      extracts.push({
        extract_number: extracts.length + 1,
        date: extractAnswers[0].date,
        correct_count: correctCount,
        total: extractAnswers.length,
        accuracy: Math.round(accuracy)
      });
    }
    
    // ✅ 反转数组，让最新的显示在上面
    return extracts.reverse();
  };

  // 刷新数据
  const handleRefresh = async () => {
    await loadData();
  };

  // 【关键】处理开始练习
  const handleStartPractice = (passage) => {
    if (onSelectPassage) {
      onSelectPassage(passage);  // 调用父组件传入的回调
    }
    setPreviewOpen(false);  // 关闭预览对话框
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
      1: { label: '入门', color: 'success' },
      2: { label: '基础', color: 'info' },
      3: { label: '中等', color: 'warning' },
      4: { label: '困难', color: 'error' },
      5: { label: '挑战', color: 'error' }
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

  // 过滤文章
  const filteredPassages = passages.filter(p => {
    if (!p) return false;
    
    const matchesSearch = searchTerm === '' || 
      (p.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || p.difficulty === parseInt(filterDifficulty);

    const mastery = p.stats?.avg_mastery || 0;
    const matchesMastery = 
      filterMastery === 'all' ||
      (filterMastery === 'never' && mastery === 0) ||
      (filterMastery === 'weak' && mastery > 0 && mastery < 0.5) ||
      (filterMastery === 'review' && mastery >= 0.5 && mastery < 0.8) ||
      (filterMastery === 'mastered' && mastery >= 0.8);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesMastery;
  });

  // 排序函数
  const sortPassages = (list) => {
    if (!list.length) return [];
    
    return [...list].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.field) {
        case 'title':
          aVal = a.title || '';
          bVal = b.title || '';
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        case 'difficulty':
          aVal = a.difficulty || 0;
          bVal = b.difficulty || 0;
          break;
        case 'question_count':
          aVal = a.questions?.length || 0;
          bVal = b.questions?.length || 0;
          break;
        case 'extract_count':
          aVal = a.stats?.extract_count || 0;
          bVal = b.stats?.extract_count || 0;
          break;
        case 'answer_count':
          aVal = a.stats?.answer_count || 0;
          bVal = b.stats?.answer_count || 0;
          break;
        case 'accuracy':
          aVal = a.stats?.accuracy || 0;
          bVal = b.stats?.accuracy || 0;
          break;
        case 'mastery':
          aVal = a.stats?.avg_mastery || 0;
          bVal = b.stats?.avg_mastery || 0;
          break;
        case 'last_practiced':
          aVal = a.stats?.last_practiced ? new Date(a.stats.last_practiced).getTime() : 0;
          bVal = b.stats?.last_practiced ? new Date(b.stats.last_practiced).getTime() : 0;
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

  const sortedPassages = sortPassages(filteredPassages);
  const totalPages = Math.ceil(sortedPassages.length / rowsPerPage);
  const paginatedPassages = sortedPassages.slice(
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

  // 打开预览对话框
  const handleOpenPreview = (passage) => {
    setSelectedPassage(passage);
    const history = calculateExtractHistory(passage);
    setExtractHistory(history);
    setPreviewOpen(true);
  };

  // 表格视图
  const renderTable = () => (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
              <TableSortLabel active={sortConfig.field === 'title'} direction={sortConfig.field === 'title' ? sortConfig.order : 'asc'} onClick={() => handleSort('title')}>标题</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
              <TableSortLabel active={sortConfig.field === 'category'} direction={sortConfig.field === 'category' ? sortConfig.order : 'asc'} onClick={() => handleSort('category')}>分类</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">
              <TableSortLabel active={sortConfig.field === 'difficulty'} direction={sortConfig.field === 'difficulty' ? sortConfig.order : 'asc'} onClick={() => handleSort('difficulty')}>难度</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">
              <TableSortLabel active={sortConfig.field === 'question_count'} direction={sortConfig.field === 'question_count' ? sortConfig.order : 'asc'} onClick={() => handleSort('question_count')}>题数</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">
              <TableSortLabel active={sortConfig.field === 'extract_count'} direction={sortConfig.field === 'extract_count' ? sortConfig.order : 'asc'} onClick={() => handleSort('extract_count')}>练习次数</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">
              <TableSortLabel active={sortConfig.field === 'answer_count'} direction={sortConfig.field === 'answer_count' ? sortConfig.order : 'asc'} onClick={() => handleSort('answer_count')}>答题次数</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">
              <TableSortLabel active={sortConfig.field === 'accuracy'} direction={sortConfig.field === 'accuracy' ? sortConfig.order : 'asc'} onClick={() => handleSort('accuracy')}>正确率</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">
              <TableSortLabel active={sortConfig.field === 'mastery'} direction={sortConfig.field === 'mastery' ? sortConfig.order : 'asc'} onClick={() => handleSort('mastery')}>掌握程度</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">
              <TableSortLabel active={sortConfig.field === 'last_practiced'} direction={sortConfig.field === 'last_practiced' ? sortConfig.order : 'asc'} onClick={() => handleSort('last_practiced')}>上次练习</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedPassages.map(p => {
            const difficulty = getDifficultyLabel(p.difficulty);
            const mastery = getMasteryInfo(p.stats?.avg_mastery);
            const hasPractice = p.stats?.extract_count > 0;
            const accuracy = p.stats?.accuracy || 0;
            
            return (
              <TableRow key={p.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f0f7ff' } }} onClick={() => handleOpenPreview(p)}>
                <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{p.title}</Typography></TableCell>
                <TableCell><Chip label={p.category || '未分类'} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} /></TableCell>
                <TableCell align="center"><Chip label={difficulty.label} size="small" color={difficulty.color} variant="outlined" sx={{ fontSize: '0.75rem', minWidth: 50 }} /></TableCell>
                <TableCell align="center"><Typography variant="body2">{p.questions?.length || 0}</Typography></TableCell>
                <TableCell align="center">
                  {hasPractice ? (
                    <Tooltip title={`文章被抽取练习 ${p.stats.extract_count} 次`}>
                      <Chip label={p.stats.extract_count} size="small" color="default" sx={{ fontSize: '0.75rem' }} />
                    </Tooltip>
                  ) : <Typography variant="body2" color="text.secondary">-</Typography>}
                </TableCell>
                <TableCell align="center"><Typography variant="body2">{p.stats?.answer_count || 0}</Typography></TableCell>
                <TableCell align="center">
                  <Typography variant="body2" sx={{ color: accuracy >= 0.7 ? '#4caf50' : accuracy >= 0.4 ? '#ff9800' : '#f44336', fontWeight: 500 }}>
                    {Math.round(accuracy * 100)}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <LinearProgress variant="determinate" value={(p.stats?.avg_mastery || 0) * 100} sx={{ width: 60, height: 6, borderRadius: 3, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: mastery.color } }} />
                    <Tooltip title={`掌握程度: ${Math.round((p.stats?.avg_mastery || 0) * 100)}%`}>
                      <Typography variant="caption" sx={{ color: mastery.color, fontWeight: 500 }}>{Math.round((p.stats?.avg_mastery || 0) * 100)}%</Typography>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell align="center"><Typography variant="caption" color={hasPractice ? 'text.primary' : 'text.disabled'}>{formatDate(p.stats?.last_practiced)}</Typography></TableCell>
                <TableCell align="center">
                  <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenPreview(p); }}>
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

  // ========== 【修改】趋势对比逻辑，适应新的排序 ==========
  const renderTrendComparison = () => {
    if (extractHistory.length < 2) return null;
    
    const firstExtract = extractHistory[extractHistory.length - 1]; // 最早的（数组最后一个）
    const lastExtract = extractHistory[0]; // 最新的（数组第一个）
    
    return (
      <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #ccc' }}>
        <Typography variant="caption" color="text.secondary">
          {lastExtract.accuracy > firstExtract.accuracy ? (
            <TrendingUp fontSize="inherit" sx={{ color: '#4caf50', verticalAlign: 'middle', mr: 0.5 }} />
          ) : (
            <TrendingDown fontSize="inherit" sx={{ color: '#f44336', verticalAlign: 'middle', mr: 0.5 }} />
          )}
          首次练习正确率 {firstExtract.accuracy}% · 
          最近练习正确率 {lastExtract.accuracy}%
        </Typography>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 标题 */}
      <Paper sx={{ p: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{learningStats?.metadata?.username || '用户'}</Typography>
          <Chip size="small" label={`正确率 ${Math.round((learningStats?.metadata?.accuracy || 0) * 100)}%`} color="success" variant="outlined" sx={{ height: 24 }} />
          <Chip size="small" label={`总练习 ${learningStats?.metadata?.totalExtracts || 0}次`} variant="outlined" sx={{ height: 24 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={handleRefresh} disabled={loading}><Refresh fontSize="small" /></IconButton>
        </Box>
      </Paper>

      {/* 筛选栏 */}
      <Paper sx={{ p: 1, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="搜索标题或分类..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search fontSize="small" sx={{ mr: 0.5, color: '#999' }} />,
            endAdornment: searchTerm && (<IconButton size="small" onClick={() => setSearchTerm('')}><Clear fontSize="small" /></IconButton>)
          }} sx={{ minWidth: 200 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} displayEmpty sx={{ fontSize: '0.875rem' }}>
            <MenuItem value="all">全部</MenuItem>
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

        <Typography variant="body2" sx={{ ml: 'auto', color: 'text.secondary' }}>共 {filteredPassages.length} 篇</Typography>
      </Paper>

      {/* 加载中 */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 表格视图 */}
      {!loading && (
        <>
          {paginatedPassages.length > 0 ? renderTable() : (
            <Paper sx={{ p: 4, textAlign: 'center', flex: 1 }}>
              <Article sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
              <Typography color="text.secondary">暂无匹配的文章</Typography>
            </Paper>
          )}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} size="small" color="primary" />
            </Box>
          )}
        </>
      )}

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        {selectedPassage && (
          <>
            <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white', py: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{selectedPassage.title}</Typography>
                <IconButton color="inherit" size="small" onClick={() => setPreviewOpen(false)}><CloseIcon fontSize="small" /></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 1.5, maxHeight: '70vh', overflow: 'auto' }}>
              {/* 基本信息 */}
              <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
                <Chip size="small" label={`难度 ${selectedPassage.difficulty}级`} />
                <Chip size="small" label={selectedPassage.category || '未分类'} variant="outlined" />
                <Chip size="small" label={`${selectedPassage.questions?.length || 0}题`} variant="outlined" />
                {selectedPassage.stats?.extract_count > 0 && (
                  <>
                    <Chip size="small" icon={<AutoGraphIcon />} label={`掌握 ${Math.round((selectedPassage.stats?.avg_mastery || 0) * 100)}%`} color={getMasteryInfo(selectedPassage.stats?.avg_mastery).chip} />
                    <Chip size="small" icon={<Timer />} label={`练习 ${selectedPassage.stats.extract_count}次`} variant="outlined" />
                  </>
                )}
              </Box>
              
              {/* 文章内容预览 */}
              <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.6 }}>
                {selectedPassage.content?.substring(0, 200)}...
              </Typography>
              
              {/* 历史正确率趋势 - 现在最新的显示在上面 */}
              {extractHistory.length > 0 && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <HistoryIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>历史练习正确率趋势</Typography>
                  </Box>
                  
                  <Box sx={{ bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1 }}>
                    {extractHistory.map((extract, index) => (
                      <Box key={index} sx={{ mb: index < extractHistory.length - 1 ? 1.5 : 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            第 {extract.extract_number} 次练习
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(extract.date)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={extract.accuracy} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4, 
                                bgcolor: '#e0e0e0', 
                                '& .MuiLinearProgress-bar': { 
                                  bgcolor: extract.accuracy >= 80 ? '#4caf50' : 
                                          extract.accuracy >= 60 ? '#ff9800' : '#f44336' 
                                } 
                              }} 
                            />
                          </Box>
                          <Typography variant="caption" sx={{ 
                            fontWeight: 600, 
                            color: extract.accuracy >= 80 ? '#4caf50' : 
                                   extract.accuracy >= 60 ? '#ff9800' : '#f44336' 
                          }}>
                            {extract.accuracy}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({extract.correct_count}/{extract.total})
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    
                    {/* 使用新的趋势对比函数 */}
                    {renderTrendComparison()}
                  </Box>
                </Box>
              )}
              
              {/* 统计信息 */}
              {selectedPassage.stats?.extract_count > 0 && (
                <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1, mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>文章被抽取练习 {selectedPassage.stats.extract_count} 次</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>总正确率 {Math.round((selectedPassage.stats.accuracy || 0) * 100)}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={(selectedPassage.stats?.avg_mastery || 0) * 100} sx={{ height: 4, borderRadius: 2, mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">上次练习: {formatDate(selectedPassage.stats.last_practiced)}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 1.5 }}>
              <Button size="small" onClick={() => setPreviewOpen(false)}>取消</Button>
              <Button size="small" variant="contained" onClick={() => handleStartPractice(selectedPassage)} sx={{ bgcolor: '#1a237e' }}>
                开始练习
              </Button>
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

export default PassageBrowseView;