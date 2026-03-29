import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  IconButton,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  Close as CloseIcon,
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  AccessTime
} from '@mui/icons-material';
import { clozeApi } from './api';

const ResultSummary = ({
  open,
  onClose,
  result,
  passageData,
  answers,
  onPracticeAgain,
  onBackToBrowse,
  onViewAnswers,
  dataSource = 'default'
}) => {
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState(null);
  const [passageStats, setPassageStats] = useState(null);

  // ========== 计算文章的历史记录 ==========
  const calculateExtractHistory = (passage) => {
    if (!passage || !passage.questions) return [];
    
    const allAnswers = [];
    
    passage.questions.forEach(question => {
      if (question.stats?.history && Array.isArray(question.stats.history)) {
        question.stats.history.forEach((record) => {
          allAnswers.push({
            date: record.date,
            result: record.result,
            questionId: question.id
          });
        });
      }
    });
    
    if (allAnswers.length === 0) return [];
    
    // 按日期排序（从旧到新）
    allAnswers.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const questionsPerPassage = passage.questions.length;
    const extracts = [];
    
    for (let i = 0; i < allAnswers.length; i += questionsPerPassage) {
      const extractAnswers = allAnswers.slice(i, i + questionsPerPassage);
      if (extractAnswers.length === 0) continue;
      
      const correctCount = extractAnswers.filter(a => a.result).length;
      const accuracy = (correctCount / extractAnswers.length) * 100;
      
      extracts.push({
        extract_number: extracts.length + 1,
        date: extractAnswers[0].date,
        correct_count: correctCount,
        total: extractAnswers.length,
        accuracy: Math.round(accuracy)
      });
    }
    
    // 反转数组，让最新的显示在上面
    return extracts.reverse();
  };

  // ========== 获取个人学习历史（从文章列表接口） ==========
  const fetchPersonalHistory = async () => {
    if (!passageData?.id) return;
    
    setLoading(true);
    try {
      // 调用API获取文章列表（包含个人历史）
      const response = await clozeApi.getPassage('all', dataSource);
      
      if (response?.flag === 1) {
        // 根据API返回结构提取passages列表
        let passagesList = [];
        if (response.content?.passages) {
          passagesList = response.content.passages;
        } else if (Array.isArray(response.content)) {
          passagesList = response.content;
        }
        
        // 从文章列表中找到当前文章（带个人历史）
        const personalPassageData = passagesList.find(p => p.id === passageData.id);
        
        if (personalPassageData) {
          // 保存文章级别的统计信息
          setPassageStats({
            extract_count: personalPassageData.stats?.extract_count || 0,
            answer_count: personalPassageData.stats?.answer_count || 0,
            correct_count: personalPassageData.stats?.correct_count || 0,
            wrong_count: personalPassageData.stats?.wrong_count || 0,
            accuracy: personalPassageData.stats?.accuracy || 0,
            avg_mastery: personalPassageData.stats?.avg_mastery || 0,
            last_practiced: personalPassageData.stats?.last_practiced || null
          });
          
          // 构建包含个人历史数据的完整文章对象
          const fullPassageWithHistory = {
            ...passageData,
            questions: passageData.questions.map(q => {
              const matchingQuestion = personalPassageData.questions?.find(
                pq => pq.id === q.id || pq.number === q.number
              );
              
              return {
                ...q,
                stats: {
                  history: matchingQuestion?.stats?.history || []
                }
              };
            })
          };
          
          // 计算历史记录
          const history = calculateExtractHistory(fullPassageWithHistory);
          setPracticeHistory(history);
          
          // 计算进步趋势（与上一次练习比较）
          if (history.length >= 1 && result) {
            const lastAccuracy = history[0].accuracy;
            const diff = result.accuracy - lastAccuracy;
            setTrend(diff);
          } else {
            setTrend(null);
          }
        } else {
          setPracticeHistory([]);
          setPassageStats(null);
          setTrend(null);
        }
      } else {
        // 降级方案：尝试使用传入的 passageData 中的历史数据（如果有的话）
        const history = calculateExtractHistory(passageData);
        setPracticeHistory(history);
        
        if (history.length >= 1 && result) {
          const lastAccuracy = history[0].accuracy;
          const diff = result.accuracy - lastAccuracy;
          setTrend(diff);
        } else {
          setTrend(null);
        }
      }
    } catch (error) {
      console.error('获取个人学习历史失败:', error);
      
      // 出错时尝试使用传入的数据
      const history = calculateExtractHistory(passageData);
      setPracticeHistory(history);
      
      if (history.length >= 1 && result) {
        const lastAccuracy = history[0].accuracy;
        const diff = result.accuracy - lastAccuracy;
        setTrend(diff);
      } else {
        setTrend(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // 当对话框打开时，获取个人学习历史
  useEffect(() => {
    if (open && passageData?.id) {
      fetchPersonalHistory();
    }
  }, [open, passageData?.id, dataSource]);

  // ========== 如果数据不存在，返回空 ==========
  if (!result || !passageData) {
    return null;
  }

  const { accuracy, correctCount, totalCount, timeSpent } = result;
  const wrongCount = totalCount - correctCount;

  // 格式化时间
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // 格式化日期
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '未知';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '未知';
    }
  };

  const hasHistory = practiceHistory.length > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      }}
    >
      {/* 简洁头部 */}
      <DialogTitle sx={{ 
        borderBottom: '1px solid #e0e0e0',
        py: 2,
        px: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: '#fafafa'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500, color: '#333' }}>
          答题结果
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#666' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* 加载中状态 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        )}

        {/* 文章标题 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', mb: 1 }}>
            {passageData.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip size="small" label={`难度 ${passageData.difficulty}级`} variant="outlined" sx={{ fontSize: '0.75rem' }} />
            <Chip size="small" label={`${totalCount}题`} variant="outlined" sx={{ fontSize: '0.75rem' }} />
            {passageData.category && (
              <Chip size="small" label={passageData.category} variant="outlined" sx={{ fontSize: '0.75rem' }} />
            )}
            {/* 显示总练习次数 - 从passageStats中获取 */}
            {passageStats?.extract_count > 0 && (
              <Chip 
                size="small" 
                label={`练习${passageStats.extract_count}次`} 
                variant="outlined" 
                sx={{ fontSize: '0.75rem' }} 
              />
            )}
          </Box>
        </Box>

        {/* 核心数据 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', mb: 3 }}>
          {/* 正确率 */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#333', lineHeight: 1.2 }}>
              {accuracy}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              本次正确率
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ height: 40 }} />

          {/* 正确/错误计数 */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                {correctCount}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle sx={{ fontSize: 14, color: '#2e7d32' }} />
                <Typography variant="caption" sx={{ color: '#666' }}>正确</Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                {wrongCount}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Cancel sx={{ fontSize: 14, color: '#d32f2f' }} />
                <Typography variant="caption" sx={{ color: '#666' }}>错误</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 答题时间 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AccessTime sx={{ fontSize: 16, color: '#666' }} />
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>
              本次用时：{formatTime(timeSpent)}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(100, ((timeSpent || 0) / 300) * 100)} 
            sx={{ 
              height: 4, 
              borderRadius: 2,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': { bgcolor: '#333' }
            }}
          />
        </Box>

        {/* 历史练习记录 */}
        {!loading && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <HistoryIcon sx={{ fontSize: 18, color: '#666' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 500, color: '#333' }}>
                练习记录
              </Typography>
              {trend !== null && (
                <Tooltip title={trend > 0 ? '较上次进步' : trend < 0 ? '较上次退步' : '与上次持平'}>
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                    {trend > 0 ? (
                      <TrendingUp sx={{ fontSize: 16, color: '#2e7d32' }} />
                    ) : trend < 0 ? (
                      <TrendingDown sx={{ fontSize: 16, color: '#d32f2f' }} />
                    ) : null}
                    <Typography variant="caption" sx={{ 
                      color: trend > 0 ? '#2e7d32' : trend < 0 ? '#d32f2f' : '#666',
                      ml: 0.5
                    }}>
                      {trend > 0 ? '+' : ''}{Math.abs(trend)}%
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>

            <Box sx={{ bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1 }}>
              {/* 本次练习始终显示在最上面 */}
              <Box 
                sx={{ 
                  mb: hasHistory ? 2 : 0,
                  bgcolor: '#e8f0fe',
                  p: 1,
                  mx: -1,
                  borderRadius: 1
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    本次练习
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(new Date().toISOString())}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={accuracy} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4, 
                        bgcolor: '#e0e0e0', 
                        '& .MuiLinearProgress-bar': { 
                          bgcolor: accuracy >= 80 ? '#4caf50' : 
                                  accuracy >= 60 ? '#ff9800' : '#f44336' 
                        } 
                      }} 
                    />
                  </Box>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600, 
                    color: accuracy >= 80 ? '#4caf50' : 
                           accuracy >= 60 ? '#ff9800' : '#f44336' 
                  }}>
                    {accuracy}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({correctCount}/{totalCount})
                  </Typography>
                </Box>
              </Box>

              {/* 历史记录（按最新的在上面的顺序显示） */}
              {hasHistory && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  {practiceHistory.map((extract, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        mb: index < practiceHistory.length - 1 ? 1.5 : 0
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          第 {extract.extract_number} 次练习
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(extract.date)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={extract.accuracy} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4, 
                              bgcolor: '#e0e0e0', 
                              '& .MuiLinearProgress-bar': { 
                                bgcolor: extract.accuracy >= 80 ? '#4caf50' : 
                                        extract.accuracy >= 60 ? '#ff9800' : '#f44336' 
                              } 
                            }} 
                          />
                        </Box>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          color: extract.accuracy >= 80 ? '#4caf50' : 
                                 extract.accuracy >= 60 ? '#ff9800' : '#f44336' 
                        }}>
                          {extract.accuracy}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({extract.correct_count}/{extract.total})
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </>
              )}
              
              {/* 趋势对比 - 首次 vs 本次 */}
              {hasHistory && (
                <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #ccc' }}>
                  <Typography variant="caption" color="text.secondary">
                    {accuracy > practiceHistory[practiceHistory.length - 1].accuracy ? (
                      <TrendingUp fontSize="inherit" sx={{ color: '#4caf50', verticalAlign: 'middle', mr: 0.5 }} />
                    ) : accuracy < practiceHistory[practiceHistory.length - 1].accuracy ? (
                      <TrendingDown fontSize="inherit" sx={{ color: '#f44336', verticalAlign: 'middle', mr: 0.5 }} />
                    ) : null}
                    首次练习 {practiceHistory[practiceHistory.length - 1].accuracy}% · 
                    本次练习 {accuracy}%
                  </Typography>
                </Box>
              )}
            </Box>

            {/* 历史统计摘要 */}
            {hasHistory && (
              <Box sx={{ display: 'flex', gap: 3, mt: 2, justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                    历史平均正确率
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                    {Math.round(practiceHistory.reduce((sum, r) => sum + r.accuracy, 0) / practiceHistory.length)}%
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                    历史练习次数
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                    {practiceHistory.length}次
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* 底部按钮 */}
      <DialogActions sx={{ 
        p: 2, 
        borderTop: '1px solid #e0e0e0',
        justifyContent: 'space-between',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined"
            onClick={onBackToBrowse}
            sx={{ 
              color: '#666',
              borderColor: '#ccc',
              '&:hover': { borderColor: '#999', bgcolor: '#f5f5f5' }
            }}
          >
            返回浏览
          </Button>
          <Button 
            variant="outlined"
            onClick={onViewAnswers}
            sx={{ 
              color: '#1a237e',
              borderColor: '#1a237e',
              '&:hover': { bgcolor: '#e8eaf6' }
            }}
          >
            查看解析
          </Button>
        </Box>
        <Button 
          variant="contained" 
          onClick={onPracticeAgain}
          startIcon={<Refresh />}
          sx={{ 
            bgcolor: '#333',
            '&:hover': { bgcolor: '#555' },
            minWidth: 120
          }}
        >
          再练一次
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResultSummary;