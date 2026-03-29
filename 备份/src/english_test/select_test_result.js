// src/pages/select_test_result.jsx
import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Stack,
  Avatar,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  Alert,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  Timer,
  TrendingUp,
  Warning,
  ArrowBack,
  Shuffle,
  School,
  Psychology,
  Speed,
  EmojiEvents,
  History,
  Lightbulb,
  Category,
  Star,
  CalendarToday,
  Info
} from '@mui/icons-material';

const SingleChoiceResult = ({
  questions = [],
  answers = {},
  timeSpent = 0,
  serverStats = {},
  testTitle = "英语单项选择练习",
  onRestart,
  onBack,
  onNewBatch,
  dataSource = 'default',
  drawType = 'smart', // 抽取类型
  questionCount = 10, // 题目数量
  startTime = null, // 开始时间
  startRange = 1, // 新增：自定义范围起始题号
  endRange = 10, // 新增：自定义范围结束题号
}) => {
  // 获取当前日期时间
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[now.getDay()];
    
    return {
      full: `${year}年${month}月${day}日 ${weekday} ${hours}:${minutes}`,
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      weekday
    };
  };

  const dateTime = getCurrentDateTime();

  // 计算本次测试的统计数据
  const totalQuestions = questions.length;
  
  // 计算正确/错误数量
  const correctCount = questions.filter(q => {
    const userAnswer = answers[q.id] || '';
    return userAnswer === q.correct;
  }).length;
  
  const wrongCount = totalQuestions - correctCount;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // 计算平均每题用时
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0;

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // 获取成绩评级
  const getGrade = (percent) => {
    if (percent >= 90) return { text: '优秀', color: '#4caf50', emoji: '🏆', description: '太棒了！继续保持！' };
    if (percent >= 80) return { text: '良好', color: '#2196f3', emoji: '🎯', description: '不错哦，再接再厉！' };
    if (percent >= 70) return { text: '中等', color: '#ff9800', emoji: '⭐', description: '有进步空间，继续努力！' };
    if (percent >= 60) return { text: '及格', color: '#ffc107', emoji: '✅', description: '刚刚及格，需要加强练习！' };
    return { text: '加油', color: '#f44336', emoji: '💪', description: '别灰心，多练习会进步的！' };
  };

  const grade = getGrade(accuracy);

  // 获取错题列表
  const wrongQuestions = questions.filter(q => answers[q.id] !== q.correct);

  // 获取数据源名称
  const getDataSourceName = () => {
    const names = {
      'default': '默认题库',
      '中考': '中考真题库',
      '高考': '高考真题库',
      '专项': '语法专项库'
    };
    return names[dataSource] || dataSource;
  };

  // 获取抽取类型文本
  const getDrawTypeText = (type) => {
    const map = {
      'smart': '智能推荐',
      'weak': '薄弱题专项',
      'new': '新题练习',
      'review': '复习题',
      'mastered': '已掌握题巩固',
      'custom': '自定义范围'
    };
    return map[type] || type;
  };

  // 获取抽取类型图标
  const getDrawTypeIcon = (type) => {
    const map = {
      'smart': <Psychology sx={{ fontSize: 20 }} />,
      'weak': <Warning sx={{ fontSize: 20 }} />,
      'new': <Star sx={{ fontSize: 20 }} />,
      'review': <Refresh sx={{ fontSize: 20 }} />,
      'mastered': <EmojiEvents sx={{ fontSize: 20 }} />,
      'custom': <Category sx={{ fontSize: 20 }} />
    };
    return map[type] || <Info sx={{ fontSize: 20 }} />;
  };

  // 处理换一批按钮点击
  const handleNewBatchClick = () => {
    // 如果是自定义模式，传递 'custom'，否则传递当前模式
    if (drawType === 'custom') {
      onNewBatch('custom');
    } else {
      onNewBatch(drawType);
    }
  };

  // 处理重新挑战按钮点击
  const handleRestartClick = () => {
    onRestart();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* 返回按钮 */}
      <Button 
        startIcon={<ArrowBack />} 
        onClick={onBack} 
        sx={{ mb: 2 }}
        variant="text"
        color="primary"
      >
        返回练习
      </Button>

      {/* 主成绩卡片 */}
      <Paper elevation={8} sx={{ p: 4, borderRadius: 4, border: `4px solid ${grade.color}`, mb: 3 }}>
        {/* 标题区域 */}
        <Typography variant="h5" sx={{ fontWeight: '900', textAlign: 'center', color: '#1a237e', mb: 0.5 }}>
          📝 测试完成
        </Typography>
        
        {/* 日期和时间 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip 
            icon={<CalendarToday />} 
            label={dateTime.full} 
            size="small" 
            variant="outlined"
            sx={{ bgcolor: '#f5f5f5' }}
          />
        </Box>

        {/* 测试信息卡片 - 如果是自定义范围，显示范围信息 */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd', borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <School fontSize="inherit" /> 题库
              </Typography>
              <Typography variant="body2" fontWeight="bold">{getDataSourceName()}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getDrawTypeIcon(drawType)} 模式
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {getDrawTypeText(drawType)}
                {drawType === 'custom' && (
                  <Chip 
                    label={`第 ${startRange}-${endRange} 题`}
                    size="small"
                    color="secondary"
                    sx={{ ml: 1, fontSize: '0.7rem' }}
                  />
                )}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Category fontSize="inherit" /> 题量
              </Typography>
              <Typography variant="body2" fontWeight="bold">{totalQuestions}题</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Timer fontSize="inherit" /> 用时
              </Typography>
              <Typography variant="body2" fontWeight="bold">{formatTime(timeSpent)}</Typography>
            </Grid>
          </Grid>
          
          {/* 自定义范围详细信息 */}
          {drawType === 'custom' && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #90caf9' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Info fontSize="inherit" /> 本次练习题目范围
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                第 {startRange} 题 至 第 {endRange} 题
              </Typography>
            </Box>
          )}
        </Paper>

        {/* 核心成绩区域 */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 3, 
            mb: 3,
            flexWrap: 'wrap'
          }}>
            <Box sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              backgroundColor: `${grade.color}15`,
              border: `6px solid ${grade.color}`, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography variant="h2" sx={{ fontWeight: '900', color: grade.color, lineHeight: 1, fontSize: '3rem' }}>
                {accuracy}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>得分率</Typography>
            </Box>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="h4" sx={{ fontWeight: '900', color: grade.color, mb: 0.5 }}>
                {grade.emoji} {grade.text}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                正确: {correctCount}/{totalQuestions}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                平均每题: {avgTimePerQuestion}秒
              </Typography>
            </Box>
          </Box>

          {/* 核心数据网格 */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Tooltip title="本次答对的题目数量">
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9', borderRadius: 3, border: '2px solid #4caf50' }}>
                  <CheckCircle sx={{ color: '#4caf50', fontSize: 28, mb: 0.5 }} />
                  <Typography variant="h5" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>{correctCount}</Typography>
                  <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>正确</Typography>
                </Paper>
              </Tooltip>
            </Grid>
            <Grid item xs={4}>
              <Tooltip title="本次答错的题目数量">
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee', borderRadius: 3, border: '2px solid #f44336' }}>
                  <Cancel sx={{ color: '#f44336', fontSize: 28, mb: 0.5 }} />
                  <Typography variant="h5" sx={{ color: '#c62828', fontWeight: 'bold' }}>{wrongCount}</Typography>
                  <Typography variant="caption" sx={{ color: '#c62828', fontWeight: 600 }}>错误</Typography>
                </Paper>
              </Tooltip>
            </Grid>
            <Grid item xs={4}>
              <Tooltip title="总用时 / 平均每题用时">
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd', borderRadius: 3, border: '2px solid #2196f3' }}>
                  <Timer sx={{ color: '#2196f3', fontSize: 28, mb: 0.5 }} />
                  <Typography variant="h5" sx={{ color: '#1565c0', fontWeight: 'bold' }}>{formatTime(timeSpent)}</Typography>
                  <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600 }}>用时</Typography>
                </Paper>
              </Tooltip>
            </Grid>
          </Grid>

          {/* 进度条 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">正确率</Typography>
              <Typography variant="body2" fontWeight="bold">{accuracy}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={accuracy} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: '#ffebee',
                '& .MuiLinearProgress-bar': {
                  bgcolor: accuracy >= 60 ? '#4caf50' : '#f44336'
                }
              }} 
            />
          </Box>
        </Box>

        {/* 服务器统计信息 */}
        {serverStats && Object.keys(serverStats).length > 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#e8eaf6', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <History /> 历史学习统计
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">总练习次数</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {serverStats.totalAttempts || serverStats.total_attempts || 0}次
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">历史正确率</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {Math.round((serverStats.accuracy || serverStats.total_accuracy || 0) * 100)}%
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">薄弱题数量</Typography>
                <Typography variant="body2" fontWeight="bold" color="error">
                  {serverStats.weakCount || serverStats.weak_count || 0}题
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* 错题列表 */}
        {wrongQuestions.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff3e0', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warning color="error" /> 错题本 ({wrongQuestions.length})
            </Typography>
            <Stack spacing={1.5}>
              {wrongQuestions.slice(0, 5).map((q, idx) => (
                <Box key={q.id} sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    {idx + 1}. {q.question.length > 50 ? q.question.substring(0, 50) + '...' : q.question}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`你的答案: ${answers[q.id]}`} 
                      size="small" 
                      color="error" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`正确答案: ${q.correct}`} 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                    {q.category && (
                      <Chip 
                        label={q.category} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              ))}
              {wrongQuestions.length > 5 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  还有 {wrongQuestions.length - 5} 道错题
                </Alert>
              )}
            </Stack>
          </Paper>
        )}

        {/* 操作按钮 */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button 
            fullWidth 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={handleRestartClick}
          >
            重新挑战 ({getDrawTypeText(drawType)})
          </Button>
          <Button 
            fullWidth 
            variant="contained" 
            startIcon={<Shuffle />} 
            onClick={handleNewBatchClick}
          >
            {drawType === 'custom' ? '重新选择范围' : `换一批 (${questionCount}题)`}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default SingleChoiceResult;