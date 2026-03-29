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
  Stack
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { readingApi } from './api';
import ReadingTest from './test';
import FileBrowserView from './view';

const ReadingCenter = () => {
  const navigate = useNavigate();
  
  // ========== 状态管理 ==========
  const [passage, setPassage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [explanations, setExplanations] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 当前选中的文件
  const [selectedFile, setSelectedFile] = useState(null);
  
  // 计时器相关
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);

  // 视图模式：'test' 或 'browser'
  const [viewMode, setViewMode] = useState('browser'); // 默认进入文件浏览器模式

  // ========== 初始化加载 ==========
  useEffect(() => {
    initData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ========== 计时器管理 ==========
  useEffect(() => {
    if (passage && !timerRef.current) {
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
  }, [passage]);

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
      // 健康检查
      await readingApi.healthCheck();
    } catch (error) {
      console.error('初始化失败:', error);
      showSnackbar('初始化失败：' + error.message, 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  // ========== 从文件浏览器加载篇章 ==========
  const loadPassageFromFile = async (file, passageId = null) => {
    setLoading(true);
    try {
      // 加载文件内容
      const res = await readingApi.getJsonContent(file.fileName);
      console.log('文件内容响应:', res);
      
      if (res?.flag === 1 && res.content?.passages && res.content.passages.length > 0) {
        // 如果没有指定篇章ID，使用第一个篇章
        let selectedPassage;
        if (passageId) {
          selectedPassage = res.content.passages.find(p => p.id === passageId);
        }
        if (!selectedPassage) {
          selectedPassage = res.content.passages[0];
        }
        
        // 设置篇章数据
        setPassage({
          id: selectedPassage.id,
          title: selectedPassage.title,
          description: selectedPassage.description,
          category: selectedPassage.category,
          difficulty: selectedPassage.difficulty,
          content: selectedPassage.content || ''
        });
        
        // 处理题目数据
        if (selectedPassage.questions && selectedPassage.questions.length > 0) {
          setQuestions(selectedPassage.questions);
          
          // 初始化答案
          const initialAnswers = {};
          selectedPassage.questions.forEach(q => {
            initialAnswers[q.id] = '';
          });
          setAnswers(initialAnswers);
          
          setExplanations({});
          
          showSnackbar(`✅ 已加载 ${selectedPassage.questions.length} 道题目`, 'success');
        } else {
          setQuestions([]);
          showSnackbar('📖 纯阅读模式 - 无题目', 'info');
        }
        
        // 保存选中的文件
        setSelectedFile(file);
        
        // 切换到测试模式
        setViewMode('test');
        
        resetTimer();
      } else {
        showSnackbar('❌ 该文件没有可用的篇章数据', 'error');
      }
    } catch (error) {
      console.error('加载篇章失败:', error);
      showSnackbar(`❌ 加载失败：${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 显示提示消息
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
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

  // ========== 加载题目解析 ==========
  const loadExplanations = async (passageId) => {
    try {
      if (!selectedFile) return;
      
      const res = await readingApi.getPassageDetails(passageId, { jsonFile: selectedFile.fileName });
      if (res?.flag === 1 && res.content?.questions) {
        const explanationsMap = {};
        res.content.questions.forEach(q => {
          explanationsMap[q.id] = {
            correct: q.correctAnswer,
            explanation: q.explanation
          };
        });
        setExplanations(explanationsMap);
      }
    } catch (error) {
      console.error('加载解析失败:', error);
    }
  };

  // ========== 提交答案 ==========
  const handleSubmit = async (answers, timeSpent) => {
    setLoading(true);
    try {
      const questionIds = Object.keys(answers);
      const answerValues = Object.values(answers);
      
      if (!selectedFile) {
        showSnackbar('❌ 未选择文件', 'error');
        return { success: false };
      }

      const res = await readingApi.submitPassage({
        passageId: passage?.id,
        jsonFile: selectedFile.fileName,
        questionIds,
        answers: answerValues,
        timeSpent: timeSpent || 0
      });
      
      if (res?.flag === 1) {
        const summary = res.content.summary;
        const accuracy = Math.round(summary.accuracy * 100);
        
        showSnackbar(`✅ 提交成功！正确率：${accuracy}% (${summary.correct}/${summary.total})`, 'success');
        
        // 加载解析
        await loadExplanations(passage.id);
        
        return { 
          success: true, 
          accuracy,
          correctCount: summary.correct,
          totalCount: summary.total
        };
      } else {
        showSnackbar(res?.message || '❌ 提交失败', 'error');
        return { success: false, error: res?.message };
      }
    } catch (error) {
      console.error('提交失败:', error);
      showSnackbar('❌ 提交失败：' + error.message, 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ========== 刷新 ==========
  const handleRefresh = () => {
    if (passage && selectedFile) {
      loadPassageFromFile(selectedFile, passage.id);
    }
  };

  // ========== 返回首页 ==========
  const handleBackToHome = () => {
    navigate('/');
  };

  // ========== 返回文件浏览器 ==========
  const handleBackToBrowser = () => {
    setViewMode('browser');
    setPassage(null);
    setQuestions([]);
    setAnswers({});
    setExplanations({});
    resetTimer();
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
          {viewMode === 'test' 
            ? (passage?.title || 'English A-Z 阅读理解')
            : 'English A-Z 文件浏览器'
          }
        </Typography>

        <Stack direction="row" spacing={1}>
          {viewMode === 'test' ? (
            <>
              <Button
                variant="contained"
                onClick={handleBackToBrowser}
                startIcon={<FolderIcon />}
                sx={{ bgcolor: '#4caf50', color: 'white' }}
              >
                浏览文件
              </Button>
              <IconButton color="inherit" onClick={handleRefresh} disabled={!passage}>
                <RefreshIcon />
              </IconButton>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => window.location.reload()} // 简单刷新页面
              startIcon={<RefreshIcon />}
              sx={{ bgcolor: '#ffd700', color: '#1a237e' }}
            >
              刷新
            </Button>
          )}
        </Stack>
      </Toolbar>
      
      {/* 显示当前选中的文件 */}
      {viewMode === 'test' && selectedFile && (
        <Box sx={{ bgcolor: '#283593', px: 2, py: 0.5 }}>
          <Typography variant="caption" color="rgba(255,255,255,0.8)">
            📁 {selectedFile.name} · 📄 {passage?.title || '未选择篇章'}
          </Typography>
        </Box>
      )}
      
      {/* 显示当前视图模式 */}
      {viewMode === 'browser' && (
        <Box sx={{ bgcolor: '#283593', px: 2, py: 0.5 }}>
          <Typography variant="caption" color="rgba(255,255,255,0.8)">
            📁 文件浏览器模式 · 点击文件开始学习
          </Typography>
        </Box>
      )}
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Header />
      {loading && <LinearProgress />}

      <Container maxWidth="lg" sx={{ py: 3, height: 'calc(100vh - 120px)' }}>
        {viewMode === 'test' ? (
          <ReadingTest
            passage={passage}
            questions={questions}
            answers={answers}
            explanations={explanations}
            loading={loading}
            onRefresh={handleRefresh}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmit}
            timeSpent={timeSpent}
            onBackToHome={handleBackToHome}
            G_word_name="word_english_test_study"
            getToken={() => localStorage.getItem('token')}
          />
        ) : (
          <FileBrowserView 
            onFileSelect={loadPassageFromFile}
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

export default ReadingCenter;
