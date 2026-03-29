import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
  LinearProgress,
  Skeleton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';

const ClozeMasterView = ({
  allQuestions,
  filteredQuestions,
  paginatedQuestions,
  expandedRow,
  searchTerm,
  page,
  rowsPerPage,
  onSearchChange,
  onPageChange,
  onRowsPerPageChange,
  onRowExpand,
  onSelectQuestions,
  onLoadAllQuestions,
  getQuestionStats,
  formatDate,
  bank,
  loading = false
}) => {
  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
        </Box>
        <Box sx={{ px: 2, pb: 1 }}>
          <Skeleton variant="text" width={200} height={24} />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <TableCell key={i}>
                    <Skeleton variant="text" width={i === 1 ? 50 : i === 2 ? 80 : 100} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5].map((row) => (
                <TableRow key={row}>
                  {[1, 2, 3, 4, 5, 6].map((col) => (
                    <TableCell key={col}>
                      <Skeleton variant="text" height={30} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <MenuBookIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
        <Typography variant="h6" gutterBottom sx={{ color: '#666' }}>
          暂无题库数据
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          点击下方按钮加载题库，开始练习七选五阅读理解
        </Typography>
        <Button 
          variant="contained" 
          onClick={onLoadAllQuestions}
          startIcon={<PlayArrowIcon />}
          sx={{ 
            bgcolor: '#1a237e',
            '&:hover': { bgcolor: '#283593' },
            px: 4,
            py: 1
          }}
        >
          加载题库
        </Button>
      </Paper>
    );
  }

  // 计算答题正确率
  const calculateAccuracy = (userAnswer, correctAnswer) => {
    if (!userAnswer || !correctAnswer) return { correct: 0, total: 0, percentage: 0 };
    
    const userAnswers = typeof userAnswer === 'object' ? userAnswer : {};
    const correctAnswers = typeof correctAnswer === 'object' ? correctAnswer : {};
    
    const blanks = Object.keys(correctAnswers);
    if (blanks.length === 0) return { correct: 0, total: 0, percentage: 0 };
    
    const correctCount = blanks.filter(blank => 
      userAnswers[blank] && userAnswers[blank] === correctAnswers[blank]
    ).length;
    
    return {
      correct: correctCount,
      total: blanks.length,
      percentage: Math.round((correctCount / blanks.length) * 100)
    };
  };

  // 格式化用户答案显示
  const formatUserAnswer = (userAnswer) => {
    if (!userAnswer) return '无';
    if (typeof userAnswer === 'object') {
      return Object.entries(userAnswer)
        .map(([blank, ans]) => `${blank}:${ans}`)
        .join('; ');
    }
    return String(userAnswer);
  };

  // 格式化正确答案显示
  const formatCorrectAnswer = (correctAnswer) => {
    if (!correctAnswer) return '无';
    if (typeof correctAnswer === 'object') {
      return Object.entries(correctAnswer)
        .map(([blank, ans]) => `${blank}:${ans}`)
        .join('; ');
    }
    return String(correctAnswer);
  };

  // 比较答案并返回差异
  const compareAnswers = (userAnswer, correctAnswer) => {
    if (!userAnswer || !correctAnswer) return {};
    
    const userAnswers = typeof userAnswer === 'object' ? userAnswer : {};
    const correctAnswers = typeof correctAnswer === 'object' ? correctAnswer : {};
    
    const result = {};
    Object.keys(correctAnswers).forEach(blank => {
      result[blank] = {
        user: userAnswers[blank] || null,
        correct: correctAnswers[blank],
        isCorrect: userAnswers[blank] === correctAnswers[blank]
      };
    });
    
    return result;
  };

  return (
    <Paper>
      {/* 搜索栏 */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="搜索标题或内容..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Box>

      {/* 统计信息 */}
      <Box sx={{ px: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          共 {filteredQuestions.length} 篇阅读
          {searchTerm && ` (搜索到 ${filteredQuestions.length} 条结果)`}
        </Typography>
        {filteredQuestions.length > 0 && (
          <Chip 
            size="small" 
            label={`第 ${page + 1} 页 / 共 ${Math.ceil(filteredQuestions.length / rowsPerPage)} 页`}
            variant="outlined"
          />
        )}
      </Box>

      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" width="50px">
                展开
              </TableCell>
              <TableCell width="80px">题号</TableCell>
              <TableCell>标题</TableCell>
              <TableCell width="120px">分类</TableCell>
              <TableCell width="100px">练习次数</TableCell>
              <TableCell width="100px">正确率</TableCell>
              <TableCell width="100px">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedQuestions.length > 0 ? (
              paginatedQuestions.map((q) => {
                const qStat = getQuestionStats(q.id);
                const isExpanded = expandedRow === q.id;
                const extractCount = qStat?.extract_count || 0;
                const accuracy = qStat?.answer_count 
                  ? Math.round((qStat.correct_count / qStat.answer_count) * 100) 
                  : 0;

                return (
                  <React.Fragment key={q.id}>
                    {/* 主行 */}
                    <TableRow 
                      hover
                      sx={{
                        bgcolor: isExpanded ? '#e3f2fd' : 'inherit',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          onClick={() => onRowExpand(isExpanded ? null : q.id)}
                          aria-label={isExpanded ? "收起" : "展开"}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ChevronRightIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Chip label={q.number} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={q.title}>
                          <Typography noWrap sx={{ maxWidth: 300 }}>
                            {q.title}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip label={q.category || '未分类'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <HistoryIcon sx={{ fontSize: 16, color: '#666' }} />
                          <Typography>{extractCount}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {qStat?.answer_count > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              sx={{ 
                                color: accuracy >= 80 ? 'success.main' : accuracy >= 60 ? 'warning.main' : 'error.main',
                                fontWeight: 500
                              }}
                            >
                              {accuracy}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={accuracy} 
                              sx={{ 
                                width: 50, 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: accuracy >= 80 ? '#4caf50' : accuracy >= 60 ? '#ff9800' : '#f44336'
                                }
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">未练习</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => onSelectQuestions([q])}
                          sx={{ 
                            bgcolor: '#1a237e',
                            '&:hover': { bgcolor: '#283593' }
                          }}
                        >
                          练习
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* 展开的详情行 */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                            <Grid container spacing={2}>
                              {/* 文章内容 */}
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom color="primary">
                                  文章内容
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                    {q.content}
                                  </Typography>
                                </Paper>
                              </Grid>

                              {/* 选项 */}
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom color="primary">
                                  选项
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                  {q.options?.map((option) => (
                                    <Typography key={option.key} variant="body2" sx={{ mb: 1 }}>
                                      <strong>{option.key}.</strong> {option.text}
                                    </Typography>
                                  ))}
                                </Paper>
                              </Grid>

                              {/* 正确答案 */}
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom color="primary">
                                  正确答案
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {Object.entries(q.correctAnswers || {}).map(([blank, answer]) => (
                                      <Chip
                                        key={blank}
                                        label={`空格 ${blank}: ${answer}`}
                                        color="success"
                                        variant="outlined"
                                        size="small"
                                      />
                                    ))}
                                  </Box>
                                </Paper>
                              </Grid>

                              {/* 解析 */}
                              {q.explanation && (
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" gutterBottom color="primary">
                                    解析
                                  </Typography>
                                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff3e0' }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                      {q.explanation}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              )}

                              {/* 历史记录 */}
                              {qStat?.history && qStat.history.length > 0 && (
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" gutterBottom color="primary">
                                    答题历史
                                  </Typography>
                                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                                    {qStat.history.slice().reverse().map((h, idx) => {
                                      const accuracy = calculateAccuracy(h.userAnswer, h.correctAnswer);
                                      const comparison = compareAnswers(h.userAnswer, h.correctAnswer);
                                      
                                      return (
                                        <Box
                                          key={idx}
                                          sx={{
                                            p: 1.5,
                                            mb: 1,
                                            borderRadius: 1,
                                            bgcolor: accuracy.percentage === 100 ? '#e8f5e8' : 
                                                    accuracy.percentage >= 60 ? '#fff3e0' : '#ffebee',
                                            border: '1px solid',
                                            borderColor: accuracy.percentage === 100 ? '#c8e6c9' : 
                                                        accuracy.percentage >= 60 ? '#ffe0b2' : '#ffcdd2'
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                            <Chip
                                              size="small"
                                              icon={accuracy.percentage === 100 ? <CheckCircleIcon /> : 
                                                    accuracy.percentage >= 60 ? <CheckCircleIcon /> : <CancelIcon />}
                                              label={`${accuracy.correct}/${accuracy.total} 正确 (${accuracy.percentage}%)`}
                                              color={accuracy.percentage === 100 ? 'success' : 
                                                     accuracy.percentage >= 60 ? 'warning' : 'error'}
                                              sx={{ minWidth: 100 }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                              {formatDate(h.date)}
                                            </Typography>
                                            {h.time && (
                                              <Typography variant="caption" color="text.secondary">
                                                用时: {h.time}秒
                                              </Typography>
                                            )}
                                          </Box>
                                          
                                          <Box sx={{ pl: 1 }}>
                                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                              答案详情:
                                            </Typography>
                                            <Grid container spacing={1}>
                                              {Object.entries(comparison).map(([blank, data]) => (
                                                <Grid item xs={12} sm={6} md={4} key={blank}>
                                                  <Paper 
                                                    variant="outlined" 
                                                    sx={{ 
                                                      p: 1, 
                                                      bgcolor: data.isCorrect ? '#e8f5e8' : '#ffebee',
                                                      borderColor: data.isCorrect ? '#c8e6c9' : '#ffcdd2'
                                                    }}
                                                  >
                                                    <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                                                      空格 {blank}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                      <Typography variant="body2" sx={{ color: data.isCorrect ? '#2e7d32' : '#c62828' }}>
                                                        您的答案: {data.user || '无'}
                                                      </Typography>
                                                      {!data.isCorrect && data.user && (
                                                        <Chip 
                                                          size="small"
                                                          label={`正确: ${data.correct}`}
                                                          color="success"
                                                          variant="outlined"
                                                          sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                                                        />
                                                      )}
                                                    </Box>
                                                  </Paper>
                                                </Grid>
                                              ))}
                                            </Grid>
                                          </Box>
                                        </Box>
                                      );
                                    })}
                                  </Paper>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
                  <MenuBookIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    没有找到匹配的阅读题目
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    尝试使用其他关键词搜索
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredQuestions.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredQuestions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => {
            onRowsPerPageChange(parseInt(e.target.value, 10));
          }}
        />
      )}
    </Paper>
  );
};

export default ClozeMasterView;