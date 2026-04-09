// src/pages/LearningCenter.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Chip,
  Button,
  Container,
  Paper,
  LinearProgress,
  TextField,
  Alert,
  IconButton,
  Snackbar,
  Tabs,
  Tab,
  Tooltip,
  FormControl,
  Select,
  Avatar,
  Grid,
  RadioGroup,
  Radio,
  FormControlLabel,
  Slider,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Fade,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Storage as StorageIcon,
  MenuBook,
  Assessment,
  Star as StarIcon,
  FilterList as FilterListIcon,
  Shuffle as ShuffleIcon,
  SortByAlpha,
  Quiz as QuizIcon,
  ViewList,
  PlayArrow,
  Close as CloseIcon,
  Add as AddIcon,
  DragHandle as DragHandleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Casino as CasinoIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SingleChoiceTest from './select_test';
import QuestionMasterView from './select_master_view';
import { questionApi } from './api';
import WordTranslator from '../translator/index.js';

// 默认题库配置
const DEFAULT_DATA_SOURCES = [
  {
    id: 'master',
    name: '默认题库',
    icon: '📚',
    color: '#1a237e',
    description: '标准英语选择题库',
    totalQuestions: 95
  }
];

// 抽取模式选项
const DRAW_OPTIONS = [
  { value: 'new', label: '抽取新题', icon: <StarIcon sx={{ fontSize: 18 }} />, description: '只抽取未练习过的题目' },
  { value: 'range', label: '范围抽取', icon: <StorageIcon sx={{ fontSize: 18 }} />, description: '按题号范围抽取所有题目' },
  { value: 'rangeRandom', label: '范围随机抽取', icon: <CasinoIcon sx={{ fontSize: 18 }} />, description: '从指定范围内随机抽取指定数量' }
];

// Tab面板组件
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && children}
  </div>
);

