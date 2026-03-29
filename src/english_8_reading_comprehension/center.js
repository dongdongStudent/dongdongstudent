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
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Quiz as QuizIcon,
  List as ListIcon,
  Edit as EditIcon,
  MenuBook as MenuBookIcon
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  
  // 题库分页
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 抽取对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extractType, setExtractType] = useState('random');
  const [passageId, setPassageId] = useState('');
  
  // 缓存数据
  const [allPassages, setAllPassages] = useState([]);
  const [categories, setCategories] = useState([]);
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
      // 获取题库信息
      const bankRes = await readingApi.getBankInfo();
      if (bankRes?.flag === 1) {
        setBankInfo(bankRes.content.bank || null);
        if (bankRes.content.categories) {
          setCategories(bankRes.content.categories);
        }
      }
      
      // 获取所有篇章列表
      await loadAllPassages();
      
      // 获取学习报告
      await loadStats();
      
    } catch (error) {
      console.error('初始化失败:', error);
      setError('初始化失败：' + error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadAllPassages = async () => {
    try {
      const res = await readingApi.getPassages();
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
    try {
      const res = await readingApi.getReport();
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
      // 设置 passage 数据
      setPassage({
        id: firstPassage.id,
        title: firstPassage.title,
        description: firstPassage.description,
        category: firstPassage.category,
        difficulty: firstPassage.difficulty,
        content: firstPassage.content || '',
        givenWords: firstPassage.givenWords || []
      });
      
      // 设置题目数据
      if (firstPassage.questions && firstPassage.questions.length > 0) {
        setQuestions(firstPassage.questions);
        
        // 初始化答案和解析
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
      // 构建完整的 passage 对象
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
      
      // 处理题目数据
      if (selectedPassage.questions && selectedPassage.questions.length > 0) {
        setQuestions(selectedPassage.questions);
        
        // 初始化答案和解析
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

  // ========== 抽取题目 ==========
  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = passageId 
        ? { passageId } 
        : { type: extractType };
      
      const res = await readingApi.getPassage(params);
      
      if (res?.flag === 1 && res.content?.passage) {
        const passageData = res.content.passage;
        
        // 设置抽取到的数据
        setPassage({
          id: passageData.id,
          title: passageData.title,
          description: passageData.description,
          category: passageData.category,
          difficulty: passageData.difficulty,
          content: passageData.content || '',
          givenWords: passageData.givenWords || []
        });
        
        // 处理题目数据
        if (passageData.questions && passageData.questions.length > 0) {
          setQuestions(passageData.questions);
          
          const initialAnswers = {};
          const explanationsMap = {};
          
          passageData.questions.forEach(q => {
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
            message: `✅ 已加载 ${passageData.questions.length} 道题目`,
            severity: 'success'
          });
        }
        
        setCurrentView(0);
        resetTimer();
      } else {
        setSnackbar({
          open: true,
          message: res?.message || '❌ 抽取失败',
          severity: 'error'
        });
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('抽取失败:', error);
      setSnackbar({
        open: true,
        message: `❌ 抽取失败：${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

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
      
      const res = await readingApi.submitPassage({
        passageId: passage?.id,
        questionIds,
        answers: answerValues,
        timeSpent: timeSpent || 0
      });
      
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

  // ========== 刷新 ==========
  const handleRefresh = () => {
    if (passage) {
      const updatedPassage = allPassages.find(p => p.id === passage.id);
      if (updatedPassage) {
        loadPassageDetail(updatedPassage);
      }
    }
  };

  // ========== 处理题库选择 ==========
  const handleSelectPassage = async (selectedPassage) => {
    const success = await loadPassageDetail(selectedPassage);
    if (success) {
      setCurrentView(0);
    }
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

  // ========== 抽取对话框 ==========
  const renderDialog = () => (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookIcon /> 阅读理解 - 抽取题目
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>抽取方式</InputLabel>
          <Select
            value={extractType}
            onChange={(e) => {
              setExtractType(e.target.value);
              setPassageId('');
            }}
            label="抽取方式"
          >
            <MenuItem value="random">随机抽取</MenuItem>
            <MenuItem value="new">未练习篇章</MenuItem>
            <MenuItem value="review">复习篇章</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 1 }}>
          或者
        </Typography>

        <FormControl fullWidth>
          <InputLabel>指定篇章ID</InputLabel>
          <Select
            value={passageId}
            onChange={(e) => {
              setPassageId(e.target.value);
              setExtractType('');
            }}
            label="指定篇章ID"
          >
            <MenuItem value="">请选择篇章</MenuItem>
            {allPassages.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.title} ({p.questions?.length || 0}题)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)}>取消</Button>
        <Button 
          onClick={handleExtract} 
          variant="contained" 
          color="primary"
          disabled={!extractType && !passageId}
        >
          确认抽取
        </Button>
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
          {bankInfo?.name || '阅读理解练习'}
        </Typography>

        <Tabs 
          value={currentView} 
          onChange={(e, v) => setCurrentView(v)} 
          sx={{ 
            mr: 2,
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
            '& .Mui-selected': { color: 'white' }
          }}
        >
          <Tab icon={<QuizIcon />} label="练习" />
          <Tab icon={<ListIcon />} label="题库" />
        </Tabs>

        {currentView === 0 && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => setDialogOpen(true)}
              startIcon={<EditIcon />}
              sx={{ bgcolor: '#ffd700', color: '#1a237e' }}
            >
              抽取题目
            </Button>
            <IconButton color="inherit" onClick={handleRefresh} disabled={!passage}>
              <RefreshIcon />
            </IconButton>
          </Stack>
        )}
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

      {renderDialog()}

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