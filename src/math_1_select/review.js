// src/math_1_select/review.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  Pagination,
  FormControlLabel,
  Switch,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  CheckCircle,
  Cancel,
  Help,
  Warning,
  TrendingUp,
  Timer,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const QuestionMasterView = ({ dataSource, questions }) => {
  // ==================== 调试日志 ====================
  console.log('========== 【QuestionMasterView】组件接收数据 ==========');
  console.log('dataSource:', dataSource);
  console.log('questions 类型:', Array.isArray(questions) ? '数组' : typeof questions);
  console.log('questions 长度:', questions?.length || 0);
  
  if (questions && questions.length > 0) {
    console.log('前5道题ID:', questions.slice(0, 5).map(q => q.id));
    console.log('所有题目ID列表:', questions.map(q => q.id));
    console.log('题目分类:', [...new Set(questions.map(q => q.category).filter(Boolean))]);
    console.log('题目难度:', [...new Set(questions.map(q => q.difficulty).filter(Boolean))]);
  } else {
    console.warn('【警告】questions 为空或不是数组!');
  }
  console.log('=====================================================');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowsPerPageAnchorEl, setRowsPerPageAnchorEl] = useState(null);
  
  // 视图模式: 'table' 或 'card'
  const [viewMode, setViewMode] = useState('table');

  // 获取所有分类和难度选项
  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
  const difficulties = [...new Set(questions.map(q => q.difficulty).filter(Boolean))];

  // 过滤题目
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = searchTerm === '' || 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === '' || q.category === filterCategory;
    const matchesDifficulty = filterDifficulty === '' || q.difficulty === filterDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // 排序题目
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'id':
        aValue = parseInt(a.id);
        bValue = parseInt(b.id);
        break;
      case 'mastery':
        aValue = a.stats?.mastery_level || 0;
        bValue = b.stats?.mastery_level || 0;
        break;
      case 'attempts':
        aValue = a.stats?.total_attempts || 0;
        bValue = b.stats?.total_attempts || 0;
        break;
      case 'difficulty':
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3, '简单': 1, '中等': 2, '困难': 3 };
        aValue = difficultyOrder[a.difficulty] || 0;
        bValue = difficultyOrder[b.difficulty] || 0;
        break;
      default:
        aValue = a[sortBy] || '';
        bValue = b[sortBy] || '';
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // 分页
  const totalPages = Math.ceil(sortedQuestions.length / rowsPerPage);
  const paginatedQuestions = sortedQuestions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // 调试日志 - 分页信息
  console.log('【QuestionMasterView】分页信息:', {
    原始题目总数: questions.length,
    筛选后题目数: filteredQuestions.length,
    每页显示: rowsPerPage,
    总页数: totalPages,
    当前页: page,
    当前页显示数量: paginatedQuestions.length
  });

  // 当筛选条件变化时重置到第一页
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory, filterDifficulty, sortBy, sortOrder]);

  // 监听 questions 变化
  useEffect(() => {
    console.log('【QuestionMasterView】questions 数据更新:', {
      新数据长度: questions?.length || 0,
      数据源: dataSource
    });
  }, [questions, dataSource]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (question) => {
    console.log('【QuestionMasterView】查看题目详情:', {
      id: question.id,
      question: question.question?.substring(0, 50)
    });
    setSelectedQuestion(question);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedQuestion(null);
  };

  const handlePageChange = (event, value) => {
    console.log('【QuestionMasterView】切换页码:', value);
    setPage(value);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRowsPerPageClick = (event) => {
    setRowsPerPageAnchorEl(event.currentTarget);
  };

  const handleRowsPerPageClose = (value) => {
    if (value) {
      console.log('【QuestionMasterView】修改每页显示数量:', value);
      setRowsPerPage(value);
      setPage(1);
    }
    setRowsPerPageAnchorEl(null);
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 0.8) return '#4CAF50';
    if (mastery >= 0.5) return '#FF9800';
    return '#F44336';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
      case '简单': return '#4CAF50';
      case 'medium':
      case '中等': return '#FF9800';
      case 'hard':
      case '困难': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    const map = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    return map[difficulty] || difficulty || '未设置';
  };

  const clearAllFilters = () => {
    console.log('【QuestionMasterView】清除所有筛选条件');
    setSearchTerm('');
    setFilterCategory('');
    setFilterDifficulty('');
    setSortBy('id');
    setSortOrder('asc');
  };

  // 卡片视图组件
  const CardView = () => (
    <Grid container spacing={2}>
      {paginatedQuestions.map((question) => {
        const mastery = question.stats?.mastery_level || 0;
        const attempts = question.stats?.total_attempts || 0;
        
        return (
          <Grid item xs={12} sm={6} md={4} key={question.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    第{question.id}题
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {question.category && (
                      <Chip
                        label={question.category}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {question.difficulty && (
                      <Chip
                        label={getDifficultyLabel(question.difficulty)}
                        size="small"
                        sx={{
                          backgroundColor: `${getDifficultyColor(question.difficulty)}20`,
                          color: getDifficultyColor(question.difficulty),
                          border: `1px solid ${getDifficultyColor(question.difficulty)}40`
                        }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2, color: '#555', lineHeight: 1.5 }}>
                  {question.question.length > 100 ? question.question.substring(0, 100) + '...' : question.question}
                </Typography>
                
                <Box sx={{ mt: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">掌握度:</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={mastery * 100}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getMasteryColor(mastery)
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ minWidth: 35 }}>
                      {Math.round(mastery * 100)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      练习: {attempts}次
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => handleViewDetails(question)}
                      startIcon={<VisibilityIcon />}
                    >
                      详情
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Box>
      {/* 调试信息面板 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: 1, mb: 2, bgcolor: '#f0f0f0', fontSize: '12px' }}>
          <Typography variant="caption" component="div">
            🔍 调试信息: 题库: {dataSource} | 总题目数: {questions.length} | 
            筛选后: {filteredQuestions.length} | 当前页: {page}/{totalPages} | 
            每页: {rowsPerPage}条
          </Typography>
        </Paper>
      )}

      {/* 筛选和搜索工具栏 */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="搜索题目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            select
            label="分类筛选"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            size="small"
            sx={{ minWidth: 130 }}
          >
            <option value="">全部分类</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </TextField>
          
          <TextField
            select
            label="难度筛选"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <option value="">全部难度</option>
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>{getDifficultyLabel(difficulty)}</option>
            ))}
          </TextField>
          
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Tooltip title="切换视图">
              <IconButton size="small" onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}>
                {viewMode === 'table' ? <ViewModuleIcon /> : <ViewListIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="每页显示">
              <IconButton size="small" onClick={handleRowsPerPageClick}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="刷新">
              <IconButton size="small" onClick={() => window.location.reload()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              size="small"
              onClick={clearAllFilters}
            >
              清除筛选
            </Button>
          </Box>
        </Box>
        
        {/* 每页显示数量菜单 */}
        <Menu
          anchorEl={rowsPerPageAnchorEl}
          open={Boolean(rowsPerPageAnchorEl)}
          onClose={() => handleRowsPerPageClose(null)}
        >
          {[5, 10, 15, 20, 30, 50].map(option => (
            <MenuItem key={option} onClick={() => handleRowsPerPageClose(option)}>
              <ListItemText primary={`${option} 条/页`} />
              {rowsPerPage === option && <CheckCircle fontSize="small" sx={{ ml: 2 }} />}
            </MenuItem>
          ))}
        </Menu>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label={`总计: ${questions.length} 题`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`筛选后: ${filteredQuestions.length} 题`}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Chip
            label={`当前页: ${paginatedQuestions.length} 题`}
            size="small"
            variant="outlined"
            color="secondary"
          />
          {filterCategory && (
            <Chip
              label={`分类: ${filterCategory}`}
              size="small"
              onDelete={() => setFilterCategory('')}
            />
          )}
          {filterDifficulty && (
            <Chip
              label={`难度: ${getDifficultyLabel(filterDifficulty)}`}
              size="small"
              onDelete={() => setFilterDifficulty('')}
            />
          )}
          {searchTerm && (
            <Chip
              label={`搜索: ${searchTerm}`}
              size="small"
              onDelete={() => setSearchTerm('')}
            />
          )}
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">
            每页 {rowsPerPage} 条，共 {totalPages} 页
          </Typography>
        </Box>
      </Paper>

      {/* 题目展示区域 */}
      {viewMode === 'table' ? (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => handleSort('id')}>
                    题号
                    <SortIcon fontSize="small" sx={{ opacity: sortBy === 'id' ? 1 : 0.3 }} />
                  </Box>
                </TableCell>
                <TableCell>题目</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => handleSort('category')}>
                    分类
                    <SortIcon fontSize="small" sx={{ opacity: sortBy === 'category' ? 1 : 0.3 }} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => handleSort('difficulty')}>
                    难度
                    <SortIcon fontSize="small" sx={{ opacity: sortBy === 'difficulty' ? 1 : 0.3 }} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => handleSort('mastery')}>
                    掌握度
                    <SortIcon fontSize="small" sx={{ opacity: sortBy === 'mastery' ? 1 : 0.3 }} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => handleSort('attempts')}>
                    练习次数
                    <SortIcon fontSize="small" sx={{ opacity: sortBy === 'attempts' ? 1 : 0.3 }} />
                  </Box>
                </TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedQuestions.map((question) => {
                const mastery = question.stats?.mastery_level || 0;
                const attempts = question.stats?.total_attempts || 0;
                
                return (
                  <TableRow 
                    key={question.id}
                    hover
                    sx={{ 
                      '&:hover': { backgroundColor: '#fafafa' },
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {question.id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap>
                        {question.question}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {question.category ? (
                        <Chip
                          label={question.category}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {question.difficulty ? (
                        <Chip
                          label={getDifficultyLabel(question.difficulty)}
                          size="small"
                          sx={{
                            backgroundColor: `${getDifficultyColor(question.difficulty)}20`,
                            color: getDifficultyColor(question.difficulty),
                            border: `1px solid ${getDifficultyColor(question.difficulty)}40`
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={mastery * 100}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getMasteryColor(mastery)
                            }
                          }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                          {Math.round(mastery * 100)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {attempts} 次
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="查看详情和学习历史">
                        <IconButton size="small" onClick={() => handleViewDetails(question)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {paginatedQuestions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      没有找到匹配的题目
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <CardView />
      )}

      {/* 分页组件 */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 'medium'
              }
            }}
          />
        </Box>
      )}

      {/* 统计信息栏 */}
      {filteredQuestions.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            第 {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, filteredQuestions.length)} 条，共 {filteredQuestions.length} 条记录
          </Typography>
        </Box>
      )}

      {/* 题目详情对话框 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedQuestion && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              题目学习记录 {selectedQuestion.id}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* 基本信息 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    题目内容
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
                    <Typography variant="body1">{selectedQuestion.question}</Typography>
                  </Paper>
                </Box>

                {/* 选项 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    选项
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedQuestion.options && selectedQuestion.options.map((option, idx) => {
                      const optionLabel = option.label || String.fromCharCode(65 + idx);
                      const optionText = option.text || option;
                      const isCorrect = optionLabel === selectedQuestion.answer || 
                                       (typeof selectedQuestion.answer === 'string' && 
                                        optionText === selectedQuestion.answer);
                      
                      return (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            border: `1px solid ${isCorrect ? '#4CAF50' : '#e0e0e0'}`,
                            backgroundColor: isCorrect ? '#E8F5E9' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Box sx={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            bgcolor: isCorrect ? '#4CAF50' : '#9E9E9E',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}>
                            {optionLabel}
                          </Box>
                          <Typography variant="body1">{optionText}</Typography>
                          {isCorrect && (
                            <Chip
                              label="正确答案"
                              size="small"
                              sx={{ ml: 'auto', bgcolor: '#4CAF50', color: 'white' }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* 解析 */}
                {selectedQuestion.explanation && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      解析
                    </Typography>
                    <Alert severity="info" sx={{ borderRadius: 1 }}>
                      <Typography variant="body2">{selectedQuestion.explanation}</Typography>
                    </Alert>
                  </Box>
                )}

                {/* 学习统计 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    学习统计
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
                      <Typography variant="caption" color="text.secondary">掌握程度</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(selectedQuestion.stats?.mastery_level || 0) * 100}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getMasteryColor(selectedQuestion.stats?.mastery_level || 0)
                            }
                          }}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          {Math.round((selectedQuestion.stats?.mastery_level || 0) * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
                      <Typography variant="caption" color="text.secondary">练习次数</Typography>
                      <Typography variant="h6" sx={{ mt: 0.5 }}>
                        {selectedQuestion.stats?.total_attempts || 0} 次
                      </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
                      <Typography variant="caption" color="text.secondary">正确次数</Typography>
                      <Typography variant="h6" sx={{ mt: 0.5, color: '#4CAF50' }}>
                        {selectedQuestion.stats?.correct_attempts || 0} 次
                      </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
                      <Typography variant="caption" color="text.secondary">错误次数</Typography>
                      <Typography variant="h6" sx={{ mt: 0.5, color: '#F44336' }}>
                        {selectedQuestion.stats?.wrong_attempts || 0} 次
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 回答历史 */}
                {selectedQuestion.stats?.history && selectedQuestion.stats.history.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      回答历史
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>时间</TableCell>
                            <TableCell align="center">结果</TableCell>
                            <TableCell align="right">用时(秒)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedQuestion.stats.history.map((record, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Typography variant="caption">
                                  {new Date(record.timestamp).toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={record.result ? '正确' : '错误'}
                                  size="small"
                                  sx={{
                                    backgroundColor: record.result ? '#E8F5E9' : '#FFEBEE',
                                    color: record.result ? '#4CAF50' : '#F44336'
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption">
                                  {record.time || 0}s
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>
                )}

                {/* 题目信息 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    题目信息
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">分类</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{selectedQuestion.category || '未分类'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">难度</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{getDifficultyLabel(selectedQuestion.difficulty)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">首次学习</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {selectedQuestion.stats?.first_seen ? new Date(selectedQuestion.stats.first_seen).toLocaleDateString() : '未学习'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">最后练习</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {selectedQuestion.stats?.last_extracted ? new Date(selectedQuestion.stats.last_extracted).toLocaleDateString() : '未练习'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>关闭</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default QuestionMasterView;