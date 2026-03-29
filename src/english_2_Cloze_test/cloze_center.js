// src/pages/ParentComponent.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  InputAdornment,
  Snackbar,
  Tabs,
  Tab,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  ArrowBack as ArrowBackIcon,
  Psychology as PsychologyIcon,
  Article as ArticleIcon,
  FilterList as FilterListIcon,
  Shuffle as ShuffleIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  EmojiEvents as EmojiEventsIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Storage as StorageIcon,
  School as SchoolIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ClozeTestSimple from './cloze_test.js';
import PassageBrowseView from './cloze_view.js';
import ResultSummary from './cloze_reasult.js';
import { clozeApi } from './api';

// 默认题库配置（作为备用，当后端没有返回时使用）
const DEFAULT_BANKS = [
  {
    id: 'default',
    name: '完形填空基础库',
    icon: '📖',
    color: '#1a237e',
    totalQuestions: 50,
    description: '基础完形填空练习'
  },
  {
    id: '中考',
    name: '中考完形填空',
    icon: '🎯',
    color: '#c62828',
    totalQuestions: 120,
    description: '中考完形填空真题'
  },
  {
    id: '高考',
    name: '高考完形填空',
    icon: '🏆',
    color: '#2e7d32',
    totalQuestions: 150,
    description: '高考完形填空真题'
  }
];

