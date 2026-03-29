// view.js - 添加单元分类
import React, { useState } from 'react';
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
  LinearProgress,
  Skeleton,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Stack,
  Menu,
  MenuItem,
  Badge
} from '@mui/material';
import {
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  MenuBook as MenuBookIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Quiz as QuizIcon,
  Edit as EditIcon,
  Input as InputIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

const SentenceMasterView = ({
  allSentences = [],
  filteredSentences = [],
  paginatedSentences = [],
  expandedRow = null,
  searchTerm = '',
  page = 0,
  rowsPerPage = 10,
  onSearchChange = () => {},
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
  onRowExpand = () => {},
  onSelectSentence = () => {},
  getSentenceStats = () => null,
  formatDate = () => '',
  loading = false,
  mode = 'choice',
  // 新增单元筛选相关
  selectedUnit = 'all',
  onUnitChange = () => {},
  availableUnits = []
}) => {
  const [localExpandedRow, setLocalExpandedRow] = useState(null);
  const [unitMenuAnchor, setUnitMenuAnchor] = useState(null);
  const activeExpandedRow = localExpandedRow;

  const handleExpandClick = (sentenceId) => {
    const newExpandedState = activeExpandedRow === sentenceId ? null : sentenceId;
    setLocalExpandedRow(newExpandedState);
    if (onRowExpand) onRowExpand(newExpandedState);
  };

  const handleUnitMenuOpen = (event) => {
    setUnitMenuAnchor(event.currentTarget);
  };

  const handleUnitMenuClose = () => {
    setUnitMenuAnchor(null);
  };

  const handleUnitSelect = (unit) => {
    onUnitChange(unit);
    handleUnitMenuClose();
  };

  // 3种模式的定义
  const MODES = [
    { key: 'choice', name: '选择题', icon: <QuizIcon fontSize="small" />, color: '#e3f2fd', shortName: '选择' },
    { key: 'cloze', name: '选择填空', icon: <EditIcon fontSize="small" />, color: '#f3e5f5', shortName: '填空' },
    { key: 'input', name: '输入填空', icon: <InputIcon fontSize="small" />, color: '#ffebee', shortName: '输入' }
  ];

  // 计算模式的胜率
  const calculateWinRate = (correct, wrong) => {
    const total = correct + wrong;
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  // 计算所有句子的平均胜率
  const calculateAverageWinRate = (modeKey) => {
    let totalCorrect = 0;
    let totalWrong = 0;
    
    allSentences.forEach(sentence => {
      const stat = getSentenceStats(sentence.id);
      const modeStat = stat?.mode_stats?.[modeKey];
      if (modeStat) {
        totalCorrect += modeStat.correct || 0;
        totalWrong += modeStat.wrong || 0;
      }
    });
    
    return calculateWinRate(totalCorrect, totalWrong);
  };

  // 计算各模式的平均胜率
  const averageWinRates = {
    choice: calculateAverageWinRate('choice'),
    cloze: calculateAverageWinRate('cloze'),
    input: calculateAverageWinRate('input')
  };

  // 获取当前单元的显示名称
  const getUnitDisplayName = () => {
    if (selectedUnit === 'all') return '全部单元';
    return `Unit ${selectedUnit}`;
  };

  // 获取当前单元的单词数量
  const getUnitCount = (unit) => {
    if (unit === 'all') return allSentences.length;
    return allSentences.filter(s => s.unit === unit).length;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ p: 2 }}><Skeleton variant="rectangular" height={40} /></Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>{[1,2,3,4,5,6,7,8,9,10,11].map(i => <TableCell key={i}><Skeleton /></TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {[1,2,3,4,5].map(row => (
                <TableRow key={row}>{[1,2,3,4,5,6,7,8,9,10,11].map(col => <TableCell key={col}><Skeleton height={30} /></TableCell>)}</TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (allSentences.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <MenuBookIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
        <Typography variant="h6" gutterBottom sx={{ color: '#666' }}>暂无句子数据</Typography>
        <Typography variant="body2" color="text.secondary">请先选择句子库或加载数据</Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      {/* 搜索栏和单元筛选 */}
      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="搜索英文或中文..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ flex: 1 }}
        />
        
        {/* 单元筛选按钮 */}
        <Button
          variant="outlined"
          size="small"
          onClick={handleUnitMenuOpen}
          startIcon={<FilterListIcon />}
          endIcon={
            <Badge
              badgeContent={selectedUnit !== 'all' ? 1 : 0}
              color="primary"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
            >
              {null}
            </Badge>
          }
          sx={{ minWidth: 100 }}
        >
          {getUnitDisplayName()}
        </Button>
        
        <Menu
          anchorEl={unitMenuAnchor}
          open={Boolean(unitMenuAnchor)}
          onClose={handleUnitMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem 
            onClick={() => handleUnitSelect('all')}
            selected={selectedUnit === 'all'}
            sx={{ justifyContent: 'space-between', gap: 2 }}
          >
            <span>📚 全部单元</span>
            <Chip size="small" label={`${getUnitCount('all')}词`} sx={{ height: 20 }} />
          </MenuItem>
          <Divider />
          {availableUnits.map(unit => (
            <MenuItem 
              key={unit} 
              onClick={() => handleUnitSelect(unit)}
              selected={selectedUnit === unit}
              sx={{ justifyContent: 'space-between', gap: 2 }}
            >
              <span>Unit {unit}</span>
              <Chip size="small" label={`${getUnitCount(unit)}词`} sx={{ height: 20 }} />
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* 统计信息 - 显示各模式平均胜率 */}
      <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper variant="outlined" sx={{ p: 1, bgcolor: '#e3f2fd', display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuizIcon fontSize="small" color="primary" />
          <Typography variant="body2">选择题平均胜率:</Typography>
          <Chip 
            size="small" 
            label={`${averageWinRates.choice}%`} 
            color={averageWinRates.choice >= 80 ? 'success' : averageWinRates.choice >= 60 ? 'warning' : 'default'}
            sx={{ height: 20, fontSize: '0.75rem' }}
          />
        </Paper>
        
        <Paper variant="outlined" sx={{ p: 1, bgcolor: '#f3e5f5', display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon fontSize="small" color="secondary" />
          <Typography variant="body2">选择填空平均胜率:</Typography>
          <Chip 
            size="small" 
            label={`${averageWinRates.cloze}%`} 
            color={averageWinRates.cloze >= 80 ? 'success' : averageWinRates.cloze >= 60 ? 'warning' : 'default'}
            sx={{ height: 20, fontSize: '0.75rem' }}
          />
        </Paper>
        
        <Paper variant="outlined" sx={{ p: 1, bgcolor: '#ffebee', display: 'flex', alignItems: 'center', gap: 1 }}>
          <InputIcon fontSize="small" color="warning" />
          <Typography variant="body2">输入填空平均胜率:</Typography>
          <Chip 
            size="small" 
            label={`${averageWinRates.input}%`} 
            color={averageWinRates.input >= 80 ? 'success' : averageWinRates.input >= 60 ? 'warning' : 'default'}
            sx={{ height: 20, fontSize: '0.75rem' }}
          />
        </Paper>
      </Box>

      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" width="50px">展开</TableCell>
              <TableCell>单元</TableCell>
              <TableCell>英文</TableCell>
              <TableCell>中文</TableCell>
              <TableCell width="80px">类型</TableCell>
              <TableCell width="80px">练习</TableCell>
              <TableCell width="100px">掌握</TableCell>
              <TableCell width="100px">上次练习</TableCell>
              {/* 添加各模式的胜率列 */}
              <TableCell align="center" width="70px">
                <Stack alignItems="center" spacing={0.5}>
                  <QuizIcon fontSize="small" color="primary" />
                  <Typography variant="caption">选择</Typography>
                  <Chip size="small" label={`${averageWinRates.choice}%`} sx={{ height: 16, fontSize: '0.65rem' }} />
                </Stack>
              </TableCell>
              <TableCell align="center" width="70px">
                <Stack alignItems="center" spacing={0.5}>
                  <EditIcon fontSize="small" color="secondary" />
                  <Typography variant="caption">填空</Typography>
                  <Chip size="small" label={`${averageWinRates.cloze}%`} sx={{ height: 16, fontSize: '0.65rem' }} />
                </Stack>
              </TableCell>
              <TableCell align="center" width="70px">
                <Stack alignItems="center" spacing={0.5}>
                  <InputIcon fontSize="small" color="warning" />
                  <Typography variant="caption">输入</Typography>
                  <Chip size="small" label={`${averageWinRates.input}%`} sx={{ height: 16, fontSize: '0.65rem' }} />
                </Stack>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSentences.length > 0 ? paginatedSentences.map((sentence) => {
              const stat = getSentenceStats(sentence.id);
              const isExpanded = activeExpandedRow === sentence.id;
              
              // 直接使用服务器的 mastery_level（0-100的数字）
              const masteryLevel = stat?.mastery_level || 0;
              const modeStats = stat?.mode_stats || {};
              
              // 计算各模式的胜率
              const choiceWinRate = calculateWinRate(modeStats.choice?.correct || 0, modeStats.choice?.wrong || 0);
              const clozeWinRate = calculateWinRate(modeStats.cloze?.correct || 0, modeStats.cloze?.wrong || 0);
              const inputWinRate = calculateWinRate(modeStats.input?.correct || 0, modeStats.input?.wrong || 0);

              return (
                <React.Fragment key={sentence.id}>
                  <TableRow hover sx={{ bgcolor: isExpanded ? '#e3f2fd' : 'inherit' }}>
                    <TableCell padding="checkbox">
                      <IconButton size="small" onClick={() => handleExpandClick(sentence.id)}>
                        {isExpanded ? <ExpandLessIcon /> : <ChevronRightIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`Unit ${sentence.unit || 1}`} 
                        size="small" 
                        variant="outlined"
                        color={sentence.unit === selectedUnit ? 'primary' : 'default'}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell><Typography fontWeight={500}>{sentence.english}</Typography></TableCell>
                    <TableCell><Typography color="text.secondary">{sentence.chinese}</Typography></TableCell>
                    <TableCell><Chip label={sentence.type || '普通'} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <HistoryIcon sx={{ fontSize: 16, color: '#666' }} />
                        <Typography>{stat?.extract_count || 0}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {masteryLevel > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ 
                            color: masteryLevel >= 80 ? 'success.main' : 
                                   masteryLevel >= 60 ? 'warning.main' : 'error.main' 
                          }}>
                            {masteryLevel}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={masteryLevel} 
                            sx={{ 
                              width: 40, 
                              height: 4, 
                              borderRadius: 2,
                              '& .MuiLinearProgress-bar': {
                                bgcolor: masteryLevel >= 80 ? '#4caf50' : 
                                        masteryLevel >= 60 ? '#ff9800' : '#f44336'
                              }
                            }} 
                          />
                        </Box>
                      ) : (
                        <Typography variant="caption">未练习</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatDate(stat?.last_practiced)}>
                        <Typography variant="caption">{stat?.last_practiced ? formatDate(stat.last_practiced) : '从未'}</Typography>
                      </Tooltip>
                    </TableCell>
                    {/* 各模式的胜率单元格 */}
                    <TableCell align="center">
                      {choiceWinRate > 0 ? (
                        <Chip 
                          size="small" 
                          label={`${choiceWinRate}%`} 
                          color={choiceWinRate >= 80 ? 'success' : choiceWinRate >= 60 ? 'warning' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {clozeWinRate > 0 ? (
                        <Chip 
                          size="small" 
                          label={`${clozeWinRate}%`} 
                          color={clozeWinRate >= 80 ? 'success' : clozeWinRate >= 60 ? 'warning' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {inputWinRate > 0 ? (
                        <Chip 
                          size="small" 
                          label={`${inputWinRate}%`} 
                          color={inputWinRate >= 80 ? 'success' : inputWinRate >= 60 ? 'warning' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={11} sx={{ p: 0 }}>
                        <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                          <Grid container spacing={2}>
                            {/* 句子详情 */}
                            <Grid item xs={12} md={5}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>📖 句子详情</Typography>
                                <Typography variant="body2"><strong>单元：</strong>Unit {sentence.unit || 1}</Typography>
                                <Typography variant="body2"><strong>英文：</strong>{sentence.english}</Typography>
                                <Typography variant="body2"><strong>中文：</strong>{sentence.chinese}</Typography>
                                {sentence.words && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption">单词拆分：</Typography>
                                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                                      {sentence.words.map((w, i) => <Chip key={i} label={w} size="small" variant="outlined" />)}
                                    </Stack>
                                  </Box>
                                )}
                              </Paper>
                            </Grid>

                            {/* 模式统计 + 最近结果 */}
                            <Grid item xs={12} md={7}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>📊 各模式统计</Typography>
                                <Grid container spacing={1}>
                                  {MODES.map(mode => {
                                    const mStat = modeStats[mode.key] || { correct: 0, wrong: 0 };
                                    const total = (mStat.correct || 0) + (mStat.wrong || 0);
                                    const recent = stat?.recent_results?.[mode.key] || [];
                                    const winRate = calculateWinRate(mStat.correct || 0, mStat.wrong || 0);
                                    
                                    return (
                                      <Grid item xs={12} sm={4} key={mode.key}>
                                        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: total > 0 ? mode.color : '#f5f5f5' }}>
                                          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                                            {mode.icon}
                                            <Typography variant="body2">{mode.name}</Typography>
                                          </Stack>
                                          
                                          {/* 胜率标题 */}
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5, fontWeight: 500 }}>
                                            胜率 {winRate}%
                                          </Typography>
                                          
                                          {/* 统计数字 */}
                                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 0.5 }}>
                                            <Typography variant="body2" color="success.main">✓ {mStat.correct || 0}</Typography>
                                            <Typography variant="body2" color="error.main">✗ {mStat.wrong || 0}</Typography>
                                          </Box>
                                          
                                          {/* 最近3次结果 */}
                                          {recent.length > 0 && (
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #ccc' }}>
                                              <Typography variant="caption" color="text.secondary" display="block">
                                                最近{recent.length}次:
                                              </Typography>
                                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                                {recent.map((r, i) => (
                                                  <Typography
                                                    key={i}
                                                    sx={{
                                                      color: r ? 'success.main' : 'error.main',
                                                      fontWeight: 'bold',
                                                      fontSize: '1.1rem'
                                                    }}
                                                  >
                                                    {r ? '✓' : '✗'}
                                                  </Typography>
                                                ))}
                                              </Stack>
                                            </Box>
                                          )}
                                        </Box>
                                      </Grid>
                                    );
                                  })}
                                </Grid>
                                
                                <Divider sx={{ my: 1.5 }} />
                                
                                {/* 掌握状态 */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2">
                                    掌握程度: {masteryLevel}%
                                    {masteryLevel >= 80 && ' (达标)'}
                                  </Typography>
                                  <Chip 
                                    size="small" 
                                    label={stat?.mastered ? '已掌握' : '未掌握'} 
                                    color={stat?.mastered ? 'success' : 'default'} 
                                  />
                                </Box>
                              </Paper>
                            </Grid>

                            {/* 答题历史 */}
                            {stat?.history?.length > 0 ? (
                              <Grid item xs={12}>
                                <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                                  <Typography variant="subtitle2" gutterBottom>📝 答题历史</Typography>
                                  {stat.history.slice().reverse().map((h, i) => {
                                    const mode = MODES.find(m => m.key === h.mode) || { name: h.mode, icon: null };
                                    return (
                                      <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                                        <CardContent sx={{ p: 2 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                            <Chip size="small" icon={mode.icon} label={mode.name} variant="outlined" />
                                            <Chip size="small" icon={h.result ? <CheckCircleIcon /> : <CancelIcon />} 
                                              label={h.result ? '正确' : '错误'} color={h.result ? 'success' : 'error'} />
                                            <Typography variant="caption">{formatDate(h.date)}</Typography>
                                          </Box>
                                          <Box sx={{ p: 1, bgcolor: h.result ? '#e8f5e8' : '#ffebee', borderRadius: 1 }}>
                                            <Typography variant="body2"><strong>答案：</strong>{h.userAnswer}</Typography>
                                            {!h.result && <Typography variant="body2" color="success.main"><strong>正确：</strong>{h.correctAnswer}</Typography>}
                                          </Box>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </Paper>
                              </Grid>
                            ) : (
                              <Grid item xs={12}>
                                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                                  <HistoryIcon sx={{ fontSize: 40, color: '#ccc' }} />
                                  <Typography variant="body2">暂无答题历史</Typography>
                                </Paper>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            }) : (
              <TableRow><TableCell colSpan={11} sx={{ py: 8, textAlign: 'center' }}>没有找到匹配的句子</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredSentences.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredSentences.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          labelRowsPerPage="每页显示"
        />
      )}
    </Paper>
  );
};

export default SentenceMasterView;