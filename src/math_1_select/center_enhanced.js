// src/math_1_select/center_enhanced.js
// 增强版数学中心组件 - 完全服务器获取版，左右分栏布局

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Divider,
  Card,
  CardContent,
  Fade,
  MenuItem,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
  Slider,
  TextField,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Storage as StorageIcon,
  MenuBook,
  Assessment,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CloudSync as CloudSyncIcon,
  Add as AddIcon,
  Star as StarIcon,
  Casino as CasinoIcon,
  FilterList as FilterListIcon,
  Quiz as QuizIcon,
  DragHandle as DragHandleIcon,
  ViewList,
  PlayArrow,
  Close as CloseIcon,
  Shuffle as ShuffleIcon,
  SortByAlpha
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SingleChoiceTest from './test';
import QuestionMasterView from './review';
import { mathApi } from './api';
import { G_config } from '../config.js';

const serverAddress = G_config.G_server_address;

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

const MathLearningCenterEnhanced = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [dataSource, setDataSource] = useState('math_master');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 题库列表状态
  const [mathBanks, setMathBanks] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);

  // 题目数据状态
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [testKey, setTestKey] = useState(0);

  // 对话框状态
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);

  // 界面状态
  const [showTest, setShowTest] = useState(false);

  // 新题统计状态
  const [newQuestionStats, setNewQuestionStats] = useState({
    total: 0,
    newCount: 0,
    masteredCount: 0,
    weakCount: 0,
    reviewCount: 0
  });

  // 服务器连接状态
  const [serverStatus, setServerStatus] = useState({
    isConnected: true,
    lastCheck: null,
    error: null,
    serverVersion: null
  });

  // 获取题库列表
  const fetchMathBanks = async () => {
    setIsLoadingBanks(true);
    try {
      const response = await fetch(`${serverAddress}/math/banks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.flag === 1 && data.content?.banks) {
          setMathBanks(data.content.banks);
          
          // 如果当前题库不在列表中，选择第一个题库
          const currentBankExists = data.content.banks.some(bank => bank.id === dataSource);
          if (!currentBankExists && data.content.banks.length > 0) {
            setDataSource(data.content.banks[0].id);
          }
        }
      }
    } catch (error) {
      console.error('获取题库列表失败:', error);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  // 检查服务器连接状态并获取题库列表
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await fetch(`${serverAddress}/math/banks`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        
        setServerStatus({
          isConnected: response.ok,
          lastCheck: new Date().toISOString(),
          error: response.ok ? null : `HTTP ${response.status}`,
          serverVersion: null
        });
        
        if (response.ok) {
          await fetchMathBanks();
        }
      } catch (error) {
        setServerStatus({
          isConnected: false,
          lastCheck: new Date().toISOString(),
          error: error.message,
          serverVersion: null
        });
      }
    };

    checkServerConnection();
  }, []);

  // 当dataSource变化时，重新加载题目
  useEffect(() => {
    if (dataSource) {
      fetchAllQuestions();
    }
  }, [dataSource]);

  const fetchAllQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const response = await mathApi.getMasterQuestions(dataSource);

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

        setSnackbar({ 
          open: true, 
          message: `成功加载 ${sortedQuestions.length} 道数学题目`, 
          severity: 'success' 
        });
      } else {
        setSnackbar({ open: true, message: response.message || '加载失败', severity: 'error' });
        setAllQuestions([]);
      }
    } catch (error) {
      console.error('获取所有数学题目失败:', error);
      setSnackbar({ open: true, message: '网络错误', severity: 'warning' });
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

  const handleStartTest = () => {
    console.log('【MathLearningCenter】开始测试，题目数量:', currentQuestions.length);
    setDrawDialogOpen(false);
    setShowTest(true);
    // 自动切换到练习模式Tab（Tab 0）
    setCurrentTab(0);
  };

  const handleTestComplete = () => {
    console.log('【MathLearningCenter】测试完成');
    setShowTest(false);
    setCurrentQuestions([]);
    fetchAllQuestions();
  };

  const handleRedraw = () => {
    console.log('【MathLearningCenter】重新抽取');
    setCurrentQuestions([]);
  };

  const handleCloseDialog = () => {
    console.log('【MathLearningCenter】关闭对话框');
    setDrawDialogOpen(false);
  };

  const handleOpenDialog = () => {
    console.log('【MathLearningCenter】打开对话框');
    setDrawDialogOpen(true);
    setShowTest(false);
  };

  // 智能抽取函数
  const fetchNewQuestions = async (settings) => {
    console.log('【MathLearningCenter】开始抽取新题', settings);
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

      console.log('【MathLearningCenter】筛选后题目数量:', filteredQuestions.length);

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
      const finalQuestions = selectedQuestions.slice(0, actualCount);

      console.log('【MathLearningCenter】抽取完成，设置题目数量:', finalQuestions.length);

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

  // 范围全量抽取
  const fetchRangeQuestions = async (start, end) => {
    console.log('【MathLearningCenter】开始范围全量抽取', { start, end });
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
      });

      console.log('【MathLearningCenter】范围筛选后题目数量:', sortedQuestions.length);

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

  // 范围随机抽取
  const fetchRangeRandomQuestions = async (start, end, count) => {
    console.log('【MathLearningCenter】开始范围随机抽取', { start, end, count });
    setIsLoadingQuestions(true);

    try {
      const availableQuestions = allQuestions.filter(q => {
        const qId = parseInt(q.id);
        return qId >= start && qId <= end;
      });

      console.log('【MathLearningCenter】范围内可用题目数量:', availableQuestions.length);

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
      
      const finalQuestions = shuffled.slice(0, actualCount);

      console.log('【MathLearningCenter】范围随机抽取完成，设置题目数量:', finalQuestions.length);

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
    console.log('【MathLearningCenter】handleConfirmDraw 被调用', { type, params });
    if (type === 'range') {
      fetchRangeQuestions(params.start, params.end);
    } else if (type === 'rangeRandom') {
      fetchRangeRandomQuestions(params.start, params.end, params.count);
    } else if (type === 'new') {
      fetchNewQuestions(params);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchAllQuestions();
      setSnackbar({ open: true, message: '数据已刷新', severity: 'success' });
    } catch (error) {
      console.error('刷新失败:', error);
      setSnackbar({ open: true, message: '刷新失败', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

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
              borderColor: '#4CAF50',
              color: '#4CAF50',
              '&:hover': {
                borderColor: '#388e3c',
                backgroundColor: 'rgba(76,175,80,0.04)'
              }
            }}
          >
            返回目录
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#4CAF50', width: 32, height: 32 }}>
                <span style={{ fontSize: '1.2rem' }}>🧮</span>
              </Avatar>
              <Typography sx={{ fontWeight: 'bold' }}>数学单项选择（服务器获取）</Typography>
            </Box>
            
            {/* 题库选择器 */}
            {mathBanks.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  displayEmpty
                  sx={{ 
                    bgcolor: 'white',
                    '& .MuiSelect-select': { py: 0.8 }
                  }}
                >
                  {mathBanks.map((bank) => (
                    <MenuItem key={bank.id} value={bank.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorageIcon fontSize="small" />
                        <Box>
                          <Typography variant="body2">{bank.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bank.totalQuestions}题
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {/* 服务器状态指示器 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {serverStatus.isConnected ? (
              <Tooltip title="服务器连接正常">
                <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
              </Tooltip>
            ) : (
              <Tooltip title={`服务器连接失败: ${serverStatus.error}`}>
                <CancelIcon sx={{ color: '#f44336', fontSize: 16 }} />
              </Tooltip>
            )}
            
            <Tooltip title="检查服务器连接">
              <IconButton size="small" onClick={() => {
                const checkServerConnection = async () => {
                  try {
                    const response = await fetch(`${serverAddress}/math/banks`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                      }
                    });
                    
                    setServerStatus({
                      isConnected: response.ok,
                      lastCheck: new Date().toISOString(),
                      error: response.ok ? null : `HTTP ${response.status}`,
                      serverVersion: null
                    });
                    
                    if (response.ok) {
                      setSnackbar({ open: true, message: '服务器连接正常', severity: 'success' });
                    } else {
                      setSnackbar({ open: true, message: `服务器连接失败: HTTP ${response.status}`, severity: 'error' });
                    }
                  } catch (error) {
                    setServerStatus({
                      isConnected: false,
                      lastCheck: new Date().toISOString(),
                      error: error.message,
                      serverVersion: null
                    });
                    setSnackbar({ open: true, message: `服务器连接失败: ${error.message}`, severity: 'error' });
                  }
                };
                checkServerConnection();
              }} disabled={loading}>
                <CloudSyncIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            disabled={isLoadingQuestions || allQuestions.length === 0}
            sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388e3c' } }}
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
          {/* 全屏测试区域 */}
          {showTest && currentQuestions.length > 0 ? (
            <Fade in={showTest}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowTest(false)}
                    startIcon={<CloseIcon />}
                    size="small"
                  >
                    返回
                  </Button>
                </Box>
                <SingleChoiceTest
                  key={`test-${testKey}`}
                  dataSource={dataSource}
                  questions={currentQuestions}
                  drawType="custom"
                  onComplete={handleTestComplete}
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
              <Box sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }}>🧮</Box>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                数学选择题练习
              </Typography>
              


              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                开始练习
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                点击右上角"抽取题目"按钮开始练习
              </Typography>

              {!serverStatus.isConnected && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  服务器连接失败，可能无法获取最新题目。请检查网络连接。
                </Alert>
              )}
            </Paper>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <QuestionMasterView 
            dataSource={dataSource}
            questions={allQuestions}
          />
        </TabPanel>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 悬浮抽取对话框 */}
      <FloatingDrawDialog
        open={drawDialogOpen}
        onClose={handleCloseDialog}
        currentSource={{ name: '数学选择题库', icon: '🧮', color: '#4CAF50' }}
        allQuestions={allQuestions}
        newQuestionStats={newQuestionStats}
        onConfirm={handleConfirmDraw}
        loading={isLoadingQuestions}
        questions={currentQuestions}
        onStartTest={handleStartTest}
        onRedraw={handleRedraw}
      />
    </Box>
  );
};

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
  // 优化初始位置：居中显示，距离顶部适当
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
    // 范围随机抽取的数量
    randomCount: 10
  });
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(10);
  const [tempStart, setTempStart] = useState('1');
  const [tempEnd, setTempEnd] = useState('10');
  const [renderKey, setRenderKey] = useState(0);
  const panelRef = useRef(null);

  // 监听窗口大小变化，调整对话框位置
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

  // 监听 questions 变化，强制重新渲染
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

  // 拖拽功能
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
      // 范围随机抽取：返回范围内总题数
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
      // 范围随机抽取：最大可抽取数量 = 范围内总题数
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
      {/* 拖拽标题栏 */}
      <Box
        className="drag-handle"
        onMouseDown={handleMouseDown}
        sx={{
          p: 1.5,
          bgcolor: '#4CAF50',
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
            抽取题目 - 数学选择题库
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* 左右分栏内容 - 修复布局：确保桌面端左右排列，题目在右侧 */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row'
        }}
      >
        {/* 左侧：抽取设置 - 桌面端固定宽度，手机端全宽 */}
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
              <Avatar sx={{ bgcolor: '#4CAF50', width: 32, height: 32 }}>
                <span style={{ fontSize: '1.2rem' }}>🧮</span>
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{currentSource?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  服务器获取方案
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 统计卡片 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              题库统计
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={3}>
                <Card variant="outlined" sx={{ bgcolor: '#e8f5e9', textAlign: 'center', py: 1 }}>
                  <Typography variant="caption" color="text.secondary">新题</Typography>:&nbsp;
                  <span style={{ fontWeight: 'bold', color: '#388e3c' }}>{newQuestionStats.newCount}</span>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card variant="outlined" sx={{ bgcolor: '#fff3e0', textAlign: 'center', py: 1 }}>
                  <Typography variant="caption" color="text.secondary">复习</Typography>:&nbsp;
                  <span style={{ fontWeight: 'bold', color: '#f57c00' }}>{newQuestionStats.reviewCount}</span>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card variant="outlined" sx={{ bgcolor: '#ffebee', textAlign: 'center', py: 1 }}>
                  <Typography variant="caption" color="text.secondary">薄弱</Typography>:&nbsp;
                  <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>{newQuestionStats.weakCount}</span>
                </Card>
              </Grid>
              <Grid item xs={3}>
                <Card variant="outlined" sx={{ bgcolor: '#e3f2fd', textAlign: 'center', py: 1 }}>
                  <Typography variant="caption" color="text.secondary">总计</Typography>:&nbsp;
                  <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{newQuestionStats.total}</span>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 抽取设置 */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              <FilterListIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
              抽取设置
            </Typography>

            {/* 抽取模式切换 */}
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
                    bgcolor: drawType === option.value ? '#4CAF50' : 'transparent'
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Box>

            {/* 新题抽取设置 */}
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

            {/* 范围抽取设置（全量抽取） */}
            {drawType === 'range' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  题号范围 (1-{allQuestions.length || 10})
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
                      const maxVal = allQuestions.length || 10;
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
                      const maxVal = allQuestions.length || 10;
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

            {/* 范围随机抽取设置 */}
            {drawType === 'rangeRandom' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  题号范围 (1-{allQuestions.length || 10})
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
                      const maxVal = allQuestions.length || 10;
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
                      const maxVal = allQuestions.length || 10;
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

            {/* 开始抽取按钮 */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleDraw}
              disabled={loading || (drawType === 'range' && rangeStart > rangeEnd) || getAvailableCount() === 0 || (drawType === 'rangeRandom' && drawSettings.randomCount > getAvailableCount())}
              sx={{
                bgcolor: '#4CAF50',
                py: 1.5,
                '&:hover': { bgcolor: '#388e3c' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '开始抽取'}
            </Button>
          </Box>
        </Box>

        {/* 右侧：题目列表 - 桌面端占剩余宽度，手机端全宽 */}
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
              {/* 题目列表 */}
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
                      {/* 题号 */}
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          bgcolor: '#4CAF50',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}
                      >
                        {idx + 1}
                      </Box>

                      {/* 题目预览 */}
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

              {/* 操作按钮 */}
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

export default MathLearningCenterEnhanced;
