// src/pages/WordbankMasterView.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Button,
  Divider,
  Alert,
  Snackbar,
  Collapse,
  Fab,
  Zoom,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Checkbox
} from '@mui/material';
import {
  Search,
  Refresh,
  School,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Cancel,
  Timer,
  EmojiEvents,
  MenuBook,
  Psychology,
  Speed,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  Assessment,
  Person,
  Category,
  SortByAlpha,
  AccessTime,
  Error,
  CheckCircleOutline,
  Storage,
  AutoAwesome,
  Translate,
  Article,
  Quiz,
  Tag as TagIcon,
  PlayArrow as PlayArrowIcon,
  FormatQuote as FormatQuoteIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { wordbankApi } from './wordbankApi';

// 排序类型 - 改为基于题目的排序
const SORT_TYPES = {
  ID_ASC: { field: 'id', order: 'asc', label: 'ID 升序', icon: <TagIcon /> },
  ID_DESC: { field: 'id', order: 'desc', label: 'ID 降序', icon: <TagIcon /> },
  NUMBER_ASC: { field: 'number', order: 'asc', label: '题号 升序', icon: <TagIcon /> },
  NUMBER_DESC: { field: 'number', order: 'desc', label: '题号 降序', icon: <TagIcon /> },
  GIVEN_WORD_ASC: { field: 'givenWord', order: 'asc', label: '原词 升序', icon: <AutoAwesome /> },
  GIVEN_WORD_DESC: { field: 'givenWord', order: 'desc', label: '原词 降序', icon: <AutoAwesome /> },
  CATEGORY_ASC: { field: 'category', order: 'asc', label: '分类 升序', icon: <Category /> },
  CATEGORY_DESC: { field: 'category', order: 'desc', label: '分类 降序', icon: <Category /> },
  DIFFICULTY_ASC: { field: 'difficulty', order: 'asc', label: '难度 低→高', icon: <Speed /> },
  DIFFICULTY_DESC: { field: 'difficulty', order: 'desc', label: '难度 高→低', icon: <Speed /> },
  EXTRACT_COUNT_ASC: { field: 'extractCount', order: 'asc', label: '练习次数 少→多', icon: <AccessTime /> },
  EXTRACT_COUNT_DESC: { field: 'extractCount', order: 'desc', label: '练习次数 多→少', icon: <AccessTime /> },
  RECENT_ACCURACY_ASC: { field: 'recentAccuracy', order: 'asc', label: '近期正确率 低→高', icon: <Error /> },
  RECENT_ACCURACY_DESC: { field: 'recentAccuracy', order: 'desc', label: '近期正确率 高→低', icon: <CheckCircleOutline /> },
  RECENT_MASTERY_ASC: { field: 'recentMastery', order: 'asc', label: '近期掌握度 低→高', icon: <TrendingUp /> },
  RECENT_MASTERY_DESC: { field: 'recentMastery', order: 'desc', label: '近期掌握度 高→低', icon: <TrendingDown /> },
  LAST_PRACTICED_ASC: { field: 'lastPracticed', order: 'asc', label: '上次练习 旧→新', icon: <AccessTime /> },
  LAST_PRACTICED_DESC: { field: 'lastPracticed', order: 'desc', label: '上次练习 新→旧', icon: <AccessTime /> }
};

const WordbankMasterView = ({ dataSource = '中考', onSelectQuestions }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterMastery, setFilterMastery] = useState('all');
  
  // 添加缺失的排序菜单状态
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const sortOpen = Boolean(sortAnchorEl);
  
  const [currentBankInfo, setCurrentBankInfo] = useState({
    name: '中考词汇变形',
    totalQuestions: 0
  });
  
  const [sortBy, setSortBy] = useState('NUMBER_ASC');
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 当前选中的题目（用于批量操作）
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // ========== 新增：基于最近历史记录的统计函数 ==========
  
  /**
   * 计算近期正确率（基于最近3次历史记录）
   */
  const calculateRecentAccuracy = (history, lookbackCount = 3) => {
    if (!history || history.length === 0) return 0;
    
    const recentHistory = history.slice(-lookbackCount);
    const correctCount = recentHistory.filter(h => h.result).length;
    return correctCount / recentHistory.length;
  };

  /**
   * 计算近期掌握程度（基于最近3次历史记录）
   */
  const calculateRecentMastery = (history) => {
    if (!history || history.length === 0) return 0;
    
    const recentHistory = history.slice(-3);
    const correctCount = recentHistory.filter(h => h.result).length;
    const totalCount = recentHistory.length;
    
    if (totalCount === 0) return 0;
    
    const recentAccuracy = correctCount / totalCount;
    
    // 时间衰减因子（越近的权重越高）
    let weightedScore = 0;
    recentHistory.forEach((record, index) => {
      const weight = (index + 1) / recentHistory.length; // 越近权重越高
      weightedScore += (record.result ? 1 : 0) * weight;
    });
    
    return Math.min(1, (recentAccuracy * 0.7 + weightedScore * 0.3));
  };

  /**
   * 判断题目是否需要复习（基于最近历史）
   */
  const isQuestionNeedReview = (history) => {
    if (!history || history.length === 0) return false;
    
    const recentHistory = history.slice(-3);
    const wrongCount = recentHistory.filter(h => !h.result).length;
    const wrongRate = wrongCount / recentHistory.length;
    
    // 动态阈值：历史记录不足时放宽标准
    let threshold = 0.5;
    if (recentHistory.length < 3) {
      threshold = 0.3; // 只有1-2次记录时，阈值降低到30%
    }
    
    // 最近一次是否错误
    const lastResult = recentHistory[recentHistory.length - 1]?.result;
    
    return wrongRate >= threshold || lastResult === false;
  };

  /**
   * 获取题目状态标签
   */
  const getQuestionStatus = (history) => {
    if (!history || history.length === 0) {
      return { label: '未练习', color: '#9e9e9e', chip: 'default', icon: <Timer /> };
    }
    
    const recentHistory = history.slice(-3);
    const correctCount = recentHistory.filter(h => h.result).length;
    const totalCount = recentHistory.length;
    
    if (totalCount === 0) return { label: '未练习', color: '#9e9e9e', chip: 'default', icon: <Timer /> };
    
    const recentAccuracy = correctCount / totalCount;
    const lastResult = recentHistory[recentHistory.length - 1]?.result;
    
    if (recentAccuracy === 0) {
      return { label: '持续错误', color: '#f44336', chip: 'error', icon: <Error /> };
    } else if (recentAccuracy < 0.5) {
      return { label: '薄弱', color: '#ff9800', chip: 'warning', icon: <Warning /> };
    } else if (recentAccuracy < 0.8) {
      return { label: '需巩固', color: '#2196f3', chip: 'info', icon: <Psychology /> };
    } else if (!lastResult) {
      return { label: '近期失误', color: '#ff9800', chip: 'warning', icon: <Warning /> };
    } else {
      return { label: '掌握', color: '#4caf50', chip: 'success', icon: <CheckCircle /> };
    }
  };

  /**
   * 获取近期趋势
   */
  const getRecentTrend = (history) => {
    if (!history || history.length < 2) return 'stable';
    
    const recentHistory = history.slice(-3);
    const results = recentHistory.map(h => h.result);
    
    // 检查是否持续进步
    if (results.length >= 3) {
      if (!results[0] && !results[1] && results[2]) return 'improving'; // 错错对
      if (results[0] && !results[1] && !results[2]) return 'declining'; // 对错错
    }
    
    // 检查最近两次
    if (results.length >= 2) {
      const lastTwo = results.slice(-2);
      if (lastTwo[0] === false && lastTwo[1] === true) return 'improving';
      if (lastTwo[0] === true && lastTwo[1] === false) return 'declining';
    }
    
    return 'stable';
  };

  useEffect(() => {
    loadData();
  }, [dataSource]);

  // 加载数据 - 使用新的 questions API
  const loadData = async () => {
    setLoading(true);
    try {
      console.log('开始加载题库数据，数据源:', dataSource);
      
      // 1️⃣ 获取所有题目（从题库文件）
      const questionsResponse = await wordbankApi.getQuestions({
        type: 'all',
        bank: dataSource
      });
      console.log('题目API响应:', questionsResponse);
      
      // 2️⃣ 获取用户学习情况（从统计文件）
      const reportResponse = await wordbankApi.getReport(dataSource);
      console.log('学习报告响应:', reportResponse);
      
      if (questionsResponse?.flag === 1) {
        // 修复：正确获取 questions 数组
        // 根据您的数据结构，题目可能在 content.questions 中
        const questions = questionsResponse.content?.questions || [];
        
        console.log('提取的题目数量:', questions.length);
        console.log('第一道题示例:', questions[0]);
        
        // 获取用户统计数据
        const userStats = reportResponse?.flag === 1 ? reportResponse.content : null;
        
        // 修复：正确获取统计信息
        // 根据后端返回的原始数据，统计信息在 metadata 和 questions 中
        const statsQuestions = userStats?.questions || {};
        const metadata = userStats?.metadata || {};
        
        console.log('用户统计文件原始数据:', userStats);
        console.log('统计题目数据:', statsQuestions);
        console.log('统计题目ID列表:', Object.keys(statsQuestions));
        
        // 合并数据：将用户学习情况合并到题目数据中，并添加近期统计
        const questionsWithStats = questions.map(question => {
          // 确保 question 有 id
          if (!question || !question.id) {
            console.warn('题目缺少ID:', question);
            return null;
          }
          
          const qStat = statsQuestions[question.id];
          const history = qStat?.history || [];
          
          // 计算近期统计
          const recentAccuracy = calculateRecentAccuracy(history);
          const recentMastery = calculateRecentMastery(history);
          const needReview = isQuestionNeedReview(history);
          const status = getQuestionStatus(history);
          const trend = getRecentTrend(history);
          
          return {
            ...question,
            // 题目级别的统计
            stats: qStat ? {
              extract_count: qStat.extract_count || 0,
              answer_count: qStat.answer_count || 0,
              correct_count: qStat.correct_count || 0,
              wrong_count: qStat.wrong_count || 0,
              accuracy: qStat.accuracy || 0,
              mastery_level: qStat.mastery_level || 0,
              last_practiced: qStat.last_practiced || null,
              first_seen: qStat.first_seen || null,
              history: history
            } : {
              extract_count: 0,
              answer_count: 0,
              correct_count: 0,
              wrong_count: 0,
              accuracy: 0,
              mastery_level: 0,
              last_practiced: null,
              first_seen: null,
              history: []
            },
            // 新增：基于最近历史的统计
            recentStats: {
              accuracy: recentAccuracy,
              mastery: recentMastery,
              needReview: needReview,
              status: status,
              trend: trend,
              historyCount: history.length
            }
          };
        }).filter(q => q !== null); // 过滤掉无效的题目

        console.log('合并后的题目数据（含近期统计）:', questionsWithStats.map(q => ({
          id: q.id,
          givenWord: q.givenWord,
          extract_count: q.stats.extract_count,
          recentAccuracy: q.recentStats.accuracy,
          recentMastery: q.recentStats.mastery,
          needReview: q.recentStats.needReview
        })));

        // 计算近期总体统计
        const questionsWithHistory = questionsWithStats.filter(q => q.stats.history.length > 0);
        const totalRecentAttempts = questionsWithHistory.reduce((sum, q) => sum + Math.min(q.stats.history.length, 3), 0);
        const totalRecentCorrect = questionsWithHistory.reduce((sum, q) => {
          const recentHistory = q.stats.history.slice(-3);
          return sum + recentHistory.filter(h => h.result).length;
        }, 0);
        
        const recentAccuracy = totalRecentAttempts > 0 ? totalRecentCorrect / totalRecentAttempts : 0;
        const needReviewCount = questionsWithStats.filter(q => q.recentStats.needReview).length;

        setData({
          questions: questionsWithStats,
          metadata: {
            totalQuestions: questionsWithStats.length,
            totalExtracts: metadata?.totalExtracts || 0,
            totalAttempts: metadata?.totalQuestionsAttempted || 0,
            accuracy: metadata?.totalQuestionsAttempted > 0 ? metadata?.totalCorrect / metadata?.totalQuestionsAttempted : 0,
            username: metadata?.username || '用户',
            // 新增：近期统计
            recentStats: {
              totalAttempts: totalRecentAttempts,
              totalCorrect: totalRecentCorrect,
              accuracy: recentAccuracy,
              needReviewCount: needReviewCount,
              practicedRecently: questionsWithHistory.length
            }
          }
        });
        
        setCurrentBankInfo({
          name: dataSource === '中考' ? '中考词汇变形' : dataSource,
          totalQuestions: questionsWithStats.length
        });
        
        setSnackbar({
          open: true,
          message: `加载成功，共 ${questionsWithStats.length} 道题目，${needReviewCount} 道需复习`,
          severity: 'success'
        });
      } else {
        setSnackbar({ open: true, message: questionsResponse?.message || '加载失败', severity: 'error' });
      }
    } catch (error) {
      console.error('加载失败:', error);
      setSnackbar({ open: true, message: '网络错误', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (difficulty) => {
    const map = {
      1: { label: '1级 · 入门', color: 'success' },
      2: { label: '2级 · 基础', color: 'info' },
      3: { label: '3级 · 中等', color: 'warning' },
      4: { label: '4级 · 困难', color: 'error' },
      5: { label: '5级 · 挑战', color: 'error' }
    };
    return map[difficulty] || { label: `${difficulty}级`, color: 'default' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '从未';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch {
      return '从未';
    }
  };

  const questions = data?.questions || [];
  
  // 获取分类列表
  const getCategories = () => {
    const categories = new Set();
    questions.forEach(q => {
      if (q.source?.category) {
        categories.add(q.source.category);
      }
    });
    return Array.from(categories);
  };

  // 过滤题目（基于近期统计）
  const filteredQuestions = questions.filter(q => {
    if (!q) return false;
    
    const matchesSearch = searchTerm === '' || 
      q.sentence?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.givenWord?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || q.source?.category === filterCategory;

    const matchesDifficulty = filterDifficulty === 'all' || 
      q.source?.difficulty === parseInt(filterDifficulty);

    // 基于近期掌握的筛选
    const recentMastery = q.recentStats?.mastery || 0;
    const matchesMastery = 
      filterMastery === 'all' ||
      (filterMastery === 'never' && q.stats.history.length === 0) ||
      (filterMastery === 'weak' && recentMastery > 0 && recentMastery < 0.5) ||
      (filterMastery === 'review' && recentMastery >= 0.5 && recentMastery < 0.8) ||
      (filterMastery === 'mastered' && recentMastery >= 0.8);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesMastery;
  });

  // 排序函数（基于近期统计）
  const sortQuestions = (list) => {
    if (!list.length) return [];
    
    const config = SORT_TYPES[sortBy];
    if (!config) return list;
    
    return [...list].sort((a, b) => {
      let aVal, bVal;
      
      switch (config.field) {
        case 'id':
          aVal = a.id || '';
          bVal = b.id || '';
          break;
        case 'number':
          aVal = a.number || 0;
          bVal = b.number || 0;
          break;
        case 'givenWord':
          aVal = a.givenWord || '';
          bVal = b.givenWord || '';
          break;
        case 'category':
          aVal = a.source?.category || '';
          bVal = b.source?.category || '';
          break;
        case 'difficulty':
          aVal = a.source?.difficulty || 0;
          bVal = b.source?.difficulty || 0;
          break;
        case 'extractCount':
          aVal = a.stats?.extract_count || 0;
          bVal = b.stats?.extract_count || 0;
          break;
        case 'recentAccuracy':
          aVal = a.recentStats?.accuracy || 0;
          bVal = b.recentStats?.accuracy || 0;
          break;
        case 'recentMastery':
          aVal = a.recentStats?.mastery || 0;
          bVal = b.recentStats?.mastery || 0;
          break;
        case 'lastPracticed':
          aVal = a.stats?.last_practiced ? new Date(a.stats.last_practiced).getTime() : 0;
          bVal = b.stats?.last_practiced ? new Date(b.stats.last_practiced).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return config.order === 'asc' ? comparison : -comparison;
      }
      
      if (aVal < bVal) return config.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedQuestions = sortQuestions(filteredQuestions);
  const paginatedQuestions = sortedQuestions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleHeaderSort = (field) => {
    const currentSort = sortBy;
    let newSortKey = '';
    
    if (currentSort === `${field}_ASC`) {
      newSortKey = `${field}_DESC`;
    } else if (currentSort === `${field}_DESC`) {
      newSortKey = `${field}_ASC`;
    } else {
      newSortKey = `${field}_ASC`;
    }
    
    if (SORT_TYPES[newSortKey]) {
      setSortBy(newSortKey);
      setPage(0);
    }
  };

  // 处理选择题目进行练习
  const handleSelectQuestion = (question) => {
    console.log('选择题目:', question.id);
    if (onSelectQuestions) {
      onSelectQuestions([question]); // 传入单个题目
    }
  };

  // 处理批量选择
  const handleSelectMultiple = (selectedQuestions) => {
    if (onSelectQuestions) {
      onSelectQuestions(selectedQuestions);
    }
  };

  const handleToggleSelect = (question) => {
    setSelectedQuestions(prev => {
      if (prev.find(q => q.id === question.id)) {
        return prev.filter(q => q.id !== question.id);
      } else {
        return [...prev, question];
      }
    });
  };

  // 获取趋势图标
  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving':
        return <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />;
      case 'declining':
        return <TrendingDown sx={{ color: '#f44336', fontSize: 16 }} />;
      default:
        return <AccessTime sx={{ color: '#9e9e9e', fontSize: 16 }} />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 标题区域 */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#1a237e', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#ffd700' }}>
              <Storage sx={{ color: '#1a237e' }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {currentBankInfo.name} · 题库
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#bbdefb' }}>
                {currentBankInfo.totalQuestions} 道题目
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {selectedQuestions.length > 0 && (
              <Button
                variant="contained"
                color="success"
                onClick={() => handleSelectMultiple(selectedQuestions)}
                startIcon={<PlayArrowIcon />}
                sx={{ bgcolor: '#4caf50' }}
              >
                练习所选 ({selectedQuestions.length})
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadData}
              disabled={loading}
              sx={{ bgcolor: 'white', color: '#1a237e', '&:hover': { bgcolor: '#e3f2fd' } }}
            >
              {loading ? '加载中...' : '刷新'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* 统计卡片 - 新增近期统计 */}
      {data && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{data.metadata.totalQuestions}</Typography>
                <Typography color="text.secondary">总题数</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{data.metadata.totalExtracts}</Typography>
                <Typography color="text.secondary">总练习次数</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{data.metadata.totalAttempts}</Typography>
                <Typography color="text.secondary">答题总次数</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{Math.round(data.metadata.accuracy * 100)}%</Typography>
                <Typography color="text.secondary">历史正确率</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={data.metadata.accuracy * 100} 
                  sx={{ mt: 1, height: 8, borderRadius: 4 }} 
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* 新增：近期统计卡片 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HistoryIcon color="primary" />
                近期学习情况（最近3次练习）
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="primary">
                      {data.metadata.recentStats.practicedRecently}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      近期练习题数
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="primary">
                      {data.metadata.recentStats.totalAttempts}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      近期练习次数
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="primary">
                      {Math.round(data.metadata.recentStats.accuracy * 100)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      近期正确率
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.metadata.recentStats.accuracy * 100} 
                      sx={{ mt: 1, height: 6, borderRadius: 3 }} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="warning.main">
                      {data.metadata.recentStats.needReviewCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      需复习题目
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* 筛选和排序栏 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="搜索句子、原词或ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')}><Clear /></IconButton>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="分类"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">全部分类</option>
              {getCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="难度"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">全部难度</option>
              <option value="1">1级</option>
              <option value="2">2级</option>
              <option value="3">3级</option>
              <option value="4">4级</option>
              <option value="5">5级</option>
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="近期掌握程度"
              value={filterMastery}
              onChange={(e) => setFilterMastery(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">全部</option>
              <option value="never">未练习</option>
              <option value="weak">薄弱 (&lt;50%)</option>
              <option value="review">需巩固 (50%-80%)</option>
              <option value="mastered">掌握 (&gt;80%)</option>
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={(e) => setSortAnchorEl(e.currentTarget)}
              startIcon={<SortByAlpha />}
              endIcon={<ExpandMore />}
              sx={{ height: '40px' }}
            >
              {SORT_TYPES[sortBy]?.label || '排序'}
            </Button>
            <Menu
              anchorEl={sortAnchorEl}
              open={sortOpen}
              onClose={() => setSortAnchorEl(null)}
            >
              {Object.entries(SORT_TYPES).map(([key, config]) => (
                <MenuItem 
                  key={key} 
                  onClick={() => {
                    setSortBy(key);
                    setPage(0);
                    setSortAnchorEl(null);
                  }}
                  selected={sortBy === key}
                >
                  <ListItemIcon>{config.icon}</ListItemIcon>
                  <ListItemText primary={config.label} />
                </MenuItem>
              ))}
            </Menu>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            共 {sortedQuestions.length} 道题目
            {filterMastery !== 'all' && ` · 近期掌握度: ${filterMastery}`}
            {sortBy !== 'NUMBER_ASC' && ` · 当前排序: ${SORT_TYPES[sortBy]?.label}`}
          </Typography>
          {(filterCategory !== 'all' || filterDifficulty !== 'all' || filterMastery !== 'all' || searchTerm !== '') && (
            <Button 
              size="small" 
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterDifficulty('all');
                setFilterMastery('all');
              }}
            >
              清除筛选
            </Button>
          )}
        </Box>
      </Paper>

      {/* 题目列表 */}
      <Paper>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < paginatedQuestions.length}
                    checked={paginatedQuestions.length > 0 && selectedQuestions.length === paginatedQuestions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuestions(paginatedQuestions);
                      } else {
                        setSelectedQuestions([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={sortBy === 'NUMBER_ASC' || sortBy === 'NUMBER_DESC'} 
                    direction={sortBy === 'NUMBER_ASC' ? 'asc' : sortBy === 'NUMBER_DESC' ? 'desc' : 'asc'} 
                    onClick={() => handleHeaderSort('NUMBER')}
                  >
                    题号
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={sortBy === 'GIVEN_WORD_ASC' || sortBy === 'GIVEN_WORD_DESC'} 
                    direction={sortBy === 'GIVEN_WORD_ASC' ? 'asc' : sortBy === 'GIVEN_WORD_DESC' ? 'desc' : 'asc'} 
                    onClick={() => handleHeaderSort('GIVEN_WORD')}
                  >
                    原词
                  </TableSortLabel>
                </TableCell>
                <TableCell>句子</TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={sortBy === 'CATEGORY_ASC' || sortBy === 'CATEGORY_DESC'} 
                    direction={sortBy === 'CATEGORY_ASC' ? 'asc' : sortBy === 'CATEGORY_DESC' ? 'desc' : 'asc'} 
                    onClick={() => handleHeaderSort('CATEGORY')}
                  >
                    分类
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={sortBy === 'DIFFICULTY_ASC' || sortBy === 'DIFFICULTY_DESC'} 
                    direction={sortBy === 'DIFFICULTY_ASC' ? 'asc' : sortBy === 'DIFFICULTY_DESC' ? 'desc' : 'asc'} 
                    onClick={() => handleHeaderSort('DIFFICULTY')}
                  >
                    难度
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={sortBy === 'EXTRACT_COUNT_ASC' || sortBy === 'EXTRACT_COUNT_DESC'} 
                    direction={sortBy === 'EXTRACT_COUNT_ASC' ? 'asc' : sortBy === 'EXTRACT_COUNT_DESC' ? 'desc' : 'asc'} 
                    onClick={() => handleHeaderSort('EXTRACT_COUNT')}
                  >
                    练习次数
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={sortBy === 'RECENT_ACCURACY_ASC' || sortBy === 'RECENT_ACCURACY_DESC'} 
                    direction={sortBy === 'RECENT_ACCURACY_ASC' ? 'asc' : sortBy === 'RECENT_ACCURACY_DESC' ? 'desc' : 'asc'} 
                    onClick={() => handleHeaderSort('RECENT_ACCURACY')}
                  >
                    近期正确率
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={sortBy === 'RECENT_MASTERY_ASC' || sortBy === 'RECENT_MASTERY_DESC'} 
                    direction={sortBy === 'RECENT_MASTERY_ASC' ? 'asc' : sortBy === 'RECENT_MASTERY_DESC' ? 'desc' : 'asc'} 
                    onClick={() => handleHeaderSort('RECENT_MASTERY')}
                  >
                    近期掌握度
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel 
                    active={sortBy === 'LAST_PRACTICED_ASC' || sortBy === 'LAST_PRACTICED_DESC'} 
                    direction={sortBy === 'LAST_PRACTICED_ASC' ? 'asc' : sortBy === 'LAST_PRACTICED_DESC' ? 'desc' : 'asc'} 
                    onClick={() => handleHeaderSort('LAST_PRACTICED')}
                  >
                    上次练习
                  </TableSortLabel>
                </TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedQuestions.map((question) => {
                const difficulty = getDifficultyLabel(question.source?.difficulty);
                const status = question.recentStats?.status || { label: '未练习', color: '#9e9e9e', chip: 'default', icon: <Timer /> };
                const recentAccuracy = question.recentStats?.accuracy || 0;
                const recentMastery = question.recentStats?.mastery || 0;
                const extractCount = question.stats?.extract_count || 0;
                const lastPracticed = question.stats?.last_practiced;
                const trend = question.recentStats?.trend || 'stable';
                const needReview = question.recentStats?.needReview || false;
                
                const isSelected = selectedQuestions.some(q => q.id === question.id);
                
                return (
                  <React.Fragment key={question.id}>
                    <TableRow 
                      hover
                      sx={{ 
                        bgcolor: expandedQuestion === question.id ? '#e3f2fd' : needReview ? alpha('#ff9800', 0.05) : 'inherit',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSelect(question)}
                        />
                      </TableCell>
                      <TableCell onClick={() => handleSelectQuestion(question)} sx={{ cursor: 'pointer' }}>
                        <Chip 
                          label={question.number} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell onClick={() => handleSelectQuestion(question)} sx={{ cursor: 'pointer' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AutoAwesome sx={{ fontSize: 16, color: '#1a237e' }} />
                          <Typography variant="body2" fontWeight="bold">
                            {question.givenWord}
                          </Typography>
                          {trend !== 'stable' && getTrendIcon(trend)}
                        </Box>
                      </TableCell>
                      <TableCell onClick={() => handleSelectQuestion(question)} sx={{ maxWidth: 300, cursor: 'pointer' }}>
                        <Tooltip title={question.sentence}>
                          <Typography noWrap variant="body2">
                            {question.sentence}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell onClick={() => handleSelectQuestion(question)} sx={{ cursor: 'pointer' }}>
                        <Chip label={question.source?.category || '未分类'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell onClick={() => handleSelectQuestion(question)} sx={{ cursor: 'pointer' }}>
                        <Chip 
                          label={difficulty.label} 
                          size="small" 
                          color={difficulty.color} 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell onClick={() => handleSelectQuestion(question)} sx={{ cursor: 'pointer' }}>
                        <Badge badgeContent={extractCount} color="secondary" max={999}>
                          <Timer fontSize="small" />
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => handleSelectQuestion(question)} sx={{ cursor: 'pointer' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ 
                            color: recentAccuracy >= 0.7 ? 'success.main' : recentAccuracy >= 0.4 ? 'warning.main' : recentAccuracy > 0 ? 'error.main' : 'text.secondary',
                            fontWeight: 500
                          }}>
                            {recentAccuracy > 0 ? `${Math.round(recentAccuracy * 100)}%` : '-'}
                          </Typography>
                          {recentAccuracy > 0 && (
                            <Chip 
                              size="small"
                              label={`${question.stats.history.slice(-3).length}次`}
                              variant="outlined"
                              sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.625rem' } }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell onClick={() => handleSelectQuestion(question)} sx={{ cursor: 'pointer' }}>
                        <Box sx={{ minWidth: 100 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip 
                              icon={status.icon}
                              label={status.label} 
                              size="small" 
                              color={status.chip} 
                              variant={question.stats.history.length === 0 ? 'outlined' : 'filled'}
                            />
                            <Typography variant="caption">
                              {Math.round(recentMastery * 100)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={recentMastery * 100} 
                            sx={{ 
                              height: 4, 
                              borderRadius: 2,
                              bgcolor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: status.color
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell onClick={() => handleSelectQuestion(question)} sx={{ cursor: 'pointer' }}>
                        <Tooltip title={formatDate(lastPracticed)}>
                          <Typography variant="caption">
                            {lastPracticed ? formatDate(lastPracticed) : '从未'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="开始练习">
                            <IconButton 
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectQuestion(question);
                              }}
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedQuestion(expandedQuestion === question.id ? null : question.id);
                            }}
                          >
                            {expandedQuestion === question.id ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* 展开的题目详情 */}
                    {expandedQuestion === question.id && (
                      <TableRow>
                        <TableCell colSpan={11} sx={{ pb: 0, pt: 0 }}>
                          <Collapse in={true}>
                            <Box sx={{ p: 3, bgcolor: '#fafafa' }}>
                              <Grid container spacing={3}>
                                {/* 题目详情 */}
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" gutterBottom>题目详情</Typography>
                                  <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="body1" paragraph>
                                      {question.sentence}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                                      <Chip 
                                        icon={<AutoAwesome />}
                                        label={`原词: ${question.givenWord}`}
                                        variant="outlined"
                                      />
                                      <Chip 
                                        icon={<CheckCircle />}
                                        label={`正确答案: ${question.correctForm}`}
                                        color="success"
                                        variant="outlined"
                                      />
                                    </Box>
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                      <Typography variant="body2">
                                        <strong>解析：</strong> {question.explanation || '暂无解析'}
                                      </Typography>
                                    </Alert>
                                  </Paper>
                                </Grid>

                                {/* 近期统计 */}
                                {question.stats?.history && question.stats.history.length > 0 && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>近期表现</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                      <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h6" color="primary">
                                              {Math.round(recentAccuracy * 100)}%
                                            </Typography>
                                            <Typography variant="caption">近期正确率</Typography>
                                          </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h6" color="primary">
                                              {Math.round(recentMastery * 100)}%
                                            </Typography>
                                            <Typography variant="caption">近期掌握度</Typography>
                                          </Box>
                                        </Grid>
                                      </Grid>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={recentMastery * 100} 
                                        sx={{ mt: 2, height: 8, borderRadius: 4 }} 
                                      />
                                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                        <Chip 
                                          icon={status.icon}
                                          label={`状态: ${status.label}`}
                                          color={status.chip}
                                        />
                                      </Box>
                                    </Paper>
                                  </Grid>
                                )}

                                {/* 答题历史 */}
                                {question.stats?.history && question.stats.history.length > 0 && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>答题历史（最近3次）</Typography>
                                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                                      {question.stats.history.slice(-3).reverse().map((h, idx) => (
                                        <Box key={idx} sx={{ 
                                          display: 'flex', 
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          py: 0.5,
                                          borderBottom: idx < Math.min(question.stats.history.length, 3) - 1 ? '1px solid #eee' : 'none'
                                        }}>
                                          <Typography variant="caption">
                                            {formatDate(h.date)}
                                          </Typography>
                                          <Chip 
                                            label={h.result ? '正确' : '错误'}
                                            size="small"
                                            color={h.result ? 'success' : 'error'}
                                            icon={h.result ? <CheckCircle /> : <Cancel />}
                                          />
                                          {h.time && (
                                            <Typography variant="caption" color="text.secondary">
                                              {h.time}秒
                                            </Typography>
                                          )}
                                          {h.userAnswer && !h.result && (
                                            <Typography variant="caption" color="error">
                                              答: "{h.userAnswer}"
                                            </Typography>
                                          )}
                                        </Box>
                                      ))}
                                    </Paper>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={sortedQuestions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* 浮动刷新按钮 */}
      <Zoom in={true}>
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={loadData}
          disabled={loading}
        >
          <Refresh />
        </Fab>
      </Zoom>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default WordbankMasterView;