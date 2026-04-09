import React, { useState, useEffect, useRef } from 'react';
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
  Tabs,
  Tab,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  Quiz as QuizIcon,
  List as ListIcon,
  MenuBook as MenuBookIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  LibraryBooks as LibraryBooksIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { readingApi } from './api';
import ReadingTest from './test';
import ReadingMasterView from './view';

const ReadingCenter = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // ========== 状态管理 ==========
  const [passage, setPassage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [explanations, setExplanations] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [currentView, setCurrentView] = useState(0); // 0: 练习, 1: 题库
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  
  // 题库相关状态
  const [availableBanks, setAvailableBanks] = useState([]);
  const [currentBank, setCurrentBank] = useState(null);
  const [bankSelectorOpen, setBankSelectorOpen] = useState(false);
  
  // 题库分页
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 缓存数据
  const [allPassages, setAllPassages] = useState([]);
  const [stats, setStats] = useState(null);
  
  // 计时器相关
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);

  // ========== 初始化加载 ==========
  useEffect(() => {
    initData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ========== 切换题库时重新加载 ==========
  useEffect(() => {
    if (currentBank) {
      loadAllPassages();
      loadStats();
    }
  }, [currentBank]);

  // ========== 计时器管理 ==========
  useEffect(() => {
    if (currentView === 0 && passage && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentView, passage]);

  // ========== 重置计时器 ==========
  const resetTimer = () => {
    setTimeSpent(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const initData = async () => {
    setInitialLoading(true);
    try {
      // 获取所有可用题库
      const banksRes = await readingApi.getBanks();
      console.log('获取题库列表响应:', banksRes);
      
      if (banksRes?.flag === 1 && banksRes.content?.banks?.length > 0) {
        setAvailableBanks(banksRes.content.banks);
        
        // 默认选择第一个题库
        const defaultBank = banksRes.content.banks[0];
        setCurrentBank(defaultBank);
        
        setSnackbar({
          open: true,
          message: `📚 已加载 ${defaultBank.name} (${defaultBank.totalPassages}篇)`,
          severity: 'success'
        });
      } else {
        setError('没有找到可用的题库');
        setSnackbar({
          open: true,
          message: '⚠️ 没有找到可用的题库',
          severity: 'warning'
        });
      }
      
    } catch (error) {
      console.error('初始化失败:', error);
      setError('初始化失败：' + error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadAllPassages = async () => {
    if (!currentBank) return;
    
    try {
      const res = await readingApi.getPassages(currentBank.id);
      console.log('getPassages 响应:', res);
      
      if (res?.flag === 1) {
        const passages = res.content.passages || [];
        setAllPassages(passages);
        
        // 自动加载第一篇
        if (passages.length > 0) {
          await loadFirstPassage(passages[0]);
        }
      }
    } catch (error) {
      console.error('加载篇章列表失败:', error);
    }
  };

  const loadStats = async () => {
    if (!currentBank) return;
    
    try {
      const res = await readingApi.getReport(currentBank.id);
      if (res?.flag === 1) {
        setStats(res.content);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // ========== 加载第一篇 ==========
  const loadFirstPassage = async (firstPassage) => {
    try {
      setPassage({
        id: firstPassage.id,
        title: firstPassage.title,
        description: firstPassage.description,
        category: firstPassage.category,
        difficulty: firstPassage.difficulty,
        content: firstPassage.content || '',
        givenWords: firstPassage.givenWords || []
      });
      
      if (firstPassage.questions && firstPassage.questions.length > 0) {
        setQuestions(firstPassage.questions);
        
        const initialAnswers = {};
        const explanationsMap = {};
        
        firstPassage.questions.forEach(q => {
          initialAnswers[q.id] = '';
          explanationsMap[q.id] = {
            correct: q.correctAnswer,
            explanation: q.explanation
          };
        });
        
        setAnswers(initialAnswers);
        setExplanations(explanationsMap);
      }
      
      resetTimer();
    } catch (error) {
      console.error('加载第一篇失败:', error);
    }
  };

  // ========== 加载篇章详情 ==========
  const loadPassageDetail = async (selectedPassage) => {
    setLoading(true);
    try {
      const fullPassage = {
        id: selectedPassage.id,
        title: selectedPassage.title,
        description: selectedPassage.description,
        category: selectedPassage.category,
        difficulty: selectedPassage.difficulty,
        content: selectedPassage.content || '',
        givenWords: selectedPassage.givenWords || []
      };
      
      setPassage(fullPassage);
      
      if (selectedPassage.questions && selectedPassage.questions.length > 0) {
        setQuestions(selectedPassage.questions);
        
        const initialAnswers = {};
        const explanationsMap = {};
        
        selectedPassage.questions.forEach(q => {
          initialAnswers[q.id] = '';
          explanationsMap[q.id] = {
            correct: q.correctAnswer,
            explanation: q.explanation
          };
        });
        
        setAnswers(initialAnswers);
        setExplanations(explanationsMap);
        
        setSnackbar({
          open: true,
          message: `✅ 加载成功，${selectedPassage.questions.length} 道题目`,
          severity: 'success'
        });
      } else {
        setQuestions([]);
        setSnackbar({
          open: true,
          message: '⚠️ 加载成功，但无题目数据',
          severity: 'warning'
        });
      }
      
      resetTimer();
      return true;
      
    } catch (error) {
      console.error('加载篇章详情失败:', error);
      setSnackbar({
        open: true,
        message: '❌ 加载失败：' + error.message,
        severity: 'error'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ========== 切换题库 ==========
  const handleBankChange = async (bank) => {
    setCurrentBank(bank);
    setPassage(null);
    setQuestions([]);
    setAnswers({});
    setExplanations({});
    resetTimer();
    
    setSnackbar({
      open: true,
      message: `🔄 已切换到: ${bank.name}`,
      severity: 'info'
    });
    
    setBankSelectorOpen(false);
  };

  // ========== 过滤篇章 ==========
  const filteredPassages = allPassages.filter(p => {
    if (!searchTerm) return true;
    return (
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // ========== 分页 ==========
  const paginatedPassages = filteredPassages.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ========== 处理答案变更 ==========
  const handleAnswerChange = (questionId, value, allAnswers) => {
    if (allAnswers) {
      setAnswers(allAnswers);
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  // ========== 提交答案 ==========
  const handleSubmit = async (answers, timeSpent, stats) => {
    setLoading(true);
    try {
      const questionIds = Object.keys(answers);
      const answerValues = Object.values(answers);
      
      const submitData = {
        passageId: passage?.id,
        questionIds,
        answers: answerValues,
        timeSpent: timeSpent || 0
      };
      
      if (currentBank) {
        submitData.bank = currentBank.id;
      }
      
      const res = await readingApi.submitPassage(submitData);
      
      if (res?.flag === 1) {
        const summary = res.content.summary;
        const accuracy = Math.round(summary.accuracy * 100);
        
        setSnackbar({
          open: true,
          message: `✅ 提交成功！正确率：${accuracy}% (${summary.correct}/${summary.total})`,
          severity: 'success'
        });
        
        await loadStats();
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        return { 
          success: true, 
          accuracy,
          correctCount: summary.correct,
          totalCount: summary.total
        };
      } else {
        setSnackbar({
          open: true,
          message: res?.message || '❌ 提交失败',
          severity: 'error'
        });
        return { success: false, error: res?.message };
      }
    } catch (error) {
      console.error('提交失败:', error);
      setSnackbar({
        open: true,
        message: '❌ 提交失败：' + error.message,
        severity: 'error'
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== 处理题库选择 ==========
  const handleSelectPassage = async (selectedPassage) => {
    const success = await loadPassageDetail(selectedPassage);
    if (success) {
      setCurrentView(0);
    }
  };

  // 空刷新函数（保持兼容性）
  const handleRefresh = () => {
    // 刷新功能已移除
  };

  // ========== 获取篇章统计 ==========
  const getPassageStats = (passageId) => {
    return stats?.passages?.[passageId] || null;
  };

  // ========== 格式化日期 ==========
  const formatDate = (dateStr) => {
    if (!dateStr) return '从未';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '从未';
    }
  };

  // ========== 返回首页 ==========
  const handleBackToHome = () => {
    navigate('/');
  };

  // ========== 题库选择器对话框 ==========
  const renderBankSelector = () => (
    <Dialog open={bankSelectorOpen} onClose={() => setBankSelectorOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LibraryBooksIcon /> 选择题库
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <List>
          {availableBanks.map((bank, index) => (
            <React.Fragment key={bank.id}>
              <ListItem 
                button 
                onClick={() => handleBankChange(bank)}
                selected={currentBank?.id === bank.id}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: currentBank?.id === bank.id ? 'rgba(26, 35, 126, 0.08)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(26, 35, 126, 0.04)' }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: currentBank?.id === bank.id ? '#1a237e' : '#757575' }}>
                    <SchoolIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {bank.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({bank.id})
                      </Typography>
                      <Chip 
                        label={`v${bank.version}`} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {bank.description}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip 
                          size="small" 
                          label={`📖 ${bank.totalPassages}篇`} 
                          icon={<MenuBookIcon />}
                        />
                        <Chip 
                          size="small" 
                          label={`📝 ${bank.totalQuestions}题`} 
                          icon={<QuizIcon />}
                        />
                        {bank.userStats && bank.userStats.totalQuestionsAttempted > 0 && (
                          <Chip 
                            size="small" 
                            label={`📊 正确率: ${Math.round(bank.userStats.accuracy * 100)}%`}
                            icon={<TrendingUpIcon />}
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                      {bank.categories && bank.categories.length > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                          {bank.categories.slice(0, 3).map(cat => (
                            <Chip key={cat} size="small" label={cat} variant="outlined" />
                          ))}
                          {bank.categories.length > 3 && (
                            <Chip size="small" label={`+${bank.categories.length - 3}`} variant="outlined" />
                          )}
                        </Stack>
                      )}
                    </Box>
                  }
                />
                {currentBank?.id === bank.id && (
                  <Chip label="当前使用" color="primary" size="small" />
                )}
              </ListItem>
              {index < availableBanks.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setBankSelectorOpen(false)}>关闭</Button>
      </DialogActions>
    </Dialog>
  );

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
          {currentBank?.name || '阅读理解练习'}
        </Typography>

        <Button
          variant="contained"
          onClick={() => setBankSelectorOpen(true)}
          startIcon={<LibraryBooksIcon />}
          sx={{ 
            bgcolor: '#ffd700', 
            color: '#1a237e',
            '&:hover': { bgcolor: '#ffc107' },
            mr: 2
          }}
        >
          切换题库
        </Button>

        <Tabs 
          value={currentView} 
          onChange={(e, v) => setCurrentView(v)} 
          sx={{ 
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
            '& .Mui-selected': { color: 'white' }
          }}
        >
          <Tab icon={<QuizIcon />} label="练习" />
          <Tab icon={<ListIcon />} label="题库" />
        </Tabs>
      </Toolbar>
    </AppBar>
  );

  if (initialLoading) {
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

  if (!currentBank) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Header />
        <Container sx={{ py: 3, textAlign: 'center' }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" color="error">
              没有找到可用的题库
            </Typography>
            <Button 
              variant="contained" 
              onClick={initData} 
              sx={{ mt: 2 }}
            >
              重新加载
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }} ref={containerRef}>
      <Header />
      {loading && <LinearProgress />}

      <Container maxWidth="xl" sx={{ py: 3, height: 'calc(100vh - 80px)' }}>
        {currentView === 0 ? (
          <ReadingTest
            passage={passage}
            questions={questions}
            answers={answers}
            explanations={explanations}
            givenWords={passage?.givenWords || []}
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmit}
            timeSpent={timeSpent}
          />
        ) : (
          <ReadingMasterView
            allPassages={allPassages}
            filteredPassages={filteredPassages}
            paginatedPassages={paginatedPassages}
            expandedRow={expandedRow}
            searchTerm={searchTerm}
            page={page}
            rowsPerPage={rowsPerPage}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPage(0);
            }}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onRowExpand={setExpandedRow}
            onSelectPassage={handleSelectPassage}
            getPassageStats={getPassageStats}
            formatDate={formatDate}
            loading={loading}
            onFetchPassageDetail={loadPassageDetail}
            passageDetails={{}}
          />
        )}
      </Container>

      {renderBankSelector()}

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

export default ReadingCenter;