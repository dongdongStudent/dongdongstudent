import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Quiz as QuizIcon,
  School as SchoolIcon,
  Visibility as VisibilityIcon,
  Folder as FolderIcon,
  Book as BookIcon,
  ArrowBack as ArrowBackIcon
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

const WordCenter = () => {
  const navigate = useNavigate();
  
  // ========== 状态管理 ==========
  const [currentView, setCurrentView] = useState(0); // 0: 测试, 1: 预览
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // ========== 从服务端获取的单词库列表 ==========
  const [wordBanks, setWordBanks] = useState([]);
  const [currentBank, setCurrentBank] = useState(null);
  const [bankMenuAnchor, setBankMenuAnchor] = useState(null);
  
  // 数据状态
  const [bankInfo, setBankInfo] = useState(null);
  
  // 用于触发子组件刷新的 key
  const [refreshKey, setRefreshKey] = useState(0);
  
  // ========== 单词本弹窗状态 ==========
  const [showWordBook, setShowWordBook] = useState(false);
  const G_jsonName = 'word_textbook_review';

  // ========== 初始化加载 ==========
  useEffect(() => {
    loadWordBanks();
  }, []);

  // ========== 当选择的单词库改变时重新加载数据 ==========
  useEffect(() => {
    if (currentBank && !initialLoading) {
      handleBankChange();
    }
  }, [currentBank]);

  // ========== 从服务端获取单词库列表 ==========
  const loadWordBanks = async () => {
    try {
      const res = await wordMemoryApi.getWordBanks();
      if (res?.flag === 1) {
        const banks = res.content.banks || [];
        setWordBanks(banks);
        
        // 默认选择第一个单词库
        if (banks.length > 0) {
          const defaultBank = banks[0];
          setCurrentBank(defaultBank);
          wordMemoryApi.setCurrentWordBank(defaultBank);
        }
      }
    } catch (error) {
      console.error('获取单词库列表失败:', error);
      setError('获取单词库列表失败');
    }
  };

  // ========== 处理单词库改变 ==========
  const handleBankChange = async () => {
    if (!currentBank) return;
    
    setLoading(true);
    try {
      const infoRes = await wordMemoryApi.getBankInfo(currentBank.file);
      if (infoRes?.flag === 1) {
        setBankInfo(infoRes.content);
      }
      
      setRefreshKey(prev => prev + 1);
      
      setSnackbar({
        open: true,
        message: `✅ 已切换到 ${currentBank.name}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('切换单词库失败:', error);
      setSnackbar({
        open: true,
        message: '❌ 切换数据源失败',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== 初始化数据 ==========
  const initData = async () => {
    setInitialLoading(true);
    try {
      if (currentBank) {
        const infoRes = await wordMemoryApi.getBankInfo(currentBank.file);
        if (infoRes?.flag === 1) {
          setBankInfo(infoRes.content);
        }
      }
    } catch (error) {
      console.error('初始化失败:', error);
      setError('初始化失败：' + error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  // ========== 刷新数据 ==========
  const handleRefresh = async () => {
    setLoading(true);
    try {
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
    navigate('/');
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
      setCurrentBank(bank);
      wordMemoryApi.setCurrentWordBank(bank);
      setLoading(true);
      
      try {
        const infoRes = await wordMemoryApi.getBankInfo(bank.file);
        if (infoRes?.flag === 1) {
          setBankInfo(infoRes.content);
        }
        
        setRefreshKey(prev => prev + 1);
        
        setSnackbar({
          open: true,
          message: `✅ 已切换到 ${bank.name}`,
          severity: 'success'
        });
      } catch (error) {
        console.error('切换单词库失败:', error);
        setSnackbar({
          open: true,
          message: '❌ 切换数据源失败',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // ========== 处理视图切换 ==========
  const handleViewChange = (event, newValue) => {
    setCurrentView(newValue);
    setRefreshKey(prev => prev + 1);
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
          首页
        </Button>
        
        <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>
          单词记忆
          {currentBank && (
            <Typography 
              component="span" 
              variant="caption" 
              sx={{ 
                ml: 1, 
                opacity: 0.8, 
                bgcolor: 'rgba(255,255,255,0.1)', 
                px: 1, 
                py: 0.5, 
                borderRadius: 1 
              }}
            >
              {currentBank.name}
            </Typography>
          )}
        </Typography>

        {/* 模式切换 Tabs */}
        <StyledTabs 
          value={currentView} 
          onChange={handleViewChange} 
          sx={{ mr: 2 }}
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
            mr: 2,
            borderRadius: 2,
            borderColor: 'white',
            color: 'white',
            '&:hover': { borderColor: '#ffd700', color: '#ffd700' }
          }}
        >
          个人单词本
        </Button>

        {/* 单词库选择和刷新按钮 */}
        <Stack direction="row" spacing={1} alignItems="center">
          {wordBanks.length > 0 && (
            <>
              <IconButton 
                size="small" 
                onClick={handleBankMenuOpen} 
                sx={{ color: 'white' }}
                title="选择单词库"
              >
                <FolderIcon />
              </IconButton>
              
              {/* 单词库选择菜单 */}
              <Menu
                anchorEl={bankMenuAnchor}
                open={Boolean(bankMenuAnchor)}
                onClose={handleBankMenuClose}
                PaperProps={{
                  sx: {
                    maxHeight: 400,
                    width: 300,
                    borderRadius: 2
                  }
                }}
              >
                <Typography variant="subtitle2" sx={{ px: 2, py: 1.5, bgcolor: '#f5f5f5', fontWeight: 600 }}>
                  选择单词库
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
            </>
          )}
          
          <IconButton size="small" onClick={handleRefresh} sx={{ color: 'white' }} title="刷新">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
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
        {/* 顶部导航栏 - 类似听力大师的样式 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBackToHome} 
            sx={{ borderRadius: 3 }}
          >
            返回主页
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setShowWordBook(prev => !prev)} 
            sx={{ borderRadius: 3, ml: 1 }}
          >
            {showWordBook ? '关闭单词本' : '单词复习'}
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center', flex: 1 }}>
            📚 单词记忆
          </Typography>
        </Box>

        {/* 单词本弹窗（内嵌式，不占满全屏） */}
        {showWordBook && (
          <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <WordBook 
              G_json={G_jsonName} 
              onClose={() => setShowWordBook(false)}
            />
          </Paper>
        )}

        {/* 内容区域 */}
        {currentView === 0 && (
          <WordTest 
            key={`test-${refreshKey}`}
            initialMode="flashcard" 
            onBack={() => setCurrentView(0)}
            currentBank={currentBank}
          />
        )}
        {currentView === 1 && (
          <WordView 
            key={`view-${refreshKey}`}
            onBack={() => setCurrentView(0)}
            currentBank={currentBank}
          />
        )}
      </Container>

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