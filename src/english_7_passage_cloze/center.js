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
import passageClozeApi from './api';
import PassageClozeTest from './test';
import ClozeMasterView from './view';

const PassageClozeCenter = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // ========== 状态管理 ==========
  const [passage, setPassage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [confirmedAnswers, setConfirmedAnswers] = useState({});
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

  // ========== 初始化加载 ==========
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setInitialLoading(true);
    try {
      // 获取题库信息
      const bankRes = await passageClozeApi.getBankInfo();
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
      const res = await passageClozeApi.getPassages();
      if (res?.flag === 1) {
        setAllPassages(res.content.passages || []);
      }
    } catch (error) {
      console.error('加载篇章列表失败:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await passageClozeApi.getReport();
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
      const params = passageId 
        ? { passageId } 
        : { type: extractType };
      
      console.log('抽取参数:', params);
      const res = await passageClozeApi.getPassage(params);
      
      if (res?.flag === 1 && res.content?.passage) {
        const passageData = res.content.passage;
        
        // 获取篇章详情（包含正确答案和解析）
        const detailRes = await passageClozeApi.getPassageDetails(passageData.id);
        
        if (detailRes?.flag === 1 && detailRes.content?.questions) {
          // 创建完整的passage对象，确保有 content 字段
          const fullPassage = {
            ...passageData,
            content: passageData.content || '',
            questions: detailRes.content.questions,
            stats: detailRes.content.passageStats || {}
          };
          
          setPassage(fullPassage);
          setQuestions(detailRes.content.questions);
          
          // 初始化答案
          const initialAnswers = {};
          const explanationsMap = {};
          detailRes.content.questions.forEach(q => {
            initialAnswers[q.id] = '';
            explanationsMap[q.id] = {
              correct: q.correctForm,
              explanation: q.explanation
            };
          });
          setAnswers(initialAnswers);
          setExplanations(explanationsMap);
          
          setConfirmedAnswers({});
          
          setSnackbar({
            open: true,
            message: `✅ 已加载 ${detailRes.content.questions.length} 道题目`,
            severity: 'success'
          });
        } else {
          // 如果没有详情，只加载基本信息，确保有 content 字段
          setPassage({
            ...passageData,
            content: passageData.content || ''
          });
          setQuestions(passageData.questions || []);
          
          const initialAnswers = {};
          (passageData.questions || []).forEach(q => {
            initialAnswers[q.id] = '';
          });
          setAnswers(initialAnswers);
          
          setConfirmedAnswers({});
          
          setSnackbar({
            open: true,
            message: `⚠️ 已加载 ${passageData.questions?.length || 0} 道题目（无解析）`,
            severity: 'warning'
          });
        }
        
        setCurrentView(0);
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
    setAnswers(allAnswers || { ...answers, [questionId]: value });
  };

  // ========== 提交答案 ==========
  const handleSubmit = async (answers, timeSpent, stats) => {
    setLoading(true);
    try {
      const questionIds = Object.keys(answers);
      const answerValues = Object.values(answers);
      
      const res = await passageClozeApi.submitPassage({
        passageId: passage?.id,
        questionIds: questionIds,
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
        
        // 刷新统计
        await loadStats();
        
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
      handleExtract();
    }
  };

  // ========== 处理题库选择 ==========
  const handleSelectPassage = async (selectedPassage) => {
    setLoading(true);
    try {
      // 直接使用选中的文章ID加载题目
      const params = { passageId: selectedPassage.id };
      const res = await passageClozeApi.getPassage(params);
      
      if (res?.flag === 1 && res.content?.passage) {
        const passageData = res.content.passage;
        
        // 获取篇章详情（包含正确答案和解析）
        const detailRes = await passageClozeApi.getPassageDetails(selectedPassage.id);
        
        if (detailRes?.flag === 1 && detailRes.content?.questions) {
          // 合并数据
          const fullPassage = {
            ...passageData,
            id: selectedPassage.id,
            title: selectedPassage.title,
            description: selectedPassage.description,
            category: selectedPassage.category,
            difficulty: selectedPassage.difficulty,
            totalQuestions: selectedPassage.totalQuestions,
            givenWords: selectedPassage.givenWords || [],
            content: passageData.content || '',
            questions: detailRes.content.questions,
            stats: detailRes.content.passageStats || {}
          };
          
          setPassage(fullPassage);
          setQuestions(detailRes.content.questions);
          
          // 初始化答案和解析
          const initialAnswers = {};
          const explanationsMap = {};
          detailRes.content.questions.forEach(q => {
            initialAnswers[q.id] = '';
            explanationsMap[q.id] = {
              correct: q.correctForm,
              explanation: q.explanation
            };
          });
          setAnswers(initialAnswers);
          setExplanations(explanationsMap);
          
          setConfirmedAnswers({});
          setCurrentView(0); // 切换到练习视图
          
          setSnackbar({
            open: true,
            message: `✅ 已加载 ${detailRes.content.questions.length} 道题目`,
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: '⚠️ 无法获取题目详情',
            severity: 'warning'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: res?.message || '❌ 加载题目失败',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('选择篇章失败:', error);
      setSnackbar({
        open: true,
        message: '❌ 选择篇章失败：' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
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

  // ========== 抽取对话框 ==========
  const renderDialog = () => (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookIcon /> 篇章完形填空 - 抽取题目
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
                {p.title} ({p.totalQuestions}题)
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
          {bankInfo?.name || '篇章完形填空'}
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

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {currentView === 0 ? (
          <PassageClozeTest
            passageData={passage}
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmit}
            readOnly={false}
            externalAnswers={answers}
            externalExplanations={explanations}
            fullscreen={isFullscreen}
            onFullscreenToggle={setIsFullscreen}
            dataSource="passage_cloze"
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

export default PassageClozeCenter;