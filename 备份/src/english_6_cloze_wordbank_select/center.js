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
import sixSelectWordApi from './api';
import ClozeTestView from './ClozeTestView';
import ClozeMasterView from './ClozeMasterView';

const ClozeCenter = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // ========== 状态管理 ==========
  const [passage, setPassage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [confirmedAnswers, setConfirmedAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
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
  const [allPassages, setAllPassages] = useState([]);
  const [bankInfo, setBankInfo] = useState(null); // 存储题库信息
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);

  // ========== 初始化加载 ==========
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setInitialLoading(true);
    try {
      // 获取题库信息 - 修改为 getBankInfo
      const bankRes = await sixSelectWordApi.getBankInfo();
      if (bankRes?.flag === 1) {
        setBankInfo(bankRes.content.bank || null);
        
        // 设置分类
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
      const res = await sixSelectWordApi.getPassages();
      if (res?.flag === 1) {
        setAllPassages(res.content.passages || []);
      }
    } catch (error) {
      console.error('加载篇章列表失败:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await sixSelectWordApi.getReport();
      if (res?.flag === 1) {
        setStats(res.content);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
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
      const params = {
        type: extractType,
        bank: bank,
        count: count
      };
      
      if (category !== 'all') params.category = category;
      
      console.log('抽取参数:', params);
      const res = await sixSelectWordApi.getPassage(params);
      console.log('API返回数据:', res);
      
      if (res?.flag === 1) {
        if (res.content?.passage) {
          // 成功获取到文章（但不包含正确答案和解析）
          const passageData = res.content.passage;
          const passageId = passageData.id;
          
          // 显示加载提示
          setSnackbar({
            open: true,
            message: `正在加载题目详情...`,
            severity: 'info'
          });
          
          // 调用详情接口获取完整信息（包含正确答案和解析）
          const detailRes = await sixSelectWordApi.getPassageDetails(passageId);
          console.log('详情数据:', detailRes);
          
          if (detailRes?.flag === 1 && detailRes.content?.questions) {
            // 使用详情接口返回的完整数据
            const fullPassage = {
              ...passageData,
              questions: detailRes.content.questions
            };
            
            setPassage(fullPassage);
            setQuestions(detailRes.content.questions);
            
            // 初始化答案
            const initialAnswers = {};
            detailRes.content.questions.forEach(q => {
              initialAnswers[q.id] = '';
            });
            setAnswers(initialAnswers);
            
            setConfirmedAnswers({});
            
            setSnackbar({
              open: true,
              message: `✅ 已加载 ${detailRes.content.questions.length} 道题目`,
              severity: 'success'
            });
          } else {
            // 如果详情接口失败，使用基本信息
            setPassage(passageData);
            setQuestions(passageData.questions);
            
            const initialAnswers = {};
            passageData.questions.forEach(q => {
              initialAnswers[q.id] = '';
            });
            setAnswers(initialAnswers);
            
            setConfirmedAnswers({});
            
            setSnackbar({
              open: true,
              message: `⚠️ 已加载 ${passageData.questions.length} 道题目（无解析）`,
              severity: 'warning'
            });
          }
        } else {
          setSnackbar({
            open: true,
            message: '⚠️ 没有找到符合条件的文章，请尝试其他抽取方式',
            severity: 'warning'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: res?.message || '❌ 抽取失败，请重试',
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
      setDialogOpen(false);
    }
  };

  // ========== 检查答案是否正确 ==========
  const checkAnswer = (question, answer) => {
    if (!question || !answer) return false;
    return answer?.toLowerCase().trim() === question.correctForm?.toLowerCase().trim();
  };

  // ========== 确认答案 ==========
  const handleConfirm = (questionId) => {
    setConfirmedAnswers(prev => ({ ...prev, [questionId]: true }));
  };

  // ========== 修改答案 ==========
  const handleModify = (questionId) => {
    const newConfirmed = { ...confirmedAnswers };
    delete newConfirmed[questionId];
    setConfirmedAnswers(newConfirmed);
  };

  // ========== 提交答案 ==========
  const handleSubmit = async (submitData) => {
    setLoading(true);
    try {
      console.log('提交数据:', submitData);
      
      const res = await sixSelectWordApi.submitPassage({
        passageId: passage?.id,
        questionIds: submitData.questionIds,
        answers: submitData.answers,
        timeSpent: submitData.timeSpent || 0
      });
      
      if (res?.flag === 1) {
        const summary = res.content.summary;
        setSnackbar({
          open: true,
          message: `✅ 提交成功！正确率：${Math.round(summary.accuracy * 100)}% (${summary.correct}/${summary.total})`,
          severity: 'success'
        });
        
        // 清空题目
        setPassage(null);
        setQuestions([]);
        setAnswers({});
        setConfirmedAnswers({});
        
        // 刷新统计
        await loadStats();
        
        return { success: true, ...res.content };
      } else {
        setSnackbar({
          open: true,
          message: res?.message || '❌ 提交失败',
          severity: 'error'
        });
        return { success: false };
      }
      
    } catch (error) {
      console.error('提交失败:', error);
      setSnackbar({
        open: true,
        message: '❌ 提交失败：' + error.message,
        severity: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========== 处理题库选择 ==========
  const handleSelectPassage = async (selectedPassage) => {
    setLoading(true);
    try {
      // 获取篇章详情
      const detailRes = await sixSelectWordApi.getPassageDetails(selectedPassage.id);
      
      if (detailRes?.flag === 1 && detailRes.content?.questions) {
        const fullPassage = {
          ...selectedPassage,
          questions: detailRes.content.questions
        };
        
        setPassage(fullPassage);
        setQuestions(detailRes.content.questions);
        
        const initialAnswers = {};
        detailRes.content.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
        
        setConfirmedAnswers({});
        setCurrentView(0);
        
        setSnackbar({
          open: true,
          message: `✅ 已选择 ${detailRes.content.questions.length} 道题目`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('选择篇章失败:', error);
      setSnackbar({
        open: true,
        message: '❌ 选择篇章失败',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== 刷新当前题目 ==========
  const handleRefresh = () => {
    if (questions.length > 0 && passage) {
      handleExtract();
    }
  };

  // ========== 返回首页 ==========
  const handleBackToHome = () => {
    navigate('/');
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

  // ========== 计算统计 ==========
  const getStats = () => {
    const total = questions.length;
    const answered = Object.keys(confirmedAnswers).length;
    let correct = 0;
    
    questions.forEach(q => {
      if (confirmedAnswers[q.id]) {
        const userAnswer = answers[q.id] || '';
        if (userAnswer.toLowerCase().trim() === q.correctForm?.toLowerCase().trim()) {
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
          <MenuBookIcon /> 五选五 - 抽取题目
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
            {/* 使用 bankInfo 显示当前题库信息 */}
            {bankInfo && (
              <MenuItem value={bankInfo.key || 'middle'}>{bankInfo.name}</MenuItem>
            )}
            {/* 也可以保留原有的选项作为备选 */}
            <MenuItem value="middle">中考词汇</MenuItem>
            <MenuItem value="high">高考词汇</MenuItem>
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
            <MenuItem value="review">复习题目</MenuItem>
          </Select>
        </FormControl>

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
          {bankInfo?.name || '五选五词汇练习'}
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
            answers={answers}
            confirmedAnswers={confirmedAnswers}
            practiceStats={practiceStats}
            progress={progress}
            isFullscreen={isFullscreen}
            onSetAnswers={setAnswers}
            onConfirm={handleConfirm}
            onModify={handleModify}
            onSubmit={handleSubmit}
            onToggleFullscreen={toggleFullscreen}
            checkAnswer={checkAnswer}
            loading={loading}
            passage={passage}
          />
        ) : (
          <ClozeMasterView
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