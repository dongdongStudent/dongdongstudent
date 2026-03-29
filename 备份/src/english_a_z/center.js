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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  MenuBook as MenuBookIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { readingApi } from './api';
import ReadingTest from './test';

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
  
  // JSON文件列表
  const [jsonFiles, setJsonFiles] = useState([]);
  const [selectedJsonFile, setSelectedJsonFile] = useState('');
  const [selectedJsonFileId, setSelectedJsonFileId] = useState('');
  const [jsonContent, setJsonContent] = useState(null);
  
  // 篇章列表
  const [passages, setPassages] = useState([]);
  const [selectedPassageId, setSelectedPassageId] = useState('');
  
  // 题库信息
  const [bankInfo, setBankInfo] = useState(null);
  
  // 抽取对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState(1); // 1: 选择JSON, 2: 选择篇章
  
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
      
      // 获取题库信息
      const bankRes = await readingApi.getBankInfo();
      if (bankRes?.flag === 1) {
        setBankInfo(bankRes.content.bank || null);
      }
      
      // 获取JSON文件列表
      await loadJsonFiles();
      
    } catch (error) {
      console.error('初始化失败:', error);
      showSnackbar('初始化失败：' + error.message, 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  // ========== 获取JSON文件列表 ==========
  const loadJsonFiles = async () => {
    try {
      const res = await readingApi.getJsonFiles();
      console.log('JSON文件列表响应:', res);
      
      if (res?.flag === 1) {
        const files = res.content?.files || [];
        setJsonFiles(files);
        
        if (files.length > 0) {
          showSnackbar(`✅ 找到 ${files.length} 个JSON文件`, 'success');
        } else {
          showSnackbar('⚠️ 没有找到JSON文件', 'warning');
          // 使用硬编码默认文件
          const defaultFiles = [
            { id: 'reading_comprehension_master', name: '阅读理解题库', fileName: 'reading_comprehension_master.json' },
            { id: 'ichiro_story', name: 'Ichiro and the Sun', fileName: 'ichiro_story.json' }
          ];
          setJsonFiles(defaultFiles);
        }
      } else {
        console.warn('获取JSON文件列表失败，使用默认配置');
        // 使用硬编码默认文件
        const defaultFiles = [
          { id: 'reading_comprehension_master', name: '阅读理解题库', fileName: 'reading_comprehension_master.json' },
          { id: 'ichiro_story', name: 'Ichiro and the Sun', fileName: 'ichiro_story.json' }
        ];
        setJsonFiles(defaultFiles);
      }
    } catch (error) {
      console.error('加载JSON文件列表失败:', error);
      // 出错时使用硬编码
      const defaultFiles = [
        { id: 'reading_comprehension_master', name: '阅读理解题库', fileName: 'reading_comprehension_master.json' },
        { id: 'ichiro_story', name: 'Ichiro and the Sun', fileName: 'ichiro_story.json' }
      ];
      setJsonFiles(defaultFiles);
    }
  };

  // ========== 加载JSON文件内容 ==========
  const loadJsonContent = async (fileId) => {
    setLoading(true);
    try {
      const file = jsonFiles.find(f => f.id === fileId);
      if (!file) {
        showSnackbar('❌ JSON文件不存在', 'error');
        setLoading(false);
        return;
      }

      console.log('选择的文件:', file);
      
      // 确保 fileName 存在
      const fileName = file.fileName || `${file.id}.json`;
      if (!fileName) {
        showSnackbar('❌ 文件名无效', 'error');
        setLoading(false);
        return;
      }

      console.log('准备加载文件:', fileName);
      const res = await readingApi.getJsonContent(fileName);
      console.log('JSON内容响应:', res);
      
      if (res?.flag === 1 && res.content?.passages) {
        setJsonContent(res.content);
        setPassages(res.content.passages || []);
        setSelectedJsonFileId(fileId);
        setSelectedJsonFile(fileName); // 保存选中的JSON文件名
        
        if (res.content.passages?.length > 0) {
          showSnackbar(`✅ 已加载 ${res.content.passages.length} 个篇章`, 'success');
          setDialogStep(2);
        } else {
          showSnackbar('⚠️ 该JSON文件无篇章数据', 'warning');
        }
      } else {
        showSnackbar(res?.message || '❌ 加载JSON失败', 'error');
      }
    } catch (error) {
      console.error('加载JSON内容失败:', error);
      showSnackbar(`❌ 加载失败：${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========== 加载篇章 ==========
  const loadPassage = async (passageId) => {
    setLoading(true);
    try {
      // 确保有选中的JSON文件
      if (!selectedJsonFile) {
        showSnackbar('❌ 未选择JSON文件', 'error');
        setLoading(false);
        return;
      }

      const res = await readingApi.getPassage({ 
        jsonFile: selectedJsonFile,
        passageId
      });
      
      console.log('加载篇章响应:', res);
      
      if (res?.flag === 1 && res.content?.passage) {
        const passageData = res.content.passage;
        
        // 设置篇章数据
        setPassage({
          id: passageData.id,
          title: passageData.title,
          description: passageData.description,
          category: passageData.category,
          difficulty: passageData.difficulty,
          content: passageData.content || ''
        });
        
        // 处理题目数据
        if (passageData.questions && passageData.questions.length > 0) {
          setQuestions(passageData.questions);
          
          // 初始化答案
          const initialAnswers = {};
          passageData.questions.forEach(q => {
            initialAnswers[q.id] = '';
          });
          setAnswers(initialAnswers);
          
          setExplanations({});
          
          showSnackbar(`✅ 已加载 ${passageData.questions.length} 道题目`, 'success');
        } else {
          setQuestions([]);
          showSnackbar('📖 纯阅读模式 - 无题目', 'info');
        }
        
        resetTimer();
      } else {
        // 如果API没有返回题目，尝试从已加载的JSON中获取
        if (jsonContent && passages.length > 0) {
          const selectedPassage = passages.find(p => p.id === passageId);
          if (selectedPassage) {
            setPassage({
              id: selectedPassage.id,
              title: selectedPassage.title,
              description: selectedPassage.description,
              category: selectedPassage.category,
              difficulty: selectedPassage.difficulty,
              content: selectedPassage.content || ''
            });
            
            if (selectedPassage.questions) {
              setQuestions(selectedPassage.questions);
              const initialAnswers = {};
              selectedPassage.questions.forEach(q => {
                initialAnswers[q.id] = '';
              });
              setAnswers(initialAnswers);
            } else {
              setQuestions([]);
            }
            
            resetTimer();
            showSnackbar(`✅ 已加载: ${selectedPassage.title}`, 'success');
          }
        } else {
          showSnackbar(res?.message || '❌ 加载失败', 'error');
        }
      }
      
      setDialogOpen(false);
      setDialogStep(1);
      setSelectedPassageId('');
    } catch (error) {
      console.error('加载篇章失败:', error);
      showSnackbar(`❌ 加载失败：${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========== 处理JSON选择 ==========
  const handleJsonSelect = () => {
    if (!selectedJsonFileId) {
      showSnackbar('请选择一个JSON文件', 'warning');
      return;
    }
    loadJsonContent(selectedJsonFileId);
  };

  // ========== 处理篇章选择 ==========
  const handlePassageSelect = () => {
    if (!selectedPassageId) {
      showSnackbar('请选择一个篇章', 'warning');
      return;
    }
    loadPassage(selectedPassageId);
  };

  // ========== 返回上一步 ==========
  const handleBackToJson = () => {
    setDialogStep(1);
    setSelectedPassageId('');
  };

  // ========== 关闭对话框 ==========
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogStep(1);
    setSelectedJsonFileId('');
    setSelectedPassageId('');
    setPassages([]);
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
      if (!selectedJsonFile) return;
      
      const res = await readingApi.getPassageDetails(passageId, { jsonFile: selectedJsonFile });
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
      
      if (!selectedJsonFile) {
        showSnackbar('❌ 未选择JSON文件', 'error');
        return { success: false };
      }

      const res = await readingApi.submitPassage({
        passageId: passage?.id,
        jsonFile: selectedJsonFile,
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
    if (passage) {
      loadPassage(passage.id);
    }
  };

  // ========== 返回首页 ==========
  const handleBackToHome = () => {
    navigate('/');
  };

  // ========== 抽取对话框 ==========
  const renderDialog = () => (
    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {dialogStep === 1 ? <FolderIcon /> : <MenuBookIcon />}
          <Typography variant="h6">
            {dialogStep === 1 ? '选择JSON文件' : '选择篇章'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {dialogStep === 1 ? (
          /* 第一步：选择JSON文件 */
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              请先选择一个JSON题库文件：
            </Typography>
            <FormControl fullWidth>
              <InputLabel>选择JSON文件</InputLabel>
              <Select
                value={selectedJsonFileId}
                onChange={(e) => setSelectedJsonFileId(e.target.value)}
                label="选择JSON文件"
              >
                {jsonFiles.map(file => (
                  <MenuItem key={file.id} value={file.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon fontSize="small" />
                      <Box>
                        <Typography variant="body1">{file.name || file.id}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {file.fileName || `${file.id}.json`}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : (
          /* 第二步：选择篇章 */
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip 
                label="返回JSON列表" 
                size="small" 
                color="primary"
                onClick={handleBackToJson}
                onDelete={handleBackToJson}
                deleteIcon={<FolderIcon />}
              />
              <Typography variant="body2" color="text.secondary" noWrap>
                {jsonFiles.find(f => f.id === selectedJsonFileId)?.name || selectedJsonFile}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              请选择要阅读的篇章：
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>选择篇章</InputLabel>
              <Select
                value={selectedPassageId}
                onChange={(e) => setSelectedPassageId(e.target.value)}
                label="选择篇章"
              >
                {passages.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MenuBookIcon fontSize="small" />
                      <Box>
                        <Typography variant="body1">{p.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.category || '未分类'} · {p.totalQuestions || 0}题
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCloseDialog}>取消</Button>
        {dialogStep === 1 ? (
          <Button 
            onClick={handleJsonSelect} 
            variant="contained" 
            color="primary"
            disabled={!selectedJsonFileId || loading}
          >
            {loading ? '加载中...' : '下一步'}
          </Button>
        ) : (
          <Button 
            onClick={handlePassageSelect} 
            variant="contained" 
            color="primary"
            disabled={!selectedPassageId || loading}
          >
            {loading ? '加载中...' : '确认选择'}
          </Button>
        )}
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
          {bankInfo?.name || 'English A-Z 阅读理解'}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={() => {
              setDialogStep(1);
              setSelectedJsonFileId('');
              setSelectedPassageId('');
              setPassages([]);
              setDialogOpen(true);
            }}
            startIcon={<EditIcon />}
            sx={{ bgcolor: '#ffd700', color: '#1a237e' }}
          >
            选择JSON/篇章
          </Button>
          <IconButton color="inherit" onClick={handleRefresh} disabled={!passage}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Toolbar>
      
      {/* 显示当前选中的JSON和篇章 */}
      {passage && selectedJsonFile && (
        <Box sx={{ bgcolor: '#283593', px: 2, py: 0.5 }}>
          <Typography variant="caption" color="rgba(255,255,255,0.8)">
            📁 {jsonFiles.find(f => f.fileName === selectedJsonFile)?.name || selectedJsonFile} · 
            📄 {passage.title}
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