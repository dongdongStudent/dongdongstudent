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
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const CToEMasterView = ({
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
  bank
}) => {
  if (allQuestions.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography>暂无题库数据</Typography>
        <Button 
          variant="contained" 
          onClick={onLoadAllQuestions}
          sx={{ mt: 2 }}
        >
          加载题库
        </Button>
      </Paper>
    );
  }

  // 解析正确答案显示
  const formatCorrectAnswer = (correctAnswer) => {
    if (!correctAnswer) return '无';
    
    try {
      // 尝试解析 JSON
      const parsed = JSON.parse(correctAnswer);
      
      if (Array.isArray(parsed)) {
        // 检查是否是二维数组格式 [["Why","Why are..."], ["Because","Because..."]]
        if (parsed.length > 0 && Array.isArray(parsed[0])) {
          return parsed.map((item, i) => {
            if (Array.isArray(item)) {
              return `空${i+1}: ${item.join(' 或 ')}`;
            }
            return item;
          }).join('; ');
        }
        // 如果是对象数组格式 [{"position":0,"correctForms":[...]}]
        else if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].correctForms) {
          return parsed.map(item => {
            if (item.correctForms) {
              return `空${item.position + 1}: ${item.correctForms.join(' 或 ')}`;
            }
            return JSON.stringify(item);
          }).join('; ');
        }
        // 普通数组
        else {
          return parsed.join(' 或 ');
        }
      } else if (typeof parsed === 'object') {
        // 单个对象
        if (parsed.correctForms) {
          return `空${parsed.position + 1}: ${parsed.correctForms.join(' 或 ')}`;
        }
        return JSON.stringify(parsed);
      }
      
      return correctAnswer;
    } catch {
      // 如果不是 JSON，直接返回原字符串
      return correctAnswer;
    }
  };

  // 解析用户答案显示
  const formatUserAnswer = (userAnswer) => {
    if (!userAnswer) return '无';
    
    // 如果已经是数组，直接处理
    if (Array.isArray(userAnswer)) {
      return userAnswer.map(ans => ans || '(空)').join(' | ');
    }
    
    // 如果是字符串，尝试解析 JSON
    if (typeof userAnswer === 'string') {
      // 检查是否是 JSON 数组格式
      if (userAnswer.startsWith('[') && userAnswer.endsWith(']')) {
        try {
          const parsed = JSON.parse(userAnswer);
          if (Array.isArray(parsed)) {
            return parsed.map(ans => ans || '(空)').join(' | ');
          }
        } catch {
          // 解析失败，返回原字符串
        }
      }
    }
    
    // 其他情况返回原字符串
    return String(userAnswer);
  };

  return (
    <Paper>
      {/* 搜索栏 */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="搜索题目（中文、英文或题号）"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Box>

      {/* 统计信息 */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          共 {filteredQuestions.length} 道题目
          {searchTerm && ` (搜索过滤)`}
        </Typography>
      </Box>

      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" width="50px">
                展开
              </TableCell>
              <TableCell width="80px">题号</TableCell>
              <TableCell>中文</TableCell>
              <TableCell>英文</TableCell>
              <TableCell width="100px">分类</TableCell>
              <TableCell width="80px">难度</TableCell>
              <TableCell width="100px">练习次数</TableCell>
              <TableCell width="100px">正确率</TableCell>
              <TableCell width="100px">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedQuestions.map((q) => {
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
                      <Tooltip title={q.chinese}>
                        <Typography noWrap sx={{ maxWidth: 200 }}>
                          {q.chinese}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={q.english}>
                        <Typography noWrap sx={{ maxWidth: 250 }}>
                          {q.english}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip label={q.category || '未分类'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${q.difficulty || 1}级`} 
                        size="small" 
                        color={q.difficulty === 1 ? 'success' : q.difficulty === 2 ? 'info' : 'warning'}
                        variant="outlined"
                      />
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
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                          <Grid container spacing={2}>
                            {/* 题目详情 */}
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" gutterBottom color="primary">
                                题目详情
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  中文：{q.chinese}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                  {q.english}
                                </Typography>
                                
                                {/* 正确答案显示 */}
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    正确答案：
                                  </Typography>
                                  {q.type === 'multi' ? (
                                    <>
                                      {q.blanks?.map((blank, idx) => (
                                        <Chip
                                          key={idx}
                                          size="small"
                                          label={`空 ${idx + 1}: ${blank.correctForms.join(' 或 ')}`}
                                          sx={{ mr: 1, mb: 1 }}
                                        />
                                      ))}
                                      {q.combinedCorrectForms && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="caption" color="text.secondary">
                                            完整答案示例：
                                          </Typography>
                                          {q.combinedCorrectForms.map((ans, idx) => (
                                            <Typography key={idx} variant="body2" color="primary" sx={{ ml: 2 }}>
                                              • {ans}
                                            </Typography>
                                          ))}
                                        </Box>
                                      )}
                                    </>
                                  ) : (
                                    <Chip
                                      label={`正确答案: ${q.correctForm || q.english}`}
                                      color="success"
                                      variant="outlined"
                                      size="medium"
                                    />
                                  )}
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
                                <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                                  {qStat.history.slice().reverse().map((h, idx) => {
                                    // 格式化正确答案显示
                                    const formattedCorrect = formatCorrectAnswer(h.correctAnswer);
                                    // 格式化用户答案显示
                                    const formattedUser = formatUserAnswer(h.userAnswer);
                                    
                                    return (
                                      <Box
                                        key={idx}
                                        sx={{
                                          p: 1.5,
                                          mb: 1,
                                          borderRadius: 1,
                                          bgcolor: h.result ? '#e8f5e8' : '#ffebee',
                                          border: '1px solid',
                                          borderColor: h.result ? '#c8e6c9' : '#ffcdd2'
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                          <Chip
                                            size="small"
                                            icon={h.result ? <CheckCircleIcon /> : <CancelIcon />}
                                            label={h.result ? '正确' : '错误'}
                                            color={h.result ? 'success' : 'error'}
                                            sx={{ minWidth: 60 }}
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
                                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <span style={{ fontWeight: 600 }}>您的答案:</span> {formattedUser}
                                          </Typography>
                                          {!h.result && (
                                            <Typography variant="body2" color="error">
                                              <span style={{ fontWeight: 600 }}>正确答案:</span> {formattedCorrect}
                                            </Typography>
                                          )}
                                          {h.result && formattedCorrect && (
                                            <Typography variant="body2" color="success.main">
                                              <span style={{ fontWeight: 600 }}>正确答案:</span> {formattedCorrect}
                                            </Typography>
                                          )}
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
            })}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Paper>
  );
};

export default CToEMasterView;