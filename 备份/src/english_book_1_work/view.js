import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Chip, IconButton, Tooltip, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  LinearProgress, Skeleton, InputAdornment, Alert, Avatar, Stack, Modal, Backdrop,
  Fade, Divider, FormControl, InputLabel, Select, MenuItem, TableSortLabel
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent,
  TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import {
  ExpandLess, ChevronRight, PlayArrow, CheckCircle, Cancel, History,
  MenuBook, Search, Clear, Category, School, VolumeUp, ArrowBack, Close,
  ZoomIn, ZoomOut, RotateRight, Refresh, FilterList, Sort, AccessTime,
  Image, Translate, Hearing, Quiz
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { wordMemoryApi } from './api';

const StyledTableCell = styled(TableCell)({ fontWeight: 500, bgcolor: '#f5f5f5' });

const UnitChip = styled(Chip)(({ unit }) => ({
  bgcolor: unit === 1 ? '#e3f2fd' : unit === 2 ? '#fff3e0' : '#f5f5f5',
  color: unit === 1 ? '#1976d2' : unit === 2 ? '#f57c00' : '#666',
  '& .MuiChip-label': { fontSize: '0.7rem' }
}));

const RecentResultDot = styled(Box)(({ correct }) => ({
  width: 10, height: 10, borderRadius: '50%',
  bgcolor: correct ? '#4caf50' : '#f44336',
  display: 'inline-block', mr: 0.5
}));

const WordView = ({ onBack }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [availableUnits, setAvailableUnits] = useState([]);
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ src: '', alt: '' });
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  const getImageUrl = (path) => path?.startsWith('./') 
    ? `https://www.ddstudent.xyz/server/src/1_english/resource/english_book_1_work/${path.substring(2)}` 
    : path || '';

  const getWordImage = (w) => w?.image ? getImageUrl(w.image) : w?.images?.[0]?.url ? getImageUrl(w.images[0].url) : '';
  const getWordAlt = (w) => w?.images?.[0]?.alt || w?.word || '单词图片';
  const getTranslation = (w) => typeof w?.translation === 'string' ? w.translation : w?.translation?.[0] || '';
  
  const getMasteryLabel = (level) => {
    if (!level) return { label: '未练习', color: 'default' };
    if (level >= 80) return { label: '已掌握', color: 'success' };
    if (level >= 60) return { label: '熟练', color: 'info' };
    if (level >= 40) return { label: '学习中', color: 'warning' };
    return { label: '生疏', color: 'error' };
  };

  const getMasteryValue = (w) => w.stats?.mastery_level || 0;
  const getPracticeCount = (w) => w.stats?.extract_count || 0;
  const getLastPracticed = (w) => w.stats?.last_practiced 
    ? new Date(w.stats.last_practiced).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;
  const formatDate = (d) => new Date(d).toLocaleString('zh-CN');

  const isModeMastered = (w, mode) => {
    const r = w.stats?.recent_results?.[mode] || [];
    return r.length >= 2 && r.slice(-2).every(v => v === true);
  };

  const speak = (word) => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  useEffect(() => { loadWords(); }, []);

  useEffect(() => {
    if (words.length) {
      const units = [...new Set(words.map(w => w.unit).filter(u => u != null))].sort((a, b) => a - b);
      setAvailableUnits(units);
      if (unitFilter !== 'all' && !units.includes(parseInt(unitFilter))) setUnitFilter('all');
    }
  }, [words]);

  const loadWords = async () => {
    setLoading(true);
    try {
      const res = await wordMemoryApi.getWords();
      if (res.flag === 1) setWords(res.content.words || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = useMemo(() => {
    let filtered = words;
    if (unitFilter !== 'all') filtered = filtered.filter(w => w.unit === parseInt(unitFilter));
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(w => 
        w.word.toLowerCase().includes(term) ||
        getTranslation(w).toLowerCase().includes(term) ||
        w.category?.toLowerCase().includes(term)
      );
    }
    filtered.sort((a, b) => {
      let va = orderBy === 'word' ? a.word?.toLowerCase() :
               orderBy === 'translation' ? getTranslation(a).toLowerCase() :
               orderBy === 'unit' ? (a.unit || 0) :
               orderBy === 'category' ? (a.category || '') :
               orderBy === 'mastery' ? getMasteryValue(a) :
               orderBy === 'practice' ? getPracticeCount(a) :
               orderBy === 'lastPracticed' ? (a.stats?.last_practiced || '') :
               a.id;
      let vb = orderBy === 'word' ? b.word?.toLowerCase() :
               orderBy === 'translation' ? getTranslation(b).toLowerCase() :
               orderBy === 'unit' ? (b.unit || 0) :
               orderBy === 'category' ? (b.category || '') :
               orderBy === 'mastery' ? getMasteryValue(b) :
               orderBy === 'practice' ? getPracticeCount(b) :
               orderBy === 'lastPracticed' ? (b.stats?.last_practiced || '') :
               b.id;
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return order === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return filtered;
  }, [words, searchTerm, unitFilter, orderBy, order]);

  const handleImageClick = (src, alt, e) => {
    e?.stopPropagation();
    if (src) { setSelectedImage({ src, alt }); setModalOpen(true); }
  };

  const paginated = filteredWords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const getUnitCount = (unit) => words.filter(w => w.unit === unit).length;

  if (loading) return <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}><LinearProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={onBack} sx={{ color: 'white' }}><ArrowBack /></IconButton>
          <School /><Typography variant="h6">单词预览</Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" placeholder="搜索单词、释义或分类..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                endAdornment: searchTerm && <IconButton size="small" onClick={() => setSearchTerm('')}><Clear /></IconButton>
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>单元筛选</InputLabel>
              <Select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} startAdornment={<FilterList fontSize="small" sx={{ mr: 1 }} />}>
                <MenuItem value="all">全部单元 ({words.length}个)</MenuItem>
                {availableUnits.map(u => <MenuItem key={u} value={u.toString()}>第 {u} 单元 ({getUnitCount(u)}个)</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sort color="action" />
              <Typography variant="caption">排序: {orderBy} {order === 'asc' ? '↑' : '↓'}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell padding="checkbox">展开</StyledTableCell>
              <StyledTableCell>图片</StyledTableCell>
              {['word', 'translation', 'unit', 'category', 'mastery', 'practice', 'lastPracticed'].map(f => (
                <StyledTableCell key={f}>
                  <TableSortLabel active={orderBy === f} direction={orderBy === f ? order : 'asc'} onClick={() => {
                    if (orderBy === f) setOrder(order === 'asc' ? 'desc' : 'asc');
                    else { setOrderBy(f); setOrder('asc'); }
                  }}>
                    {f === 'word' ? '单词' : f === 'translation' ? '释义' : f === 'unit' ? '单元' : f === 'category' ? '分类' : f === 'mastery' ? '掌握分' : f === 'practice' ? '练习' : '最近练习'}
                  </TableSortLabel>
                </StyledTableCell>
              ))}
              <StyledTableCell>操作</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(word => {
              const expanded = expandedRow === word.id;
              const mastery = getMasteryLabel(getMasteryValue(word));
              return (
                <React.Fragment key={word.id}>
                  <TableRow hover sx={{ bgcolor: expanded ? '#e3f2fd' : 'inherit' }}>
                    <TableCell><IconButton size="small" onClick={() => setExpandedRow(expanded ? null : word.id)}>{expanded ? <ExpandLess /> : <ChevronRight />}</IconButton></TableCell>
                    <TableCell>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar src={getWordImage(word)} variant="rounded" sx={{ width: 50, height: 50, cursor: 'pointer' }}
                          onClick={(e) => handleImageClick(getWordImage(word), getWordAlt(word), e)} />
                        <ZoomIn sx={{ position: 'absolute', bottom: -4, right: -4, fontSize: 14, bgcolor: 'white', borderRadius: '50%' }} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontWeight={500}>{word.word}</Typography>
                        <IconButton size="small" onClick={() => speak(word.word)}><VolumeUp fontSize="small" /></IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell>{getTranslation(word)}</TableCell>
                    <TableCell>{word.unit && <UnitChip label={`第${word.unit}单元`} unit={word.unit} size="small" />}</TableCell>
                    <TableCell><Chip label={word.category || '未分类'} size="small" variant="outlined" icon={<Category />} /></TableCell>
                    <TableCell>
                      {getPracticeCount(word) > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={`${getMasteryValue(word)}分`} size="small" color={mastery.color} sx={{ minWidth: 50 }} />
                          <LinearProgress variant="determinate" value={getMasteryValue(word)} sx={{ width: 50, height: 6, borderRadius: 3 }} />
                        </Box>
                      ) : '未练习'}
                    </TableCell>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><History sx={{ fontSize: 16 }} />{getPracticeCount(word)}</Box></TableCell>
                    <TableCell>
                      {getLastPracticed(word) ? 
                        <Tooltip title={formatDate(word.stats.last_practiced)}><Typography variant="caption">{getLastPracticed(word)}</Typography></Tooltip> : 
                        <Typography variant="caption">从未</Typography>}
                    </TableCell>
                    <TableCell><IconButton size="small" color="primary"><PlayArrow /></IconButton></TableCell>
                  </TableRow>
                  
                  {expanded && (
                    <TableRow>
                      <TableCell colSpan={10} sx={{ p: 0 }}>
                        <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="primary" gutterBottom>详细信息</Typography>
                                <Stack spacing={2}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">ID</Typography>
                                    <Typography variant="body2">{word.id}</Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">音标</Typography>
                                    <Typography variant="body2">{word.phonetic || '暂无'}</Typography>
                                  </Box>
                                  <Divider />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">例句</Typography>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{word.example || '暂无'}</Typography>
                                    {word.exampleTranslation && (
                                      <Typography variant="body2" color="text.secondary">{word.exampleTranslation}</Typography>
                                    )}
                                  </Box>
                                </Stack>
                              </Paper>
                            </Grid>
                            
                            {word.stats && (
                              <Grid item xs={12} md={4}>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>学习统计</Typography>
                                  
                                  {/* 统计数字 */}
                                  <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={4}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6">{word.stats.extract_count || 0}</Typography>
                                        <Typography variant="caption">练习</Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="success.main">{word.stats.correct_count || 0}</Typography>
                                        <Typography variant="caption">正确</Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="error.main">{word.stats.wrong_count || 0}</Typography>
                                        <Typography variant="caption">错误</Typography>
                                      </Box>
                                    </Grid>
                                  </Grid>

                                  {/* 各模式统计 */}
                                  {['picture', 'en2zh', 'listen'].map(mode => {
                                    const modeStats = word.stats.mode_stats?.[mode] || { correct: 0, wrong: 0 };
                                    const total = modeStats.correct + modeStats.wrong;
                                    const accuracy = total > 0 ? Math.round((modeStats.correct / total) * 100) : 0;
                                    
                                    return (
                                      <Box key={mode} sx={{ mb: 1.5 }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                          <Typography variant="caption" fontWeight={500}>
                                            {mode === 'picture' ? '看图' : mode === 'en2zh' ? '英译中' : '听力'}:
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            正确 {modeStats.correct || 0} / 错误 {modeStats.wrong || 0} ({accuracy}%)
                                          </Typography>
                                        </Stack>
                                        
                                        {/* 最近结果圆点 */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {(word.stats.recent_results?.[mode] || []).map((r, i) => (
                                              <Tooltip key={i} title={`第${i+1}次: ${r ? '正确' : '错误'}`}>
                                                <RecentResultDot correct={r} />
                                              </Tooltip>
                                            ))}
                                          </Box>
                                          {isModeMastered(word, mode) && (
                                            <Chip 
                                              size="small" 
                                              label="✓ 已掌握" 
                                              color="success" 
                                              sx={{ height: 18, fontSize: '0.6rem' }} 
                                            />
                                          )}
                                        </Box>
                                      </Box>
                                    );
                                  })}
                                </Paper>
                              </Grid>
                            )}
                            
                            <Grid item xs={12} md={4}>
                              <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                                <Stack direction="row" spacing={1} sx={{ mb: 2 }}><History color="primary" /><Typography variant="subtitle2" color="primary">练习历史</Typography></Stack>
                                {(word.stats?.history || []).length === 0 ? (
                                  <Box sx={{ textAlign: 'center', py: 3 }}><History sx={{ fontSize: 40, color: '#ccc' }} /><Typography variant="caption">暂无记录</Typography></Box>
                                ) : (
                                  <Timeline position="right" sx={{ p: 0 }}>
                                    {word.stats.history.slice().reverse().map((h, i) => (
                                      <TimelineItem key={i}>
                                        <TimelineOppositeContent sx={{ flex: 0.2 }} variant="caption">
                                          {new Date(h.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                        </TimelineOppositeContent>
                                        <TimelineSeparator>
                                          <TimelineDot color={h.result ? 'success' : 'error'} sx={{ m: 0 }}>
                                            {h.result ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                                          </TimelineDot>
                                          {i < word.stats.history.length - 1 && <TimelineConnector />}
                                        </TimelineSeparator>
                                        <TimelineContent sx={{ py: 0 }}>
                                          <Paper elevation={0} sx={{ p: 1, bgcolor: '#f5f5f5' }}>
                                            <Typography variant="caption">
                                              {h.mode === 'picture' ? '📷' : h.mode === 'en2zh' ? '📖' : '👂'} {h.userAnswer} {!h.result && `→ ${h.correctAnswer}`}
                                            </Typography>
                                          </Paper>
                                        </TimelineContent>
                                      </TimelineItem>
                                    ))}
                                  </Timeline>
                                )}
                              </Paper>
                            </Grid>

                            {word.images && word.images.length > 1 && (
                              <Grid item xs={12}>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>更多图片</Typography>
                                  <Grid container spacing={1}>
                                    {word.images.map((img, idx) => (
                                      <Grid item key={idx}>
                                        <Box sx={{ position: 'relative' }}>
                                          <Avatar src={getImageUrl(img.url)} variant="rounded" sx={{ width: 60, height: 60, cursor: 'pointer' }}
                                            onClick={(e) => handleImageClick(getImageUrl(img.url), img.alt, e)} />
                                          <ZoomIn sx={{ position: 'absolute', bottom: 0, right: 0, fontSize: 14, bgcolor: 'white', borderRadius: '50%' }} />
                                        </Box>
                                      </Grid>
                                    ))}
                                  </Grid>
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
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination rowsPerPageOptions={[5,10,25,50]} component="div" count={filteredWords.length}
        rowsPerPage={rowsPerPage} page={page} onPageChange={(e, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        labelRowsPerPage="每页显示" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500, sx: { bgcolor: 'rgba(0,0,0,0.95)' } }}>
        <Fade in={modalOpen}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', outline: 'none' }}>
            <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 1 }}>
              <Paper sx={{ display: 'flex', gap: 0.5, p: 0.5, bgcolor: 'rgba(0,0,0,0.6)' }}>
                <IconButton onClick={() => setImageScale(s => Math.max(s - 0.25, 0.5))} sx={{ color: 'white' }}><ZoomOut /></IconButton>
                <IconButton onClick={() => setImageScale(s => Math.min(s + 0.25, 3))} sx={{ color: 'white' }}><ZoomIn /></IconButton>
                <IconButton onClick={() => setImageRotation(r => (r + 90) % 360)} sx={{ color: 'white' }}><RotateRight /></IconButton>
                <IconButton onClick={() => { setImageScale(1); setImageRotation(0); }} sx={{ color: 'white' }}><Refresh /></IconButton>
              </Paper>
              <IconButton onClick={() => setModalOpen(false)} sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}><Close /></IconButton>
            </Box>
            <Box sx={{ transform: `scale(${imageScale}) rotate(${imageRotation}deg)` }}>
              <img src={selectedImage.src} alt={selectedImage.alt} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default WordView;