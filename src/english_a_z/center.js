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
  
  // JSON文件相关状态
  const [jsonFiles, setJsonFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileContent, setSelectedFileContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 计时器相关
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);

  // 视图模式：'test' 或 'browser'
  const [viewMode, setViewMode] = useState('browser');

  // ========== 初始化加载 ==========
  useEffect(() => {
    initData();
    loadJsonFiles();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ========== 搜索过滤 ==========
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFiles(jsonFiles);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = jsonFiles.filter(file => 
      (file.name && file.name.toLowerCase().includes(term)) ||
      (file.fileName && file.fileName.toLowerCase().includes(term)) ||
      (file.id && file.id.toLowerCase().includes(term))
    );
    setFilteredFiles(filtered);
  }, [searchTerm, jsonFiles]);

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

  // ========== 初始化API ==========
  const initData = async () => {
    setInitialLoading(true);
    try {
      await readingApi.healthCheck();
    } catch (error) {
      console.error('初始化失败:', error);
      showSnackbar('初始化失败：' + error.message, 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  // ========== 加载JSON文件列表 ==========
  const loadJsonFiles = async () => {
    setContentLoading(true);
    try {
      const res = await readingApi.getJsonFiles();
      console.log('文件列表响应:', res);
      
      if (res?.flag === 1 && res.content?.files) {
        // 对于每个文件，读取其内容来获取 name 字段
        const filesWithNames = await Promise.all(
          res.content.files.map(async (file) => {
            const fileName = file.fileName || `${file.id}.json`;
            
            try {
              // 读取文件内容获取 name
              const contentRes = await readingApi.getJsonContent(fileName);
              console.log(`读取文件 ${fileName} 的内容:`, contentRes);
              
              if (contentRes?.flag === 1 && contentRes.content) {
                // 使用JSON文件中的 name 字段，如果没有则使用文件名
                const displayName = contentRes.content.name || file.name || file.id;
                const displayDescription = contentRes.content.description || file.description || '';
                
                return {
                  ...file,
                  fileName: fileName,
                  name: displayName,
                  description: displayDescription,
                  fileContent: contentRes.content // 缓存文件内容
                };
              }
            } catch (err) {
              console.warn(`无法读取文件 ${fileName} 的内容:`, err);
            }
            
            // 如果无法读取内容，使用默认名称
            return {
              ...file,
              fileName: fileName,
              name: file.name || file.id,
              description: file.description || '英语学习材料',
              fileContent: null
            };
          })
        );
        
        setJsonFiles(filesWithNames);
        setFilteredFiles(filesWithNames);
        showSnackbar(`成功加载 ${filesWithNames.length} 个学习材料`, 'success');
      } else {
        // 使用默认的中文显示列表作为备用
        const defaultFiles = [
          {
            id: 'ichiro_story',
            name: '📖 Ichiro的冒险故事与基础词汇学习',
            fileName: 'ichiro_story.json',
            description: '包含有趣的Ichiro探索太阳的冒险故事，以及基础情绪词汇学习',
            loaded: false,
            fileContent: null
          },
          {
            id: 'reading_comprehension_master',
            name: '📚 英语阅读理解大师',
            fileName: 'reading_comprehension_master.json',
            description: '包含丰富的阅读理解文章，适合提升阅读能力',
            loaded: false,
            fileContent: null
          },
          {
            id: 'emotions_learning',
            name: '😊 英语情绪词汇学习',
            fileName: 'emotions_learning.json',
            description: '通过图片学习各种表情的英语表达',
            loaded: false,
            fileContent: null
          },
          {
            id: 'baby_animals',
            name: '🐱 幼年动物词汇学习',
            fileName: 'baby_animals.json',
            description: '学习各种幼年动物的英语名称',
            loaded: false,
            fileContent: null
          },
          {
            id: 'science_passages',
            name: '🔬 科学文章精选',
            fileName: 'science_passages.json',
            description: '探索科学世界的英语阅读材料',
            loaded: false,
            fileContent: null
          },
          {
            id: 'history_passages',
            name: '🏛️ 历史故事集',
            fileName: 'history_passages.json',
            description: '了解历史事件的英语文章',
            loaded: false,
            fileContent: null
          }
        ];
        setJsonFiles(defaultFiles);
        setFilteredFiles(defaultFiles);
        showSnackbar(`加载默认学习材料 (${defaultFiles.length} 个)`, 'info');
      }
    } catch (err) {
      console.error('加载文件列表失败:', err);
      showSnackbar('加载文件列表失败：' + err.message, 'error');
      
      // 出错时也显示默认列表
      const defaultFiles = [
        {
          id: 'ichiro_story',
          name: '📖 Ichiro的冒险故事与基础词汇学习',
          fileName: 'ichiro_story.json',
          description: '包含有趣的Ichiro探索太阳的冒险故事，以及基础情绪词汇学习',
          loaded: false,
          fileContent: null
        },
        {
          id: 'reading_comprehension_master',
          name: '📚 英语阅读理解大师',
          fileName: 'reading_comprehension_master.json',
          description: '包含丰富的阅读理解文章，适合提升阅读能力',
          loaded: false,
          fileContent: null
        },
        {
          id: 'emotions_learning',
          name: '😊 英语情绪词汇学习',
          fileName: 'emotions_learning.json',
          description: '通过图片学习各种表情的英语表达',
          loaded: false,
          fileContent: null
        }
      ];
      setJsonFiles(defaultFiles);
      setFilteredFiles(defaultFiles);
    } finally {
      setContentLoading(false);
    }
  };

  // ========== 选择JSON文件并加载内容 ==========
  const handleSelectJsonFile = async (file) => {
    setSelectedFile(file);
    
    // 如果已经有缓存的内容，直接使用
    if (file.fileContent) {
      setSelectedFileContent(file.fileContent);
      showSnackbar(`✅ 成功加载: ${file.name}`, 'success');
      return;
    }
    
    setContentLoading(true);
    
    try {
      const res = await readingApi.getJsonContent(file.fileName);
      console.log('文件内容响应:', res);
      
      if (res?.flag === 1 && res.content) {
        // 确保文件内容也有 name 字段
        const content = {
          ...res.content,
          name: res.content.name || file.name,
          description: res.content.description || file.description || ''
        };
        setSelectedFileContent(content);
        showSnackbar(`✅ 成功加载: ${content.name}`, 'success');
      } else {
        showSnackbar('加载文件内容失败：' + (res?.message || '未知错误'), 'error');
        setSelectedFileContent(null);
      }
    } catch (err) {
      console.error('加载文件内容失败:', err);
      showSnackbar('加载文件内容失败：' + err.message, 'error');
      setSelectedFileContent(null);
    } finally {
      setContentLoading(false);
    }
  };

  // ========== 选择文章并开始学习 ==========
  const handleSelectArticle = async (file, passageId) => {
    setLoading(true);
    try {
      // 使用已加载的文件内容
      let content = selectedFileContent;
      
      // 如果没有内容但有缓存，使用缓存
      if (!content && file.fileContent) {
        content = file.fileContent;
        setSelectedFileContent(content);
      }
      
      if (content?.passages && content.passages.length > 0) {
        const selectedPassage = content.passages.find(p => p.id === passageId);
        
        if (!selectedPassage) {
          showSnackbar('未找到指定的文章', 'error');
          return;
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

  // ========== 显示提示消息 ==========
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
      // 重新加载当前文章
      handleSelectArticle(selectedFile, passage.id);
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

  // ========== 处理搜索变化 ==========
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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
            : '📚 English A-Z 学习中心'
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
                选择材料
              </Button>
              <IconButton color="inherit" onClick={handleRefresh} disabled={!passage}>
                <RefreshIcon />
              </IconButton>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => loadJsonFiles()}
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
            {selectedFile.name} · 📖 {passage?.title || '未选择文章'}
          </Typography>
        </Box>
      )}
      
      {/* 显示当前视图模式 */}
      {viewMode === 'browser' && (
        <Box sx={{ bgcolor: '#283593', px: 2, py: 0.5 }}>
          <Typography variant="caption" color="rgba(255,255,255,0.8)">
            📚 学习材料浏览器 · 选择材料开始学习
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
            files={filteredFiles}
            onFileSelect={handleSelectJsonFile}
            onArticleSelect={handleSelectArticle}
            loading={contentLoading}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            selectedFile={selectedFile}
            fileContent={selectedFileContent}
            contentLoading={contentLoading}
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