// src/pages/WordbankParent.jsx
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
  Badge,
  Chip,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Quiz as QuizIcon,
  List as ListIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Shuffle as ShuffleIcon,
  Error as ErrorIcon,
  NewReleases as NewReleasesIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import WordbankTestSimple from './WordbankTest';
import WordbankMasterView from './WordbankMasterView';
import { wordbankApi } from './wordbankApi';

const WordbankParent = () => {
  const navigate = useNavigate();

  // ========== 状态管理 ==========
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [explanations, setExplanations] = useState({});
  const [dataSource] = useState('中考');
  const [confirmedAnswers, setConfirmedAnswers] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 当前视图状态（0: 练习, 1: 题库查看）
  const [currentView, setCurrentView] = useState(0);
  
  // 题库统计信息
  const [bankStats, setBankStats] = useState({ 
    total: 0, 
    mastered: 0, 
    attempted: 0, 
    extracts: 0, 
    accuracy: 0 
  });
  
  // 自定义抽取对话框的状态
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [extractMode, setExtractMode] = useState('range'); // 'range', 'random', 'wrong', 'never'
  const [startNumber, setStartNumber] = useState(1);
  const [endNumber, setEndNumber] = useState(10);
  const [randomCount, setRandomCount] = useState(5);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [availableQuestionsInRange, setAvailableQuestionsInRange] = useState(0);
  const [wrongQuestionsCount, setWrongQuestionsCount] = useState(0);
  const [neverExtractedCount, setNeverExtractedCount] = useState(0);
  
  // 缓存所有题目
  const [allQuestions, setAllQuestions] = useState([]);
  const [studentStats, setStudentStats] = useState(null);
  
  // 保存当前抽取的范围
  const [currentRange, setCurrentRange] = useState({ start: 1, end: 10 });
  const [currentExtractMode, setCurrentExtractMode] = useState('range');
  const [currentExtractCount, setCurrentExtractCount] = useState(0);

  // 标记是否已经执行过初始抽取
  const initialExtractDone = useRef(false);
  const studentStatsRef = useRef(null);

  // ========== 错题判断辅助函数 ==========
  const isQuestionWrong = (qStat, lookbackCount = 3, wrongRateThreshold = 0.5) => {
    if (!qStat || !qStat.history || qStat.history.length === 0) {
      return false; // 没有历史记录，不算错题
    }
    
    // 获取最近的历史记录
    const recentHistory = qStat.history.slice(-lookbackCount);
    
    // 计算最近错误率
    const wrongCount = recentHistory.filter(h => !h.result).length;
    const wrongRate = wrongCount / recentHistory.length;
    
    // 动态调整阈值（历史记录不足时放宽标准）
    let adjustedThreshold = wrongRateThreshold;
    if (recentHistory.length < lookbackCount) {
      // 只有1-2次记录时，阈值降低
      adjustedThreshold = wrongRateThreshold * 0.6;
    }
    
    // 特殊情况：最近一次是错误，且总错误次数>0
    const lastResult = recentHistory[recentHistory.length - 1]?.result;
    const hasRecentWrong = lastResult === false;
    
    // 综合判断：
    // 1. 最近错误率超过阈值
    // 2. 或者最近一次是错误（且有过错误记录）
    return wrongRate >= adjustedThreshold || (hasRecentWrong && qStat.wrong_count > 0);
  };

  const getPriorityScore = (qStat) => {
    if (!qStat || !qStat.history) return 0;
    
    const recentHistory = qStat.history.slice(-3);
    const wrongCount = recentHistory.filter(h => !h.result).length;
    const wrongRate = wrongCount / recentHistory.length;
    
    // 最近错误率 * 10（主要因素）
    let score = wrongRate * 10;
    
    // 最近一次错误，额外加分
    if (recentHistory[recentHistory.length - 1]?.result === false) {
      score += 5;
    }
    
    // 总错误次数，适当加分（但权重降低）
    score += Math.min(qStat.wrong_count, 5) * 0.5;
    
    // 最近练习时间，越久没练分数越高
    const lastPractice = new Date(qStat.last_practiced).getTime();
    const daysSinceLast = (Date.now() - lastPractice) / (1000 * 60 * 60 * 24);
    score += Math.min(daysSinceLast, 7) * 0.2;
    
    return score;
  };

  // ========== 初始化加载 ==========
  useEffect(() => {
    const initData = async () => {
      setInitialLoading(true);
      console.log('开始初始化加载...');
      
      // 先获取所有题目
      await fetchAllQuestions();
      
      // 然后获取统计信息
      await fetchBankStats();
      
      setInitialLoading(false);
      console.log('初始化加载完成');
    };
    
    initData();
  }, []);

  // 当 allQuestions 和 totalQuestionsCount 都准备好后，执行初始抽取
  useEffect(() => {
    // 确保数据已加载且未执行过初始抽取
    if (!initialLoading && allQuestions.length > 0 && totalQuestionsCount > 0 && !initialExtractDone.current) {
      console.log('数据已加载，执行初始抽取 1-10');
      initialExtractDone.current = true;
      
      // 直接调用抽取函数，不再使用 setTimeout
      fetchQuestionsByRange(1, Math.min(10, totalQuestionsCount), false);
    }
  }, [initialLoading, allQuestions, totalQuestionsCount]);

  // 当起始和结束范围变化时，计算范围内可用题目数量
  useEffect(() => {
    if (allQuestions.length > 0 && startNumber && endNumber) {
      const count = allQuestions.filter(q => 
        q.number && q.number >= startNumber && q.number <= endNumber
      ).length;
      setAvailableQuestionsInRange(count);
      
      // 调整随机抽取数量不超过可用题目数
      if (randomCount > count) {
        setRandomCount(count);
      }
    }
  }, [startNumber, endNumber, allQuestions]);

  // 当统计信息更新时，计算错题和未抽题目数量
  useEffect(() => {
    if (allQuestions.length > 0 && studentStats) {
      calculateQuestionStats();
    }
  }, [allQuestions, studentStats]);

  // 获取所有题目（用于客户端过滤）
  const fetchAllQuestions = async () => {
    try {
      console.log('正在获取所有题目...');
      const response = await wordbankApi.getQuestions({
        type: 'all',
        bank: dataSource,
        count: 200
      });

      console.log('获取题目响应:', response);

      if (response?.flag === 1 && response.content?.questions) {
        const questions = response.content.questions;
        console.log('获取到所有题目数量:', questions.length);
        console.log('题目样例:', questions.slice(0, 3));
        
        setAllQuestions(questions);
        
        // 计算总题数（取最大的题号）
        const numbers = questions.map(q => q.number).filter(n => n !== undefined && n !== null);
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        console.log('最大题号:', maxNumber);
        
        setTotalQuestionsCount(maxNumber);
        setEndNumber(Math.min(10, maxNumber));
        
        return { success: true, maxNumber };
      } else {
        console.error('获取题目失败:', response?.message);
        setError('获取题目失败：' + (response?.message || '未知错误'));
        return { success: false };
      }
    } catch (error) {
      console.error('获取所有题目失败:', error);
      setError('获取题目失败：' + (error.message || '网络错误'));
      return { success: false };
    }
  };

  // 计算错题和未抽题目数量 - 基于最近历史记录
  const calculateQuestionStats = () => {
    if (!allQuestions.length || !studentStats) return;
    
    let wrongCount = 0;
    let neverCount = 0;
    
    allQuestions.forEach(question => {
      const qStat = studentStats.questions?.[question.id];
      
      if (!qStat) {
        // 从未抽取过的题目
        neverCount++;
      } else {
        // 基于最近历史记录判断是否是错题
        if (isQuestionWrong(qStat)) {
          wrongCount++;
        }
      }
    });
    
    setWrongQuestionsCount(wrongCount);
    setNeverExtractedCount(neverCount);
    console.log('统计信息:', { wrongCount, neverCount, total: allQuestions.length });
  };

  // 根据范围获取题目 - 客户端过滤版
  const fetchQuestionsByRange = async (start, end, showMessage = false) => {
    console.log('fetchQuestionsByRange 被调用:', { start, end, showMessage });
    
    if (start > end) {
      if (showMessage) {
        setSnackbar({
          open: true,
          message: '起始序号不能大于结束序号',
          severity: 'error'
        });
      }
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 检查是否有数据
      if (!allQuestions || allQuestions.length === 0) {
        const errorMsg = '题目数据尚未加载完成，请稍后重试';
        console.log(errorMsg);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'warning'
          });
        }
        
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      console.log('当前 allQuestions 长度:', allQuestions.length);
      
      // 直接过滤
      const rangeQuestions = allQuestions.filter(q => {
        return q.number && q.number >= start && q.number <= end;
      });
      
      console.log('过滤后的题目数量:', rangeQuestions.length);
      console.log('过滤后的题目:', rangeQuestions.map(q => q.number).sort((a, b) => a - b));
      
      if (rangeQuestions.length > 0) {
        const sortedQuestions = [...rangeQuestions].sort((a, b) => (a.number || 0) - (b.number || 0));
        
        setQuestions(sortedQuestions);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setExplanations({});
        setConfirmedAnswers({});
        setCurrentRange({ start, end });
        setCurrentExtractMode('range');
        setCurrentExtractCount(sortedQuestions.length);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: `已加载 ${sortedQuestions.length} 道题目 (第${start}-${end}题)`,
            severity: 'success'
          });
        }
      } else {
        const errorMsg = `第${start}-${end}题范围内没有题目`;
        console.log(errorMsg);
        setError(errorMsg);
        
        // 清空当前题目
        setQuestions([]);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'warning'
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('获取题目失败:', error);
      setError('获取题目失败：' + (error.message || '网络错误'));
      if (showMessage) {
        setSnackbar({
          open: true,
          message: '获取题目失败：' + (error.message || '网络错误'),
          severity: 'error'
        });
      }
      setLoading(false);
    }
  };

  // 随机抽取题目
  const fetchRandomQuestions = async (start, end, count, showMessage = false) => {
    console.log('fetchRandomQuestions 被调用:', { start, end, count, showMessage });
    
    if (start > end) {
      if (showMessage) {
        setSnackbar({
          open: true,
          message: '起始序号不能大于结束序号',
          severity: 'error'
        });
      }
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 检查是否有数据
      if (!allQuestions || allQuestions.length === 0) {
        const errorMsg = '题目数据尚未加载完成，请稍后重试';
        console.log(errorMsg);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'warning'
          });
        }
        
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      console.log('当前 allQuestions 长度:', allQuestions.length);
      
      // 获取范围内的所有题目
      const rangeQuestions = allQuestions.filter(q => {
        return q.number && q.number >= start && q.number <= end;
      });
      
      console.log('范围内题目数量:', rangeQuestions.length);
      
      if (rangeQuestions.length === 0) {
        const errorMsg = `第${start}-${end}题范围内没有题目`;
        console.log(errorMsg);
        setError(errorMsg);
        setQuestions([]);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'warning'
          });
        }
        setLoading(false);
        return;
      }
      
      // 检查请求数量是否超过可用题目
      let extractCount = count;
      if (count > rangeQuestions.length) {
        if (showMessage) {
          setSnackbar({
            open: true,
            message: `范围内只有 ${rangeQuestions.length} 道题目，将全部加载`,
            severity: 'info'
          });
        }
        extractCount = rangeQuestions.length;
      }
      
      // 随机抽取指定数量的题目
      const shuffled = [...rangeQuestions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, extractCount);
      
      // 按题号排序
      const sortedQuestions = [...selected].sort((a, b) => (a.number || 0) - (b.number || 0));
      
      setQuestions(sortedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setExplanations({});
      setConfirmedAnswers({});
      setCurrentRange({ start, end });
      setCurrentExtractMode('random');
      setCurrentExtractCount(extractCount);
      
      if (showMessage) {
        setSnackbar({
          open: true,
          message: `已随机抽取 ${sortedQuestions.length} 道题目 (第${start}-${end}题范围)`,
          severity: 'success'
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('随机抽取失败:', error);
      setError('随机抽取失败：' + (error.message || '网络错误'));
      if (showMessage) {
        setSnackbar({
          open: true,
          message: '随机抽取失败：' + (error.message || '网络错误'),
          severity: 'error'
        });
      }
      setLoading(false);
    }
  };

  // 获取错题 - 基于最近历史记录
  const fetchWrongQuestions = async (count, showMessage = false) => {
    console.log('fetchWrongQuestions 被调用:', { count, showMessage });
    
    setLoading(true);
    setError(null);
    
    try {
      if (!allQuestions || allQuestions.length === 0) {
        const errorMsg = '题目数据尚未加载完成，请稍后重试';
        console.log(errorMsg);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'warning'
          });
        }
        
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (!studentStats) {
        const errorMsg = '学习统计尚未加载完成，请稍后重试';
        console.log(errorMsg);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'warning'
          });
        }
        
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // 获取错题（基于最近历史记录判断）
      const wrongQuestions = allQuestions.filter(question => {
        const qStat = studentStats.questions?.[question.id];
        return isQuestionWrong(qStat);
      });
      
      console.log('基于最近历史的错题数量:', wrongQuestions.length);
      
      if (wrongQuestions.length === 0) {
        const errorMsg = '没有找到需要复习的错题，请继续练习';
        console.log(errorMsg);
        setError(errorMsg);
        setQuestions([]);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'info'
          });
        }
        setLoading(false);
        return;
      }
      
      // 按优先级排序（分数高的优先）
      const sortedWrongQuestions = wrongQuestions.sort((a, b) => {
        const aScore = getPriorityScore(studentStats.questions?.[a.id]);
        const bScore = getPriorityScore(studentStats.questions?.[b.id]);
        return bScore - aScore;
      });
      
      // 检查请求数量是否超过可用题目
      let extractCount = count;
      if (count > sortedWrongQuestions.length) {
        if (showMessage) {
          setSnackbar({
            open: true,
            message: `当前有 ${sortedWrongQuestions.length} 道需要复习的错题，将全部加载`,
            severity: 'info'
          });
        }
        extractCount = sortedWrongQuestions.length;
      }
      
      // 抽取指定数量的错题（按优先级取前N个）
      const selected = sortedWrongQuestions.slice(0, extractCount);
      
      // 按题号排序（便于浏览）
      const sortedQuestions = [...selected].sort((a, b) => (a.number || 0) - (b.number || 0));
      
      setQuestions(sortedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setExplanations({});
      setConfirmedAnswers({});
      setCurrentRange({ start: 1, end: totalQuestionsCount });
      setCurrentExtractMode('wrong');
      setCurrentExtractCount(extractCount);
      
      if (showMessage) {
        setSnackbar({
          open: true,
          message: `已抽取 ${sortedQuestions.length} 道需要复习的错题`,
          severity: 'success'
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('获取错题失败:', error);
      setError('获取错题失败：' + (error.message || '网络错误'));
      if (showMessage) {
        setSnackbar({
          open: true,
          message: '获取错题失败：' + (error.message || '网络错误'),
          severity: 'error'
        });
      }
      setLoading(false);
    }
  };

  // 获取从未抽取过的题目
  const fetchNeverExtractedQuestions = async (count, showMessage = false) => {
    console.log('fetchNeverExtractedQuestions 被调用:', { count, showMessage });
    
    setLoading(true);
    setError(null);
    
    try {
      if (!allQuestions || allQuestions.length === 0) {
        const errorMsg = '题目数据尚未加载完成，请稍后重试';
        console.log(errorMsg);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'warning'
          });
        }
        
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (!studentStats) {
        const errorMsg = '学习统计尚未加载完成，请稍后重试';
        console.log(errorMsg);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'warning'
          });
        }
        
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // 获取从未抽取过的题目
      const neverQuestions = allQuestions.filter(question => {
        const qStat = studentStats.questions?.[question.id];
        return !qStat; // 没有统计记录，说明从未抽取过
      });
      
      console.log('未抽题目数量:', neverQuestions.length);
      
      if (neverQuestions.length === 0) {
        const errorMsg = '所有题目都已经抽取过了！';
        console.log(errorMsg);
        setError(errorMsg);
        setQuestions([]);
        
        if (showMessage) {
          setSnackbar({
            open: true,
            message: errorMsg,
            severity: 'info'
          });
        }
        setLoading(false);
        return;
      }
      
      // 检查请求数量是否超过可用题目
      let extractCount = count;
      if (count > neverQuestions.length) {
        if (showMessage) {
          setSnackbar({
            open: true,
            message: `未抽题目只有 ${neverQuestions.length} 道，将全部加载`,
            severity: 'info'
          });
        }
        extractCount = neverQuestions.length;
      }
      
      // 随机抽取指定数量的未抽题目
      const shuffled = [...neverQuestions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, extractCount);
      
      // 按题号排序
      const sortedQuestions = [...selected].sort((a, b) => (a.number || 0) - (b.number || 0));
      
      setQuestions(sortedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setExplanations({});
      setConfirmedAnswers({});
      setCurrentRange({ start: 1, end: totalQuestionsCount });
      setCurrentExtractMode('never');
      setCurrentExtractCount(extractCount);
      
      if (showMessage) {
        setSnackbar({
          open: true,
          message: `已抽取 ${sortedQuestions.length} 道未抽题目`,
          severity: 'success'
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('获取未抽题目失败:', error);
      setError('获取未抽题目失败：' + (error.message || '网络错误'));
      if (showMessage) {
        setSnackbar({
          open: true,
          message: '获取未抽题目失败：' + (error.message || '网络错误'),
          severity: 'error'
        });
      }
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchBankStats = async () => {
    try {
      const response = await wordbankApi.getReport(dataSource);
      if (response?.flag === 1 && response.content) {
        const metadata = response.content.metadata || {};
        const questions = response.content.questions || {};
        
        let masteredCount = 0;
        Object.values(questions).forEach(q => {
          if (q.mastery_level >= 0.8) {
            masteredCount++;
          }
        });
        
        setBankStats({
          total: metadata.totalQuestions || Object.keys(questions).length,
          mastered: masteredCount,
          attempted: metadata.practicedQuestions || 0,
          extracts: metadata.totalExtracts || 0,
          accuracy: Math.round((metadata.accuracy || 0) * 100)
        });
        
        setStudentStats(response.content);
        studentStatsRef.current = response.content;
      }
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  // ========== 处理函数 ==========

  // 处理答案变更
  const handleAnswerChange = (questionId, value, allAnswers) => {
    setAnswers(allAnswers);
  };

  // 确认答案
  const handleConfirmAnswer = (questionId) => {
    setConfirmedAnswers(prev => ({ ...prev, [questionId]: true }));
  };

  // 修改答案
  const handleModifyAnswer = (questionId) => {
    const newConfirmed = { ...confirmedAnswers };
    delete newConfirmed[questionId];
    setConfirmedAnswers(newConfirmed);
    setSnackbar({ open: true, message: '题目已解锁', severity: 'info' });
  };

  // 处理提交 - 修改这里，提交成功后清除答题数据
  const handleSubmit = async (submitData) => {
    if (!questions.length) return;
    
    setLoading(true);
    
    try {
      const response = await wordbankApi.submitAnswers(submitData);
      
      if (response?.flag === 1) {
        const correctCount = response.content.results?.filter(r => r.isCorrect).length || 0;
        const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
        
        setSnackbar({ 
          open: true, 
          message: `提交成功！正确率：${accuracy}% (${correctCount}/${questions.length})`, 
          severity: 'success' 
        });
        
        // 提交成功后，清除所有答题数据
        // 这样用户需要重新抽取题目才能继续练习
        setQuestions([]);
        setAnswers({});
        setExplanations({});
        setConfirmedAnswers({});
        setCurrentQuestionIndex(0);
        
        // 刷新统计信息
        setTimeout(() => {
          fetchBankStats();
        }, 500);
        
        return { 
          success: true, 
          accuracy, 
          correctCount, 
          response: response.content 
        };
      } else {
        setSnackbar({ 
          open: true, 
          message: response?.message || '提交失败', 
          severity: 'error' 
        });
        return { success: false };
      }
    } catch (error) {
      console.error('提交失败:', error);
      setSnackbar({ 
        open: true, 
        message: '提交失败：' + (error.message || '网络错误'), 
        severity: 'error' 
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 打开自定义抽取对话框
  const handleOpenCustomDialog = () => {
    setCustomDialogOpen(true);
    setExtractMode('range');
    setStartNumber(1);
    setEndNumber(Math.min(10, totalQuestionsCount));
    setRandomCount(Math.min(5, availableQuestionsInRange));
  };

  // 关闭自定义抽取对话框
  const handleCloseCustomDialog = () => {
    setCustomDialogOpen(false);
  };

  // 执行抽取（根据模式）
  const handleExtract = async () => {
    console.log('执行抽取:', { mode: extractMode, startNumber, endNumber, randomCount });
    
    if (extractMode === 'range' || extractMode === 'random') {
      if (startNumber > endNumber) {
        setSnackbar({
          open: true,
          message: '起始序号不能大于结束序号',
          severity: 'error'
        });
        return;
      }

      if (startNumber < 1 || endNumber > totalQuestionsCount) {
        setSnackbar({
          open: true,
          message: `请输入有效的序号范围 (1-${totalQuestionsCount})`,
          severity: 'error'
        });
        return;
      }
    }

    if (extractMode === 'range') {
      // 范围抽取
      await fetchQuestionsByRange(startNumber, endNumber, true);
    } else if (extractMode === 'random') {
      // 随机抽取
      if (randomCount < 1) {
        setSnackbar({
          open: true,
          message: '抽取数量必须大于0',
          severity: 'error'
        });
        return;
      }
      await fetchRandomQuestions(startNumber, endNumber, randomCount, true);
    } else if (extractMode === 'wrong') {
      // 错题抽取（基于最近历史）
      if (randomCount < 1) {
        setSnackbar({
          open: true,
          message: '抽取数量必须大于0',
          severity: 'error'
        });
        return;
      }
      await fetchWrongQuestions(randomCount, true);
    } else if (extractMode === 'never') {
      // 未抽题目抽取
      if (randomCount < 1) {
        setSnackbar({
          open: true,
          message: '抽取数量必须大于0',
          severity: 'error'
        });
        return;
      }
      await fetchNeverExtractedQuestions(randomCount, true);
    }
    
    handleCloseCustomDialog();
  };

  // 处理从题库视图选择题目
  const handleSelectQuestions = (selectedQuestions) => {
    const sortedQuestions = [...selectedQuestions].sort((a, b) => (a.number || 0) - (b.number || 0));
    
    setQuestions(sortedQuestions);
    setCurrentView(0);
    setAnswers({});
    setExplanations({});
    setConfirmedAnswers({});
    
    const firstNumber = sortedQuestions[0]?.number || '?';
    const lastNumber = sortedQuestions[sortedQuestions.length-1]?.number || '?';
    
    setSnackbar({
      open: true,
      message: `已选择 ${sortedQuestions.length} 道题目 (第${firstNumber}-${lastNumber}题)`,
      severity: 'success'
    });
  };

  // 处理刷新/换一批（刷新时根据当前模式重新抽取）
  const handleRefresh = () => {
    if (currentView === 0 && questions.length > 0) {
      if (currentExtractMode === 'range') {
        fetchQuestionsByRange(currentRange.start, currentRange.end, true);
      } else if (currentExtractMode === 'random') {
        fetchRandomQuestions(currentRange.start, currentRange.end, currentExtractCount, true);
      } else if (currentExtractMode === 'wrong') {
        fetchWrongQuestions(currentExtractCount, true);
      } else if (currentExtractMode === 'never') {
        fetchNeverExtractedQuestions(currentExtractCount, true);
      }
    }
  };

  // 处理视图切换
  const handleViewChange = (event, newValue) => {
    setCurrentView(newValue);
    if (newValue === 1) {
      fetchBankStats();
    }
  };

  // 返回首页
  const handleBackToHome = () => {
    navigate('/');
  };

  // 显示当前题目的ID信息
  const renderQuestionIdInfo = () => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null;
    
    const sortedQuestions = [...questions].sort((a, b) => (a.number || 0) - (b.number || 0));
    
    const currentQuestion = sortedQuestions[currentQuestionIndex];
    const questionNumber = currentQuestion.number || '未知';
    const totalQuestions = sortedQuestions.length;
    const firstNumber = sortedQuestions[0]?.number || '?';
    const lastNumber = sortedQuestions[sortedQuestions.length-1]?.number || '?';
    
    // 判断是否是特殊抽取模式
    const isRandom = currentExtractMode === 'random';
    const isWrong = currentExtractMode === 'wrong';
    const isNever = currentExtractMode === 'never';
    
    return (
      <Paper sx={{ p: 1, mb: 2, bgcolor: '#f0f4fa', display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon fontSize="small" color="info" />
        <Typography variant="body2" color="text.secondary">
          当前题目: 第 {questionNumber} 题 | 共 {totalQuestions} 题
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1}>
          {currentExtractMode !== 'range' && currentExtractMode !== 'random' && (
            <Chip 
              size="small" 
              label={`抽取范围: ${currentRange.start} - ${currentRange.end}`} 
              variant="outlined"
              color="primary"
            />
          )}
          {isRandom && (
            <Chip 
              size="small" 
              icon={<ShuffleIcon />}
              label={`随机 ${totalQuestions} 题`} 
              variant="outlined"
              color="success"
            />
          )}
          {isWrong && (
            <Chip 
              size="small" 
              icon={<ErrorIcon />}
              label={`错题 ${totalQuestions} 题`} 
              variant="outlined"
              color="error"
            />
          )}
          {isNever && (
            <Chip 
              size="small" 
              icon={<NewReleasesIcon />}
              label={`未抽 ${totalQuestions} 题`} 
              variant="outlined"
              color="info"
            />
          )}
          <Chip 
            size="small" 
            label={`显示范围: ${firstNumber} - ${lastNumber}`} 
            variant="outlined"
            color="secondary"
          />
        </Stack>
      </Paper>
    );
  };

  // ========== 头部组件 ==========
  const Header = () => {
    return (
      <AppBar position="static" sx={{ bgcolor: '#1a237e' }}>
        <Toolbar>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleBackToHome}
            sx={{
              borderRadius: 2,
              borderColor: 'white',
              color: 'white',
              mr: 2,
              '&:hover': { borderColor: '#ffd700', backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            首页
          </Button>
          
          <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>
            词汇变形
          </Typography>

          <Tabs 
            value={currentView} 
            onChange={handleViewChange}
            sx={{
              mr: 2,
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', minWidth: 100 },
              '& .Mui-selected': { color: 'white', fontWeight: 'bold' },
              '& .MuiTabs-indicator': { backgroundColor: '#ffd700' }
            }}
          >
            <Tab icon={<QuizIcon />} label="练习" iconPosition="start" />
            <Tab 
              icon={
                <Badge 
                  badgeContent={bankStats.mastered} 
                  color="success" 
                  max={999}
                  title={`已掌握 ${bankStats.mastered} 道题目`}
                >
                  <ListIcon />
                </Badge>
              } 
              label="题库" 
              iconPosition="start"
            />
          </Tabs>

          {currentView === 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                size="small"
                onClick={handleOpenCustomDialog}
                startIcon={<EditIcon />}
                disabled={initialLoading}
                sx={{ 
                  bgcolor: '#ffd700', 
                  color: '#1a237e',
                  '&:hover': { bgcolor: '#ffc400' },
                  '&.Mui-disabled': { bgcolor: '#cccccc', color: '#666666' }
                }}
              >
                {initialLoading ? '加载中...' : '抽取题目'}
              </Button>

              <Tooltip title="重新抽取当前范围题目">
                <span>
                  <IconButton 
                    color="inherit" 
                    onClick={handleRefresh} 
                    disabled={loading || initialLoading || questions.length === 0}
                  >
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          )}
        </Toolbar>
      </AppBar>
    );
  };

  // 自定义抽取对话框
  const renderCustomDialog = () => (
    <Dialog open={customDialogOpen} onClose={handleCloseCustomDialog} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon /> 抽取题目
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          请设置抽取方式（共 {totalQuestionsCount} 题，需复习错题 {wrongQuestionsCount} 题，未抽 {neverExtractedCount} 题）
        </Typography>
        
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">抽取方式</FormLabel>
          <RadioGroup
            row
            value={extractMode}
            onChange={(e) => setExtractMode(e.target.value)}
          >
            <FormControlLabel value="range" control={<Radio />} label="范围抽取" />
            <FormControlLabel value="random" control={<Radio />} label="随机抽取" />
            <FormControlLabel value="wrong" control={<Radio />} label="错题复习" />
            <FormControlLabel value="never" control={<Radio />} label="未抽题目" />
          </RadioGroup>
        </FormControl>
        
        {(extractMode === 'range' || extractMode === 'random') && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              label="起始题号"
              type="number"
              size="small"
              value={startNumber}
              onChange={(e) => {
                const value = e.target.value === '' ? 1 : Number(e.target.value);
                const newStart = Math.max(1, Math.min(totalQuestionsCount, value));
                setStartNumber(newStart);
                if (newStart > endNumber) {
                  setEndNumber(newStart);
                }
              }}
              InputProps={{
                inputProps: { min: 1, max: totalQuestionsCount }
              }}
              sx={{ flex: 1 }}
            />
            <Typography variant="body1">-</Typography>
            <TextField
              label="结束题号"
              type="number"
              size="small"
              value={endNumber}
              onChange={(e) => {
                const value = e.target.value === '' ? startNumber : Number(e.target.value);
                const newEnd = Math.max(startNumber, Math.min(totalQuestionsCount, value));
                setEndNumber(newEnd);
              }}
              InputProps={{
                inputProps: { min: startNumber, max: totalQuestionsCount }
              }}
              sx={{ flex: 1 }}
            />
          </Box>
        )}
        
        {(extractMode === 'random' || extractMode === 'wrong' || extractMode === 'never') && (
          <Box sx={{ mb: 2 }}>
            <TextField
              label="抽取数量"
              type="number"
              size="small"
              value={randomCount}
              onChange={(e) => {
                const value = e.target.value === '' ? 1 : Number(e.target.value);
                let maxCount = 0;
                
                if (extractMode === 'random') {
                  maxCount = availableQuestionsInRange;
                } else if (extractMode === 'wrong') {
                  maxCount = wrongQuestionsCount;
                } else if (extractMode === 'never') {
                  maxCount = neverExtractedCount;
                }
                
                const newCount = Math.max(1, Math.min(maxCount, value));
                setRandomCount(newCount);
              }}
              InputProps={{
                inputProps: { 
                  min: 1, 
                  max: extractMode === 'random' ? availableQuestionsInRange : 
                        extractMode === 'wrong' ? wrongQuestionsCount : neverExtractedCount 
                }
              }}
              fullWidth
              helperText={
                extractMode === 'random' 
                  ? `范围内共有 ${availableQuestionsInRange} 道题目`
                  : extractMode === 'wrong'
                    ? `共有 ${wrongQuestionsCount} 道需复习错题`
                    : `共有 ${neverExtractedCount} 道未抽题目`
              }
            />
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          {extractMode === 'range' 
            ? `将抽取第${startNumber}-${endNumber}题，共${endNumber - startNumber + 1}题`
            : extractMode === 'random'
              ? `将从第${startNumber}-${endNumber}题中随机抽取 ${randomCount} 题`
              : extractMode === 'wrong'
                ? `将从需复习错题中随机抽取 ${randomCount} 题（基于最近表现）`
                : `将从未抽题目中随机抽取 ${randomCount} 题`
          }
        </Typography>
        
        {extractMode === 'wrong' && wrongQuestionsCount === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            暂无需要复习的错题，请继续练习
          </Alert>
        )}
        
        {extractMode === 'never' && neverExtractedCount === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            所有题目都已抽取过
          </Alert>
        )}
        
        {totalQuestionsCount === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            暂无题目数据
          </Alert>
        )}
        
        {initialLoading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            题目数据正在加载中...
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseCustomDialog}>取消</Button>
        <Button 
          onClick={handleExtract} 
          variant="contained" 
          color="primary"
          disabled={
            initialLoading || 
            totalQuestionsCount === 0 ||
            (extractMode === 'range' && (startNumber > endNumber || startNumber < 1 || endNumber > totalQuestionsCount)) ||
            (extractMode === 'random' && (randomCount < 1 || randomCount > availableQuestionsInRange)) ||
            (extractMode === 'wrong' && (randomCount < 1 || randomCount > wrongQuestionsCount)) ||
            (extractMode === 'never' && (randomCount < 1 || randomCount > neverExtractedCount))
          }
        >
          确认抽取
        </Button>
      </DialogActions>
    </Dialog>
  );

  // 显示加载状态
  if (initialLoading && !questions.length && allQuestions.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Header />
        <LinearProgress />
        <Container sx={{ py: 3, textAlign: 'center' }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              正在加载题目数据...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请稍候
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  // ========== 渲染 ==========
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Header />
      {loading && currentView === 0 && <LinearProgress />}

      <Container maxWidth={currentView === 0 ? "lg" : "xl"} sx={{ py: 3 }}>
        {currentView === 0 ? (
          error ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              <Button 
                variant="contained" 
                onClick={() => window.location.reload()} 
                startIcon={<RefreshIcon />}
              >
                刷新页面
              </Button>
            </Paper>
          ) : questions.length > 0 ? (
            <>
              {renderQuestionIdInfo()}
              
              <WordbankTestSimple
                questions={questions}
                currentIndex={currentQuestionIndex}
                onIndexChange={setCurrentQuestionIndex}
                loading={loading}
                error={null}
                onRefresh={handleRefresh}
                onAnswerChange={handleAnswerChange}
                onSubmit={handleSubmit}
                externalAnswers={answers}
                externalExplanations={explanations}
                confirmedAnswers={confirmedAnswers}
                onConfirmAnswer={handleConfirmAnswer}
                onModifyAnswer={handleModifyAnswer}
                dataSource={dataSource}
              />
            </>
          ) : !loading ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="info">暂无题目，点击"抽取题目"按钮加载题目</Alert>
              <Button 
                variant="contained" 
                onClick={handleOpenCustomDialog} 
                startIcon={<EditIcon />}
                sx={{ mt: 2 }}
                disabled={initialLoading}
              >
                {initialLoading ? '加载中...' : '抽取题目'}
              </Button>
            </Paper>
          ) : null
        ) : (
          <WordbankMasterView 
            dataSource={dataSource} 
            onSelectQuestions={handleSelectQuestions}
          />
        )}
      </Container>

      {renderCustomDialog()}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, maxWidth: '600px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WordbankParent;