const ParentComponent = () => {
  const navigate = useNavigate(); // 添加导航
  // 状态管理
  const [passageData, setPassageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [explanations, setExplanations] = useState({});
  const [dataSource, setDataSource] = useState(''); // 当前选中的题库，初始为空
  const [bankList, setBankList] = useState([]); // 题库列表
  const [bankLoading, setBankLoading] = useState(false); // 题库加载状态
  const [startTime, setStartTime] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [currentView, setCurrentView] = useState('practice');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 抽题相关状态
  const [drawType, setDrawType] = useState('smart');
  const [drawAnchorEl, setDrawAnchorEl] = useState(null);
  const drawOpen = Boolean(drawAnchorEl);
  
  // 自定义抽取状态
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [allPassages, setAllPassages] = useState([]);
  const [selectedPassageId, setSelectedPassageId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [confirmedAnswers, setConfirmedAnswers] = useState({});
  
  // 结算界面状态
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  const startTimeRef = useRef(null);
  const isUserSelectedRef = useRef(false); // 标记是否是用户选择的文章
  const initialLoadRef = useRef(false); // 标记是否已经初始加载

  // 处理返回目录
  const handleBackToHome = () => {
    navigate('/');
  };

  // ========== 获取题库列表 ==========
  const fetchBanks = useCallback(async () => {
    setBankLoading(true);
    try {
      const response = await clozeApi.getBanks();
      if (response?.flag === 1 && response.content?.banks && response.content.banks.length > 0) {
        // 成功后端返回的题库列表
        setBankList(response.content.banks);
        
        // 如果当前没有选中题库，或者选中的题库不在列表中，则选择第一个
        if (!dataSource || !response.content.banks.some(b => b.id === dataSource)) {
          setDataSource(response.content.banks[0].id);
        }
      } else {
        // 后端返回空，使用默认题库但只保留实际存在的
        console.log('后端返回空题库列表，检查默认配置');
        
        // 这里可以尝试检查默认题库文件是否存在
        // 暂时使用 DEFAULT_BANKS，但实际应该只显示有文件的
        setBankList(DEFAULT_BANKS);
        
        if (!dataSource && DEFAULT_BANKS.length > 0) {
          setDataSource(DEFAULT_BANKS[0].id);
        }
      }
    } catch (error) {
      console.error('获取题库列表失败:', error);
      // 使用默认题库
      setBankList(DEFAULT_BANKS);
      if (!dataSource && DEFAULT_BANKS.length > 0) {
        setDataSource(DEFAULT_BANKS[0].id);
      }
      setSnackbar({
        open: true,
        message: '获取题库列表失败，使用默认配置',
        severity: 'warning'
      });
    } finally {
      setBankLoading(false);
    }
  }, [dataSource]);

  // 组件挂载时加载题库
  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  // 当题库切换时重新获取文章
  useEffect(() => {
    // 只有在题库已经加载且不在测试模式时才自动获取
    if (dataSource && !testMode && currentView === 'practice') {
      console.log('【调试】题库切换，重新获取文章:', dataSource);
      // 重置用户选择标记
      isUserSelectedRef.current = false;
      setPassageData(null);
      fetchPassage(drawType, true, true);
    }
  }, [dataSource, testMode, currentView]);

  // 获取所有文章列表（用于自定义抽取）
  const fetchAllPassages = useCallback(async () => {
    if (!dataSource) return;
    
    try {
      const response = await clozeApi.getPassage('all', dataSource);
      if (response && response.flag === 1) {
        if (response.content && response.content.passages) {
          setAllPassages(response.content.passages);
        } else if (Array.isArray(response.content)) {
          setAllPassages(response.content);
        } else {
          setAllPassages([]);
        }
      } else {
        setAllPassages([]);
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
      setAllPassages([]);
    }
  }, [dataSource]);

  // 打开自定义抽取对话框
  const handleOpenCustomDialog = () => {
    fetchAllPassages();
    setCustomDialogOpen(true);
    setDrawAnchorEl(null);
  };

  // 关闭自定义抽取对话框
  const handleCloseCustomDialog = () => {
    setCustomDialogOpen(false);
    setSelectedPassageId('');
    setSearchTerm('');
  };

  // 执行自定义抽取
  const handleCustomSelect = () => {
    if (selectedPassageId) {
      const selected = allPassages.find(p => p.id === selectedPassageId);
      if (selected) {
        console.log('【调试】自定义选择文章:', selected.title);
        
        isUserSelectedRef.current = true;
        setPassageData(selected);
        setDrawType('custom');
        setAnswers({});
        setExplanations({});
        setConfirmedAnswers({});
        setSnackbar({
          open: true,
          message: `已选择: ${selected.title}`,
          severity: 'success'
        });
      }
    }
    handleCloseCustomDialog();
  };

  // 处理从浏览视图选择文章
  const handleSelectPassage = (passage) => {
    console.log('【调试】handleSelectPassage 被调用', passage);
    
    if (!passage || !passage.id) {
      console.error('【错误】无效的文章数据', passage);
      setSnackbar({
        open: true,
        message: '文章数据无效',
        severity: 'error'
      });
      return;
    }

    if (!passage.questions || !Array.isArray(passage.questions) || passage.questions.length === 0) {
      console.error('【错误】文章没有题目', passage);
      setSnackbar({
        open: true,
        message: '该文章没有题目',
        severity: 'error'
      });
      return;
    }

    isUserSelectedRef.current = true;
    
    setPassageData(passage);
    setDrawType('custom');
    setAnswers({});
    setExplanations({});
    setConfirmedAnswers({});
    
    const now = new Date();
    setStartTime(now);
    startTimeRef.current = now;
    
    setCurrentView('practice');
    setTestMode(true);
    
    setSnackbar({
      open: true,
      message: `开始练习: ${passage.title}`,
      severity: 'success'
    });
  };

  // 获取文章数据
  const fetchPassage = async (type = 'smart', showSuccessMessage = true, force = false) => {
    if (!dataSource) {
      console.log('【调试】题库未选择，跳过获取');
      return;
    }

    if (isUserSelectedRef.current && !force) {
      console.log('【调试】用户已选择文章，跳过自动获取');
      return;
    }
    
    if (!force && passageData) {
      console.log('【调试】已有文章数据，跳过获取');
      return;
    }
    
    console.log('【调试】开始获取文章, type:', type, 'bank:', dataSource, 'force:', force);
    setLoading(true);
    setError(null);
    setAnswers({});
    setExplanations({});
    setConfirmedAnswers({});
    setStartTime(new Date());
    startTimeRef.current = new Date();
    setTestMode(false);
    setDrawType(type);
    
    try {
      const response = await clozeApi.getPassage(type, dataSource);
      
      if (response && response.flag === 1 && response.content?.passage) {
        const newPassage = response.content.passage;
        console.log('【调试】获取到新文章:', newPassage.title);
        
        if (!newPassage.questions || !Array.isArray(newPassage.questions) || newPassage.questions.length === 0) {
          console.error('【错误】获取的文章没有题目');
          setError('文章数据异常');
        } else {
          setPassageData(newPassage);
          if (showSuccessMessage) {
            setSnackbar({
              open: true,
              message: `已加载: ${newPassage.title}`,
              severity: 'success'
            });
          }
        }
      } else {
        console.log('【调试】获取文章失败:', response?.message);
        setError(response?.message || '暂无文章');
        setPassageData(null);
      }
    } catch (error) {
      console.error('【调试】获取文章异常:', error);
      setError('网络错误');
      setPassageData(null);
    } finally {
      setLoading(false);
      initialLoadRef.current = true;
    }
  };

  // 处理答案变更
  const handleAnswerChange = useCallback((questionId, value, allAnswers) => {
    setAnswers(allAnswers);
  }, []);

  // 确认答案
  const handleConfirmAnswer = useCallback((questionId) => {
    setConfirmedAnswers(prev => {
      const newState = { ...prev, [questionId]: true };
      return newState;
    });
  }, []);

  // 修改答案
  const handleModifyAnswer = useCallback((questionId) => {
    setConfirmedAnswers(prev => {
      const newState = { ...prev };
      delete newState[questionId];
      return newState;
    });
    setSnackbar({ open: true, message: '题目已解锁', severity: 'info' });
  }, []);

  // 处理提交
  const handleSubmit = useCallback(async (answers, timeSpent, stats) => {
    if (!passageData) return;
    
    const allConfirmed = passageData.questions.every(q => confirmedAnswers[q.id]);
    if (!allConfirmed) {
      setSnackbar({ 
        open: true, 
        message: '请先完成所有题目', 
        severity: 'warning' 
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const endTime = new Date();
      const actualTimeSpent = startTime ? Math.round((endTime - startTime) / 1000) : timeSpent;
      
      const response = await clozeApi.submitAnswers(passageData.id, answers, actualTimeSpent, dataSource);
      
      if (response?.flag === 1) {
        const correctCount = passageData.questions.filter(q => {
          const userAnswer = answers[q.id];
          const correctAnswer = q.correct;
          return userAnswer === correctAnswer;
        }).length;
        
        const accuracy = Math.round((correctCount / passageData.questions.length) * 100);
        
        const result = { 
          success: true, 
          accuracy,
          correctCount,
          totalCount: passageData.questions.length,
          answers: answers,
          passageId: passageData.id,
          timeSpent: actualTimeSpent,
          message: `提交成功！正确率：${accuracy}%`
        };
        
        console.log('【调试】提交成功，返回结果:', result);
        
        setSubmitResult(result);
        setResultDialogOpen(true);
        
        setSnackbar({ 
          open: true, 
          message: `提交成功！正确率：${accuracy}%`, 
          severity: 'success' 
        });
        
        return result;
        
      } else {
        const errorMsg = response?.message || '提交失败';
        setSnackbar({ 
          open: true, 
          message: errorMsg, 
          severity: 'error' 
        });
        
        return { 
          success: false, 
          error: errorMsg 
        };
      }
    } catch (error) {
      console.error('提交失败:', error);
      setSnackbar({ 
        open: true, 
        message: '提交失败：' + (error.message || '网络错误'), 
        severity: 'error' 
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [passageData, startTime, dataSource, confirmedAnswers]);

  // ========== 结算界面处理函数 ==========
  const handleCloseResultDialog = () => {
    setResultDialogOpen(false);
  };

  const handlePracticeAgain = () => {
    setResultDialogOpen(false);
    setAnswers({});
    setExplanations({});
    setConfirmedAnswers({});
    setStartTime(new Date());
    startTimeRef.current = new Date();
    setSnackbar({
      open: true,
      message: '重新开始练习',
      severity: 'info'
    });
  };

  // 返回浏览模式
  const handleBackToBrowse = () => {
    setResultDialogOpen(false);
    setTestMode(false);
    setCurrentView('browse');
    setPassageData(null);
    setAnswers({});
    setExplanations({});
    setConfirmedAnswers({});
    setSnackbar({
      open: true,
      message: '返回文章列表',
      severity: 'info'
    });
  };

  // 查看答案解析
  const handleViewAnswers = () => {
    setResultDialogOpen(false);
    // 这里可以根据你的需求实现查看答案的逻辑
    // 例如：设置一个状态让 ClozeTestSimple 显示答案
    setSnackbar({
      open: true,
      message: '查看答案解析',
      severity: 'info'
    });
  };

  // 刷新文章
  const handleRefresh = () => {
    if (!dataSource) {
      setSnackbar({
        open: true,
        message: '请先选择题库',
        severity: 'warning'
      });
      return;
    }
    isUserSelectedRef.current = false;
    fetchPassage(drawType, true, true);
  };

  // 按类型抽取
  const handleDrawByType = (type) => {
    if (!dataSource) {
      setSnackbar({
        open: true,
        message: '请先选择题库',
        severity: 'warning'
      });
      setDrawAnchorEl(null);
      return;
    }
    isUserSelectedRef.current = false;
    setDrawType(type);
    fetchPassage(type, true, true);
    setDrawAnchorEl(null);
  };

  // 处理题库切换
  const handleBankChange = (event) => {
    const newBank = event.target.value;
    setDataSource(newBank);
    isUserSelectedRef.current = false; // 重置用户选择标记
    setPassageData(null); // 清空当前文章
    setError(null); // 清空错误
    setAnswers({});
    setExplanations({});
    setConfirmedAnswers({});
    
    setSnackbar({
      open: true,
      message: `已切换到 ${bankList.find(b => b.id === newBank)?.name || newBank}`,
      severity: 'success'
    });
    
    // 如果当前在练习预览模式，立即获取新文章
    if (currentView === 'practice') {
      console.log('【调试】题库切换，立即获取新文章');
      // 使用 setTimeout 确保状态更新后再获取
      setTimeout(() => {
        fetchPassage(drawType, true, true);
      }, 100);
    }
  };

  // 打开抽取菜单
  const handleDrawClick = (event) => setDrawAnchorEl(event.currentTarget);
  const handleDrawClose = () => setDrawAnchorEl(null);

  // 切换视图
  const handleViewChange = (event, newView) => {
    setCurrentView(newView);
    setTestMode(false);
    
    if (newView === 'practice' && !passageData && !isUserSelectedRef.current && dataSource) {
      console.log('【调试】切换到practice且无数据，自动获取');
      fetchPassage(drawType, false, true);
    }
  };

  // 进入测试模式
  const enterTestMode = () => {
    console.log('【调试】进入测试模式，当前文章:', passageData?.title);
    
    if (!passageData) {
      console.error('【错误】没有文章数据，无法进入测试模式');
      setSnackbar({
        open: true,
        message: '没有文章数据',
        severity: 'error'
      });
      return;
    }

    if (!passageData.questions || !Array.isArray(passageData.questions) || passageData.questions.length === 0) {
      console.error('【错误】文章没有题目', passageData);
      setSnackbar({
        open: true,
        message: '该文章没有题目',
        severity: 'error'
      });
      return;
    }
    
    setAnswers({});
    setExplanations({});
    setConfirmedAnswers({});
    setStartTime(new Date());
    startTimeRef.current = new Date();
    setTestMode(true);
    console.log('【调试】已进入测试模式');
  };
  
  const exitTestMode = () => {
    setTestMode(false);
    isUserSelectedRef.current = false;
  };

  // 获取抽取类型文本和图标
  const getDrawTypeInfo = (type) => {
    const map = {
      'smart': { text: '智能推荐', icon: <PsychologyIcon fontSize="small" /> },
      'weak': { text: '薄弱文章', icon: <WarningIcon fontSize="small" color="error" /> },
      'new': { text: '新文章', icon: <StarIcon fontSize="small" color="info" /> },
      'review': { text: '复习文章', icon: <RefreshIcon fontSize="small" color="warning" /> },
      'mastered': { text: '已掌握', icon: <EmojiEventsIcon fontSize="small" color="success" /> },
      'random': { text: '随机抽取', icon: <ShuffleIcon fontSize="small" color="secondary" /> },
      'custom': { text: '自定义', icon: <EditIcon fontSize="small" color="primary" /> }
    };
    return map[type] || map.smart;
  };

  // 统计
  const stats = !passageData ? null : {
    answered: Object.keys(confirmedAnswers).length,
    total: passageData.questions.length
  };

  // 获取当前题库信息
  const currentBank = bankList.find(b => b.id === dataSource) || {
    id: dataSource || 'default',
    name: dataSource === 'default' ? '默认题库' : (dataSource || '未选择'),
    icon: '📚',
    color: '#1a237e',
    description: ''
  };

  // 过滤文章（用于自定义对话框）
  const filteredPassages = allPassages.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 测试模式头部 - 添加返回目录按钮
  const TestModeHeader = () => (
    <AppBar position="static" sx={{ bgcolor: '#1a237e' }}>
      <Toolbar>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToHome}
          sx={{
            borderRadius: 2,
            borderColor: 'white',
            color: 'white',
            mr: 2,
            '&:hover': {
              borderColor: '#ffd700',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          目录
        </Button>
        <IconButton color="inherit" onClick={exitTestMode} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ flex: 1 }}>{passageData?.title}</Typography>
        <Chip 
          label={`${stats?.answered || 0}/${stats?.total || 0}`} 
          sx={{ bgcolor: 'white', color: '#1a237e', mr: 1 }} 
        />
        <Chip 
          label={currentBank.name} 
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
        />
      </Toolbar>
    </AppBar>
  );

  // 预览模式头部 - 添加返回目录按钮
  const PreviewModeHeader = () => {
    const drawInfo = getDrawTypeInfo(drawType);
    
    return (
      <AppBar position="static" color="default">
        <Toolbar>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleBackToHome}
            sx={{
              borderRadius: 2,
              borderColor: '#1a237e',
              color: '#1a237e',
              mr: 2,
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
              <Avatar sx={{ bgcolor: currentBank.color, width: 32, height: 32 }}>
                <span style={{ fontSize: '1.2rem' }}>{currentBank.icon}</span>
              </Avatar>
              <Typography sx={{ fontWeight: 'bold' }}>完形填空</Typography>
            </Box>
            
            {/* 题库选择下拉框 */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={dataSource || ''}
                onChange={handleBankChange}
                displayEmpty
                disabled={bankLoading}
                sx={{ bgcolor: 'white', fontSize: '0.9rem' }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <em>请选择题库</em>;
                  }
                  const bank = bankList.find(b => b.id === selected) || currentBank;
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{bank.icon}</span>
                      <span>{bank.name}</span>
                    </Box>
                  );
                }}
              >
                {bankList.length > 0 ? (
                  bankList.map((bank) => (
                    <MenuItem key={bank.id} value={bank.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '1.2rem' }}>{bank.icon}</span>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {bank.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bank.totalQuestions || 0}题 · {bank.description || ''}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      暂无可用题库
                    </Typography>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
          
          <Tabs value={currentView} onChange={handleViewChange} sx={{ mr: 2 }}>
            <Tab value="practice" icon={<PsychologyIcon />} label="练习" />
            <Tab value="browse" icon={<ArticleIcon />} label="浏览" />
          </Tabs>
          
          {currentView === 'practice' && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDrawClick}
                startIcon={drawInfo.icon}
                endIcon={<FilterListIcon />}
                disabled={!dataSource}
              >
                {drawInfo.text}
              </Button>
              
              <Menu anchorEl={drawAnchorEl} open={drawOpen} onClose={handleDrawClose}>
                <MenuItem onClick={() => handleDrawByType('smart')} selected={drawType === 'smart'}>
                  <ListItemIcon><PsychologyIcon /></ListItemIcon>
                  <ListItemText>智能推荐</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleDrawByType('weak')} selected={drawType === 'weak'}>
                  <ListItemIcon><WarningIcon color="error" /></ListItemIcon>
                  <ListItemText>薄弱文章</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleDrawByType('new')} selected={drawType === 'new'}>
                  <ListItemIcon><StarIcon color="info" /></ListItemIcon>
                  <ListItemText>新文章</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleDrawByType('review')} selected={drawType === 'review'}>
                  <ListItemIcon><RefreshIcon color="warning" /></ListItemIcon>
                  <ListItemText>复习文章</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleDrawByType('mastered')} selected={drawType === 'mastered'}>
                  <ListItemIcon><EmojiEventsIcon color="success" /></ListItemIcon>
                  <ListItemText>已掌握</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleDrawByType('random')} selected={drawType === 'random'}>
                  <ListItemIcon><ShuffleIcon color="secondary" /></ListItemIcon>
                  <ListItemText>随机抽取</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOpenCustomDialog} selected={drawType === 'custom'}>
                  <ListItemIcon><EditIcon color="primary" /></ListItemIcon>
                  <ListItemText>自定义选择</ListItemText>
                </MenuItem>
              </Menu>
              
              <Tooltip title="换一篇">
                <IconButton size="small" onClick={handleRefresh} disabled={loading || !dataSource}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Toolbar>
      </AppBar>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {testMode ? <TestModeHeader /> : <PreviewModeHeader />}
      {(loading || bankLoading) && <LinearProgress />}

      <Container maxWidth={testMode ? 'xl' : 'lg'} sx={{ py: testMode ? 1 : 3 }}>
        {!testMode ? (
          currentView === 'practice' ? (
            /* 练习预览模式 */
            passageData && !loading ? (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5">{passageData.title}</Typography>
                  <Chip label={`难度 ${passageData.difficulty}级`} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {passageData.category} · {passageData.questions.length}题
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#fafafa', maxHeight: 200, overflow: 'auto', mb: 2 }}>
                  <Typography variant="body2">{passageData.content.substring(0, 300)}...</Typography>
                </Paper>
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={enterTestMode} 
                  startIcon={<PlayArrowIcon />}
                  disabled={!passageData || !passageData.questions || passageData.questions.length === 0}
                >
                  开始答题
                </Button>
              </Paper>
            ) : error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
                {!dataSource && <Box sx={{ mt: 1 }}>请先选择题库</Box>}
              </Alert>
            ) : !dataSource ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                请先选择题库
              </Alert>
            ) : null
          ) : (
            /* 浏览模式 - 传入 dataSource 和 onSelectPassage 回调 */
            <PassageBrowseView 
              dataSource={dataSource} 
              onSelectPassage={handleSelectPassage}
            />
          )
        ) : (
          /* 测试模式 - 直接进入答题界面 */
          <Box sx={{ height: 'calc(100vh - 70px)' }}>
            {passageData ? (
              <ClozeTestSimple
                key={`${dataSource}-${passageData.id}`}
                passageData={passageData}
                loading={loading}
                error={error}
                onRefresh={handleRefresh}
                onAnswerChange={handleAnswerChange}
                onSubmit={handleSubmit}
                onQuestionClick={() => {}}
                externalAnswers={answers}
                externalExplanations={explanations}
                initialQuestionIndex={0}
                readOnly={false}
                fullscreen={true}
                confirmedAnswers={confirmedAnswers}
                onConfirmAnswer={handleConfirmAnswer}
                onModifyAnswer={handleModifyAnswer}
                dataSource={dataSource}
              />
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography>加载文章中...</Typography>
              </Paper>
            )}
          </Box>
        )}
      </Container>

      {/* 自定义抽取对话框 */}
      <Dialog 
        open={customDialogOpen} 
        onClose={handleCloseCustomDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon /> 自定义选择文章 - {currentBank.name}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            size="small"
            placeholder="搜索文章标题、分类或来源..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          
          <FormControl fullWidth>
            <InputLabel>选择文章</InputLabel>
            <Select
              value={selectedPassageId}
              onChange={(e) => setSelectedPassageId(e.target.value)}
              label="选择文章"
            >
              {filteredPassages.length > 0 ? (
                filteredPassages.map((passage) => (
                  <MenuItem key={passage.id} value={passage.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {passage.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {passage.category} · 难度 {passage.difficulty}级 · {passage.questions?.length || 0}题
                        {passage.stats?.extract_count > 0 && ` · 练习${passage.stats.extract_count}次`}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    暂无文章
                  </Typography>
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCustomDialog}>取消</Button>
          <Button 
            onClick={handleCustomSelect} 
            variant="contained" 
            color="primary"
            disabled={!selectedPassageId}
          >
            确认选择
          </Button>
        </DialogActions>
      </Dialog>

      {/* 结算界面组件 */}
      <ResultSummary
        open={resultDialogOpen}
        onClose={handleCloseResultDialog}
        result={submitResult}
        passageData={passageData}
        answers={answers}
        onPracticeAgain={handlePracticeAgain}
        onBackToBrowse={handleBackToBrowse}
        onViewAnswers={handleViewAnswers}
        dataSource={dataSource}
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ParentComponent;