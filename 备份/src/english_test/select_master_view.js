// src/pages/QuestionMasterView.jsx
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
  Stack,
  Collapse,
  Fab,
  Zoom,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select
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
  Star,
  StarBorder,
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
  Storage
} from '@mui/icons-material';
import { questionApi } from './api';

// 排序类型
const SORT_TYPES = {
  ID_ASC: { field: 'id', order: 'asc', label: 'ID 升序', icon: <SortByAlpha /> },
  ID_DESC: { field: 'id', order: 'desc', label: 'ID 降序', icon: <SortByAlpha /> },
  MASTERY_ASC: { field: 'mastery', order: 'asc', label: '掌握程度 低→高', icon: <TrendingUp /> },
  MASTERY_DESC: { field: 'mastery', order: 'desc', label: '掌握程度 高→低', icon: <TrendingDown /> },
  ATTEMPTS_ASC: { field: 'attempts', order: 'asc', label: '练习次数 少→多', icon: <AccessTime /> },
  ATTEMPTS_DESC: { field: 'attempts', order: 'desc', label: '练习次数 多→少', icon: <AccessTime /> },
  CORRECT_RATE_ASC: { field: 'correctRate', order: 'asc', label: '正确率 低→高', icon: <Error /> },
  CORRECT_RATE_DESC: { field: 'correctRate', order: 'desc', label: '正确率 高→低', icon: <CheckCircleOutline /> },
  WRONG_RATE_ASC: { field: 'wrongRate', order: 'asc', label: '错误率 低→高', icon: <CheckCircleOutline /> },
  WRONG_RATE_DESC: { field: 'wrongRate', order: 'desc', label: '错误率 高→低', icon: <Error /> },
  CATEGORY_ASC: { field: 'category', order: 'asc', label: '分类 升序', icon: <Category /> },
  CATEGORY_DESC: { field: 'category', order: 'desc', label: '分类 降序', icon: <Category /> },
  DIFFICULTY_ASC: { field: 'difficulty', order: 'asc', label: '难度 低→高 (1→5)', icon: <Speed /> },
  DIFFICULTY_DESC: { field: 'difficulty', order: 'desc', label: '难度 高→低 (5→1)', icon: <Speed /> },
  LAST_EXTRACTED_ASC: { field: 'last_extracted', order: 'asc', label: '上次练习 旧→新', icon: <AccessTime /> },
  LAST_EXTRACTED_DESC: { field: 'last_extracted', order: 'desc', label: '上次练习 新→旧', icon: <AccessTime /> }
};