// 悬浮抽取+题目预览对话框组件
const FloatingDrawDialog = ({
  open,
  onClose,
  currentSource,
  allQuestions,
  newQuestionStats,
  onConfirm,
  loading,
  questions,
  onStartTest,
  onRedraw
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({
    x: Math.max(20, (window.innerWidth - (isMobile ? 350 : 900)) / 2),
    y: Math.max(20, (window.innerHeight - (isMobile ? 500 : 600)) / 2)
  });
  const [drawType, setDrawType] = useState('new');
  const [drawSettings, setDrawSettings] = useState({
    drawSubType: 'new',
    sortType: 'random',
    count: 10,
    rangeStart: 1,
    rangeEnd: 10,
    randomCount: 10
  });
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(10);
  const [tempStart, setTempStart] = useState('1');
  const [tempEnd, setTempEnd] = useState('10');
  const [renderKey, setRenderKey] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(Math.max(20, prev.x), window.innerWidth - (isMobile ? 370 : 920)),
        y: Math.min(Math.max(20, prev.y), window.innerHeight - (isMobile ? 520 : 620))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useEffect(() => {
    console.log('【悬浮对话框】questions 数据更新:', {
      hasQuestions: questions && questions.length > 0,
      count: questions?.length || 0
    });
    setRenderKey(prev => prev + 1);
  }, [questions]);

  useEffect(() => {
    console.log('【悬浮对话框】open 状态变化:', open);
  }, [open]);

  useEffect(() => {
    if (open) {
      console.log('【悬浮对话框】对话框打开');
      setDrawType('new');
      setDrawSettings({
        drawSubType: 'new',
        sortType: 'random',
        count: 10,
        rangeStart: 1,
        rangeEnd: 10,
        randomCount: 10
      });
      setRangeStart(1);
      setRangeEnd(10);
      setTempStart('1');
      setTempEnd('10');
    }
  }, [open]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: Math.min(Math.max(20, e.clientX - dragOffset.x), window.innerWidth - (isMobile ? 370 : 920)),
        y: Math.min(Math.max(20, e.clientY - dragOffset.y), window.innerHeight - (isMobile ? 520 : 620))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleNewQuestionSettingsChange = (key, value) => {
    setDrawSettings(prev => ({ ...prev, [key]: value }));
  };

  const getAvailableCount = () => {
    if (drawType === 'new') {
      switch (drawSettings.drawSubType) {
        case 'new': return newQuestionStats.newCount;
        case 'weak': return newQuestionStats.weakCount;
        case 'review': return newQuestionStats.reviewCount;
        default: return newQuestionStats.total;
      }
    } else if (drawType === 'range') {
      return allQuestions.filter(q => {
        const qId = parseInt(q.id);
        return qId >= rangeStart && qId <= rangeEnd;
      }).length;
    } else {
      return allQuestions.filter(q => {
        const qId = parseInt(q.id);
        return qId >= rangeStart && qId <= rangeEnd;
      }).length;
    }
  };

  const getMaxCount = () => {
    if (drawType === 'new') {
      switch (drawSettings.drawSubType) {
        case 'new': return newQuestionStats.newCount;
        case 'weak': return newQuestionStats.weakCount;
        case 'review': return newQuestionStats.reviewCount;
        default: return newQuestionStats.total;
      }
    } else if (drawType === 'range') {
      return rangeEnd - rangeStart + 1;
    } else {
      return getAvailableCount();
    }
  };

  const handleDraw = () => {
    console.log('【悬浮对话框】点击开始抽取按钮', { drawType, drawSettings, rangeStart, rangeEnd });
    if (drawType === 'range') {
      onConfirm(drawType, { start: rangeStart, end: rangeEnd });
    } else if (drawType === 'rangeRandom') {
      onConfirm(drawType, { 
        start: rangeStart, 
        end: rangeEnd,
        count: drawSettings.randomCount
      });
    } else {
      onConfirm(drawType, drawSettings);
    }
  };

  const hasQuestions = questions && Array.isArray(questions) && questions.length > 0;

  return (
    <Paper
      key={renderKey}
      ref={panelRef}
      elevation={12}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: isMobile ? '95vw' : 900,
        maxWidth: '95vw',
        maxHeight: isMobile ? '90vh' : '85vh',
        backgroundColor: '#ffffff',
        borderRadius: 3,
        overflow: 'hidden',
        zIndex: 1400,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        display: open ? 'flex' : 'none',
        flexDirection: 'column'
      }}
    >
      <Box
        className="drag-handle"
        onMouseDown={handleMouseDown}
        sx={{
          p: 1.5,
          bgcolor: '#1a237e',
          color: 'white',
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          '&:active': { cursor: 'grabbing' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragHandleIcon sx={{ fontSize: 20, cursor: 'grab' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            抽取题目
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row'
        }}
      >
        <Box
          sx={{
            width: isMobile ? '100%' : '40%',
            minWidth: isMobile ? 'auto' : 280,
            borderRight: isMobile ? 'none' : '1px solid #eaeaea',
            borderBottom: isMobile ? '1px solid #eaeaea' : 'none',
            overflow: 'auto',
            p: 2,
            maxHeight: isMobile ? '50%' : '100%'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{currentSource?.name}</Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              题库统计
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={3}>
                <Card variant="outlined" sx={{ bgcolor: '#e8f5e9', textAlign: 'center', py: 1 }}>
                  <Typography variant="caption" color="text.secondary">新题</Typography>:&nbsp;
                  <span variant="body2" sx={{ fontWeight: 'bold', color: '#388e3c' }}>{newQuestionStats.newCount}</span>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card variant="outlined" sx={{ bgcolor: '#fff3e0', textAlign: 'center', py: 1 }}>
                  <Typography variant="caption" color="text.secondary">复习</Typography>:&nbsp;
                  <span variant="body2" sx={{ fontWeight: 'bold', color: '#f57c00' }}>{newQuestionStats.reviewCount}</span>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card variant="outlined" sx={{ bgcolor: '#ffebee', textAlign: 'center', py: 1 }}>
                  <Typography variant="caption" color="text.secondary">薄弱</Typography>:&nbsp;
                  <span variant="body2" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>{newQuestionStats.weakCount}</span>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card variant="outlined" sx={{ bgcolor: '#e3f2fd', textAlign: 'center', py: 1 }}>
                  <Typography variant="caption" color="text.secondary">总计</Typography>:&nbsp;
                  <span variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{newQuestionStats.total}</span>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              <FilterListIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
              抽取设置
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {DRAW_OPTIONS.map(option => (
                <Button
                  key={option.value}
                  variant={drawType === option.value ? 'contained' : 'outlined'}
                  onClick={() => setDrawType(option.value)}
                  startIcon={option.icon}
                  size="small"
                  sx={{
                    flex: 1,
                    minWidth: '100px',
                    bgcolor: drawType === option.value ? '#1a237e' : 'transparent'
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Box>

            {drawType === 'new' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  题目类型
                </Typography>
                <RadioGroup
                  value={drawSettings.drawSubType}
                  onChange={(e) => handleNewQuestionSettingsChange('drawSubType', e.target.value)}
                  row
                  sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
                >
                  <FormControlLabel
                    value="new"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">新题({newQuestionStats.newCount})</Typography>
                    }
                    sx={{ mr: 1 }}
                  />
                  <FormControlLabel
                    value="weak"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">薄弱({newQuestionStats.weakCount})</Typography>
                    }
                    sx={{ mr: 1 }}
                  />
                  <FormControlLabel
                    value="review"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">复习({newQuestionStats.reviewCount})</Typography>
                    }
                    sx={{ mr: 1 }}
                  />
                  <FormControlLabel
                    value="all"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">全部({newQuestionStats.total})</Typography>
                    }
                  />
                </RadioGroup>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  排序方式
                </Typography>
                <RadioGroup
                  value={drawSettings.sortType}
                  onChange={(e) => handleNewQuestionSettingsChange('sortType', e.target.value)}
                  row
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel value="random" control={<Radio size="small" />} label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ShuffleIcon fontSize="small" />
                      <Typography variant="body2">随机</Typography>
                    </Box>
                  } />
                  <FormControlLabel value="sequential" control={<Radio size="small" />} label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SortByAlpha fontSize="small" />
                      <Typography variant="body2">顺序</Typography>
                    </Box>
                  } />
                </RadioGroup>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  抽取数量
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={drawSettings.count}
                    onChange={(e, val) => handleNewQuestionSettingsChange('count', val)}
                    min={1}
                    max={Math.min(50, getMaxCount())}
                    valueLabelDisplay="auto"
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={drawSettings.count}
                    onChange={(e) => handleNewQuestionSettingsChange('count', Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    size="small"
                    sx={{ width: 70 }}
                  />
                  <Typography variant="body2">题</Typography>
                </Box>
              </Box>
            )}

            {drawType === 'range' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  题号范围 (1-{allQuestions.length || 95})
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    type="number"
                    label="起始"
                    value={tempStart}
                    onChange={(e) => {
                      setTempStart(e.target.value);
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) setRangeStart(val);
                    }}
                    onBlur={() => {
                      const maxVal = allQuestions.length || 95;
                      let val = parseInt(tempStart);
                      if (isNaN(val)) val = 1;
                      val = Math.min(Math.max(val, 1), maxVal);
                      setRangeStart(val);
                      setTempStart(String(val));
                    }}
                    size="small"
                    sx={{ width: 100 }}
                  />
                  <Typography>—</Typography>
                  <TextField
                    type="number"
                    label="结束"
                    value={tempEnd}
                    onChange={(e) => {
                      setTempEnd(e.target.value);
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) setRangeEnd(val);
                    }}
                    onBlur={() => {
                      const maxVal = allQuestions.length || 95;
                      let val = parseInt(tempEnd);
                      if (isNaN(val)) val = 10;
                      val = Math.min(Math.max(val, 1), maxVal);
                      setRangeEnd(val);
                      setTempEnd(String(val));
                    }}
                    size="small"
                    sx={{ width: 100 }}
                  />
                </Box>
                <Alert severity="info" sx={{ mt: 2, py: 0 }}>
                  <Typography variant="caption">
                    将抽取范围内所有题目（共{getAvailableCount()}题）
                  </Typography>
                </Alert>
              </Box>
            )}

            {drawType === 'rangeRandom' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  题号范围 (1-{allQuestions.length || 95})
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TextField
                    type="number"
                    label="起始"
                    value={tempStart}
                    onChange={(e) => {
                      setTempStart(e.target.value);
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) setRangeStart(val);
                    }}
                    onBlur={() => {
                      const maxVal = allQuestions.length || 95;
                      let val = parseInt(tempStart);
                      if (isNaN(val)) val = 1;
                      val = Math.min(Math.max(val, 1), maxVal);
                      setRangeStart(val);
                      setTempStart(String(val));
                    }}
                    size="small"
                    sx={{ width: 100 }}
                  />
                  <Typography>—</Typography>
                  <TextField
                    type="number"
                    label="结束"
                    value={tempEnd}
                    onChange={(e) => {
                      setTempEnd(e.target.value);
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) setRangeEnd(val);
                    }}
                    onBlur={() => {
                      const maxVal = allQuestions.length || 95;
                      let val = parseInt(tempEnd);
                      if (isNaN(val)) val = 10;
                      val = Math.min(Math.max(val, 1), maxVal);
                      setRangeEnd(val);
                      setTempEnd(String(val));
                    }}
                    size="small"
                    sx={{ width: 100 }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  随机抽取数量
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Slider
                    value={drawSettings.randomCount}
                    onChange={(e, val) => handleNewQuestionSettingsChange('randomCount', val)}
                    min={1}
                    max={Math.min(50, getMaxCount())}
                    valueLabelDisplay="auto"
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    value={drawSettings.randomCount}
                    onChange={(e) => handleNewQuestionSettingsChange('randomCount', Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    size="small"
                    sx={{ width: 70 }}
                  />
                  <Typography variant="body2">题</Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 2, py: 0 }}>
                  <Typography variant="caption">
                    范围内共有{getAvailableCount()}题，将从中随机抽取{drawSettings.randomCount}题
                  </Typography>
                </Alert>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 1, mb: 2, py: 0 }}>
              <Typography variant="caption">
                可抽取: {getAvailableCount()} 题
              </Typography>
            </Alert>

            <Button
              fullWidth
              variant="contained"
              onClick={handleDraw}
              disabled={loading || (drawType === 'range' && rangeStart > rangeEnd) || getAvailableCount() === 0 || (drawType === 'rangeRandom' && drawSettings.randomCount > getAvailableCount())}
              sx={{
                bgcolor: '#1a237e',
                py: 1.5,
                '&:hover': { bgcolor: '#0d1a5c' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '开始抽取'}
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'auto',
            p: 2,
            bgcolor: '#fafafa',
            maxHeight: isMobile ? '50%' : '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <ViewList fontSize="small" />
            已抽取题目 {hasQuestions ? `(${questions.length}题)` : '(0题)'}
          </Typography>

          {!hasQuestions ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minHeight: 200,
              color: '#999'
            }}>
              <QuizIcon sx={{ fontSize: 64, mb: 2, color: '#ccc' }} />
              <Typography variant="body1" color="text.secondary" align="center">
                暂无抽取题目<br />
                请在左侧设置抽取条件并点击"开始抽取"
              </Typography>
            </Box>
          ) : (
            <>
              <List sx={{
                width: '100%',
                bgcolor: 'background.paper',
                borderRadius: 2,
                mb: 2,
                flex: 1,
                overflow: 'auto'
              }}>
                {questions.map((q, idx) => (
                  <ListItem
                    key={q.id}
                    divider
                    sx={{
                      py: 1.5,
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          bgcolor: '#1a237e',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}
                      >
                        {idx + 1}
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, wordBreak: 'break-word' }}>
                          {q.question.length > 60 ? q.question.substring(0, 60) + '...' : q.question}
                        </Typography>
                        {q.category && (
                          <Chip
                            label={q.category}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    console.log('【悬浮对话框】点击重新抽取按钮');
                    onRedraw();
                  }}
                  size="medium"
                >
                  重新抽取
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => {
                    console.log('【悬浮对话框】点击开始测试按钮, 题目数量:', questions.length);
                    onStartTest();
                  }}
                  sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
                  size="medium"
                >
                  开始测试 ({questions.length}题)
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

const LearningCenter = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [dataSource, setDataSource] = useState('master');
  const [dataSources, setDataSources] = useState(DEFAULT_DATA_SOURCES);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 对话框状态
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);

  // 题目数据状态
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [testKey, setTestKey] = useState(0);
  
  // 保存当前抽取模式信息
  const [currentDrawInfo, setCurrentDrawInfo] = useState({
    type: 'new',
    subType: null,
    rangeStart: null,
    rangeEnd: null,
    count: 0,
    sortType: null
  });

  // 界面状态
  const [showTest, setShowTest] = useState(false);

  // 翻译器状态
  const [translatorOpen, setTranslatorOpen] = useState(false);
  const translatorRef = useRef(null);

  // 新题统计状态
  const [newQuestionStats, setNewQuestionStats] = useState({
    total: 0,
    newCount: 0,
    masteredCount: 0,
    weakCount: 0,
    reviewCount: 0
  });

  const currentSource = dataSources.find(s => s.id === dataSource) || dataSources[0];
  const memoizedAllQuestions = useMemo(() => allQuestions, [allQuestions]);

  // 监听文本选择事件
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 0 && selectedText.length <= 100) {
        const isEnglish = /^[a-zA-Z\s\-']+$/.test(selectedText);
        if (isEnglish) {
          const wordCount = selectedText.split(/\s+/).filter(w => w.length > 0).length;
          if (wordCount <= 7) {
            console.log('【LearningCenter】检测到选中文本:', selectedText);
            
            if (translatorRef.current) {
              translatorRef.current.translateText(selectedText);
            }
            
            if (!translatorOpen) {
              setTranslatorOpen(true);
            }
          }
        }
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);
    
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
    };
  }, [translatorOpen]);

  useEffect(() => {
    fetchDataSources();
  }, []);

  useEffect(() => {
    if (dataSource) {
      fetchAllQuestions();
    }
  }, [dataSource]);

  const fetchDataSources = async () => {
    setLoading(true);
    try {
      const response = await questionApi.getBanks();
      if (response.flag === 1 && response.content?.banks) {
        setDataSources(response.content.banks);
        const exists = response.content.banks.some(b => b.id === dataSource);
        if (!exists && response.content.banks.length > 0) {
          setDataSource(response.content.banks[0].id);
        }
      }
    } catch (error) {
      console.error('获取题库列表失败:', error);
      setSnackbar({ open: true, message: '获取题库列表失败', severity: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchDataSources();
      await fetchAllQuestions();
      setSnackbar({ open: true, message: '数据已刷新', severity: 'success' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const response = await questionApi.getMasterQuestions(dataSource);

      if (response.flag === 1) {
        let questions = [];

        if (response.content?.questions && Array.isArray(response.content.questions)) {
          questions = response.content.questions;
        } else if (response.questions && Array.isArray(response.questions)) {
          questions = response.questions;
        }

        const sortedQuestions = [...questions].sort((a, b) => {
          const aId = parseInt(a.id);
          const bId = parseInt(b.id);
          return aId - bId;
        });

        setAllQuestions(sortedQuestions);
        updateNewQuestionStats(sortedQuestions);

        setSnackbar({ open: true, message: `成功加载 ${sortedQuestions.length} 道题目`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: response.message || '加载失败', severity: 'error' });
        setAllQuestions([]);
      }
    } catch (error) {
      console.error('获取所有题目失败:', error);
      setSnackbar({ open: true, message: '网络错误，请稍后重试', severity: 'error' });
      setAllQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const updateNewQuestionStats = (questions) => {
    let newCount = 0;
    let masteredCount = 0;
    let weakCount = 0;
    let reviewCount = 0;

    questions.forEach(q => {
      const mastery = q.stats?.mastery_level || 0;
      const attempts = q.stats?.total_attempts || 0;

      if (attempts === 0 || mastery === 0) {
        newCount++;
      } else if (mastery >= 0.8) {
        masteredCount++;
      } else if (mastery >= 0.5) {
        reviewCount++;
      } else {
        weakCount++;
      }
    });

    setNewQuestionStats({
      total: questions.length,
      newCount,
      masteredCount,
      weakCount,
      reviewCount
    });
  };

  const fetchNewQuestions = async (settings) => {
    console.log('【LearningCenter】开始抽取新题', settings);
    setIsLoadingQuestions(true);

    try {
      let filteredQuestions = [];
      const drawSubType = settings.drawSubType || 'new';

      switch (drawSubType) {
        case 'new':
          filteredQuestions = allQuestions.filter(q => {
            const attempts = q.stats?.total_attempts || 0;
            return attempts === 0;
          });
          break;
        case 'weak':
          filteredQuestions = allQuestions.filter(q => {
            const attempts = q.stats?.total_attempts || 0;
            const mastery = q.stats?.mastery_level || 0;
            return attempts > 0 && mastery < 0.5;
          });
          break;
        case 'review':
          filteredQuestions = allQuestions.filter(q => {
            const attempts = q.stats?.total_attempts || 0;
            const mastery = q.stats?.mastery_level || 0;
            return attempts > 0 && mastery >= 0.5 && mastery < 0.8;
          });
          break;
        default:
          filteredQuestions = [...allQuestions];
          break;
      }

      console.log('【LearningCenter】筛选后题目数量:', filteredQuestions.length);

      if (filteredQuestions.length === 0) {
        let message = '';
        switch (drawSubType) {
          case 'new': message = '没有新题可抽，请先练习其他题目或切换模式'; break;
          case 'weak': message = '没有薄弱题，继续保持！'; break;
          case 'review': message = '没有需要复习的题目，继续保持！'; break;
          default: message = '没有题目可抽';
        }
        setSnackbar({ open: true, message, severity: 'warning' });
        setIsLoadingQuestions(false);
        return;
      }

      let selectedQuestions = [...filteredQuestions];

      if (settings.sortType === 'random') {
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }
      } else {
        selectedQuestions.sort((a, b) => {
          const aId = parseInt(a.id);
          const bId = parseInt(b.id);
          return aId - bId;
        });
      }

      const actualCount = Math.min(settings.count, selectedQuestions.length);
      // 添加实际模式信息到题目中
      const finalQuestions = selectedQuestions.slice(0, actualCount).map(q => ({
        ...q,
        _actualDrawType: 'new',
        _actualSubType: drawSubType,
        _actualRangeStart: null,
        _actualRangeEnd: null,
        _actualQuestionCount: actualCount,
        _actualSortType: settings.sortType
      }));

      console.log('【LearningCenter】抽取完成，设置题目数量:', finalQuestions.length);
      
      // 保存当前抽取模式信息
      setCurrentDrawInfo({
        type: 'new',
        subType: drawSubType,
        rangeStart: null,
        rangeEnd: null,
        count: actualCount,
        sortType: settings.sortType
      });

      setCurrentQuestions([...finalQuestions]);
      setTestKey(prev => prev + 1);

      const typeText = {
        'new': '新题',
        'weak': '薄弱题',
        'review': '复习题',
        'all': '全部题目'
      }[drawSubType];

      setSnackbar({
        open: true,
        message: `成功抽取 ${finalQuestions.length} 道${typeText}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('抽取失败:', error);
      setSnackbar({ open: true, message: '抽取失败', severity: 'error' });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const fetchRangeQuestions = async (start, end) => {
    console.log('【LearningCenter】开始范围全量抽取', { start, end });
    setIsLoadingQuestions(true);

    try {
      const filteredQuestions = allQuestions.filter(q => {
        const qId = parseInt(q.id);
        return qId >= start && qId <= end;
      });

      const sortedQuestions = [...filteredQuestions].sort((a, b) => {
        const aId = parseInt(a.id);
        const bId = parseInt(b.id);
        return aId - bId;
      }).map(q => ({
        ...q,
        _actualDrawType: 'range',
        _actualSubType: null,
        _actualRangeStart: start,
        _actualRangeEnd: end,
        _actualQuestionCount: filteredQuestions.length,
        _actualSortType: 'sequential'
      }));

      console.log('【LearningCenter】范围筛选后题目数量:', sortedQuestions.length);
      
      // 保存当前抽取模式信息
      setCurrentDrawInfo({
        type: 'range',
        subType: null,
        rangeStart: start,
        rangeEnd: end,
        count: sortedQuestions.length,
        sortType: 'sequential'
      });

      if (sortedQuestions.length === 0) {
        setSnackbar({
          open: true,
          message: `第 ${start}-${end} 题范围内没有题目`,
          severity: 'warning'
        });
        setCurrentQuestions([]);
      } else {
        setCurrentQuestions([...sortedQuestions]);
        setTestKey(prev => prev + 1);

        setSnackbar({
          open: true,
          message: `成功从第 ${start}-${end} 题中抽取 ${sortedQuestions.length} 道题`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('范围抽取异常:', error);
      setSnackbar({ open: true, message: '范围抽取失败', severity: 'error' });
      setCurrentQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const fetchRangeRandomQuestions = async (start, end, count) => {
    console.log('【LearningCenter】开始范围随机抽取', { start, end, count });
    setIsLoadingQuestions(true);

    try {
      const availableQuestions = allQuestions.filter(q => {
        const qId = parseInt(q.id);
        return qId >= start && qId <= end;
      });

      console.log('【LearningCenter】范围内可用题目数量:', availableQuestions.length);

      if (availableQuestions.length === 0) {
        setSnackbar({
          open: true,
          message: `第 ${start}-${end} 题范围内没有题目`,
          severity: 'warning'
        });
        setCurrentQuestions([]);
        setIsLoadingQuestions(false);
        return;
      }

      const actualCount = Math.min(count, availableQuestions.length);
      
      if (actualCount < count) {
        setSnackbar({
          open: true,
          message: `范围内只有 ${availableQuestions.length} 道题，将抽取全部 ${actualCount} 道题`,
          severity: 'warning'
        });
      }

      const shuffled = [...availableQuestions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      const finalQuestions = shuffled.slice(0, actualCount).map(q => ({
        ...q,
        _actualDrawType: 'rangeRandom',
        _actualSubType: null,
        _actualRangeStart: start,
        _actualRangeEnd: end,
        _actualQuestionCount: actualCount,
        _actualSortType: 'random'
      }));

      console.log('【LearningCenter】范围随机抽取完成，设置题目数量:', finalQuestions.length);
      
      // 保存当前抽取模式信息
      setCurrentDrawInfo({
        type: 'rangeRandom',
        subType: null,
        rangeStart: start,
        rangeEnd: end,
        count: actualCount,
        sortType: 'random'
      });

      setCurrentQuestions([...finalQuestions]);
      setTestKey(prev => prev + 1);

      setSnackbar({
        open: true,
        message: `成功从第 ${start}-${end} 题中随机抽取 ${actualCount} 道题`,
        severity: 'success'
      });
    } catch (error) {
      console.error('范围随机抽取异常:', error);
      setSnackbar({ open: true, message: '范围随机抽取失败', severity: 'error' });
      setCurrentQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleConfirmDraw = (type, params) => {
    console.log('【LearningCenter】handleConfirmDraw 被调用', { type, params });
    if (type === 'range') {
      fetchRangeQuestions(params.start, params.end);
    } else if (type === 'rangeRandom') {
      fetchRangeRandomQuestions(params.start, params.end, params.count);
    } else if (type === 'new') {
      fetchNewQuestions(params);
    }
  };

  const handleStartTest = () => {
    console.log('【LearningCenter】开始测试，题目数量:', currentQuestions.length);
    setDrawDialogOpen(false);
    setShowTest(true);
  };

  const handleRedraw = () => {
    console.log('【LearningCenter】重新抽取');
    setCurrentQuestions([]);
  };

  const handleCloseDialog = () => {
    console.log('【LearningCenter】关闭对话框');
    setDrawDialogOpen(false);
  };

  const handleOpenDialog = () => {
    console.log('【LearningCenter】打开对话框');
    setDrawDialogOpen(true);
    setShowTest(false);
  };

  const handleTestComplete = () => {
    console.log('【LearningCenter】测试完成');
    setShowTest(false);
    setCurrentQuestions([]);
    fetchAllQuestions();
  };

  const handleDataSourceChange = async (event) => {
    const newSource = event.target.value;
    console.log('【LearningCenter】切换数据源:', newSource);
    setDataSource(newSource);
    setCurrentTab(0);
    setCurrentQuestions([]);
    setShowTest(false);
    setDrawDialogOpen(false);
    setSnackbar({ open: true, message: `已切换到 ${dataSources.find(s => s.id === newSource)?.name || newSource}`, severity: 'success' });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleOpenTranslator = () => {
    setTranslatorOpen(true);
  };

  const handleCloseTranslator = () => {
    setTranslatorOpen(false);
  };

  // 处理单词翻译请求
  const handleTranslateWord = (word) => {
    if (translatorRef.current) {
      translatorRef.current.translateText(word);
    }
    setTranslatorOpen(true);
  };

  // 处理打开翻译器请求
  const handleOpenTranslatorWithWord = (word) => {
    if (translatorRef.current) {
      if (word) {
        translatorRef.current.translateText(word);
      }
    }
    setTranslatorOpen(true);
  };

  useEffect(() => {
    console.log('【LearningCenter】currentQuestions 状态更新:', {
      length: currentQuestions.length
    });
  }, [currentQuestions]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* 头部导航栏 */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleBackToHome}
            sx={{
              borderRadius: 2,
              borderColor: '#1a237e',
              color: '#1a237e',
              '&:hover': {
                borderColor: '#0d47a1',
                backgroundColor: 'rgba(26,35,126,0.04)'
              }
            }}
          >
            返回目录
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: currentSource?.color || '#1a237e', width: 32, height: 32 }}>
                <span style={{ fontSize: '1.2rem' }}>{currentSource?.icon || '📚'}</span>
              </Avatar>
              <Typography sx={{ fontWeight: 'bold' }}>英语单项选择</Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={dataSource || ''}
                onChange={handleDataSourceChange}
                displayEmpty
                disabled={loading}
                sx={{ bgcolor: 'white', fontSize: '0.9rem' }}
                renderValue={(selected) => {
                  if (!selected) return <em>请选择题库</em>;
                  const bank = dataSources.find(b => b.id === selected) || currentSource;
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{bank.icon}</span>
                      <span>{bank.name}</span>
                    </Box>
                  );
                }}
              >
                {dataSources.length > 0 ? (
                  dataSources.map((bank) => (
                    <MenuItem key={bank.id} value={bank.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '1.2rem' }}>{bank.icon}</span>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{bank.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bank.totalQuestions || 0}题 · {bank.description || ''}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">暂无可用题库</Typography>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          <Tooltip title="打开翻译器">
            <IconButton 
              size="small" 
              onClick={handleOpenTranslator}
              sx={{ color: '#4ec9b0' }}
            >
              <TranslateIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{ bgcolor: '#1a237e', '&:hover': { bgcolor: '#0d1a5c' } }}
          >
            抽取题目
          </Button>

          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab icon={<MenuBook />} iconPosition="start" label="练习模式" sx={{ textTransform: 'none' }} />
            <Tab icon={<Assessment />} iconPosition="start" label="统计与题库管理" sx={{ textTransform: 'none' }} />
          </Tabs>

          <Tooltip title="刷新题库">
            <IconButton size="small" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {(loading || isLoadingQuestions) && <LinearProgress />}

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <TabPanel value={currentTab} index={0}>
          {showTest && currentQuestions.length > 0 ? (
            <Fade in={showTest}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleOpenDialog}
                    startIcon={<AddIcon />}
                    size="small"
                  >
                    重新抽取
                  </Button>
                </Box>
                <SingleChoiceTest
                  key={`test-${testKey}`}
                  dataSource={dataSource}
                  questions={currentQuestions}
                  drawType={currentDrawInfo.type}
                  questionCount={currentDrawInfo.count}
                  rangeStart={currentDrawInfo.rangeStart}
                  rangeEnd={currentDrawInfo.rangeEnd}
                  onComplete={handleTestComplete}
                  // 传递翻译相关函数
                  onTranslateWord={handleTranslateWord}
                  onOpenTranslator={handleOpenTranslatorWithWord}
                />
              </Box>
            </Fade>
          ) : (
            <Paper sx={{
              p: 6,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              bgcolor: '#f8f9fa',
              borderRadius: 2,
              border: '1px solid #eaeaea',
              minHeight: 400
            }}>
              <QuizIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                开始练习
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                点击右上角"抽取题目"按钮，在弹出的窗口中选择抽取模式
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{ bgcolor: '#1a237e' }}
              >
                抽取题目
              </Button>
            </Paper>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon sx={{ color: '#1a237e' }} />题库信息
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #eaeaea' }}>
                    <Typography variant="body2" color="text.secondary">当前题库</Typography>
                    <Typography variant="h6" sx={{ mt: 1 }}>{currentSource?.name}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #eaeaea' }}>
                    <Typography variant="body2" color="text.secondary">总题数</Typography>
                    <Typography variant="h6" sx={{ mt: 1 }}>{allQuestions.length} 题</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            <QuestionMasterView dataSource={dataSource} questions={memoizedAllQuestions} />
          </Box>
        </TabPanel>
      </Container>

      {/* 悬浮抽取对话框 */}
      <FloatingDrawDialog
        open={drawDialogOpen}
        onClose={handleCloseDialog}
        currentSource={currentSource}
        allQuestions={allQuestions}
        newQuestionStats={newQuestionStats}
        onConfirm={handleConfirmDraw}
        loading={isLoadingQuestions}
        questions={currentQuestions}
        onStartTest={handleStartTest}
        onRedraw={handleRedraw}
      />

      {/* 翻译器组件 */}
      <WordTranslator
        ref={translatorRef}
        open={translatorOpen}
        onClose={handleCloseTranslator}
        defaultCompact={true}
        enableClipboardDetection={true}
        onRequestOpen={() => setTranslatorOpen(true)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LearningCenter;
