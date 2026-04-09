import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Quiz as QuizIcon,
  School as SchoolIcon,
  Visibility as VisibilityIcon,
  Folder as FolderIcon,
  Book as BookIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { wordMemoryApi } from './api';
import WordTest from './test';
import WordView from './view';
import WordBook from "../word/wordReviewBook.js";

// 样式组件
const StyledTabs = styled(Tabs)({
  '& .MuiTab-root': {
    color: 'rgba(255,255,255,0.7)',
    minWidth: 100,
  },
  '& .Mui-selected': {
    color: 'white',
  },
  '& .MuiTabs-indicator': {
    backgroundColor: 'white',
  }
});

// 统一的单词抽取配置
const EXTRACTION_CONFIGS = {
  sequential_all: {
    name: '顺序全部',
    type: 'sequential',
    count: 'all',
    shuffle: false,
    description: '按原始顺序抽取所有单词'
  },
  sequential_first_n: {
    name: '顺序前N个',
    type: 'sequential',
    count: 'fixed',
    shuffle: false,
    description: '按顺序抽取前N个单词'
  },
  sequential_range: {
    name: '顺序范围',
    type: 'sequential',
    count: 'range',
    shuffle: false,
    description: '按顺序抽取指定范围的单词'
  },
  random_n: {
    name: '随机N个',
    type: 'random',
    count: 'fixed',
    shuffle: true,
    description: '随机抽取N个单词'
  },
  random_all: {
    name: '随机全部',
    type: 'random',
    count: 'all',
    shuffle: true,
    description: '随机抽取所有单词（打乱顺序）'
  }
};