const QuestionMasterView = ({ dataSource = 'default' }) => {
  // 状态管理
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterMastery, setFilterMastery] = useState('all');
  
  // 题库列表状态
  const [dataSources, setDataSources] = useState([]);
  const [currentBankInfo, setCurrentBankInfo] = useState({
    id: 'default',
    name: '默认题库',
    totalQuestions: 0
  });
  
  // 排序状态
  const [sortBy, setSortBy] = useState('ID_ASC');
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const sortOpen = Boolean(sortAnchorEl);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 获取题库列表
  useEffect(() => {
    fetchBanks();
  }, []);

  // 监听数据源变化
  useEffect(() => {
    loadData();
  }, [dataSource]);

  // 获取题库列表
  const fetchBanks = async () => {
    try {
      const response = await questionApi.getBanks();
      if (response && response.flag === 1) {
        setDataSources(response.content.banks || []);
      }
    } catch (error) {
      console.error('获取题库列表失败:', error);
    }
  };

  // 获取数据源名称
  const getDataSourceName = (bankId) => {
    const bank = dataSources.find(s => s.id === bankId) || 
                 dataSources.find(s => s.key === bankId) || 
                 { name: bankId };
    return bank.name || bankId;
  };

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      console.log('开始加载数据，数据源:', dataSource);
      const response = await questionApi.getMasterQuestions(dataSource);
      console.log('API响应:', response);
      
      if (response && response.flag === 1) {
        console.log('数据内容:', response.content);
        setData(response.content);
        
        // 更新当前题库信息
        setCurrentBankInfo({
          id: dataSource,
          name: getDataSourceName(dataSource),
          totalQuestions: response.content.metadata?.totalQuestions || 0
        });
        
        setSnackbar({
          open: true,
          message: `加载成功，共 ${response.content.questions?.length || 0} 题`,
          severity: 'success'
        });
        
        // 重置分页
        setPage(0);
      } else {
        console.error('加载失败:', response?.message);
        setSnackbar({
          open: true,
          message: response?.message || '加载失败',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('加载异常:', error);
      setSnackbar({
        open: true,
        message: '网络错误，请稍后重试',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 计算正确率的辅助函数
  const calculateAccuracy = (stats) => {
    if (!stats) return 0;
    const total = (stats.correct_count || 0) + (stats.wrong_count || 0);
    if (total === 0) return 0;
    return (stats.correct_count || 0) / total;
  };

  // 计算错误率的辅助函数
  const calculateWrongRate = (stats) => {
    if (!stats) return 0;
    const total = (stats.correct_count || 0) + (stats.wrong_count || 0);
    if (total === 0) return 0;
    return (stats.wrong_count || 0) / total;
  };

  // 获取难度标签（1-5级转文字）
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

  // 排序函数
// 排序函数
const sortQuestions = (questions) => {
  if (!questions || questions.length === 0) return [];
  
  const sortConfig = SORT_TYPES[sortBy];
  if (!sortConfig) return questions;
  
  return [...questions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortConfig.field) {
      case 'id':
        // 提取ID中的数字部分（第一个下划线前的数字）
        const aNum = parseInt(a.id?.split('_')[0] || '0');
        const bNum = parseInt(b.id?.split('_')[0] || '0');
        aValue = aNum;
        bValue = bNum;
        break;
      case 'mastery':
        aValue = a.stats?.mastery_level || 0;
        bValue = b.stats?.mastery_level || 0;
        break;
      case 'attempts':
        aValue = (a.stats?.correct_count || 0) + (a.stats?.wrong_count || 0);
        bValue = (b.stats?.correct_count || 0) + (b.stats?.wrong_count || 0);
        break;
      case 'correctRate': {
        const aTotal = (a.stats?.correct_count || 0) + (a.stats?.wrong_count || 0);
        const bTotal = (b.stats?.correct_count || 0) + (b.stats?.wrong_count || 0);
        aValue = aTotal > 0 ? (a.stats?.correct_count || 0) / aTotal : -1;
        bValue = bTotal > 0 ? (b.stats?.correct_count || 0) / bTotal : -1;
        break;
      }
      case 'wrongRate': {
        const aTotal = (a.stats?.correct_count || 0) + (a.stats?.wrong_count || 0);
        const bTotal = (b.stats?.correct_count || 0) + (b.stats?.wrong_count || 0);
        aValue = aTotal > 0 ? (a.stats?.wrong_count || 0) / aTotal : -1;
        bValue = bTotal > 0 ? (b.stats?.wrong_count || 0) / bTotal : -1;
        break;
      }
      case 'category':
        aValue = a.category || '';
        bValue = b.category || '';
        break;
      case 'difficulty':
        aValue = a.difficulty || 0;
        bValue = b.difficulty || 0;
        break;
      case 'last_extracted':
        aValue = a.stats?.last_extracted ? new Date(a.stats.last_extracted).getTime() : 0;
        bValue = b.stats?.last_extracted ? new Date(b.stats.last_extracted).getTime() : 0;
        break;
      default:
        return 0;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.order === 'asc' ? comparison : -comparison;
    }
    
    if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
    return 0;
  });
};

  // 安全检查：确保data和questions存在
  const questions = data?.questions || [];
  
  // 先过滤，后排序
  const filteredQuestions = questions.filter(q => {
    if (!q) return false;
    
    // 搜索过滤
    const matchesSearch = searchTerm === '' || 
      (q.question && q.question.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.category && q.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.id && q.id.toLowerCase().includes(searchTerm.toLowerCase()));

    // 分类过滤
    const matchesCategory = filterCategory === 'all' || q.category === filterCategory;

    // 难度过滤（1-5级）
    const matchesDifficulty = filterDifficulty === 'all' || 
      (filterDifficulty === '1' && q.difficulty === 1) ||
      (filterDifficulty === '2' && q.difficulty === 2) ||
      (filterDifficulty === '3' && q.difficulty === 3) ||
      (filterDifficulty === '4' && q.difficulty === 4) ||
      (filterDifficulty === '5' && q.difficulty === 5);

    // 掌握程度过滤
    const mastery = q.stats?.mastery_level || 0;
    const matchesMastery = 
      filterMastery === 'all' ||
      (filterMastery === 'never' && mastery === 0) ||
      (filterMastery === 'weak' && mastery > 0 && mastery < 0.5) ||
      (filterMastery === 'review' && mastery >= 0.5 && mastery < 0.8) ||
      (filterMastery === 'mastered' && mastery >= 0.8);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesMastery;
  });

  // 应用排序
  const sortedQuestions = sortQuestions(filteredQuestions);

  // 分页
  const paginatedQuestions = sortedQuestions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 获取掌握程度标签和颜色
  const getMasteryInfo = (mastery) => {
    if (mastery === undefined || mastery === null) return { label: '未知', color: '#9e9e9e', chip: 'default' };
    if (mastery === 0) return { label: '未练习', color: '#9e9e9e', chip: 'default' };
    if (mastery < 0.5) return { label: '薄弱', color: '#f44336', chip: 'error' };
    if (mastery < 0.8) return { label: '需复习', color: '#ff9800', chip: 'warning' };
    return { label: '掌握', color: '#4caf50', chip: 'success' };
  };

  // 格式化时间
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
    } catch (e) {
      return '无效日期';
    }
  };

  // 获取分类列表
  const getCategories = () => {
    if (!questions.length) return [];
    const categories = new Set(questions.map(q => q.category).filter(Boolean));
    return Array.from(categories);
  };

  // 处理排序点击
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (sortKey) => {
    setSortBy(sortKey);
    setPage(0);
    handleSortClose();
  };

  // 获取当前排序显示文本
  const getCurrentSortLabel = () => {
    return SORT_TYPES[sortBy]?.label || '排序';
  };

  // 处理表头排序点击
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 标题区域 - 显示当前题库 */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#1a237e', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#ffd700' }}>
              <Storage sx={{ color: '#1a237e' }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {currentBankInfo.name}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#bbdefb' }}>
                题库查看 · 共 {currentBankInfo.totalQuestions} 题
              </Typography>
            </Box>
          </Box>
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
      </Paper>

      {/* 加载中状态 */}
      {loading && !data && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>正在加载 {currentBankInfo.name}...</Typography>
        </Paper>
      )}

      {/* 统计卡片 */}
      {data && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}>
                    <MenuBook />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">{data.metadata?.totalQuestions || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">总题数</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`1级 ${data.difficultySummary?.easy?.total || 0}`} size="small" color="success" variant="outlined" />
                  <Chip label={`2级 ${data.difficultySummary?.medium?.total || 0}`} size="small" color="info" variant="outlined" />
                  <Chip label={`3级 ${data.difficultySummary?.hard?.total || 0}`} size="small" color="warning" variant="outlined" />
                  <Chip label={`4级 ${data.difficultySummary?.hard?.total || 0}`} size="small" color="error" variant="outlined" />
                  <Chip label={`5级 ${data.difficultySummary?.hard?.total || 0}`} size="small" color="error" variant="outlined" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">{data.metadata?.totalAttempts || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">总练习次数</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">正确率: {Math.round((data.metadata?.accuracy || 0) * 100)}%</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(data.metadata?.accuracy || 0) * 100} 
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#fff3e0', color: '#ed6c02' }}>
                    <Psychology />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">{data.stats?.mastered || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">已掌握</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Chip label={`薄弱 ${data.stats?.weak || 0}`} size="small" color="error" />
                  <Chip label={`复习 ${data.stats?.review || 0}`} size="small" color="warning" />
                  <Chip label={`未练 ${data.stats?.never || 0}`} size="small" variant="outlined" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#e8eaf6', color: '#3f51b5' }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="body1" noWrap>{data.metadata?.username || '未知'}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      上次: {formatDate(data.metadata?.lastActive)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    注册: {formatDate(data.metadata?.createdAt)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 筛选和排序栏 */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="搜索题目、分类或ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
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
              disabled={!data}
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
              <option value="1">1级 · 入门</option>
              <option value="2">2级 · 基础</option>
              <option value="3">3级 · 中等</option>
              <option value="4">4级 · 困难</option>
              <option value="5">5级 · 挑战</option>
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="掌握程度"
              value={filterMastery}
              onChange={(e) => setFilterMastery(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">全部</option>
              <option value="never">未练习</option>
              <option value="weak">薄弱 (&lt;50%)</option>
              <option value="review">需复习 (50%-80%)</option>
              <option value="mastered">掌握 (&gt;80%)</option>
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSortClick}
              startIcon={<SortByAlpha />}
              endIcon={<ExpandMore />}
              sx={{ height: '40px' }}
            >
              {getCurrentSortLabel()}
            </Button>
            <Menu
              anchorEl={sortAnchorEl}
              open={sortOpen}
              onClose={handleSortClose}
              PaperProps={{
                sx: { maxHeight: 400, width: '250px' }
              }}
            >
              {Object.entries(SORT_TYPES).map(([key, config]) => (
                <MenuItem 
                  key={key} 
                  onClick={() => handleSortSelect(key)}
                  selected={sortBy === key}
                >
                  <ListItemIcon>
                    {config.icon}
                  </ListItemIcon>
                  <ListItemText primary={config.label} />
                  {sortBy === key && (
                    <CheckCircle color="primary" sx={{ ml: 1, fontSize: 18 }} />
                  )}
                </MenuItem>
              ))}
            </Menu>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {currentBankInfo.name} · 共 {sortedQuestions.length} 题 / 总 {questions.length} 题
            {sortBy !== 'ID_ASC' && ` · 当前排序: ${getCurrentSortLabel()}`}
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
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'ID_ASC' || sortBy === 'ID_DESC'}
                    direction={sortBy === 'ID_ASC' ? 'asc' : sortBy === 'ID_DESC' ? 'desc' : 'asc'}
                    onClick={() => handleHeaderSort('ID')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>题目</TableCell>
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
                    active={sortBy === 'ATTEMPTS_ASC' || sortBy === 'ATTEMPTS_DESC'}
                    direction={sortBy === 'ATTEMPTS_ASC' ? 'asc' : sortBy === 'ATTEMPTS_DESC' ? 'desc' : 'asc'}
                    onClick={() => handleHeaderSort('ATTEMPTS')}
                  >
                    练习次数
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'CORRECT_RATE_ASC' || sortBy === 'CORRECT_RATE_DESC'}
                    direction={sortBy === 'CORRECT_RATE_ASC' ? 'asc' : sortBy === 'CORRECT_RATE_DESC' ? 'desc' : 'asc'}
                    onClick={() => handleHeaderSort('CORRECT_RATE')}
                  >
                    正确率
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'WRONG_RATE_ASC' || sortBy === 'WRONG_RATE_DESC'}
                    direction={sortBy === 'WRONG_RATE_ASC' ? 'asc' : sortBy === 'WRONG_RATE_DESC' ? 'desc' : 'asc'}
                    onClick={() => handleHeaderSort('WRONG_RATE')}
                  >
                    错误率
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'MASTERY_ASC' || sortBy === 'MASTERY_DESC'}
                    direction={sortBy === 'MASTERY_ASC' ? 'asc' : sortBy === 'MASTERY_DESC' ? 'desc' : 'asc'}
                    onClick={() => handleHeaderSort('MASTERY')}
                  >
                    掌握程度
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'LAST_EXTRACTED_ASC' || sortBy === 'LAST_EXTRACTED_DESC'}
                    direction={sortBy === 'LAST_EXTRACTED_ASC' ? 'asc' : sortBy === 'LAST_EXTRACTED_DESC' ? 'desc' : 'asc'}
                    onClick={() => handleHeaderSort('LAST_EXTRACTED')}
                  >
                    上次练习
                  </TableSortLabel>
                </TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedQuestions.length > 0 ? (
                paginatedQuestions.map((q) => {
                  if (!q) return null;
                  const masteryInfo = getMasteryInfo(q.stats?.mastery_level);
                  const difficultyInfo = getDifficultyLabel(q.difficulty);
                  const totalAttempts = (q.stats?.correct_count || 0) + (q.stats?.wrong_count || 0);
                  const correctRate = calculateAccuracy(q.stats);
                  const wrongRate = calculateWrongRate(q.stats);
                  
                  return (
                    <React.Fragment key={q.id}>
                      <TableRow 
                        hover
                        sx={{ 
                          bgcolor: expandedQuestion === q.id ? '#e3f2fd' : 'inherit',
                          '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                      >
                        <TableCell>
<TableCell>
  <Tooltip title={q.id}>
    <Chip 
      label={q.id?.split('_')[0] || q.id}  // 只取第一个下划线前的部分（序号）
      size="small" 
      variant="outlined"
    />
  </Tooltip>
</TableCell>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography noWrap variant="body2">
                            {q.question?.substring(0, 60) || '无题目'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={q.category || '未分类'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={difficultyInfo.label} 
                            size="small" 
                            color={difficultyInfo.color} 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge badgeContent={totalAttempts} color="primary" max={999}>
                            <Timer fontSize="small" />
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip 
                              icon={<CheckCircle />} 
                              label={q.stats?.correct_count || 0} 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                            {totalAttempts > 0 && (
                              <Typography variant="caption" color="success.main" fontWeight="bold">
                                {Math.round(correctRate * 100)}%
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip 
                              icon={<Cancel />} 
                              label={q.stats?.wrong_count || 0} 
                              size="small" 
                              color="error" 
                              variant="outlined"
                            />
                            {totalAttempts > 0 && (
                              <Typography variant="caption" color="error.main" fontWeight="bold">
                                {Math.round(wrongRate * 100)}%
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 100 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Chip 
                                label={masteryInfo.label} 
                                size="small" 
                                color={masteryInfo.chip} 
                                variant={q.stats?.mastery_level === 0 ? 'outlined' : 'filled'}
                              />
                              <Typography variant="caption">
                                {Math.round((q.stats?.mastery_level || 0) * 100)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(q.stats?.mastery_level || 0) * 100} 
                              sx={{ 
                                height: 4, 
                                borderRadius: 2,
                                bgcolor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: masteryInfo.color
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={formatDate(q.stats?.last_extracted)}>
                            <Typography variant="caption">
                              {q.stats?.last_extracted ? formatDate(q.stats.last_extracted) : '从未'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small"
                            onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                          >
                            {expandedQuestion === q.id ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* 展开的详细信息 */}
                      {expandedQuestion === q.id && (
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                            <Collapse in={true} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 3, bgcolor: '#fafafa' }}>
                                <Grid container spacing={3}>
                                  {/* 题目详情 */}
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>题目详情</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                      <Typography variant="body1" paragraph>
                                        {q.question}
                                      </Typography>
                                      <Grid container spacing={1}>
                                        {q.options?.map(opt => (
                                          <Grid item xs={12} sm={6} key={opt.label}>
                                            <Paper 
                                              variant="outlined" 
                                              sx={{ 
                                                p: 1,
                                                bgcolor: opt.label === q.correct ? '#e8f5e9' : 'transparent',
                                                borderColor: opt.label === q.correct ? '#4caf50' : '#ddd'
                                              }}
                                            >
                                              <Typography variant="body2">
                                                <strong>{opt.label}.</strong> {opt.text}
                                                {opt.label === q.correct && (
                                                  <CheckCircle sx={{ color: '#4caf50', fontSize: 16, ml: 1, verticalAlign: 'middle' }} />
                                                )}
                                              </Typography>
                                            </Paper>
                                          </Grid>
                                        ))}
                                      </Grid>
                                      <Alert severity="info" sx={{ mt: 2 }}>
                                        <Typography variant="body2">
                                          <strong>解析：</strong> {q.explanation}
                                        </Typography>
                                      </Alert>
                                    </Paper>
                                  </Grid>

                                  {/* 答题历史 */}
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>答题历史</Typography>
                                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                                      {q.stats?.history && q.stats.history.length > 0 ? (
                                        q.stats.history.slice().reverse().map((h, idx) => (
                                          <Box key={idx} sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: 0.5,
                                            borderBottom: idx < q.stats.history.length - 1 ? '1px solid #eee' : 'none'
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
                                          </Box>
                                        ))
                                      ) : (
                                        <Typography color="text.secondary" align="center">暂无答题历史</Typography>
                                      )}
                                    </Paper>
                                  </Grid>

                                  {/* 连续记录 */}
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>连续记录</Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                      <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" color="text.secondary">当前连续正确</Typography>
                                          <Typography variant="h6" color="success.main">
                                            {q.stats?.streak?.current_correct || 0}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" color="text.secondary">最大连续正确</Typography>
                                          <Typography variant="h6" color="success.main">
                                            {q.stats?.streak?.max_correct || 0}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" color="text.secondary">当前连续错误</Typography>
                                          <Typography variant="h6" color="error.main">
                                            {q.stats?.streak?.current_wrong || 0}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" color="text.secondary">最大连续错误</Typography>
                                          <Typography variant="h6" color="error.main">
                                            {q.stats?.streak?.max_wrong || 0}
                                          </Typography>
                                        </Grid>
                                      </Grid>

                                      {q.stats?.time_stats?.avg_time > 0 && (
                                        <>
                                          <Divider sx={{ my: 2 }} />
                                          <Typography variant="body2" gutterBottom fontWeight="bold">用时统计</Typography>
                                          <Grid container spacing={2}>
                                            <Grid item xs={4}>
                                              <Typography variant="caption" color="text.secondary">平均</Typography>
                                              <Typography variant="body2">{q.stats.time_stats.avg_time}秒</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                              <Typography variant="caption" color="text.secondary">最快</Typography>
                                              <Typography variant="body2" color="success.main">{q.stats.time_stats.fastest}秒</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                              <Typography variant="caption" color="text.secondary">最慢</Typography>
                                              <Typography variant="body2" color="error.main">{q.stats.time_stats.slowest}秒</Typography>
                                            </Grid>
                                          </Grid>
                                        </>
                                      )}
                                    </Paper>
                                  </Grid>
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">暂无数据</Typography>
                  </TableCell>
                </TableRow>
              )}
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

      {/* 提示消息 */}
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

export default QuestionMasterView;