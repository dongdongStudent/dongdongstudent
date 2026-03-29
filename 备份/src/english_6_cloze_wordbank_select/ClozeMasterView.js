import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,Divider,
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
  Skeleton,
  InputAdornment
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  MenuBook as MenuBookIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  School as SchoolIcon
} from '@mui/icons-material';

const ClozeMasterView = ({
  allPassages = [],
  filteredPassages = [],
  paginatedPassages = [],
  expandedRow = null,
  searchTerm = '',
  page = 0,
  rowsPerPage = 10,
  onSearchChange = () => {},
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
  onRowExpand = () => {},
  onSelectPassage = () => {},
  getPassageStats = () => null,
  formatDate = () => '',
  loading = false
}) => {
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

  // 获取难度标签
  const getDifficultyLabel = (difficulty) => {
    const map = {
      1: { label: '简单', color: 'success' },
      2: { label: '中等', color: 'warning' },
      3: { label: '困难', color: 'error' },
      4: { label: '挑战', color: 'error' },
      5: { label: '专家', color: 'error' }
    };
    return map[difficulty] || { label: `${difficulty}级`, color: 'default' };
  };

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

  if (allPassages.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <MenuBookIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
        <Typography variant="h6" gutterBottom sx={{ color: '#666' }}>
          暂无题库数据
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          点击下方按钮加载题库，开始练习五选五阅读理解
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      {/* 搜索栏 */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="搜索标题或分类..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* 统计信息 */}
      <Box sx={{ px: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          共 {filteredPassages.length} 篇阅读
          {searchTerm && ` (搜索到 ${filteredPassages.length} 条结果)`}
        </Typography>
        {filteredPassages.length > 0 && (
          <Chip 
            size="small" 
            label={`第 ${page + 1} 页 / 共 ${Math.ceil(filteredPassages.length / rowsPerPage)} 页`}
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
              <TableCell width="120px">分类</TableCell>
              <TableCell>标题</TableCell>
              <TableCell width="100px">难度</TableCell>
              <TableCell width="100px">题目数</TableCell>
              <TableCell width="100px">练习次数</TableCell>
              <TableCell width="100px">掌握度</TableCell>
              <TableCell width="120px">上次练习</TableCell>
              <TableCell width="100px">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPassages.length > 0 ? (
              paginatedPassages.map((passage) => {
                const passageStat = getPassageStats(passage.id);
                const isExpanded = expandedRow === passage.id;
                const difficulty = getDifficultyLabel(passage.difficulty);
                const extractCount = passageStat?.extract_count || 0;
                
                // 计算掌握度（基于正确率）
                let masteryLevel = 0;
                if (passageStat?.questions) {
                  const questions = Object.values(passageStat.questions);
                  if (questions.length > 0) {
                    const totalCorrect = questions.reduce((sum, q) => sum + (q.correct_count || 0), 0);
                    const totalAttempts = questions.reduce((sum, q) => sum + (q.correct_count || 0) + (q.wrong_count || 0), 0);
                    masteryLevel = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
                  }
                }

                return (
                  <React.Fragment key={passage.id}>
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
                          onClick={() => onRowExpand(isExpanded ? null : passage.id)}
                          aria-label={isExpanded ? "收起" : "展开"}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ChevronRightIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={passage.category || '未分类'} 
                          size="small" 
                          variant="outlined"
                          icon={<CategoryIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={passage.description || passage.title}>
                          <Typography noWrap sx={{ maxWidth: 300 }}>
                            {passage.title}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={difficulty.label} 
                          size="small" 
                          color={difficulty.color} 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={passage.totalQuestions || 0} 
                          size="small" 
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
                        {masteryLevel > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              sx={{ 
                                color: masteryLevel >= 80 ? 'success.main' : masteryLevel >= 60 ? 'warning.main' : 'error.main',
                                fontWeight: 500
                              }}
                            >
                              {masteryLevel}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={masteryLevel} 
                              sx={{ 
                                width: 50, 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: masteryLevel >= 80 ? '#4caf50' : masteryLevel >= 60 ? '#ff9800' : '#f44336'
                                }
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">未练习</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formatDate(passageStat?.last_practiced)}>
                          <Typography variant="caption">
                            {passageStat?.last_practiced ? formatDate(passageStat.last_practiced) : '从未'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => onSelectPassage(passage)}
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
                              {/* 篇章描述 */}
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom color="primary">
                                  篇章描述
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                  <Typography variant="body2">
                                    {passage.description || '暂无描述'}
                                  </Typography>
                                </Paper>
                              </Grid>

                              {/* 所给词列表 */}
                              {passage.givenWords && passage.givenWords.length > 0 && (
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" gutterBottom color="primary">
                                    所给词
                                  </Typography>
                                  <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                      {passage.givenWords.map((word, index) => (
                                        <Chip
                                          key={index}
                                          label={word}
                                          color="primary"
                                          variant="outlined"
                                          sx={{ fontSize: '1rem' }}
                                        />
                                      ))}
                                    </Box>
                                  </Paper>
                                </Grid>
                              )}

                              {/* 题目列表 */}
                              {passage.questions && passage.questions.length > 0 && (
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" gutterBottom color="primary">
                                    题目预览
                                  </Typography>
                                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                                    {passage.questions.map((q, idx) => (
                                      <Box key={q.id} sx={{ mb: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {q.number}. {q.givenWord}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                          {q.sentence}
                                        </Typography>
                                        {idx < passage.questions.length - 1 && (
                                          <Divider sx={{ my: 1 }} />
                                        )}
                                      </Box>
                                    ))}
                                  </Paper>
                                </Grid>
                              )}

                              {/* 统计信息 */}
                              {passageStat && (
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" gutterBottom color="primary">
                                    练习统计
                                  </Typography>
                                  <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Grid container spacing={2}>
                                      <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="h6" color="primary">
                                            {passageStat.extract_count || 0}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            总练习次数
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="h6" color="success.main">
                                            {Object.values(passageStat.questions || {}).reduce((sum, q) => sum + (q.correct_count || 0), 0)}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            总正确数
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="h6" color="error.main">
                                            {Object.values(passageStat.questions || {}).reduce((sum, q) => sum + (q.wrong_count || 0), 0)}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            总错误数
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                          <Typography variant="h6" color="warning.main">
                                            {masteryLevel}%
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            掌握程度
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Paper>
                                </Grid>
                              )}

                              {/* 练习历史 */}
                              {passageStat?.history && passageStat.history.length > 0 && (
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" gutterBottom color="primary">
                                    练习历史
                                  </Typography>
                                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                                    {passageStat.history.slice().reverse().map((h, idx) => (
                                      <Box
                                        key={idx}
                                        sx={{
                                          p: 1,
                                          mb: 1,
                                          borderRadius: 1,
                                          bgcolor: '#f5f5f5',
                                          border: '1px solid #e0e0e0'
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                          <Typography variant="caption" color="text.secondary">
                                            {formatDate(h.date)}
                                          </Typography>
                                          <Chip
                                            size="small"
                                            label={`正确率: ${Math.round(h.accuracy * 100)}%`}
                                            color={h.accuracy >= 0.8 ? 'success' : h.accuracy >= 0.6 ? 'warning' : 'error'}
                                            sx={{ height: 20 }}
                                          />
                                          <Typography variant="caption" color="text.secondary">
                                            用时: {h.timeSpent}秒
                                          </Typography>
                                        </Box>
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
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} sx={{ py: 8, textAlign: 'center' }}>
                  <MenuBookIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    没有找到匹配的阅读篇章
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

      {filteredPassages.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredPassages.length}
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