const WordCenter = () => {
  const navigate = useNavigate();

  // ========== 状态管理 ==========
  const [currentView, setCurrentView] = useState(0); // 0: 测试, 1: 预览
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ========== 单词库相关 ==========
  const [wordBanks, setWordBanks] = useState([]);
  const [currentBank, setCurrentBank] = useState(null);
  const [bankMenuAnchor, setBankMenuAnchor] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);

  // ========== 抽取设置 ==========
  const [extractionConfig, setExtractionConfig] = useState({
    mode: 'sequential_all',
    count: 10,
    startIndex: 0,
    endIndex: 50,
    customSeed: null
  });

  const [showSettings, setShowSettings] = useState(false);

  // ========== 统一的单词列表 ==========
  const [allWords, setAllWords] = useState([]);
  const [extractedWords, setExtractedWords] = useState([]);
  const [extractionKey, setExtractionKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // ========== 单词本弹窗状态 ==========
  const [showWordBook, setShowWordBook] = useState(false);
  const G_jsonName = 'word_textbook_review';

  // ========== 初始化加载 ==========
  useEffect(() => {
    loadWordBanks();
  }, []);

  // ========== 从服务端获取单词库列表 ==========
  const loadWordBanks = async () => {
    try {
      const res = await wordMemoryApi.getWordBanks();
      if (res?.flag === 1) {
        const banks = res.content.banks || [];
        setWordBanks(banks);

        if (banks.length > 0) {
          const defaultBank = banks[0];
          setCurrentBank(defaultBank);
          wordMemoryApi.setCurrentWordBank(defaultBank);
          await loadAllWords(defaultBank);
        }
      }
    } catch (error) {
      console.error('获取单词库列表失败:', error);
      setError('获取单词库列表失败');
    } finally {
      setInitialLoading(false);
    }
  };

  // ========== 加载所有单词 ==========
  const loadAllWords = async (bank) => {
    if (!bank) return;

    setLoading(true);
    try {
      const infoRes = await wordMemoryApi.getBankInfo(bank.file);
      if (infoRes?.flag === 1) {
        setBankInfo(infoRes.content);
        const words = infoRes.content.words || [];
        setAllWords(words);
        extractWordsByConfig(words, extractionConfig);
      }
    } catch (error) {
      console.error('加载单词失败:', error);
      setSnackbar({
        open: true,
        message: '❌ 加载单词失败',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== 根据配置抽取单词 ==========
  const extractWordsByConfig = useCallback((words, config) => {
    if (!words || words.length === 0) {
      setExtractedWords([]);
      return;
    }

    let result = [];
    const configDetail = EXTRACTION_CONFIGS[config.mode];

    if (!configDetail) {
      setExtractedWords([...words]);
      return;
    }

    if (configDetail.type === 'sequential') {
      if (configDetail.count === 'all') {
        result = [...words];
      } else if (configDetail.count === 'fixed') {
        const count = Math.min(config.count, words.length);
        result = words.slice(0, count);
      } else if (configDetail.count === 'range') {
        const start = Math.max(0, config.startIndex);
        const end = Math.min(words.length, config.endIndex);
        result = words.slice(start, end);
      }
    } else if (configDetail.type === 'random') {
      let shuffled = [...words];

      if (config.customSeed !== null) {
        shuffled = shuffleWithSeed(shuffled, config.customSeed);
      } else {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
      }

      if (configDetail.count === 'all') {
        result = shuffled;
      } else if (configDetail.count === 'fixed') {
        const count = Math.min(config.count, words.length);
        result = shuffled.slice(0, count);
      }
    }

    setExtractedWords(result);
    setExtractionKey(prev => prev + 1);
    return result;
  }, []);

  // ========== 带种子的随机打乱函数 ==========
  const shuffleWithSeed = (array, seed) => {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    let random;

    const seededRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    while (currentIndex !== 0) {
      random = Math.floor(seededRandom() * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[currentIndex]] = [shuffled[currentIndex], shuffled[currentIndex]];
    }

    return shuffled;
  };

  // ========== 当选择的单词库改变时重新加载 ==========
  useEffect(() => {
    if (currentBank && !initialLoading) {
      loadAllWords(currentBank);
    }
  }, [currentBank]);

  // ========== 当抽取配置改变时重新抽取 ==========
  useEffect(() => {
    if (allWords.length > 0) {
      extractWordsByConfig(allWords, extractionConfig);
    }
  }, [extractionConfig, extractWordsByConfig]);

  // ========== 处理单词库改变 ==========
  const handleBankChange = async (bank) => {
    setCurrentBank(bank);
    wordMemoryApi.setCurrentWordBank(bank);

    setSnackbar({
      open: true,
      message: `✅ 已切换到 ${bank.name}`,
      severity: 'success'
    });
  };

  // ========== 刷新数据 ==========
  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (currentBank) {
        await loadAllWords(currentBank);
      }
      setRefreshKey(prev => prev + 1);

      setSnackbar({
        open: true,
        message: '✅ 刷新成功',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '❌ 刷新失败',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== 返回首页 ==========
  const handleBackToHome = () => {
    navigate('/english_book_pic_read');
  };

  // ========== 打开单词库菜单 ==========
  const handleBankMenuOpen = (event) => {
    setBankMenuAnchor(event.currentTarget);
  };

  // ========== 关闭单词库菜单 ==========
  const handleBankMenuClose = () => {
    setBankMenuAnchor(null);
  };

  // ========== 打开单词本 ==========
  const handleOpenWordBook = () => {
    setShowWordBook(true);
  };

  // ========== 关闭单词本 ==========
  const handleCloseWordBook = () => {
    setShowWordBook(false);
  };

  // ========== 选择单词库 ==========
  const handleBankSelect = async (bank) => {
    handleBankMenuClose();

    if (!currentBank || currentBank.id !== bank.id) {
      await handleBankChange(bank);
    }
  };

  // ========== 处理视图切换 ==========
  const handleViewChange = (event, newValue) => {
    setCurrentView(newValue);
    setRefreshKey(prev => prev + 1);
  };

  // ========== 更新抽取配置 ==========
  const updateExtractionConfig = (key, value) => {
    setExtractionConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ========== 应用抽取设置 ==========
  const applyExtractionSettings = () => {
    setShowSettings(false);
    extractWordsByConfig(allWords, extractionConfig);

    setSnackbar({
      open: true,
      message: '✅ 抽取设置已应用',
      severity: 'success'
    });
  };

  // ========== 重置抽取设置为默认 ==========
  const resetExtractionSettings = () => {
    setExtractionConfig({
      mode: 'sequential_all',
      count: 10,
      startIndex: 0,
      endIndex: 50,
      customSeed: null
    });
    setShowSettings(false);

    setSnackbar({
      open: true,
      message: '✅ 已重置为默认设置',
      severity: 'success'
    });
  };

  // ========== 获取当前抽取模式的UI组件 ==========
  const renderExtractionSettings = () => {
    const configDetail = EXTRACTION_CONFIGS[extractionConfig.mode];

    return (
      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>抽取模式</InputLabel>
          <Select
            value={extractionConfig.mode}
            onChange={(e) => updateExtractionConfig('mode', e.target.value)}
            label="抽取模式"
          >
            {Object.entries(EXTRACTION_CONFIGS).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                <Box>
                  <Typography variant="body2">{config.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {config.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {configDetail?.count === 'fixed' && (
          <TextField
            fullWidth
            type="number"
            label="抽取数量"
            value={extractionConfig.count}
            onChange={(e) => updateExtractionConfig('count', Math.max(1, parseInt(e.target.value) || 10))}
            sx={{ mb: 2 }}
            helperText={`最多 ${allWords.length} 个单词`}
          />
        )}

        {configDetail?.count === 'range' && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="起始索引"
              value={extractionConfig.startIndex}
              onChange={(e) => updateExtractionConfig('startIndex', Math.max(0, parseInt(e.target.value) || 0))}
            />
            <TextField
              fullWidth
              type="number"
              label="结束索引"
              value={extractionConfig.endIndex}
              onChange={(e) => updateExtractionConfig('endIndex', Math.min(allWords.length, parseInt(e.target.value) || allWords.length))}
            />
          </Box>
        )}

        {configDetail?.type === 'random' && (
          <TextField
            fullWidth
            label="随机种子（留空则使用随机）"
            value={extractionConfig.customSeed === null ? '' : extractionConfig.customSeed}
            onChange={(e) => {
              const val = e.target.value;
              updateExtractionConfig('customSeed', val === '' ? null : parseInt(val) || 0);
            }}
            sx={{ mb: 2 }}
            helperText="设置相同的种子可以得到相同的随机结果"
          />
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button variant="contained" onClick={applyExtractionSettings} fullWidth>
            应用设置
          </Button>
          <Button variant="outlined" onClick={resetExtractionSettings} fullWidth>
            重置
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            📊 当前共 {allWords.length} 个单词，已抽取 {extractedWords.length} 个单词
            <br />
            📝 抽取方式：{configDetail?.name}
          </Typography>
        </Alert>
      </Box>
    );
  };

  // ========== 头部 ==========
  const Header = () => (
    <AppBar position="static" sx={{ bgcolor: '#1a237e' }}>
      <Toolbar>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={handleBackToHome}
          sx={{ borderRadius: 2, borderColor: 'white', color: 'white', mr: 2 }}
        >
          返回
        </Button>

        {/* 单词库选择和显示区域 - 合并在一起 */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 1
        }}>
          {/* 单词库切换按钮 - 显示当前单词库名称 */}
          <Button
            onClick={handleBankMenuOpen}
            sx={{ 
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
            endIcon={<ChevronRightIcon />}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <FolderIcon fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 'normal' }}>
                {currentBank?.name || '选择单词库'}
              </Typography>
            </Stack>
          </Button>

          {/* 单词数量显示 */}
          {extractedWords.length > 0 && (
            <Chip
              label={`${extractedWords.length} 个单词`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
        </Box>

        {/* 单词库选择菜单 */}
        <Menu
          anchorEl={bankMenuAnchor}
          open={Boolean(bankMenuAnchor)}
          onClose={handleBankMenuClose}
          PaperProps={{
            sx: {
              maxHeight: 400,
              width: 320,
              borderRadius: 2,
              mt: 1
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ px: 2, py: 1.5, bgcolor: '#f5f5f5', fontWeight: 600 }}>
            📚 选择单词库
          </Typography>
          {wordBanks.map((bank) => (
            <MenuItem
              key={bank.id}
              onClick={() => handleBankSelect(bank)}
              selected={currentBank?.id === bank.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1.5,
                px: 2,
                borderLeft: currentBank?.id === bank.id ? '3px solid #2196f3' : '3px solid transparent'
              }}
            >
              <FolderIcon fontSize="small" color={currentBank?.id === bank.id ? 'primary' : 'action'} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={currentBank?.id === bank.id ? 600 : 400}>
                  {bank.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {bank.description || '无描述'}
                </Typography>
                {bank.categories && (
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                    {bank.categories.slice(0, 2).map((cat, idx) => (
                      <Chip
                        key={idx}
                        label={cat}
                        size="small"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
              {currentBank?.id === bank.id && (
                <Chip size="small" label="当前" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
            </MenuItem>
          ))}
        </Menu>

        {/* 模式切换 Tabs */}
        <StyledTabs
          value={currentView}
          onChange={handleViewChange}
          sx={{ mx: 2 }}
        >
          <Tab icon={<QuizIcon />} label="测试" />
          <Tab icon={<VisibilityIcon />} label="预览" />
        </StyledTabs>

        {/* 单词本按钮 */}
        <Button
          variant="outlined"
          startIcon={<BookIcon />}
          onClick={handleOpenWordBook}
          sx={{
            mr: 1,
            borderRadius: 2,
            borderColor: 'white',
            color: 'white',
            '&:hover': { borderColor: '#ffd700', color: '#ffd700' }
          }}
        >
          单词本
        </Button>

        {/* 设置和刷新按钮 */}
        <IconButton 
          size="small" 
          onClick={() => setShowSettings(true)} 
          sx={{ color: 'white', mr: 1 }}
          title="抽取设置"
        >
          <SettingsIcon />
        </IconButton>

        <IconButton 
          size="small" 
          onClick={handleRefresh} 
          sx={{ color: 'white' }} 
          title="刷新"
        >
          <RefreshIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );

  // ========== 抽取设置对话框 ==========
  const ExtractionSettingsDialog = () => (
    <Dialog
      open={showSettings}
      onClose={() => setShowSettings(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon />
          <Typography variant="h6">单词抽取设置</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {renderExtractionSettings()}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowSettings(false)}>关闭</Button>
      </DialogActions>
    </Dialog>
  );

  if (initialLoading && wordBanks.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Header />
        <LinearProgress />
        <Container sx={{ py: 3, textAlign: 'center' }}>
          <Paper sx={{ p: 4 }}>加载中...</Paper>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Header />
        <Container sx={{ py: 3 }}>
          <Alert severity="error">{error}</Alert>
          <Button variant="contained" onClick={loadWordBanks} sx={{ mt: 2 }}>重试</Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Header />
      {loading && <LinearProgress />}

      <Container maxWidth="xl" sx={{ py: 3 }}>

        {/* 抽取信息提示 */}
        {extractedWords.length > 0 && allWords.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }} icon={<SettingsIcon />}>
            当前抽取模式：{EXTRACTION_CONFIGS[extractionConfig.mode]?.name} |
            已抽取 {extractedWords.length} / {allWords.length} 个单词
            {extractionConfig.customSeed !== null && ` | 随机种子: ${extractionConfig.customSeed}`}
          </Alert>
        )}

        {/* 单词本弹窗 */}
        {showWordBook && (
          <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <WordBook
              G_json={G_jsonName}
              onClose={() => setShowWordBook(false)}
            />
          </Paper>
        )}

        {/* 内容区域 - 传递统一的抽取单词列表 */}
        {currentView === 0 && (
          <WordTest
            key={`test-${refreshKey}-${extractionKey}`}
            initialMode="flashcard"
            onBack={() => setCurrentView(0)}
            currentBank={currentBank}
            extractedWords={extractedWords}
          />
        )}
        {currentView === 1 && (
          <WordView
            key={`view-${refreshKey}-${extractionKey}`}
            onBack={() => setCurrentView(0)}
            currentBank={currentBank}
            extractedWords={extractedWords}
          />
        )}
      </Container>

      {/* 抽取设置对话框 */}
      <ExtractionSettingsDialog />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, boxShadow: 3 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WordCenter;