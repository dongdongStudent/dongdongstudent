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
import { clozeApi } from './clozeApi';
import ClozeTestView from './ClozeTestView';
import ClozeMasterView from './ClozeMasterView';

const ClozeCenter = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // ========== 状态管理 ==========
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confirmedAnswers, setConfirmedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentView, setCurrentView] = useState(0); // 0: 练习, 1: 题库
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 题库分页
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 抽取对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extractType, setExtractType] = useState('random');
  const [bank, setBank] = useState('middle');
  const [count, setCount] = useState(1);
  const [category, setCategory] = useState('all');
  
  // 缓存数据
  const [allQuestions, setAllQuestions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);

  // 当前题目
  const currentQuestion = questions[currentIndex];
  const isConfirmed = currentQuestion ? confirmedAnswers[currentQuestion.id] === true : false;

  // ========== 过滤题目 ==========
  const filteredQuestions = allQuestions.filter(q => {
    if (!searchTerm) return true;
    return (
      q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.number?.toString().includes(searchTerm)
    );
  });

  // ========== 分页 ==========
  const paginatedQuestions = filteredQuestions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ========== 初始化加载 ==========
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setInitialLoading(true);
    try {
      const banksRes = await clozeApi.getBanks();
      if (banksRes?.flag === 1) {
        setBanks(banksRes.content.banks || []);
        
        // 收集所有分类
        const allCats = [];
        banksRes.content.banks.forEach(b => {
          if (b.categories) {
            allCats.push(...b.categories);
          }
        });
        setCategories([...new Set(allCats)]);
      }
      await loadStats();
    } catch (error) {
      console.error('初始化失败:', error);
      setError('初始化失败：' + error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadAllQuestions = async (bankId) => {
    try {
      const res = await clozeApi.getQuestions({
        type: 'all',
        bank: bankId,
        count: 200,
        withDetails: true
      });
      
      if (res?.flag === 1) {
        setAllQuestions(res.content.questions || []);
      }
    } catch (error) {
      console.error('加载题目失败:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await clozeApi.getReport(bank);
      if (res?.flag === 1) {
        setStats(res.content);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // ========== 抽取题目 ==========
  const handleExtract = async () => {
    if (extractType === 'all') {
      await loadAllQuestions(bank);
      setCurrentView(1);
      setDialogOpen(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = {
        type: extractType,
        bank: bank,
        count: count
      };
      
      if (category !== 'all') params.category = category;
      
      console.log('抽取参数:', params);
      const res = await clozeApi.getQuestions(params);
      
      if (res?.flag === 1 && res.content?.questions?.length > 0) {
        setQuestions(res.content.questions);
        setCurrentIndex(0);
        
        // 初始化每个题目的答案为空对象
        const initialAnswers = {};
        res.content.questions.forEach(q => {
          initialAnswers[q.id] = {};
          q.blanks.forEach(blank => {
            initialAnswers[q.id][blank] = '';
          });
        });
        setAnswers(initialAnswers);
        
        setConfirmedAnswers({});
        setShowExplanation({});
        setCurrentView(0);
        
        setSnackbar({
          open: true,
          message: `已加载 ${res.content.questions.length} 篇阅读`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: '没有符合条件的题目',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('抽取失败:', error);
      setError('抽取失败：' + error.message);
    } finally {
      setLoading(false);
      setDialogOpen(false);
    }
  };

  // ========== 检查答案是否正确 ==========
  const checkAnswer = (question, userAnswer) => {
    if (!question || !question.correctAnswers) return false;
    
    return Object.entries(question.correctAnswers).every(([blankKey, correctOption]) => {
      return userAnswer[blankKey] === correctOption;
    });
  };

  // ========== 确认答案 ==========
  const handleConfirm = () => {
    if (!currentQuestion) return;
    
    if (isConfirmed) {
      setSnackbar({ open: true, message: '答案已锁定，不能修改', severity: 'info' });
      return;
    }

    const currentAnswers = answers[currentQuestion.id] || {};
    
    // 检查是否有空未填
    const hasEmpty = currentQuestion.blanks.some(blank => !currentAnswers[blank]);
    if (hasEmpty) {
      setSnackbar({ open: true, message: '请填写所有空格', severity: 'warning' });
      return;
    }

    setConfirmedAnswers(prev => ({ ...prev, [currentQuestion.id]: true }));
    setShowExplanation(prev => ({ ...prev, [currentQuestion.id]: true }));

    const isCorrect = checkAnswer(currentQuestion, currentAnswers);
    setSnackbar({ 
      open: true, 
      message: isCorrect ? '✓ 回答正确！' : `✗ 部分答案错误`, 
      severity: isCorrect ? 'success' : 'error' 
    });
  };

  // ========== 修改答案 ==========
  const handleModify = (questionId) => {
    const newConfirmed = { ...confirmedAnswers };
    delete newConfirmed[questionId];
    setConfirmedAnswers(newConfirmed);
    setShowExplanation(prev => ({ ...prev, [questionId]: false }));
  };

  // ========== 提交答案 ==========
  const handleSubmit = async (submitData) => {
    setLoading(true);
    try {
      console.log('提交数据:', submitData);
      const res = await clozeApi.submitAnswers(submitData);
      
      if (res?.flag === 1) {
        const summary = res.content.summary;
        setSnackbar({
          open: true,
          message: `提交成功！正确率：${Math.round(summary.accuracy * 100)}% (${summary.correct}/${summary.total})`,
          severity: 'success'
        });
        
        setQuestions([]);
        setAnswers({});
        setConfirmedAnswers({});
        setShowExplanation({});
        
        await loadStats();
        
        return { success: true, ...res.content };
      } else {
        setSnackbar({
          open: true,
          message: res?.message || '提交失败',
          severity: 'error'
        });
        return { success: false };
      }
    } catch (error) {
      console.error('提交失败:', error);
      setSnackbar({
        open: true,
        message: '提交失败：' + error.message,
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========== 处理题库选择 ==========
  const handleSelectQuestions = (selectedQuestions) => {
    const sorted = [...selectedQuestions].sort((a, b) => a.number - b.number);
    setQuestions(sorted);
    
    // 初始化答案
    const initialAnswers = {};
    sorted.forEach(q => {
      initialAnswers[q.id] = {};
      q.blanks.forEach(blank => {
        initialAnswers[q.id][blank] = '';
      });
    });
    setAnswers(initialAnswers);
    
    setCurrentView(0);
    setConfirmedAnswers({});
    setShowExplanation({});
    
    setSnackbar({
      open: true,
      message: `已选择 ${sorted.length} 篇阅读`,
      severity: 'success'
    });
  };

  // ========== 刷新当前题目 ==========
  const handleRefresh = () => {
    if (questions.length > 0) {
      handleExtract();
    }
  };

  // ========== 返回首页 ==========
  const handleBackToHome = () => {
    navigate('/');
  };

  // ========== 上一题/下一题 ==========
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // ========== 切换全屏 ==========
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error('全屏切换失败:', error);
    }
  };

  // ========== 获取题目统计 ==========
  const getQuestionStats = (questionId) => {
    return stats?.questions?.[questionId] || null;
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

  // ========== 计算统计 ==========
  const getStats = () => {
    const total = questions.length;
    const answered = Object.keys(confirmedAnswers).length;
    let correct = 0;
    
    questions.forEach(q => {
      if (confirmedAnswers[q.id]) {
        const userAnswer = answers[q.id] || {};
        if (checkAnswer(q, userAnswer)) {
          correct++;
        }
      }
    });
    
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    
    return { total, answered, correct, wrong: answered - correct, accuracy };
  };

  const practiceStats = getStats();
  const progress = practiceStats.total > 0 ? (practiceStats.answered / practiceStats.total) * 100 : 0;

  // ========== 抽取对话框 ==========
  const renderDialog = () => (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookIcon /> 七选五 - 抽取题目
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>题库</InputLabel>
          <Select
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            label="题库"
          >
            {banks.map(b => (
              <MenuItem key={b.id} value={b.key}>{b.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>抽取方式</InputLabel>
          <Select
            value={extractType}
            onChange={(e) => setExtractType(e.target.value)}
            label="抽取方式"
          >
            <MenuItem value="random">随机抽取</MenuItem>
            <MenuItem value="new">未练习题目</MenuItem>
            <MenuItem value="weak">薄弱题目</MenuItem>
            <MenuItem value="all">查看全部</MenuItem>
          </Select>
        </FormControl>

        {extractType !== 'all' && (
          <>
            <TextField
              fullWidth
              type="number"
              label="抽取数量"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              inputProps={{ min: 1, max: 10 }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth>
              <InputLabel>分类</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="分类"
              >
                <MenuItem value="all">全部分类</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)}>取消</Button>
        <Button onClick={handleExtract} variant="contained" color="primary">
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
          七选五阅读理解
        </Typography>

        <Tabs value={currentView} onChange={(e, v) => setCurrentView(v)} sx={{ mr: 2 }}>
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
            <IconButton color="inherit" onClick={handleRefresh} disabled={!questions.length}>
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

      <Container maxWidth={currentView === 0 ? "lg" : "xl"} sx={{ py: 3 }}>
        {currentView === 0 ? (
          <ClozeTestView
            questions={questions}
            currentIndex={currentIndex}
            currentQuestion={currentQuestion}
            isConfirmed={isConfirmed}
            answers={answers}
            confirmedAnswers={confirmedAnswers}
            showExplanation={showExplanation}
            practiceStats={practiceStats}
            progress={progress}
            isFullscreen={isFullscreen}
            onSetAnswers={setAnswers}
            onConfirm={handleConfirm}
            onModify={handleModify}
            onPrev={handlePrev}
            onNext={handleNext}
            onSetCurrentIndex={setCurrentIndex}
            onSubmit={handleSubmit}
            onToggleFullscreen={toggleFullscreen}
            checkAnswer={checkAnswer}
            loading={loading}
            bank={bank}
            onSetShowExplanation={setShowExplanation}
          />
        ) : (
          <ClozeMasterView
            allQuestions={allQuestions}
            filteredQuestions={filteredQuestions}
            paginatedQuestions={paginatedQuestions}
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
            onSelectQuestions={handleSelectQuestions}
            onLoadAllQuestions={() => loadAllQuestions(bank)}
            getQuestionStats={getQuestionStats}
            formatDate={formatDate}
            bank={bank}
            loading={loading}
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

export default ClozeCenter;