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
  Pagination
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
  Timer
} from '@mui/icons-material';

const QuestionMasterView = ({ dataSource, questions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 获取所有分类
  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];

  // 过滤和排序题目
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = searchTerm === '' || 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === '' || q.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

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
        aValue = a.difficulty || '';
        bValue = b.difficulty || '';
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

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (question) => {
    setSelectedQuestion(question);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedQuestion(null);
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 0.8) return '#4CAF50';
    if (mastery >= 0.5) return '#FF9800';
    return '#F44336';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '简单': return '#4CAF50';
      case '中等': return '#FF9800';
      case '困难': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <Box>
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
            sx={{ minWidth: 150 }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="">全部分类</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </TextField>
          
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Tooltip title="刷新">
              <IconButton size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              size="small"
              onClick={() => setFilterCategory('')}
            >
              清除筛选
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`总计: ${questions.length} 题`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`显示: ${filteredQuestions.length} 题`}
            size="small"
            variant="outlined"
            color="primary"
          />
          {filterCategory && (
            <Chip
              label={`分类: ${filterCategory}`}
              size="small"
              onDelete={() => setFilterCategory('')}
            />
          )}
        </Box>
      </Paper>

      {/* 题目表格 */}
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
              <TableCell align="center">查看</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedQuestions.map((question) => {
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
                        label={question.difficulty}
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
            
            {sortedQuestions.length === 0 && (
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
                    {selectedQuestion.options && selectedQuestion.options.map((option, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: `1px solid ${idx.toString() === selectedQuestion.answer ? '#4CAF50' : '#e0e0e0'}`,
                          backgroundColor: idx.toString() === selectedQuestion.answer ? '#E8F5E9' : 'transparent',
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
                          bgcolor: idx.toString() === selectedQuestion.answer ? '#4CAF50' : '#9E9E9E',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}>
                          {String.fromCharCode(65 + idx)}
                        </Box>
                        <Typography variant="body1">{option}</Typography>
                        {idx.toString() === selectedQuestion.answer && (
                          <Chip
                            label="正确答案"
                            size="small"
                            sx={{ ml: 'auto', bgcolor: '#4CAF50', color: 'white' }}
                          />
                        )}
                      </Box>
                    ))}
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
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{selectedQuestion.difficulty || '未设置'}</Typography>
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
