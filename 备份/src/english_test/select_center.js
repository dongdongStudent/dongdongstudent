// src/pages/LearningCenter.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  AppBar,
  Toolbar,
  Grid,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  IconButton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Slider,
  InputLabel,
  FormHelperText,
  Divider,
  Switch,
  FormControlLabel,
  Paper as MuiPaper
} from '@mui/material';
import {
  MenuBook,
  Assessment,
  DataUsage,
  Storage,
  ArrowBack,
  Fullscreen,
  FullscreenExit,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  EmojiEvents as EmojiEventsIcon,
  Shuffle as ShuffleIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Numbers as NumbersIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  RestartAlt as RestartAltIcon,
  Timeline as TimelineIcon,
  FormatListNumbered as RangeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SingleChoiceTest from './select_test';
import QuestionMasterView from './select_master_view';
import { questionApi } from './api';

// 数据源配置 - 使用英文ID，默认使用 master.json
const DEFAULT_DATA_SOURCES = [
  {
    id: 'master',  // 对应 master.json
    name: '默认题库',
    description: '标准英语选择题库',
    totalQuestions: 40,
    categories: ['名词复数', '形容词', '动词', '语法', '情态动词']
  }
];

// 默认每种抽取类型的题目数量配置
const DEFAULT_DRAW_TYPE_COUNTS = {
  'smart': 10,
  'weak': 8,
  'new': 12,
  'review': 10,
  'mastered': 5,
  'random': 10
};

// 默认每种抽取类型的题目范围配置（使用函数返回，避免引用未定义的变量）
const getDefaultDrawTypeRanges = (totalQuestions = 40) => ({
  'smart': { start: 1, end: totalQuestions, enabled: false },
  'weak': { start: 1, end: totalQuestions, enabled: false },
  'new': { start: 1, end: totalQuestions, enabled: false },
  'review': { start: 1, end: totalQuestions, enabled: false },
  'mastered': { start: 1, end: totalQuestions, enabled: false },
  'random': { start: 1, end: totalQuestions, enabled: false }
});

// Tab面板组件
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ padding: '24px 0' }}>
    {value === index && children}
  </div>
);

const LearningCenter = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [dataSource, setDataSource] = useState('master');  // 默认使用 master.json
  const [dataSources, setDataSources] = useState(DEFAULT_DATA_SOURCES);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [fullscreen, setFullscreen] = useState(false);
  
  // 添加 ref 引用容器
  const containerRef = useRef(null);
  
  // 抽取功能相关状态
  const [drawType, setDrawType] = useState('smart');
  const [drawAnchorEl, setDrawAnchorEl] = useState(null);
  const drawOpen = Boolean(drawAnchorEl);
  
  // 为每种抽取类型分别存储题目数量
  const [drawTypeCounts, setDrawTypeCounts] = useState(() => {
    const saved = localStorage.getItem('drawTypeCounts');
    return saved ? JSON.parse(saved) : DEFAULT_DRAW_TYPE_COUNTS;
  });
  
  // 为每种抽取类型分别存储题目范围 - 先使用默认值
  const [drawTypeRanges, setDrawTypeRanges] = useState(() => {
    const saved = localStorage.getItem('drawTypeRanges');
    if (saved) {
      return JSON.parse(saved);
    }
    // 使用默认值40，后面会在useEffect中根据实际题库更新
    return getDefaultDrawTypeRanges(40);
  });
  
  // 是否启用独立配置（数量和范围）
  const [enableIndependentConfig, setEnableIndependentConfig] = useState(() => {
    const saved = localStorage.getItem('enableIndependentConfig');
    return saved ? JSON.parse(saved) : false;
  });
  
  // 自定义范围状态（全局自定义，与独立配置分开）
  const [globalRangeDialogOpen, setGlobalRangeDialogOpen] = useState(false);
  const [globalStartRange, setGlobalStartRange] = useState(1);
  const [globalEndRange, setGlobalEndRange] = useState(10);
  const [isGlobalCustomRange, setIsGlobalCustomRange] = useState(false);
  const [globalCustomRangeData, setGlobalCustomRangeData] = useState({ start: 1, end: 10 });
  
  // 数量设置对话框状态
  const [countDialogOpen, setCountDialogOpen] = useState(false);
  const [tempDrawType, setTempDrawType] = useState('smart');
  const [tempCount, setTempCount] = useState(10);
  
  // 范围设置对话框状态
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [tempRangeDrawType, setTempRangeDrawType] = useState('smart');
  const [tempRange, setTempRange] = useState({ start: 1, end: 40, enabled: false });
  
  // 批量设置对话框状态
  const [batchConfigDialogOpen, setBatchConfigDialogOpen] = useState(false);
  const [batchConfigs, setBatchConfigs] = useState({
    counts: { ...DEFAULT_DRAW_TYPE_COUNTS },
    ranges: getDefaultDrawTypeRanges(40)
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 获取当前数据源信息 - 移到state之后
  const currentSource = dataSources.find(s => s.id === dataSource) || dataSources[0];

  // ========== 全屏逻辑 ==========
  // 监听浏览器全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenStatus = !!document.fullscreenElement;
      setFullscreen(fullscreenStatus);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 切换全屏函数
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // 进入全屏
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('全屏切换失败:', error);
      setSnackbar({
        open: true,
        message: '全屏切换失败：' + (error.message || '未知错误'),
        severity: 'error'
      });
    }
  };
  // ========== 全屏逻辑结束 ==========

  useEffect(() => {
    fetchDataSources();
  }, []);

  // 当数据源变化时，更新范围配置的默认值
  useEffect(() => {
    if (currentSource) {
      setDrawTypeRanges(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = {
            ...updated[key],
            end: currentSource.totalQuestions
          };
          // 确保start不超过totalQuestions
          if (updated[key].start > currentSource.totalQuestions) {
            updated[key].start = 1;
          }
        });
        return updated;
      });

      setGlobalCustomRangeData({
        start: 1,
        end: currentSource.totalQuestions
      });

      setTempRange(prev => ({
        ...prev,
        end: currentSource.totalQuestions
      }));
    }
  }, [currentSource]);

  // 保存配置到localStorage
  useEffect(() => {
    localStorage.setItem('drawTypeCounts', JSON.stringify(drawTypeCounts));
  }, [drawTypeCounts]);

  useEffect(() => {
    localStorage.setItem('drawTypeRanges', JSON.stringify(drawTypeRanges));
  }, [drawTypeRanges]);

  useEffect(() => {
    localStorage.setItem('enableIndependentConfig', JSON.stringify(enableIndependentConfig));
  }, [enableIndependentConfig]);

  const fetchDataSources = async () => {
    setLoading(true);
    try {
      const response = await questionApi.getBanks();
      if (response.flag === 1 && response.content?.banks) {
        setDataSources(response.content.banks);
        
        // 确保当前 dataSource 在返回的题库列表中
        const exists = response.content.banks.some(b => b.id === dataSource);
        if (!exists && response.content.banks.length > 0) {
          // 如果当前 dataSource 不存在，切换到第一个题库
          setDataSource(response.content.banks[0].id);
        }
      } else {
        setDataSources(DEFAULT_DATA_SOURCES);
      }
    } catch (error) {
      console.error('获取题库列表失败:', error);
      setSnackbar({
        open: true,
        message: '获取题库列表失败，使用默认配置',
        severity: 'warning'
      });
      setDataSources(DEFAULT_DATA_SOURCES);
    } finally {
      setLoading(false);
    }
  };

  const handleDataSourceChange = (event) => {
    const newSource = event.target.value;
    setDataSource(newSource);
    setCurrentTab(0);
    setDrawType('smart');
    setIsGlobalCustomRange(false);
    
    // 当切换题库时，检查并更新范围配置
    const newSourceData = dataSources.find(s => s.id === newSource);
    if (newSourceData) {
      setDrawTypeRanges(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key].end > newSourceData.totalQuestions) {
            updated[key] = {
              ...updated[key],
              end: newSourceData.totalQuestions
            };
          }
          if (updated[key].start > newSourceData.totalQuestions) {
            updated[key].start = 1;
          }
        });
        return updated;
      });

      setGlobalCustomRangeData({
        start: 1,
        end: newSourceData.totalQuestions
      });
    }
    
    setSnackbar({
      open: true,
      message: `已切换到 ${dataSources.find(s => s.id === newSource)?.name || newSource}`,
      severity: 'success'
    });
    localStorage.removeItem('unfinishedTest');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // 抽取菜单处理
  const handleDrawClick = (event) => setDrawAnchorEl(event.currentTarget);
  const handleDrawClose = () => setDrawAnchorEl(null);

  // 按类型抽取
  const handleDrawByType = (type) => {
    setDrawType(type);
    setIsGlobalCustomRange(false); // 关闭全局自定义模式
    setDrawAnchorEl(null);
    
    let message = `已切换到 ${getDrawTypeText(type)} 模式`;
    if (enableIndependentConfig) {
      message += `，每次 ${drawTypeCounts[type]} 题`;
      if (drawTypeRanges[type]?.enabled) {
        const range = drawTypeRanges[type];
        message += `，范围: 第 ${range.start}-${range.end} 题`;
      }
    } else {
      message += `，每次 ${drawTypeCounts['smart']} 题`;
    }
    
    setSnackbar({
      open: true,
      message: message,
      severity: 'success'
    });
  };

  // 打开数量设置对话框
  const handleOpenCountDialog = () => {
    if (enableIndependentConfig) {
      setTempDrawType(drawType);
      setTempCount(drawTypeCounts[drawType] || 10);
    } else {
      setTempDrawType('smart');
      setTempCount(drawTypeCounts['smart'] || 10);
    }
    setCountDialogOpen(true);
  };

  // 保存单个抽取类型的数量设置
  const handleSaveCount = () => {
    setDrawTypeCounts(prev => ({
      ...prev,
      [tempDrawType]: tempCount
    }));
    setCountDialogOpen(false);
    setSnackbar({
      open: true,
      message: `已设置${getDrawTypeText(tempDrawType)}模式每次 ${tempCount} 题`,
      severity: 'success'
    });
  };

  // 打开范围设置对话框
  const handleOpenRangeDialog = () => {
    if (enableIndependentConfig) {
      setTempRangeDrawType(drawType);
      setTempRange(drawTypeRanges[drawType] || { 
        start: 1, 
        end: currentSource?.totalQuestions || 40, 
        enabled: false 
      });
    } else {
      setTempRangeDrawType('smart');
      setTempRange({ 
        start: 1, 
        end: currentSource?.totalQuestions || 40, 
        enabled: false 
      });
    }
    setRangeDialogOpen(true);
    setDrawAnchorEl(null);
  };

  // 保存单个抽取类型的范围设置
  const handleSaveRange = () => {
    if (tempRange.start > tempRange.end) {
      setSnackbar({
        open: true,
        message: '起始题号不能大于结束题号',
        severity: 'error'
      });
      return;
    }

    if (tempRange.start < 1 || tempRange.end > (currentSource?.totalQuestions || 40)) {
      setSnackbar({
        open: true,
        message: `题号范围必须在 1-${currentSource?.totalQuestions || 40} 之间`,
        severity: 'error'
      });
      return;
    }

    setDrawTypeRanges(prev => ({
      ...prev,
      [tempRangeDrawType]: tempRange
    }));
    
    setRangeDialogOpen(false);
    
    if (tempRange.enabled) {
      setSnackbar({
        open: true,
        message: `已设置${getDrawTypeText(tempRangeDrawType)}模式范围: 第 ${tempRange.start}-${tempRange.end} 题`,
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: `已取消${getDrawTypeText(tempRangeDrawType)}模式的范围限制`,
        severity: 'info'
      });
    }
  };

  // 打开全局自定义范围对话框
  const handleOpenGlobalRangeDialog = () => {
    setGlobalStartRange(globalCustomRangeData.start);
    setGlobalEndRange(globalCustomRangeData.end);
    setGlobalRangeDialogOpen(true);
    setDrawAnchorEl(null);
  };

  // 确认全局自定义范围
  const handleConfirmGlobalRange = () => {
    if (globalStartRange > globalEndRange) {
      setSnackbar({
        open: true,
        message: '起始题号不能大于结束题号',
        severity: 'error'
      });
      return;
    }

    if (globalStartRange < 1 || globalEndRange > (currentSource?.totalQuestions || 40)) {
      setSnackbar({
        open: true,
        message: `题号范围必须在 1-${currentSource?.totalQuestions || 40} 之间`,
        severity: 'error'
      });
      return;
    }

    setGlobalCustomRangeData({ start: globalStartRange, end: globalEndRange });
    setDrawType('custom');
    setIsGlobalCustomRange(true);
    setGlobalRangeDialogOpen(false);
    setSnackbar({
      open: true,
      message: `已设置全局自定义范围: 第 ${globalStartRange} - ${globalEndRange} 题 (共 ${globalEndRange - globalStartRange + 1} 题)`,
      severity: 'success'
    });
  };

  // 重置全局自定义范围
  const handleResetGlobalRange = () => {
    setIsGlobalCustomRange(false);
    setDrawType('smart');
    setGlobalCustomRangeData({ start: 1, end: currentSource?.totalQuestions || 40 });
    setSnackbar({
      open: true,
      message: '已返回智能抽取模式',
      severity: 'info'
    });
  };

  // 打开批量配置对话框
  const handleOpenBatchConfigDialog = () => {
    setBatchConfigs({
      counts: { ...drawTypeCounts },
      ranges: { ...drawTypeRanges }
    });
    setBatchConfigDialogOpen(true);
    setDrawAnchorEl(null);
  };

  // 保存批量配置
  const handleSaveBatchConfigs = () => {
    // 验证所有范围
    for (const [type, range] of Object.entries(batchConfigs.ranges)) {
      if (range.enabled) {
        if (range.start > range.end) {
          setSnackbar({
            open: true,
            message: `${getDrawTypeText(type)}的起始题号不能大于结束题号`,
            severity: 'error'
          });
          return;
        }
        if (range.start < 1 || range.end > (currentSource?.totalQuestions || 40)) {
          setSnackbar({
            open: true,
            message: `${getDrawTypeText(type)}的题号范围必须在 1-${currentSource?.totalQuestions || 40} 之间`,
            severity: 'error'
          });
          return;
        }
      }
    }

    setDrawTypeCounts(batchConfigs.counts);
    setDrawTypeRanges(batchConfigs.ranges);
    setBatchConfigDialogOpen(false);
    setSnackbar({
      open: true,
      message: '已保存所有抽取类型的配置',
      severity: 'success'
    });
  };

  // 重置批量配置为默认值
  const handleResetBatchConfigs = () => {
    setBatchConfigs({
      counts: { ...DEFAULT_DRAW_TYPE_COUNTS },
      ranges: getDefaultDrawTypeRanges(currentSource?.totalQuestions || 40)
    });
  };

  // 切换独立配置模式 - 修改开关颜色为绿色
  const handleToggleIndependentConfig = (event) => {
    setEnableIndependentConfig(event.target.checked);
    if (event.target.checked) {
      setSnackbar({
        open: true,
        message: '已启用独立配置模式，可为每种抽取类型单独设置数量和范围',
        severity: 'info'
      });
    } else {
      setSnackbar({
        open: true,
        message: '已禁用独立配置模式，所有抽取类型使用统一配置',
        severity: 'info'
      });
    }
  };

  // 获取抽取类型文本和图标
  const getDrawTypeInfo = (type) => {
    const map = {
      'smart': { text: '智能推荐', icon: <PsychologyIcon fontSize="small" /> },
      'weak': { text: '薄弱题目', icon: <WarningIcon fontSize="small" /> },
      'new': { text: '新题目', icon: <StarIcon fontSize="small" /> },
      'review': { text: '复习题目', icon: <RefreshIcon fontSize="small" /> },
      'mastered': { text: '已掌握', icon: <EmojiEventsIcon fontSize="small" /> },
      'random': { text: '随机抽取', icon: <ShuffleIcon fontSize="small" /> },
      'custom': { text: '全局自定义', icon: <NumbersIcon fontSize="small" /> }
    };
    return map[type] || map.smart;
  };

  // 获取抽取类型文本
  const getDrawTypeText = (type) => {
    const map = {
      'smart': '智能推荐',
      'weak': '薄弱题目',
      'new': '新题目',
      'review': '复习题目',
      'mastered': '已掌握',
      'random': '随机抽取',
      'custom': '全局自定义'
    };
    return map[type] || '智能推荐';
  };

  const drawInfo = getDrawTypeInfo(drawType);

  // 计算当前使用的题目数量（根据当前抽取类型和配置模式计算）
  const currentQuestionCount = enableIndependentConfig 
    ? drawTypeCounts[drawType] || 10
    : drawTypeCounts['smart'] || 10;
  
  // 计算当前使用的题目范围（根据当前抽取类型和配置模式计算）- 修改为返回null表示无范围
  const getCurrentRange = () => {
    // 如果启用了全局自定义范围
    if (isGlobalCustomRange) {
      return {
        start: globalCustomRangeData.start,
        end: globalCustomRangeData.end,
        enabled: true
      };
    }
    
    // 如果启用了独立配置且当前类型启用了范围限制
    if (enableIndependentConfig && drawTypeRanges[drawType]?.enabled) {
      return drawTypeRanges[drawType];
    }
    
    // 默认情况：没有范围限制，返回null表示不使用范围
    return null;
  };

  // 生成当前抽取的详细信息文本
  const getCurrentDrawInfo = () => {
    if (isGlobalCustomRange) {
      return `全局自定义 · 第 ${globalCustomRangeData.start}-${globalCustomRangeData.end} 题 · 共 ${globalCustomRangeData.end - globalCustomRangeData.start + 1} 题`;
    }
    
    let info = `${getDrawTypeText(drawType)} · 每次 ${currentQuestionCount} 题`;
    
    if (enableIndependentConfig && drawTypeRanges[drawType]?.enabled) {
      const range = drawTypeRanges[drawType];
      info += ` · 范围: 第 ${range.start}-${range.end} 题`;
    }
    
    return info;
  };

  const currentRange = getCurrentRange();

  // 沉浸式模式下的布局 - 使用 containerRef
  if (fullscreen) {
    return (
      <Box 
        ref={containerRef}
        sx={{ 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#ffffff'
        }}
      >
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            bgcolor: '#000000', 
            borderBottom: '1px solid #eaeaea'
          }}
        >
          <Toolbar sx={{ minHeight: 48 }}>
            <IconButton
              color="inherit"
              onClick={toggleFullscreen}
              sx={{ color: '#ffffff', mr: 1 }}
            >
              <FullscreenExit />
            </IconButton>
            <Typography 
              variant="body2" 
              sx={{ 
                flexGrow: 1, 
                color: '#ffffff',
                fontWeight: 300
              }}
            >
              {currentSource?.name} · {getCurrentDrawInfo()}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBack />}
              onClick={handleBackToHome}
              sx={{
                borderRadius: 0,
                borderColor: '#ffffff',
                color: '#ffffff',
                '&:hover': {
                  borderColor: '#cccccc',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              返回
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <SingleChoiceTest 
            key={`practice-${dataSource}-${drawType}-${currentQuestionCount}-${currentRange ? 'range' : 'normal'}`}
            dataSource={dataSource}
            drawType={drawType}
            questionCount={currentQuestionCount}
            startRange={currentRange?.start}
            endRange={currentRange?.end}
            isCustomRange={!!currentRange}
            fullscreen={true}
          />
        </Box>
      </Box>
    );
  }

  // 普通模式 - 添加 containerRef
  return (
    <Box 
      ref={containerRef}
      sx={{ 
        flexGrow: 1, 
        bgcolor: '#ffffff', 
        minHeight: '100vh'
      }}
    >
      {/* 顶部导航栏 */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: '#000000', 
          borderBottom: '1px solid #eaeaea'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToHome}
            sx={{
              borderRadius: 0,
              textTransform: 'none',
              px: 2,
              mr: 2,
              borderColor: '#ffffff',
              color: '#ffffff',
              '&:hover': {
                borderColor: '#cccccc',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            返回目录
          </Button>

          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 400,
              color: '#ffffff'
            }}
          >
            英语学习
          </Typography>

          <IconButton
            color="inherit"
            onClick={toggleFullscreen}
            sx={{ color: '#ffffff', mr: 1 }}
          >
            <Fullscreen />
          </IconButton>

          <Typography 
            variant="body2" 
            sx={{ 
              color: '#aaaaaa', 
              display: { xs: 'none', sm: 'block' }
            }}
          >
            练习 · 统计 · 分析
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {loading && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              my: 3, 
              textAlign: 'center',
              border: '1px solid #eaeaea',
              borderRadius: 0
            }}
          >
            <CircularProgress size={24} sx={{ color: '#000000' }} />
            <Typography sx={{ mt: 2, color: '#666666' }}>
              加载题库列表中...
            </Typography>
          </Paper>
        )}

        {/* 控制栏 - 包含数据源选择和抽取功能 */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            my: 3, 
            border: '1px solid #eaeaea',
            borderRadius: 0,
            bgcolor: '#ffffff'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 2 
          }}>
            {/* 数据源选择 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Storage sx={{ color: '#000000', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#333333' }}>
                数据源:
              </Typography>
            </Box>
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={dataSource}
                onChange={handleDataSourceChange}
                variant="outlined"
                sx={{
                  borderRadius: 0,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#eaeaea'
                  }
                }}
              >
                {dataSources.map((source) => (
                  <MenuItem key={source.id} value={source.id}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#000000' }}>
                        {source.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        {source.totalQuestions}题
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 抽取功能按钮组 */}
            <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
              {/* 主抽取按钮 */}
              <Button
                variant="outlined"
                size="small"
                onClick={handleDrawClick}
                startIcon={drawInfo.icon}
                endIcon={<FilterListIcon />}
                sx={{
                  borderRadius: 0,
                  borderColor: '#dddddd',
                  color: '#333333',
                  '&:hover': {
                    borderColor: '#000000',
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                {drawInfo.text}
              </Button>
              
              {/* 抽取菜单 */}
              <Menu 
                anchorEl={drawAnchorEl} 
                open={drawOpen} 
                onClose={handleDrawClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                sx={{
                  '& .MuiPaper-root': {
                    borderRadius: 0,
                    border: '1px solid #eaeaea',
                    boxShadow: 'none',
                    minWidth: 260
                  }
                }}
              >
                {/* 抽取类型选项 */}
                <MenuItem 
                  onClick={() => handleDrawByType('smart')} 
                  selected={drawType === 'smart' && !isGlobalCustomRange}
                >
                  <ListItemIcon><PsychologyIcon fontSize="small" sx={{ color: '#000000' }} /></ListItemIcon>
                  <ListItemText>
                    智能推荐
                    {enableIndependentConfig && (
                      <Typography variant="caption" sx={{ ml: 1, color: '#666666', display: 'block' }}>
                        {drawTypeCounts['smart']}题
                        {drawTypeRanges['smart']?.enabled && ` · 第${drawTypeRanges['smart'].start}-${drawTypeRanges['smart'].end}题`}
                      </Typography>
                    )}
                  </ListItemText>
                </MenuItem>
                
                <MenuItem 
                  onClick={() => handleDrawByType('weak')} 
                  selected={drawType === 'weak' && !isGlobalCustomRange}
                >
                  <ListItemIcon><WarningIcon fontSize="small" sx={{ color: '#000000' }} /></ListItemIcon>
                  <ListItemText>
                    薄弱题目
                    {enableIndependentConfig && (
                      <Typography variant="caption" sx={{ ml: 1, color: '#666666', display: 'block' }}>
                        {drawTypeCounts['weak']}题
                        {drawTypeRanges['weak']?.enabled && ` · 第${drawTypeRanges['weak'].start}-${drawTypeRanges['weak'].end}题`}
                      </Typography>
                    )}
                  </ListItemText>
                </MenuItem>
                
                <MenuItem 
                  onClick={() => handleDrawByType('new')} 
                  selected={drawType === 'new' && !isGlobalCustomRange}
                >
                  <ListItemIcon><StarIcon fontSize="small" sx={{ color: '#000000' }} /></ListItemIcon>
                  <ListItemText>
                    新题目
                    {enableIndependentConfig && (
                      <Typography variant="caption" sx={{ ml: 1, color: '#666666', display: 'block' }}>
                        {drawTypeCounts['new']}题
                        {drawTypeRanges['new']?.enabled && ` · 第${drawTypeRanges['new'].start}-${drawTypeRanges['new'].end}题`}
                      </Typography>
                    )}
                  </ListItemText>
                </MenuItem>
                
                <MenuItem 
                  onClick={() => handleDrawByType('review')} 
                  selected={drawType === 'review' && !isGlobalCustomRange}
                >
                  <ListItemIcon><RefreshIcon fontSize="small" sx={{ color: '#000000' }} /></ListItemIcon>
                  <ListItemText>
                    复习题目
                    {enableIndependentConfig && (
                      <Typography variant="caption" sx={{ ml: 1, color: '#666666', display: 'block' }}>
                        {drawTypeCounts['review']}题
                        {drawTypeRanges['review']?.enabled && ` · 第${drawTypeRanges['review'].start}-${drawTypeRanges['review'].end}题`}
                      </Typography>
                    )}
                  </ListItemText>
                </MenuItem>
                
                <MenuItem 
                  onClick={() => handleDrawByType('mastered')} 
                  selected={drawType === 'mastered' && !isGlobalCustomRange}
                >
                  <ListItemIcon><EmojiEventsIcon fontSize="small" sx={{ color: '#000000' }} /></ListItemIcon>
                  <ListItemText>
                    已掌握
                    {enableIndependentConfig && (
                      <Typography variant="caption" sx={{ ml: 1, color: '#666666', display: 'block' }}>
                        {drawTypeCounts['mastered']}题
                        {drawTypeRanges['mastered']?.enabled && ` · 第${drawTypeRanges['mastered'].start}-${drawTypeRanges['mastered'].end}题`}
                      </Typography>
                    )}
                  </ListItemText>
                </MenuItem>
                
                <MenuItem 
                  onClick={() => handleDrawByType('random')} 
                  selected={drawType === 'random' && !isGlobalCustomRange}
                >
                  <ListItemIcon><ShuffleIcon fontSize="small" sx={{ color: '#000000' }} /></ListItemIcon>
                  <ListItemText>
                    随机抽取
                    {enableIndependentConfig && (
                      <Typography variant="caption" sx={{ ml: 1, color: '#666666', display: 'block' }}>
                        {drawTypeCounts['random']}题
                        {drawTypeRanges['random']?.enabled && ` · 第${drawTypeRanges['random'].start}-${drawTypeRanges['random'].end}题`}
                      </Typography>
                    )}
                  </ListItemText>
                </MenuItem>
                
                <Divider />
                
                {/* 全局自定义选项 */}
                <MenuItem 
                  onClick={handleOpenGlobalRangeDialog} 
                  selected={isGlobalCustomRange}
                >
                  <ListItemIcon><NumbersIcon fontSize="small" sx={{ color: '#000000' }} /></ListItemIcon>
                  <ListItemText>全局自定义范围</ListItemText>
                </MenuItem>
              </Menu>

              {/* 数量设置按钮 */}
              {!isGlobalCustomRange && (
                <Tooltip title="设置题目数量">
                  <IconButton 
                    size="small"
                    onClick={handleOpenCountDialog}
                    sx={{ 
                      border: '1px solid #dddddd',
                      borderRadius: 0,
                      color: '#333333'
                    }}
                  >
                    <NumbersIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* 范围设置按钮 - 独立配置模式下显示 */}
              {enableIndependentConfig && !isGlobalCustomRange && (
                <Tooltip title="设置抽取范围">
                  <IconButton 
                    size="small"
                    onClick={handleOpenRangeDialog}
                    sx={{ 
                      border: '1px solid #dddddd',
                      borderRadius: 0,
                      color: '#333333'
                    }}
                  >
                    <RangeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            {/* 独立配置模式开关 - 修改为绿色 */}
            {!isGlobalCustomRange && (
              <FormControlLabel
                control={
                  <Switch
                    checked={enableIndependentConfig}
                    onChange={handleToggleIndependentConfig}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4caf50',
                      },
                      '& .MuiSwitch-switchBase': {
                        color: '#cccccc',
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: '#e0e0e0',
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: '#666666' }}>
                    独立配置
                  </Typography>
                }
                sx={{ ml: 1 }}
              />
            )}

            {/* 批量配置按钮 - 独立配置模式下显示 */}
            {enableIndependentConfig && !isGlobalCustomRange && (
              <Tooltip title="批量配置各类型">
                <IconButton
                  size="small"
                  onClick={handleOpenBatchConfigDialog}
                  sx={{ 
                    border: '1px solid #dddddd',
                    borderRadius: 0,
                    color: '#333333'
                  }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* 当前配置信息 */}
            <Box sx={{ ml: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {isGlobalCustomRange ? (
                <Chip 
                  icon={<NumbersIcon />}
                  label={`全局自定义: 第 ${globalCustomRangeData.start}-${globalCustomRangeData.end} 题`}
                  size="small"
                  onDelete={handleResetGlobalRange}
                  sx={{ 
                    borderRadius: 0,
                    bgcolor: '#f0f0f0',
                    color: '#000000'
                  }}
                />
              ) : (
                <>
                  <Chip 
                    icon={<NumbersIcon />}
                    label={`${currentQuestionCount}题`}
                    size="small"
                    sx={{ 
                      borderRadius: 0,
                      bgcolor: '#f0f0f0',
                      color: '#000000'
                    }}
                  />
                  {enableIndependentConfig && drawTypeRanges[drawType]?.enabled && (
                    <Chip 
                      icon={<RangeIcon />}
                      label={`范围: ${drawTypeRanges[drawType].start}-${drawTypeRanges[drawType].end}`}
                      size="small"
                      sx={{ 
                        borderRadius: 0,
                        bgcolor: '#f0f0f0',
                        color: '#000000'
                      }}
                    />
                  )}
                </>
              )}
            </Box>

            {/* 数据源统计信息 */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexWrap: 'wrap', 
              ml: 'auto',
              alignItems: 'center'
            }}>
              <Chip 
                icon={<DataUsage sx={{ fontSize: 16, color: '#666666' }} />}
                label={`${currentSource?.totalQuestions || 0}题`}
                size="small"
                sx={{ 
                  borderRadius: 0,
                  bgcolor: '#f5f5f5',
                  color: '#333333'
                }}
              />
              {currentSource?.categories?.slice(0, 3).map(cat => (
                <Chip 
                  key={cat} 
                  label={cat} 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    borderRadius: 0,
                    borderColor: '#dddddd',
                    color: '#666666'
                  }}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        {/* 标签页导航 */}
        <Paper 
          elevation={0}
          sx={{ 
            border: '1px solid #eaeaea',
            borderRadius: 0,
            overflow: 'hidden',
            bgcolor: '#ffffff'
          }}
        >
          <Tabs 
            value={currentTab} 
            onChange={(e, v) => setCurrentTab(v)}
            variant={isMobile ? 'fullWidth' : 'standard'}
            centered={!isMobile}
            sx={{ 
              borderBottom: '1px solid #eaeaea',
              '& .MuiTab-root': { 
                py: 1.5,
                color: '#888888',
                '&.Mui-selected': {
                  color: '#000000'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#000000'
              }
            }}
          >
            <Tab 
              icon={<MenuBook sx={{ fontSize: 18 }} />} 
              label={isMobile ? "练习" : "智能练习"} 
            />
            <Tab 
              icon={<Assessment sx={{ fontSize: 18 }} />} 
              label={isMobile ? "题库" : "题库查看"} 
            />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <SingleChoiceTest 
              key={`practice-${dataSource}-${drawType}-${currentQuestionCount}-${currentRange ? 'range' : 'normal'}`}
              dataSource={dataSource}
              drawType={drawType}
              questionCount={currentQuestionCount}
              startRange={currentRange?.start}
              endRange={currentRange?.end}
              isCustomRange={!!currentRange}
              fullscreen={false}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <QuestionMasterView 
              key={`master-${dataSource}`}
              dataSource={dataSource}
            />
          </TabPanel>
        </Paper>

        <Box sx={{ py: 3, mt: 3, textAlign: 'center', borderTop: '1px solid #eaeaea' }}>
          <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
            © 2024 英语学习 · 当前数据源: {currentSource?.name} · {getCurrentDrawInfo()}
          </Typography>
        </Box>
      </Container>

      {/* 数量设置对话框 */}
      <Dialog 
        open={countDialogOpen} 
        onClose={() => setCountDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #eaeaea', bgcolor: '#000000', color: '#ffffff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NumbersIcon /> 设置题目数量
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {enableIndependentConfig && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>抽取类型</InputLabel>
              <Select
                value={tempDrawType}
                onChange={(e) => {
                  setTempDrawType(e.target.value);
                  setTempCount(drawTypeCounts[e.target.value] || 10);
                }}
                label="抽取类型"
              >
                <MenuItem value="smart">智能推荐</MenuItem>
                <MenuItem value="weak">薄弱题目</MenuItem>
                <MenuItem value="new">新题目</MenuItem>
                <MenuItem value="review">复习题目</MenuItem>
                <MenuItem value="mastered">已掌握</MenuItem>
                <MenuItem value="random">随机抽取</MenuItem>
              </Select>
            </FormControl>
          )}
          
          <Typography gutterBottom>
            {enableIndependentConfig 
              ? `${getDrawTypeText(tempDrawType)}模式抽取题目数量: ${tempCount} 题`
              : `每次抽取题目数量: ${tempCount} 题`}
          </Typography>
          
          <Slider
            value={tempCount}
            onChange={(e, newValue) => setTempCount(newValue)}
            min={5}
            max={30}
            step={5}
            marks={[
              { value: 5, label: '5题' },
              { value: 10, label: '10题' },
              { value: 15, label: '15题' },
              { value: 20, label: '20题' },
              { value: 25, label: '25题' },
              { value: 30, label: '30题' }
            ]}
            valueLabelDisplay="auto"
            sx={{ mt: 2, mb: 3 }}
          />
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>选择数量</InputLabel>
            <Select
              value={tempCount}
              onChange={(e) => setTempCount(e.target.value)}
              label="选择数量"
            >
              <MenuItem value={5}>5题</MenuItem>
              <MenuItem value={10}>10题</MenuItem>
              <MenuItem value={15}>15题</MenuItem>
              <MenuItem value={20}>20题</MenuItem>
              <MenuItem value={25}>25题</MenuItem>
              <MenuItem value={30}>30题</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCountDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleSaveCount} 
            variant="contained"
            sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 范围设置对话框 */}
      <Dialog 
        open={rangeDialogOpen} 
        onClose={() => setRangeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #eaeaea', bgcolor: '#000000', color: '#ffffff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RangeIcon /> 设置抽取范围
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>抽取类型</InputLabel>
            <Select
              value={tempRangeDrawType}
              onChange={(e) => {
                setTempRangeDrawType(e.target.value);
                setTempRange(drawTypeRanges[e.target.value] || { 
                  start: 1, 
                  end: currentSource?.totalQuestions || 40, 
                  enabled: false 
                });
              }}
              label="抽取类型"
            >
              <MenuItem value="smart">智能推荐</MenuItem>
              <MenuItem value="weak">薄弱题目</MenuItem>
              <MenuItem value="new">新题目</MenuItem>
              <MenuItem value="review">复习题目</MenuItem>
              <MenuItem value="mastered">已掌握</MenuItem>
              <MenuItem value="random">随机抽取</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={tempRange.enabled}
                onChange={(e) => setTempRange(prev => ({ ...prev, enabled: e.target.checked }))}
                color="default"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4caf50',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4caf50',
                  }
                }}
              />
            }
            label="启用范围限制"
            sx={{ mb: 2 }}
          />

          {tempRange.enabled && (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: '#666666' }}>
                题库总题数: <strong>{currentSource?.totalQuestions || 40}</strong> 题
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>起始题号</InputLabel>
                    <Select
                      value={tempRange.start}
                      onChange={(e) => setTempRange(prev => ({ ...prev, start: e.target.value }))}
                      label="起始题号"
                    >
                      {Array.from({ length: currentSource?.totalQuestions || 40 }, (_, i) => i + 1).map(num => (
                        <MenuItem key={num} value={num}>
                          第 {num} 题
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>结束题号</InputLabel>
                    <Select
                      value={tempRange.end}
                      onChange={(e) => setTempRange(prev => ({ ...prev, end: e.target.value }))}
                      label="结束题号"
                    >
                      {Array.from({ length: currentSource?.totalQuestions || 40 }, (_, i) => i + 1)
                        .filter(num => num >= tempRange.start)
                        .map(num => (
                          <MenuItem key={num} value={num}>
                            第 {num} 题
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Slider
                  value={[tempRange.start, tempRange.end]}
                  onChange={(e, newValue) => {
                    setTempRange(prev => ({
                      ...prev,
                      start: newValue[0],
                      end: newValue[1]
                    }));
                  }}
                  min={1}
                  max={currentSource?.totalQuestions || 40}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `第 ${value} 题`}
                />
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', border: '1px solid #eaeaea' }}>
                <Typography variant="body2" gutterBottom>
                  选择结果:
                </Typography>
                <Typography variant="h6" sx={{ color: '#000000' }}>
                  第 {tempRange.start} - {tempRange.end} 题
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#666666' }}>
                  共 <strong>{tempRange.end - tempRange.start + 1}</strong> 题
                </Typography>
              </Box>
            </>
          )}

          {!tempRange.enabled && (
            <Typography variant="body2" sx={{ color: '#666666', textAlign: 'center', py: 2 }}>
              未启用范围限制，将在整个题库中抽取
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRangeDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleSaveRange} 
            variant="contained"
            sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 批量配置对话框 - 垂直排列 */}
      <Dialog 
        open={batchConfigDialogOpen} 
        onClose={() => setBatchConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #eaeaea', bgcolor: '#000000', color: '#ffffff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon /> 批量配置抽取类型
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ mb: 3, color: '#666666' }}>
            为每种抽取类型分别设置题目数量和范围
          </Typography>
          
          {/* 垂直排列的配置项 */}
          <Stack spacing={2}>
            {['smart', 'weak', 'new', 'review', 'mastered', 'random'].map((type) => (
              <MuiPaper 
                key={type} 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  borderColor: '#eaeaea',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                {/* 类型标题 */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#000000' }}>
                  {getDrawTypeText(type)}
                </Typography>
                
                {/* 题目数量设置 - 单独一行 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 80, color: '#666666' }}>
                    题目数量:
                  </Typography>
                  <FormControl size="small" sx={{ width: 120 }}>
                    <Select
                      value={batchConfigs.counts[type]}
                      onChange={(e) => setBatchConfigs(prev => ({
                        ...prev,
                        counts: { ...prev.counts, [type]: e.target.value }
                      }))}
                      sx={{ borderRadius: 0 }}
                    >
                      {[5,10,15,20,25,30].map(num => (
                        <MenuItem key={num} value={num}>{num}题</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                {/* 范围设置 - 单独一行 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ minWidth: 80, color: '#666666' }}>
                    范围限制:
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={batchConfigs.ranges[type]?.enabled || false}
                        onChange={(e) => setBatchConfigs(prev => ({
                          ...prev,
                          ranges: {
                            ...prev.ranges,
                            [type]: {
                              ...prev.ranges[type],
                              enabled: e.target.checked,
                              start: prev.ranges[type]?.start || 1,
                              end: prev.ranges[type]?.end || (currentSource?.totalQuestions || 40)
                            }
                          }
                        }))}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#4caf50',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#4caf50',
                          },
                          '& .MuiSwitch-switchBase': {
                            color: '#cccccc',
                          },
                          '& .MuiSwitch-track': {
                            backgroundColor: '#e0e0e0',
                          }
                        }}
                      />
                    }
                    label="启用"
                    sx={{ mr: 2 }}
                  />
                  
                  {batchConfigs.ranges[type]?.enabled && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666666' }}>从</Typography>
                        <FormControl size="small" sx={{ width: 90 }}>
                          <Select
                            value={batchConfigs.ranges[type]?.start || 1}
                            onChange={(e) => setBatchConfigs(prev => ({
                              ...prev,
                              ranges: {
                                ...prev.ranges,
                                [type]: {
                                  ...prev.ranges[type],
                                  start: e.target.value
                                }
                              }
                            }))}
                            sx={{ borderRadius: 0 }}
                          >
                            {Array.from({ length: currentSource?.totalQuestions || 40 }, (_, i) => i + 1).map(num => (
                              <MenuItem key={num} value={num}>第{num}题</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Typography variant="body2" sx={{ color: '#666666' }}>到</Typography>
                        <FormControl size="small" sx={{ width: 90 }}>
                          <Select
                            value={batchConfigs.ranges[type]?.end || (currentSource?.totalQuestions || 40)}
                            onChange={(e) => setBatchConfigs(prev => ({
                              ...prev,
                              ranges: {
                                ...prev.ranges,
                                [type]: {
                                  ...prev.ranges[type],
                                  end: e.target.value
                                }
                              }
                            }))}
                            sx={{ borderRadius: 0 }}
                          >
                            {Array.from({ length: currentSource?.totalQuestions || 40 }, (_, i) => i + 1)
                              .filter(num => num >= (batchConfigs.ranges[type]?.start || 1))
                              .map(num => (
                                <MenuItem key={num} value={num}>第{num}题</MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Box>

                      {/* 显示选中范围的总题数 */}
                      <Typography variant="caption" sx={{ color: '#666666', ml: 'auto' }}>
                        共 {batchConfigs.ranges[type]?.end - batchConfigs.ranges[type]?.start + 1} 题
                      </Typography>
                    </>
                  )}
                </Box>
                
                {/* 添加分隔线，除了最后一个类型 */}
                {type !== 'random' && <Divider sx={{ mt: 1 }} />}
              </MuiPaper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeaea' }}>
          <Button 
            onClick={handleResetBatchConfigs} 
            startIcon={<RestartAltIcon />}
            sx={{ color: '#666666' }}
          >
            重置
          </Button>
          <Button 
            onClick={() => setBatchConfigDialogOpen(false)}
            sx={{ color: '#666666' }}
          >
            取消
          </Button>
          <Button 
            onClick={handleSaveBatchConfigs} 
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
          >
            保存全部
          </Button>
        </DialogActions>
      </Dialog>

      {/* 全局自定义范围对话框 */}
      <Dialog 
        open={globalRangeDialogOpen} 
        onClose={() => setGlobalRangeDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #eaeaea', bgcolor: '#000000', color: '#ffffff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NumbersIcon /> 全局自定义范围 - {currentSource?.name}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ mb: 3, color: '#666666' }}>
            题库总题数: <strong>{currentSource?.totalQuestions || 40}</strong> 题
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>起始题号</InputLabel>
                <Select
                  value={globalStartRange}
                  onChange={(e) => setGlobalStartRange(e.target.value)}
                  label="起始题号"
                >
                  {Array.from({ length: currentSource?.totalQuestions || 40 }, (_, i) => i + 1).map(num => (
                    <MenuItem key={num} value={num}>
                      第 {num} 题
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>结束题号</InputLabel>
                <Select
                  value={globalEndRange}
                  onChange={(e) => setGlobalEndRange(e.target.value)}
                  label="结束题号"
                >
                  {Array.from({ length: currentSource?.totalQuestions || 40 }, (_, i) => i + 1)
                    .filter(num => num >= globalStartRange)
                    .map(num => (
                      <MenuItem key={num} value={num}>
                        第 {num} 题
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', border: '1px solid #eaeaea' }}>
            <Typography variant="body2" gutterBottom>
              选择结果:
            </Typography>
            <Typography variant="h6" sx={{ color: '#000000' }}>
              第 {globalStartRange} - {globalEndRange} 题
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#666666' }}>
              共 <strong>{globalEndRange - globalStartRange + 1}</strong> 题
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Slider
              value={[globalStartRange, globalEndRange]}
              onChange={(e, newValue) => {
                setGlobalStartRange(newValue[0]);
                setGlobalEndRange(newValue[1]);
              }}
              min={1}
              max={currentSource?.totalQuestions || 40}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `第 ${value} 题`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGlobalRangeDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleConfirmGlobalRange} 
            variant="contained"
            sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
          >
            确认范围
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ 
            borderRadius: 0,
            border: '1px solid #000000',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LearningCenter;