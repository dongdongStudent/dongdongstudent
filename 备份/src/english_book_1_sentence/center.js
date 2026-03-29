// center.js - 修复抽取逻辑，基于当前模式胜率
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Paper,
  LinearProgress,
  Alert,
  Snackbar,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Grid
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Quiz as QuizIcon,
  Edit as EditIcon,
  Input as InputIcon,
  MenuBook as MenuBookIcon,
  ViewList as ViewListIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { sentenceApi } from './api';
import SentenceTest from './test';
import SentenceMasterView from './view';

// 模式定义
const MODES = [
  { value: 'choice', label: '选择题', icon: <QuizIcon />, color: 'primary' },
  { value: 'cloze', label: '选择填空', icon: <EditIcon />, color: 'secondary' },
  { value: 'input', label: '输入填空', icon: <InputIcon />, color: 'warning' }
];

const SentenceCenter = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // ========== 核心状态 ==========
  const [banks, setBanks] = useState([]);
  const [currentBank, setCurrentBank] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [currentView, setCurrentView] = useState(0);
  const [selectedMode, setSelectedMode] = useState('choice');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 单元筛选
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [availableUnits, setAvailableUnits] = useState([]);
  
  // 测试相关
  const [testConfig, setTestConfig] = useState({
    mode: 'choice',
    questionCount: 5,
    extractType: 'random',
    unit: 'all'
  });
  const [isTestActive, setIsTestActive] = useState(false);
  
  // 句子库数据
  const [allSentences, setAllSentences] = useState([]);
  const [filteredSentences, setFilteredSentences] = useState([]);
  const [paginatedSentences, setPaginatedSentences] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 抽取对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extractType, setExtractType] = useState('random');
  const [questionCountValue, setQuestionCountValue] = useState(5);
  const [countError, setCountError] = useState('');
  
  // 统计信息 - 按单元和模式
  const [unitModeStats, setUnitModeStats] = useState({});

  // ========== 初始化 ==========
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setInitialLoading(true);
    try {
      await fetchBanks();
    } catch (error) {
      console.error('初始化失败:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await sentenceApi.getBanks();
      if (res.flag === 1) {
        setBanks(res.content.banks);
        if (res.content.banks.length > 0 && !currentBank) {
          setCurrentBank(res.content.banks[0]);
        }
      }
    } catch (err) {
      console.error('获取句子库列表失败:', err);
    }
  };

  // 加载句子数据
  useEffect(() => {
    if (currentBank) {
      fetchBankInfo();
      fetchAllSentences();
    }
  }, [currentBank?.file]);

  // 当视图切换时重新获取数据
  useEffect(() => {
    if (currentBank && (currentView === 0 || currentView === 1)) {
      fetchAllSentences();
    }
  }, [currentView]);

  const fetchBankInfo = async () => {
    if (!currentBank) return;
    try {
      const res = await sentenceApi.getBankInfo(currentBank.file);
      if (res.flag === 1) setBankInfo(res.content);
    } catch (err) {
      console.error('获取句子库信息失败:', err);
    }
  };

  // 计算统计信息 - 按单元和模式
  const calculateStats = useCallback((sentences) => {
    const stats = {};
    
    sentences.forEach(s => {
      const unit = s.unit || 1;
      if (!stats[unit]) {
        stats[unit] = {
          total: 0,
          mastered: 0,
          unmastered: 0,
          neverPracticed: 0,
          byMode: {
            choice: { mastered: 0, unmastered: 0, neverPracticed: 0 },
            cloze: { mastered: 0, unmastered: 0, neverPracticed: 0 },
            input: { mastered: 0, unmastered: 0, neverPracticed: 0 }
          }
        };
      }
      
      stats[unit].total++;
      
      // 统计各模式在当前句子中的情况
      MODES.forEach(mode => {
        const modeKey = mode.value;
        const modeStat = s.stats?.mode_stats?.[modeKey];
        const recentResults = s.stats?.recent_results?.[modeKey] || [];
        
        const hasPractice = modeStat && (modeStat.correct + modeStat.wrong) > 0;
        
        if (!hasPractice) {
          stats[unit].byMode[modeKey].neverPracticed++;
        } else {
          // 判断是否掌握：最近两次都正确，或只有一次且正确
          const isMastered = (recentResults.length === 1 && recentResults[0] === true) ||
                            (recentResults.length >= 2 && recentResults.slice(-2).every(r => r === true));
          
          if (isMastered) {
            stats[unit].byMode[modeKey].mastered++;
          } else {
            stats[unit].byMode[modeKey].unmastered++;
          }
        }
      });
      
      // 统计该句子的总体掌握情况（用于单元级别）
      const hasAnyPractice = MODES.some(mode => {
        const modeKey = mode.value;
        const modeStat = s.stats?.mode_stats?.[modeKey];
        return modeStat && (modeStat.correct + modeStat.wrong) > 0;
      });
      
      if (!hasAnyPractice) {
        stats[unit].neverPracticed++;
      } else {
        const allModesMastered = MODES.every(mode => {
          const modeKey = mode.value;
          const modeStat = s.stats?.mode_stats?.[modeKey];
          const recentResults = s.stats?.recent_results?.[modeKey] || [];
          const hasPractice = modeStat && (modeStat.correct + modeStat.wrong) > 0;
          
          if (!hasPractice) return false;
          
          return (recentResults.length === 1 && recentResults[0] === true) ||
                 (recentResults.length >= 2 && recentResults.slice(-2).every(r => r === true));
        });
        
        if (allModesMastered) {
          stats[unit].mastered++;
        } else {
          stats[unit].unmastered++;
        }
      }
    });
    
    console.log('单元模式统计:', stats);
    setUnitModeStats(stats);
  }, []);

  const fetchAllSentences = async () => {
    if (!currentBank) return;
    setLoading(true);
    try {
      const res = await sentenceApi.getWords(currentBank.file);
      if (res.flag === 1) {
        const sentences = res.content.words || [];
        const formattedSentences = sentences.map(s => ({
          id: s.id,
          english: s.word,
          chinese: s.translation,
          words: s.word.split(' '),
          stats: s.stats || null,
          unit: s.unit || 1
        }));
        setAllSentences(formattedSentences);
        
        const units = [...new Set(formattedSentences.map(s => s.unit))].sort();
        setAvailableUnits(units);
        
        calculateStats(formattedSentences);
        filterSentences(formattedSentences, searchTerm, selectedUnit);
        
        setSnackbar({
          open: true,
          message: '✅ 数据已更新',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('获取句子列表失败:', err);
      setSnackbar({
        open: true,
        message: '❌ 获取数据失败',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 过滤句子 - 修复单元过滤
  const filterSentences = (sentences, term, unit) => {
    console.log('过滤前句子数:', sentences.length, '选中单元:', unit);
    
    let filtered = sentences;
    
    // 先按单元筛选
    if (unit && unit !== 'all') {
      const unitNum = parseInt(unit);
      filtered = filtered.filter(s => {
        const match = s.unit === unitNum;
        return match;
      });
      console.log('按单元过滤后:', filtered.length, '单元:', unitNum);
    }
    
    // 再按搜索词筛选
    if (term && term.trim()) {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter(s => 
        s.english?.toLowerCase().includes(lowerTerm) ||
        s.chinese?.toLowerCase().includes(lowerTerm)
      );
      console.log('按搜索词过滤后:', filtered.length);
    }
    
    console.log('最终过滤结果:', filtered.length);
    setFilteredSentences(filtered);
    setPage(0);
  };

  useEffect(() => {
    filterSentences(allSentences, searchTerm, selectedUnit);
  }, [searchTerm, selectedUnit, allSentences]);

  // 分页
  useEffect(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    setPaginatedSentences(filteredSentences.slice(start, end));
  }, [filteredSentences, page, rowsPerPage]);

  // 获取当前单元的统计（按模式）
  const getCurrentUnitModeStats = useCallback(() => {
    if (selectedUnit === 'all') {
      // 汇总所有单元
      const total = Object.values(unitModeStats).reduce((sum, u) => sum + u.total, 0);
      const mastered = Object.values(unitModeStats).reduce((sum, u) => sum + u.mastered, 0);
      const unmastered = Object.values(unitModeStats).reduce((sum, u) => sum + u.unmastered, 0);
      const neverPracticed = Object.values(unitModeStats).reduce((sum, u) => sum + u.neverPracticed, 0);
      
      // 汇总各模式
      const byMode = {
        choice: { mastered: 0, unmastered: 0, neverPracticed: 0 },
        cloze: { mastered: 0, unmastered: 0, neverPracticed: 0 },
        input: { mastered: 0, unmastered: 0, neverPracticed: 0 }
      };
      
      Object.values(unitModeStats).forEach(unit => {
        MODES.forEach(mode => {
          byMode[mode.value].mastered += unit.byMode[mode.value].mastered;
          byMode[mode.value].unmastered += unit.byMode[mode.value].unmastered;
          byMode[mode.value].neverPracticed += unit.byMode[mode.value].neverPracticed;
        });
      });
      
      return { total, mastered, unmastered, neverPracticed, byMode };
    } else {
      const unitNum = parseInt(selectedUnit);
      console.log('获取单元统计:', unitNum, unitModeStats[unitNum]);
      return unitModeStats[unitNum] || { 
        total: 0, mastered: 0, unmastered: 0, neverPracticed: 0,
        byMode: {
          choice: { mastered: 0, unmastered: 0, neverPracticed: 0 },
          cloze: { mastered: 0, unmastered: 0, neverPracticed: 0 },
          input: { mastered: 0, unmastered: 0, neverPracticed: 0 }
        }
      };
    }
  }, [selectedUnit, unitModeStats]);

  // 获取当前模式的统计
  const getCurrentModeStats = useCallback(() => {
    const unitStats = getCurrentUnitModeStats();
    return unitStats.byMode[selectedMode] || { mastered: 0, unmastered: 0, neverPracticed: 0 };
  }, [getCurrentUnitModeStats, selectedMode]);

  // 验证题目数量 - 基于当前模式的胜率
  const validateQuestionCount = (value) => {
    if (value < 1) return '题目数量不能小于1';
    
    const unitStats = getCurrentUnitModeStats();
    const modeStats = getCurrentModeStats();
    
    console.log('验证:', { unitStats, modeStats, extractType });
    
    // 总单词数不变
    if (value > unitStats.total) return `不能超过 ${unitStats.total} 个`;
    
    // 根据抽取方式检查可用数量（基于当前模式）
    let availableCount = 0;
    switch (extractType) {
      case 'random':
        availableCount = unitStats.total;
        break;
      case 'new':
        availableCount = modeStats.neverPracticed;
        break;
      case 'unmastered':
        availableCount = modeStats.unmastered;
        break;
      default:
        availableCount = unitStats.total;
    }
    
    console.log('可用数量:', availableCount);
    
    if (value > availableCount) {
      return `当前模式下符合条件的单词只有 ${availableCount} 个`;
    }
    
    return '';
  };

  const handleQuestionCountChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setQuestionCountValue(value);
    setCountError(validateQuestionCount(value));
  };

  // ========== 抽取方式变化处理 ==========
  const handleExtractTypeChange = (event) => {
    const newExtractType = event.target.value;
    setExtractType(newExtractType);
    
    // 使用 setTimeout 确保状态更新后获取最新统计
    setTimeout(() => {
      const unitStats = getCurrentUnitModeStats();
      const modeStats = getCurrentModeStats();
      
      // 根据抽取方式计算最大可用数量
      let maxAvailable = 0;
      switch (newExtractType) {
        case 'random':
          maxAvailable = unitStats.total;
          break;
        case 'new':
          maxAvailable = modeStats.neverPracticed;
          break;
        case 'unmastered':
          maxAvailable = modeStats.unmastered;
          break;
        default:
          maxAvailable = unitStats.total;
      }
      
      console.log('【抽取方式变更】', {
        新抽取方式: newExtractType,
        最大可用数量: maxAvailable,
        单元统计: unitStats,
        模式统计: modeStats
      });
      
      // 自动设置题目数量为最大可用值
      setQuestionCountValue(maxAvailable > 0 ? maxAvailable : 1);
      setCountError(validateQuestionCount(maxAvailable > 0 ? maxAvailable : 1));
    }, 0);
  };

  // ========== 模式变化处理 ==========
  const handleModeChange = (event) => {
    const newMode = event.target.value;
    setSelectedMode(newMode);
    
    // 使用 setTimeout 确保状态更新后获取最新统计
    setTimeout(() => {
      const unitStats = getCurrentUnitModeStats();
      const modeStats = getCurrentModeStats();
      
      // 根据当前抽取方式计算最大可用数量
      let maxAvailable = 0;
      switch (extractType) {
        case 'random':
          maxAvailable = unitStats.total;
          break;
        case 'new':
          maxAvailable = modeStats.neverPracticed;
          break;
        case 'unmastered':
          maxAvailable = modeStats.unmastered;
          break;
        default:
          maxAvailable = unitStats.total;
      }
      
      console.log('【模式变更】', {
        新模式: newMode,
        当前抽取方式: extractType,
        最大可用数量: maxAvailable
      });
      
      // 自动设置题目数量为最大可用值
      setQuestionCountValue(maxAvailable > 0 ? maxAvailable : 1);
      setCountError(validateQuestionCount(maxAvailable > 0 ? maxAvailable : 1));
    }, 0);
  };

  // ========== 单元变化处理 ==========
  const handleUnitChange = (event) => {
    const newUnit = event.target.value;
    setSelectedUnit(newUnit);
    
    // 使用 setTimeout 确保状态更新后获取最新统计
    setTimeout(() => {
      const unitStats = getCurrentUnitModeStats();
      const modeStats = getCurrentModeStats();
      
      // 根据当前抽取方式计算最大可用数量
      let maxAvailable = 0;
      switch (extractType) {
        case 'random':
          maxAvailable = unitStats.total;
          break;
        case 'new':
          maxAvailable = modeStats.neverPracticed;
          break;
        case 'unmastered':
          maxAvailable = modeStats.unmastered;
          break;
        default:
          maxAvailable = unitStats.total;
      }
      
      console.log('【单元变更】', {
        新单元: newUnit,
        当前抽取方式: extractType,
        最大可用数量: maxAvailable
      });
      
      // 自动设置题目数量为最大可用值
      setQuestionCountValue(maxAvailable > 0 ? maxAvailable : 1);
      setCountError(validateQuestionCount(maxAvailable > 0 ? maxAvailable : 1));
    }, 0);
  };

  // ========== 开始练习 ==========
  const handleStartTest = () => {
    console.log('打开练习对话框，重置所有设置');
    
    // 重置所有设置为默认值
    setSelectedMode('choice');        // 默认选择题模式
    setSelectedUnit('all');           // 默认全部单元
    setExtractType('random');         // 默认随机抽取
    setQuestionCountValue(5);         // 默认5题
    setCountError('');                // 清除错误信息
    
    setDialogOpen(true);
  };

  const handleConfirmStart = () => {
    const modeStats = getCurrentModeStats();
    const unitStats = getCurrentUnitModeStats();
    
    console.log('========== 开始抽取数据 ==========');
    console.log('【抽取配置】');
    console.log('- 选中单元:', selectedUnit);
    console.log('- 选中模式:', selectedMode);
    console.log('- 抽取方式:', extractType);
    console.log('- 题目数量:', questionCountValue);
    console.log('- 单元总单词:', unitStats.total);
    console.log('- 当前模式统计:', modeStats);
    
    // 根据抽取方式获取可用数量
    let availableIds = [];
    
    if (selectedUnit === 'all') {
      // 全部单元
      availableIds = allSentences.map(s => s.id);
      console.log('【第一步：按单元筛选】全部单元，初始ID数:', availableIds.length);
    } else {
      // 特定单元
      const unitNum = parseInt(selectedUnit);
      availableIds = allSentences
        .filter(s => s.unit === unitNum)
        .map(s => s.id);
      console.log(`【第一步：按单元筛选】Unit ${unitNum}，筛选后ID数:`, availableIds.length);
    }
    
    // 根据抽取方式进一步筛选
    if (extractType === 'new') {
      // 未练习的单词：没有 stats 或从未练习过
      availableIds = allSentences
        .filter(s => {
          if (selectedUnit !== 'all' && s.unit !== parseInt(selectedUnit)) return false;
          const stats = s.stats;
          return !stats || !stats.mode_stats?.[selectedMode] || 
                 (stats.mode_stats[selectedMode].correct + stats.mode_stats[selectedMode].wrong) === 0;
        })
        .map(s => s.id);
      console.log('【第二步：按抽取类型筛选】未练习单词，筛选后ID数:', availableIds.length);
      
      // 打印前5个未练习的单词示例
      const sampleWords = allSentences
        .filter(s => availableIds.includes(s.id))
        .slice(0, 5)
        .map(s => ({ id: s.id, english: s.english }));
      console.log('未练习单词示例:', sampleWords);
      
    } else if (extractType === 'unmastered') {
      // 未掌握的单词：练习过但不满足掌握条件
      availableIds = allSentences
        .filter(s => {
          if (selectedUnit !== 'all' && s.unit !== parseInt(selectedUnit)) return false;
          const stats = s.stats;
          const modeStat = stats?.mode_stats?.[selectedMode];
          const recentResults = stats?.recent_results?.[selectedMode] || [];
          
          if (!modeStat || (modeStat.correct + modeStat.wrong) === 0) return false;
          
          const isMastered = (recentResults.length === 1 && recentResults[0] === true) ||
                            (recentResults.length >= 2 && recentResults.slice(-2).every(r => r === true));
          
          return !isMastered;
        })
        .map(s => s.id);
      console.log('【第二步：按抽取类型筛选】未掌握单词，筛选后ID数:', availableIds.length);
      
      // 打印前5个未掌握的单词示例
      const sampleWords = allSentences
        .filter(s => availableIds.includes(s.id))
        .slice(0, 5)
        .map(s => ({ id: s.id, english: s.english, stats: s.stats?.mode_stats?.[selectedMode] }));
      console.log('未掌握单词示例:', sampleWords);
    }
    
    console.log('可用单词IDs总数:', availableIds.length);
    
    if (availableIds.length < questionCountValue) {
      console.warn('⚠️ 可用单词不足!');
      console.warn('- 需要数量:', questionCountValue);
      console.warn('- 可用数量:', availableIds.length);
      setCountError(`只有 ${availableIds.length} 个符合条件的单词`);
      return;
    }
    
    const error = validateQuestionCount(questionCountValue);
    if (error) {
      setCountError(error);
      return;
    }
    
    // 随机选择指定数量的单词ID
    console.log('【第三步：随机选择】');
    console.log('- 待选池大小:', availableIds.length);
    console.log('- 需要选择数量:', questionCountValue);
    
    const shuffled = [...availableIds].sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, questionCountValue);
    
    console.log('【最终选中的单词IDs】:', selectedIds);
    
    // 打印选中的单词详细信息
    const selectedWords = allSentences
      .filter(s => selectedIds.includes(s.id))
      .map(s => ({ 
        id: s.id, 
        english: s.english, 
        unit: s.unit,
        stats: s.stats?.mode_stats?.[selectedMode] 
      }));
    console.log('【选中的单词详情】:', selectedWords);
    
    // 传递给测试组件
    setTestConfig({
      mode: selectedMode,
      questionCount: questionCountValue,
      extractType: extractType,
      unit: selectedUnit,
      specificIds: selectedIds  // 直接传递选中的ID列表
    });
    
    console.log('【已设置testConfig】:', {
      mode: selectedMode,
      questionCount: questionCountValue,
      extractType: extractType,
      unit: selectedUnit,
      specificIds: selectedIds
    });
    
    setIsTestActive(true);
    setDialogOpen(false);
    console.log('========== 抽取完成 ==========');
  };

  const handleBackFromTest = useCallback(() => {
    console.log('从练习返回，重置所有设置');
    
    setIsTestActive(false);
    
    // 返回时也重置所有设置为默认值
    setSelectedMode('choice');
    setSelectedUnit('all');
    setExtractType('random');
    setQuestionCountValue(5);
    setCountError('');
    
    // 刷新句子数据
    fetchAllSentences();
  }, []);

  const handleSelectSentence = (sentence) => {
    setTestConfig({
      mode: selectedMode,
      questionCount: 1,
      extractType: 'specific',
      specificId: sentence.id,
      unit: selectedUnit
    });
    setIsTestActive(true);
  };

  const handleRefresh = () => {
    fetchAllSentences();
  };

  const handleBackToHome = () => navigate('/');

  const getSentenceStats = (sentenceId) => {
    const sentence = allSentences.find(s => s.id === sentenceId);
    return sentence?.stats || null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '从未';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '从未';
    }
  };

  // ========== 抽取对话框 ==========
  const renderDialog = () => {
    const unitStats = getCurrentUnitModeStats();
    const modeStats = getCurrentModeStats();
    
    // 根据抽取方式获取可用数量（基于当前模式）
    const getAvailableCount = () => {
      switch (extractType) {
        case 'random':
          return unitStats.total;
        case 'new':
          return modeStats.neverPracticed;
        case 'unmastered':
          return modeStats.unmastered;
        default:
          return unitStats.total;
      }
    };
    
    const availableCount = getAvailableCount();
    
    return (
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white', py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookIcon /> 开始练习
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          {/* 统计信息卡片 - 显示当前模式统计 */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              当前模式: {MODES.find(m => m.value === selectedMode)?.label}
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">总单词</Typography>
                <Typography variant="body2" fontWeight="bold">{unitStats.total}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="success.main">已掌握</Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">{modeStats.mastered}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="warning.main">未掌握</Typography>
                <Typography variant="body2" fontWeight="bold" color="warning.main">{modeStats.unmastered}</Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Chip size="small" label={`未练习: ${modeStats.neverPracticed}`} color="info" sx={{ height: 20 }} />
            </Box>
          </Paper>

          {/* 单元选择 */}
          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>单元</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select 
              value={selectedUnit} 
              onChange={handleUnitChange}  // 使用新的处理函数
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>📚 全部单元</span>
                  <Chip size="small" label={`${allSentences.length}词`} sx={{ ml: 1, height: 20 }} />
                </Box>
              </MenuItem>
              {availableUnits.map(unit => {
                const unitStat = unitModeStats[unit] || { total: 0 };
                return (
                  <MenuItem key={unit} value={unit}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>Unit {unit}</span>
                      <Chip size="small" label={`${unitStat.total}词`} sx={{ ml: 1, height: 20 }} />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* 模式选择 - 带统计（当单元改变时，这里的统计会自动更新） */}
          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>模式</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select 
              value={selectedMode} 
              onChange={handleModeChange}  // 使用新的处理函数
            >
              {MODES.map(mode => {
                const modeStat = unitStats.byMode[mode.value] || { mastered: 0, unmastered: 0, neverPracticed: 0 };
                return (
                  <MenuItem key={mode.value} value={mode.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                      <Box sx={{ color: mode.color }}>{mode.icon}</Box>
                      <Typography sx={{ flex: 1 }}>{mode.label}</Typography>
                      <Chip size="small" label={`✓${modeStat.mastered}`} color="success" sx={{ height: 18 }} />
                      <Chip size="small" label={`✗${modeStat.unmastered}`} color="warning" sx={{ height: 18 }} />
                      <Chip size="small" label={`新${modeStat.neverPracticed}`} color="info" sx={{ height: 18 }} />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* 抽取方式 - 只保留三个选项 */}
          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>抽取</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <Select 
              value={extractType} 
              onChange={handleExtractTypeChange}  // 使用新的处理函数
            >
              <MenuItem value="random">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>🎲 随机抽取</span>
                  <Chip size="small" label={`${unitStats.total}可抽`} sx={{ ml: 1, height: 18 }} />
                </Box>
              </MenuItem>
              <MenuItem value="new">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>🆕 还没有练习句子</span>
                  <Chip size="small" label={`${modeStats.neverPracticed}可抽`} color="info" sx={{ ml: 1, height: 18 }} />
                </Box>
              </MenuItem>
              <MenuItem value="unmastered">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>❌ 还没有掌握</span>
                  <Chip size="small" label={`${modeStats.unmastered}可抽`} color="warning" sx={{ ml: 1, height: 18 }} />
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* 题目数量 - 移到最下面 */}
          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>题目数量</Typography>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={questionCountValue}
            onChange={handleQuestionCountChange}
            error={!!countError}
            helperText={countError}
            sx={{ mb: 2 }}
            inputProps={{ min: 1, max: unitStats.total }}
          />

          {/* 提示信息 */}
          {extractType === 'unmastered' && modeStats.unmastered > 0 && (
            <Alert severity="info" sx={{ mt: 1, py: 0 }}>
              <Typography variant="caption">在当前模式下抽取还没有掌握的单词</Typography>
            </Alert>
          )}
          {availableCount === 0 && (
            <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
              <Typography variant="caption">当前模式下没有符合条件的单词</Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setDialogOpen(false)} size="small">取消</Button>
          <Button 
            onClick={handleConfirmStart} 
            variant="contained" 
            size="small"
            disabled={!currentBank || !!countError || !questionCountValue || availableCount === 0}
            startIcon={<PlayArrowIcon />}
          >
            开始 ({questionCountValue}题)
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ========== 头部 ==========
  const Header = () => (
    <AppBar position="static" sx={{ bgcolor: '#1a237e' }}>
      <Toolbar variant="dense">
        <Button variant="text" startIcon={<HomeIcon />} onClick={handleBackToHome} sx={{ color: 'white', mr: 1 }}>
          首页
        </Button>
        <Typography variant="subtitle1" sx={{ flex: 1, textAlign: 'center' }}>
          {currentBank?.name || '句子学习'}
        </Typography>
        <Tabs value={currentView} onChange={(e, v) => setCurrentView(v)} sx={{ mr: 1 }}>
          <Tab icon={<QuizIcon />} label="练习" sx={{ minWidth: 60, color: 'white' }} />
          <Tab icon={<ViewListIcon />} label="库" sx={{ minWidth: 60, color: 'white' }} />
        </Tabs>
        {currentView === 0 && !isTestActive && (
          <Button variant="contained" size="small" onClick={handleStartTest} startIcon={<PlayArrowIcon />} sx={{ bgcolor: '#ffd700', color: '#1a237e', mr: 1 }}>
            练习
          </Button>
        )}
        <IconButton size="small" color="inherit" onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );

  if (initialLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Header />
        <LinearProgress />
        <Container sx={{ py: 3, textAlign: 'center' }}>加载中...</Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }} ref={containerRef}>
      <Header />
      {loading && <LinearProgress />}

      <Container maxWidth="xl" sx={{ py: 2, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
        {currentView === 0 ? (
          isTestActive ? (
            <SentenceTest
              mode={testConfig.mode}
              bank={currentBank}
              questionCount={testConfig.questionCount}
              specificId={testConfig.specificId}
              specificIds={testConfig.specificIds}  // 传递选中的ID列表
              onBack={handleBackFromTest}
            />
          ) : currentBank ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
                <MenuBookIcon sx={{ fontSize: 60, color: '#1a237e', mb: 2 }} />
                <Typography variant="h6" gutterBottom>准备开始练习</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  点击按钮选择单元和模式
                </Typography>
                <Button variant="contained" onClick={handleStartTest} startIcon={<PlayArrowIcon />}>
                  开始练习
                </Button>
              </Paper>
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>请先选择一个句子库</Typography>
            </Paper>
          )
        ) : (
          <SentenceMasterView
            allSentences={allSentences}
            filteredSentences={filteredSentences}
            paginatedSentences={paginatedSentences}
            expandedRow={expandedRow}
            searchTerm={searchTerm}
            page={page}
            rowsPerPage={rowsPerPage}
            onSearchChange={setSearchTerm}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onRowExpand={setExpandedRow}
            onSelectSentence={handleSelectSentence}
            getSentenceStats={getSentenceStats}
            formatDate={formatDate}
            loading={loading}
            mode={selectedMode}
            selectedUnit={selectedUnit}
            onUnitChange={setSelectedUnit}
            availableUnits={availableUnits}
          />
        )}
      </Container>

      {renderDialog()}

      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 1 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SentenceCenter;