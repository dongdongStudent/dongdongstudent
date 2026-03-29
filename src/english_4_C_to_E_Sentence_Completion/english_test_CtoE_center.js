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
  Translate as TranslateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cToEApi } from './api';
import CToETestView from './CToETestView';
import CToEMasterView from './CToEMasterView';

const CToECenter = () => {
  const navigate = useNavigate();
  const inputRefs = useRef([]);
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
  const [inputValue, setInputValue] = useState('');
  const [focusedBlankIndex, setFocusedBlankIndex] = useState(0);
  
  // 题库分页
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 抽取对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extractType, setExtractType] = useState('random');
  const [bank, setBank] = useState('middle');
  const [count, setCount] = useState(5);
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  
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
      q.chinese?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.english?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.number?.toString().includes(searchTerm)
    );
  });

  // ========== 分页 ==========
  const paginatedQuestions = filteredQuestions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ========== 初始化 refs 数组 ==========
  useEffect(() => {
    if (currentQuestion?.type === 'multi' && currentQuestion.blanks) {
      inputRefs.current = inputRefs.current.slice(0, currentQuestion.blanks.length);
      while (inputRefs.current.length < currentQuestion.blanks.length) {
        inputRefs.current.push(null);
      }
    }
  }, [currentQuestion]);

  // ========== 回车键逻辑 ==========
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Enter') return;
      if (!currentQuestion) return;
      
      const activeElement = document.activeElement;
      const isInAnyInput = inputRefs.current.some(ref => ref === activeElement);
      
      if (isInAnyInput) {
        e.preventDefault();
        
        if (!isConfirmed) {
          if (currentQuestion.type === 'multi' && currentQuestion.blanks) {
            const answerArray = Array.isArray(inputValue) ? inputValue : [];
            if (answerArray.length !== currentQuestion.blanks.length || 
                answerArray.some(ans => !ans?.trim())) {
              setSnackbar({ open: true, message: '请填写所有空格', severity: 'warning' });
              return;
            }
          } else {
            const answer = inputRefs.current[0]?.value?.trim() || '';
            if (!answer) {
              setSnackbar({ open: true, message: '请输入答案', severity: 'warning' });
              return;
            }
          }
          handleConfirm();
        } else if (currentIndex < questions.length - 1) {
          handleNext();
        }
        return;
      }
      
      e.preventDefault();
      if (!isConfirmed) {
        if (currentQuestion?.type === 'multi' && currentQuestion.blanks) {
          inputRefs.current[0]?.focus();
          setFocusedBlankIndex(0);
        } else {
          inputRefs.current[0]?.focus();
        }
      } else if (currentIndex < questions.length - 1) {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, isConfirmed, currentIndex, questions.length, inputValue]);

  // ========== 当切换题目时，更新输入框 ==========
  useEffect(() => {
    if (currentQuestion) {
      if (currentQuestion.type === 'multi' && currentQuestion.blanks) {
        const savedAnswers = answers[currentQuestion.id];
        if (Array.isArray(savedAnswers)) {
          setInputValue(savedAnswers);
        } else {
          setInputValue(new Array(currentQuestion.blanks.length).fill(''));
        }
      } else {
        setInputValue(answers[currentQuestion.id] || '');
      }
      
      if (!isConfirmed && !focusedBlankIndex) {
        setTimeout(() => {
          if (currentQuestion?.type === 'multi' && currentQuestion.blanks) {
            inputRefs.current[0]?.focus();
          } else {
            inputRefs.current[0]?.focus();
          }
        }, 100);
      }
    }
  }, [currentIndex, currentQuestion, answers, isConfirmed]);

  // ========== 初始化加载 ==========
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setInitialLoading(true);
    try {
      const banksRes = await cToEApi.getBanks();
      if (banksRes?.flag === 1) {
        setBanks(banksRes.content.banks || []);
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
      const res = await cToEApi.getQuestions({
        type: 'all',
        bank: bankId,
        count: 200,
        withDetails: true
      });
      
      if (res?.flag === 1) {
        setAllQuestions(res.content.questions || []);
        const cats = [...new Set(res.content.questions.map(q => q.category).filter(Boolean))];
        setCategories(cats);
      }
    } catch (error) {
      console.error('加载题目失败:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await cToEApi.getReport(bank);
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
        count: count,
        withDetails: true
      };
      
      if (category !== 'all') params.category = category;
      if (difficulty !== 'all') params.difficulty = difficulty;
      
      const res = await cToEApi.getQuestions(params);
      
      if (res?.flag === 1 && res.content?.questions?.length > 0) {
        setQuestions(res.content.questions);
        setCurrentIndex(0);
        setAnswers({});
        setConfirmedAnswers({});
        setShowExplanation({});
        setCurrentView(0);
        
        setSnackbar({
          open: true,
          message: `已加载 ${res.content.questions.length} 道题目`,
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

  // ========== 检查多空题中单个空的答案 ==========
  const checkBlankAnswer = (question, blankIndex, userAnswer) => {
    if (!question || !question.blanks) return false;
    
    const blank = question.blanks[blankIndex];
    if (!blank) return false;
    
    const normalizedUser = String(userAnswer || '').trim().toLowerCase().replace(/\s+/g, ' ');
    
    if (!normalizedUser) return false;
    
    return blank.correctForms.some(correct => {
      const normalizedCorrect = String(correct).trim().toLowerCase().replace(/\s+/g, ' ');
      
      // 完全匹配
      if (normalizedCorrect === normalizedUser) return true;
      
      // 用户答案是正确答案的前缀
      if (normalizedCorrect.startsWith(normalizedUser)) {
        const nextChar = normalizedCorrect.charAt(normalizedUser.length);
        if (nextChar === '' || nextChar === ' ') return true;
      }
      
      return false;
    });
  };

  // ========== 检查答案是否正确 ==========
  const checkAnswer = (question, userAnswer) => {
    if (!question) return false;
    
    if (question.type === 'multi' && question.blanks) {
      if (!Array.isArray(userAnswer) || userAnswer.length !== question.blanks.length) {
        return false;
      }
      
      return question.blanks.every((blank, index) => {
        const userAns = String(userAnswer[index] || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (!userAns) return false;
        
        return blank.correctForms.some(correct => {
          const normalizedCorrect = String(correct).trim().toLowerCase().replace(/\s+/g, ' ');
          
          // 完全匹配
          if (normalizedCorrect === userAns) return true;
          
          // 用户答案是正确答案的前缀
          if (normalizedCorrect.startsWith(userAns)) {
            const nextChar = normalizedCorrect.charAt(userAns.length);
            if (nextChar === '' || nextChar === ' ') return true;
          }
          
          return false;
        });
      });
    } else {
      const normalizedUser = String(userAnswer).trim().toLowerCase().replace(/\s+/g, ' ');
      if (!normalizedUser) return false;
      
      if (question.correctForm && question.correctForm.includes('/')) {
        const correctForms = question.correctForm.split('/').map(s => s.trim().toLowerCase());
        return correctForms.some(correct => {
          const normalizedCorrect = correct.replace(/\s+/g, ' ');
          if (normalizedCorrect === normalizedUser) return true;
          if (normalizedCorrect.startsWith(normalizedUser)) {
            const nextChar = normalizedCorrect.charAt(normalizedUser.length);
            if (nextChar === '' || nextChar === ' ') return true;
          }
          return false;
        });
      } else {
        const normalizedCorrect = String(question.correctForm).trim().toLowerCase().replace(/\s+/g, ' ');
        if (normalizedCorrect === normalizedUser) return true;
        if (normalizedCorrect.startsWith(normalizedUser)) {
          const nextChar = normalizedCorrect.charAt(normalizedUser.length);
          if (nextChar === '' || nextChar === ' ') return true;
        }
        return false;
      }
    }
  };

  // ========== 确认答案 ==========
  const handleConfirm = () => {
    if (!currentQuestion) return;
    
    if (isConfirmed) {
      setSnackbar({ open: true, message: '答案已锁定，不能修改', severity: 'info' });
      return;
    }

    let currentAnswer;
    if (currentQuestion.type === 'multi' && currentQuestion.blanks) {
      currentAnswer = Array.isArray(inputValue) ? inputValue : [];
      
      if (currentAnswer.length !== currentQuestion.blanks.length || 
          currentAnswer.some(ans => !ans?.trim())) {
        setSnackbar({ open: true, message: '请填写所有空格', severity: 'warning' });
        return;
      }
    } else {
      currentAnswer = inputRefs.current[0]?.value?.trim() || '';
      
      if (!currentAnswer) {
        setSnackbar({ open: true, message: '请输入答案', severity: 'warning' });
        return;
      }
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: currentAnswer
    }));

    setConfirmedAnswers(prev => ({ ...prev, [currentQuestion.id]: true }));
    setShowExplanation(prev => ({ ...prev, [currentQuestion.id]: true }));

    const isCorrect = checkAnswer(currentQuestion, currentAnswer);
    setSnackbar({ 
      open: true, 
      message: isCorrect ? '✓ 回答正确！' : `✗ 回答错误`, 
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
      // 直接提交原始数据，不做额外处理
      console.log('提交数据:', submitData);
      const res = await cToEApi.submitAnswers(submitData);
      
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
    setCurrentView(0);
    setAnswers({});
    setConfirmedAnswers({});
    setShowExplanation({});
    
    setSnackbar({
      open: true,
      message: `已选择 ${sorted.length} 道题目`,
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
      setFocusedBlankIndex(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFocusedBlankIndex(0);
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
        const userAnswer = answers[q.id] || '';
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
          <TranslateIcon /> 中译英 - 抽取题目
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
              inputProps={{ min: 1, max: 50 }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
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

            <FormControl fullWidth>
              <InputLabel>难度</InputLabel>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                label="难度"
              >
                <MenuItem value="all">全部难度</MenuItem>
                <MenuItem value="1">1级</MenuItem>
                <MenuItem value="2">2级</MenuItem>
                <MenuItem value="3">3级</MenuItem>
                <MenuItem value="4">4级</MenuItem>
                <MenuItem value="5">5级</MenuItem>
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
          中译英句子填空
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
          <CToETestView
            questions={questions}
            currentIndex={currentIndex}
            currentQuestion={currentQuestion}
            isConfirmed={isConfirmed}
            answers={answers}
            confirmedAnswers={confirmedAnswers}
            showExplanation={showExplanation}
            inputValue={inputValue}
            inputRefs={inputRefs}
            focusedBlankIndex={focusedBlankIndex}
            practiceStats={practiceStats}
            progress={progress}
            isFullscreen={isFullscreen}
            onSetInputValue={setInputValue}
            onSetAnswers={setAnswers}
            onSetFocusedBlankIndex={setFocusedBlankIndex}
            onConfirm={handleConfirm}
            onModify={handleModify}
            onPrev={handlePrev}
            onNext={handleNext}
            onSetCurrentIndex={setCurrentIndex}
            onSubmit={handleSubmit}
            onToggleFullscreen={toggleFullscreen}
            checkBlankAnswer={checkBlankAnswer}
            checkAnswer={checkAnswer}
            loading={loading}
            bank={bank}
            onSetShowExplanation={setShowExplanation}
          />
        ) : (
          <CToEMasterView
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

export default CToECenter;