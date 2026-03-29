import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  MobileStepper,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Lock as LockIcon,
  Lightbulb as LightbulbIcon,
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  EmojiEvents as EmojiEventsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

const CToETestView = ({
  questions,
  currentIndex,
  currentQuestion,
  isConfirmed,
  answers,
  confirmedAnswers,
  showExplanation,
  inputValue,
  inputRefs,
  focusedBlankIndex,
  practiceStats,
  progress,
  isFullscreen,
  onSetInputValue,
  onSetAnswers,
  onSetFocusedBlankIndex,
  onConfirm,
  onModify,
  onPrev,
  onNext,
  onSetCurrentIndex,
  onSubmit,
  onToggleFullscreen,
  checkBlankAnswer,
  checkAnswer,
  loading,
  bank,
  onSetShowExplanation
}) => {
  if (questions.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>暂无题目</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          点击"抽取题目"按钮开始练习
        </Typography>
      </Paper>
    );
  }

  // 构建提交数据
  const handleSubmitClick = () => {
    const questionIds = questions.map(q => q.id);
    
    // 直接使用 answers 中存储的原始数据
    const answerValues = questions.map(q => {
      const userAnswer = answers[q.id];
      
      // 多空题：直接返回数组
      if (q.type === 'multi' && q.blanks) {
        // 确保返回数组格式
        if (Array.isArray(userAnswer)) {
          return userAnswer;
        }
        // 如果没有答案，返回空数组
        return new Array(q.blanks.length).fill('');
      }
      
      // 单空题：返回字符串
      return userAnswer || '';
    });
    
    console.log('提交数据:', {
      questionIds,
      answers: answerValues,
      bank
    });
    
    onSubmit({
      questionIds,
      answers: answerValues,
      timeSpent: 0,
      bank
    });
  };

  return (
    <Box>
      {/* 头部信息 */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 2, 
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            中译英练习
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`${practiceStats.answered}/${practiceStats.total}`} 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} 
            />
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏模式"}>
              <IconButton 
                size="small" 
                onClick={onToggleFullscreen}
                sx={{ color: 'white' }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* 进度条 */}
        <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 4, mb: 1 }}>
          <Box 
            sx={{ 
              width: `${progress}%`, 
              height: 8, 
              background: 'linear-gradient(90deg, #ffd700 0%, #ffb300 100%)',
              borderRadius: 4,
              transition: 'width 0.3s ease'
            }} 
          />
        </Box>

        {/* 统计信息 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} /> 正确: {practiceStats.correct}
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CancelIcon sx={{ fontSize: 16, color: '#f44336' }} /> 错误: {practiceStats.wrong}
            </Typography>
          </Box>
          {practiceStats.answered > 0 && (
            <Chip
              size="small"
              icon={<EmojiEventsIcon />}
              label={`正确率 ${practiceStats.accuracy}%`}
              sx={{ 
                bgcolor: practiceStats.accuracy >= 80 ? '#4caf50' : practiceStats.accuracy >= 60 ? '#ff9800' : '#f44336',
                color: 'white',
                fontWeight: 600
              }}
            />
          )}
        </Box>
      </Paper>

      {/* 题目进度指示器 */}
      <Box sx={{ mb: 2 }}>
        <MobileStepper
          variant="progress"
          steps={practiceStats.total}
          position="static"
          activeStep={currentIndex}
          sx={{ 
            maxWidth: '100%', 
            flexGrow: 1,
            bgcolor: 'transparent',
            '& .MuiMobileStepper-progress': {
              width: '100%',
              height: 8,
              borderRadius: 4
            }
          }}
          nextButton={<Box />}
          backButton={<Box />}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
          第 {currentIndex + 1} 题 / 共 {practiceStats.total} 题
        </Typography>
      </Box>

      {/* 当前题目 */}
      {currentQuestion && (
        <Zoom in={true}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mb: 2,
              border: isConfirmed ? '2px solid' : 'none',
              borderColor: isConfirmed ? (
                checkAnswer(currentQuestion, answers[currentQuestion.id]) 
                  ? '#4caf50' 
                  : '#f44336'
              ) : '#1a237e',
              transition: 'all 0.3s ease'
            }}
          >
            {/* 题目头部 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {isConfirmed && (
                  <Chip 
                    icon={<LockIcon />} 
                    label="已锁定" 
                    size="small" 
                    color={checkAnswer(currentQuestion, answers[currentQuestion.id]) ? 'success' : 'error'}
                    onDelete={() => onModify(currentQuestion.id)}
                  />
                )}
                {currentQuestion.category && (
                  <Chip 
                    label={currentQuestion.category} 
                    size="small" 
                    variant="outlined"
                  />
                )}
                {currentQuestion.difficulty && (
                  <Chip 
                    label={`难度 ${currentQuestion.difficulty}级`} 
                    size="small" 
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Box>
                <Tooltip title={showExplanation[currentQuestion.id] ? "隐藏解析" : "显示解析"}>
                  <IconButton 
                    size="small" 
                    onClick={() => onSetShowExplanation(prev => ({ 
                      ...prev, 
                      [currentQuestion.id]: !prev[currentQuestion.id] 
                    }))}
                    color={showExplanation[currentQuestion.id] ? "warning" : "default"}
                    disabled={!isConfirmed}
                  >
                    <LightbulbIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* 中文句子 */}
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: '#1a237e' }}>
              {currentQuestion.chinese}
            </Typography>

            {/* 英文句子 */}
            <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              {currentQuestion.english}
            </Typography>

            {/* 输入区域 - 根据题目类型动态显示 */}
            <Box sx={{ mb: 2 }}>
              {currentQuestion.type === 'multi' && currentQuestion.blanks ? (
                // 多空题：显示多个输入框
                <Stack spacing={2}>
                  {currentQuestion.blanks.map((blank, index) => {
                    const blankNumber = index + 1;
                    const blankAnswer = Array.isArray(answers[currentQuestion.id]) 
                      ? answers[currentQuestion.id]?.[index] || '' 
                      : '';
                    
                    return (
                      <Box key={index}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                          空 {blankNumber}:
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          placeholder={`请输入第 ${blankNumber} 空的答案...`}
                          value={isConfirmed 
                            ? blankAnswer
                            : (Array.isArray(inputValue) ? inputValue[index] || '' : '')}
                          onChange={(e) => {
                            if (!isConfirmed) {
                              const newValues = Array.isArray(inputValue) ? [...inputValue] : new Array(currentQuestion.blanks.length).fill('');
                              newValues[index] = e.target.value;
                              onSetInputValue(newValues);
                              
                              const newAnswers = Array.isArray(answers[currentQuestion.id]) 
                                ? [...answers[currentQuestion.id]] 
                                : new Array(currentQuestion.blanks.length).fill('');
                              newAnswers[index] = e.target.value;
                              onSetAnswers(prev => ({
                                ...prev,
                                [currentQuestion.id]: newAnswers
                              }));
                            }
                          }}
                          disabled={isConfirmed}
                          size="medium"
                          inputRef={el => inputRefs.current[index] = el}
                          onFocus={() => onSetFocusedBlankIndex(index)}
                          InputProps={{
                            sx: {
                              bgcolor: isConfirmed ? '#f5f5f5' : '#fff',
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: isConfirmed ? (
                                    checkBlankAnswer(currentQuestion, index, blankAnswer)
                                      ? '#4caf50'
                                      : '#f44336'
                                  ) : '#1a237e',
                                  borderWidth: isConfirmed ? 2 : 1
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                  
                  {/* 多空题的确认按钮 */}
                  {!isConfirmed && (
                    <Button
                      variant="contained"
                      onClick={onConfirm}
                      color="primary"
                      size="large"
                      startIcon={<SendIcon />}
                      sx={{ mt: 1, borderRadius: 20 }}
                    >
                      确认所有答案
                    </Button>
                  )}
                </Stack>
              ) : (
                // 单空题：显示一个输入框
                <TextField
                  inputRef={el => inputRefs.current[0] = el}
                  fullWidth
                  variant="outlined"
                  placeholder="请输入英文翻译..."
                  value={isConfirmed ? (answers[currentQuestion.id] || '') : inputValue}
                  onChange={(e) => {
                    if (!isConfirmed) {
                      onSetInputValue(e.target.value);
                      onSetAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }));
                    }
                  }}
                  disabled={isConfirmed}
                  size="medium"
                  InputProps={{
                    endAdornment: !isConfirmed && (
                      <Button
                        variant="contained"
                        onClick={onConfirm}
                        color="primary"
                        size="small"
                        startIcon={<SendIcon />}
                        sx={{ minWidth: 80, borderRadius: 20 }}
                      >
                        确认
                      </Button>
                    ),
                    sx: {
                      bgcolor: isConfirmed ? '#f5f5f5' : '#fff',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: isConfirmed ? (
                            checkAnswer(currentQuestion, answers[currentQuestion.id])
                              ? '#4caf50'
                              : '#f44336'
                          ) : '#1a237e',
                          borderWidth: isConfirmed ? 2 : 1
                        }
                      }
                    }
                  }}
                />
              )}
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
              {!isConfirmed 
                ? (currentQuestion.type === 'multi' ? '请填写所有空格后点击确认按钮' : '↵ 回车确认答案')
                : (currentIndex < questions.length - 1 ? '↵ 回车进入下一题' : '已是最后一题')}
            </Typography>

            {/* 解析 */}
            {isConfirmed && showExplanation[currentQuestion.id] && currentQuestion.explanation && (
              <Paper 
                variant="outlined" 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: checkAnswer(currentQuestion, answers[currentQuestion.id]) ? '#d4edda' : '#fff3cd',
                  borderColor: checkAnswer(currentQuestion, answers[currentQuestion.id]) ? '#28a745' : '#ffc107',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a237e' }}>
                    答案解析
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => onSetShowExplanation(prev => ({ 
                      ...prev, 
                      [currentQuestion.id]: false 
                    }))}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {currentQuestion.explanation}
                </Typography>

                {/* 多空题显示每个空的正确答案 */}
                {currentQuestion.type === 'multi' && currentQuestion.blanks && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      各空正确答案：
                    </Typography>
                    {currentQuestion.blanks.map((blank, idx) => (
                      <Typography key={idx} variant="body2">
                        空 {idx + 1}: {blank.correctForms.join(' 或 ')}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Paper>
            )}

            {/* 正确答案提示（如果没有解析但有正确答案） */}
            {isConfirmed && !showExplanation[currentQuestion.id] && currentQuestion.correctForm && (
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  正确答案: <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{currentQuestion.correctForm}</span>
                </Typography>
              </Box>
            )}
          </Paper>
        </Zoom>
      )}

      {/* 底部导航 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onPrev}
          disabled={currentIndex === 0}
          startIcon={<NavigateBeforeIcon />}
          size="large"
          sx={{ py: 1.5, borderColor: '#1a237e', color: '#1a237e' }}
        >
          上一题
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={onNext}
          disabled={currentIndex === questions.length - 1}
          endIcon={<NavigateNextIcon />}
          size="large"
          sx={{ py: 1.5, borderColor: '#1a237e', color: '#1a237e' }}
        >
          下一题
        </Button>
      </Box>

      {/* 题目快速导航 */}
      {questions.length > 5 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 2 }}>
          {questions.map((q, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = !!confirmedAnswers[q.id];
            const isCorrect = isAnswered && checkAnswer(q, answers[q.id]);
            
            return (
              <Tooltip key={q.id} title={`第 ${index + 1} 题 - ${isAnswered ? (isCorrect ? '正确' : '错误') : '未答'}`}>
                <Button
                  size="small"
                  variant={isCurrent ? "contained" : "outlined"}
                  onClick={() => onSetCurrentIndex(index)}
                  sx={{
                    minWidth: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: isCurrent ? '#1a237e' : isAnswered ? (isCorrect ? '#4caf50' : '#f44336') : 'transparent',
                    color: isCurrent ? 'white' : isAnswered ? 'white' : '#1a237e',
                    borderColor: '#1a237e',
                    '&:hover': {
                      bgcolor: isCurrent ? '#283593' : (isAnswered ? (isCorrect ? '#388e3c' : '#d32f2f') : 'rgba(26,35,126,0.1)')
                    }
                  }}
                >
                  {index + 1}
                </Button>
              </Tooltip>
            );
          })}
        </Box>
      )}

      {/* 提交按钮 */}
      {practiceStats.answered === practiceStats.total && practiceStats.total > 0 && (
        <Fade in={practiceStats.answered === practiceStats.total}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            onClick={handleSubmitClick}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <EmojiEventsIcon />}
            sx={{ 
              py: 1.5, 
              fontSize: '1rem', 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #2e7d32 30%, #388e3c 90%)'
            }}
          >
            {loading ? '提交中...' : `提交答案 (正确率 ${practiceStats.accuracy}%)`}
          </Button>
        </Fade>
      )}
    </Box>
  );
};

export default CToETestView;