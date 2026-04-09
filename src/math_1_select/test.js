// src/math_1_select/test.js
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Divider,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { mathApi } from './api';

const SingleChoiceTest = ({ dataSource, questions, drawType, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [answeredStatus, setAnsweredStatus] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // 计时器状态
  const [elapsedTime, setElapsedTime] = useState(0); // 以秒为单位
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const isAllAnswered = answeredCount === totalQuestions;

  const currentQuestion = useMemo(() => {
    return questions[currentIndex];
  }, [questions, currentIndex]);

  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // 格式化时间显示
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 启动计时器
  useEffect(() => {
    // 如果显示结果，停止计时
    if (showResults) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 启动计时器
    startTimeRef.current = Date.now() - (elapsedTime * 1000);
    
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showResults]); // 只在 showResults 变化时重新设置计时器

  // 辅助函数：根据文字内容获取选项标签
  const getLabelByText = useCallback((options, text) => {
    const index = options.findIndex(opt => opt === text);
    return index !== -1 ? String.fromCharCode(65 + index) : null;
  }, []);

  // 获取选项标签
  const getOptionLabel = useCallback((index) => {
    return String.fromCharCode(65 + index);
  }, []);

  // ========== 关键修复：正确比较答案 ==========
  const handleAnswerSelect = useCallback((questionId, selectedLabel) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    // 将选项标签 (A/B/C/D) 转换为实际文字内容
    const selectedIndex = selectedLabel.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1
    const selectedText = question.options[selectedIndex];
    
    // 比较文字内容
    const isCorrect = selectedText === question.correct;
    
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: selectedLabel  // 存储用户选择的标签
    }));
    
    setAnsweredStatus(prev => ({
      ...prev,
      [questionId]: {
        selectedLabel,
        selectedText,
        isCorrect,
        correctAnswer: question.correct,
        correctLabel: getLabelByText(question.options, question.correct),
        explanation: question.explanation,
        questionText: question.question
      }
    }));
    
    setShowFeedback(true);
  }, [questions, getLabelByText]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // ========== 修改：关闭反馈并自动跳转下一题 ==========
  const closeFeedbackAndNext = useCallback(() => {
    setShowFeedback(false);
    
    // 如果不是最后一题，自动跳转到下一题
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handleSubmitTest = useCallback(async () => {
    if (!isAllAnswered) {
      alert(`还有 ${totalQuestions - answeredCount} 题未作答，请完成所有题目后再提交。`);
      return;
    }

    // 停止计时
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsSubmitting(true);
    
    try {
      let correctCount = 0;
      const results = questions.map(q => {
        const userLabel = userAnswers[q.id];
        const userIndex = userLabel ? userLabel.charCodeAt(0) - 65 : -1;
        const userText = userIndex >= 0 ? q.options[userIndex] : '未作答';
        const isCorrect = userText === q.correct;
        if (isCorrect) correctCount++;
        
        return {
          questionId: q.id,
          userAnswer: userLabel || '未作答',
          userAnswerText: userText,
          correctAnswer: q.correct,
          correctLabel: getLabelByText(q.options, q.correct),
          isCorrect,
          question: q.question,
          explanation: q.explanation
        };
      });

      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      const testData = {
        dataSource,
        drawType,
        questions: questions.map(q => q.id),
        userAnswers,
        correctAnswers: questions.reduce((acc, q) => {
          acc[q.id] = q.correct;
          return acc;
        }, {}),
        score,
        correctCount,
        totalQuestions,
        elapsedTime, // 添加练习时长
        formattedTime: formatTime(elapsedTime), // 格式化的时间
        timestamp: new Date().toISOString()
      };

      let serverResponse = null;
      try {
        const response = await mathApi.submitTestResult(testData);
        serverResponse = response;
      } catch (apiError) {
        console.error('API提交失败:', apiError);
      }
      
      setTestResults({
        score,
        correctCount,
        totalQuestions,
        results,
        elapsedTime, // 添加时间到结果中
        formattedTime: formatTime(elapsedTime),
        serverResponse
      });
      setShowResults(true);
    } catch (error) {
      console.error('处理测试结果失败:', error);
      
      let correctCount = 0;
      const results = questions.map(q => {
        const userLabel = userAnswers[q.id];
        const userIndex = userLabel ? userLabel.charCodeAt(0) - 65 : -1;
        const userText = userIndex >= 0 ? q.options[userIndex] : '未作答';
        const isCorrect = userText === q.correct;
        if (isCorrect) correctCount++;
        
        return {
          questionId: q.id,
          userAnswer: userLabel || '未作答',
          userAnswerText: userText,
          correctAnswer: q.correct,
          correctLabel: getLabelByText(q.options, q.correct),
          isCorrect,
          question: q.question,
          explanation: q.explanation
        };
      });

      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      setTestResults({
        score,
        correctCount,
        totalQuestions,
        results,
        elapsedTime,
        formattedTime: formatTime(elapsedTime),
        serverResponse: null
      });
      setShowResults(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [questions, userAnswers, isAllAnswered, totalQuestions, answeredCount, dataSource, drawType, getLabelByText, elapsedTime, formatTime]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setUserAnswers({});
    setAnsweredStatus({});
    setShowResults(false);
    setTestResults(null);
    setShowFeedback(false);
    setElapsedTime(0); // 重置时间
    startTimeRef.current = null;
  }, []);

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // 获取选项样式
  const getOptionStyle = useCallback((optionLabel, isAnswered, isUserSelected, isCorrectOption) => {
    if (!isAnswered) {
      return {
        borderColor: isUserSelected ? '#999' : '#e0e0e0',
        bgColor: isUserSelected ? '#f5f5f5' : '#fff',
        textColor: '#333',
        showMark: false,
        markIcon: null,
        disabled: false
      };
    }

    if (isCorrectOption) {
      return {
        borderColor: '#4CAF50',
        bgColor: '#e8f5e9',
        textColor: '#2e7d32',
        showMark: true,
        markIcon: <CheckCircleIcon sx={{ fontSize: 16, color: '#4CAF50', ml: 1 }} />,
        disabled: true
      };
    }

    if (isUserSelected && !isCorrectOption) {
      return {
        borderColor: '#f44336',
        bgColor: '#ffebee',
        textColor: '#c62828',
        showMark: true,
        markIcon: <CancelIcon sx={{ fontSize: 16, color: '#f44336', ml: 1 }} />,
        disabled: true
      };
    }

    return {
      borderColor: '#e0e0e0',
      bgColor: '#fff',
      textColor: '#666',
      showMark: false,
      markIcon: null,
      disabled: true
    };
  }, []);

  // 渲染结果页面
  if (showResults && testResults) {
    const wrongQuestions = testResults.results.filter(r => !r.isCorrect);
    
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
            测试完成
          </Typography>
          
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold',
              color: testResults.score >= 60 ? '#4CAF50' : '#f44336',
              mb: 1
            }}>
              {testResults.score}分
            </Typography>
            <Typography variant="body1" color="text.secondary">
              正确 {testResults.correctCount}/{testResults.totalQuestions} 题
            </Typography>
            {/* 显示练习时长 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 1,
              mt: 2,
              p: 1.5,
              bgcolor: '#f5f5f5',
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}>
              <TimerIcon sx={{ color: '#666', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                练习时长: <span style={{ fontWeight: 'bold', color: '#333' }}>{testResults.formattedTime}</span>
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mb: 2 }}>
            错题详情
          </Typography>
          
          <Box sx={{ maxHeight: 400, overflow: 'auto', mb: 3 }}>
            {wrongQuestions.length > 0 ? (
              wrongQuestions.map((result, idx) => (
                <Box 
                  key={result.questionId} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    borderRadius: 1, 
                    border: '1px solid #ffcdd2',
                    bgcolor: '#ffebee'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      错题 {idx + 1}
                    </Typography>
                    <Chip 
                      label="错误" 
                      size="small" 
                      sx={{ bgcolor: '#f44336', color: '#fff', fontSize: '11px', height: 22 }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {result.question}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      你的答案: {result.userAnswer}. {result.userAnswerText}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 'medium' }}>
                      正确答案: {result.correctLabel}. {result.correctAnswer}
                    </Typography>
                  </Box>
                  
                  {result.explanation && (
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 1, 
                      bgcolor: '#fff',
                      border: '1px solid #e0e0e0',
                      mt: 1
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                        解析:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.explanation}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  🎉 恭喜！本次测试没有错题 🎉
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleRestart}
              sx={{ color: '#333', borderColor: '#ccc', '&:hover': { borderColor: '#666' } }}
            >
              重新测试
            </Button>
            <Button
              variant="outlined"
              onClick={handleComplete}
              sx={{ color: '#333', borderColor: '#333', '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              返回题库
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          暂无题目
        </Typography>
      </Box>
    );
  }

  const currentAnswered = answeredStatus[currentQuestion?.id];
  const isCurrentAnswered = !!currentAnswered;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            第 {currentIndex + 1} / {totalQuestions} 题
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 计时器显示 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              bgcolor: '#f5f5f5',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}>
              <TimerIcon sx={{ fontSize: 16, color: '#666' }} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'medium', color: '#333' }}>
                {formatTime(elapsedTime)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              已作答: {answeredCount}/{totalQuestions}
            </Typography>
          </Box>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 4, 
            borderRadius: 2,
            backgroundColor: '#f0f0f0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#666'
            }
          }}
        />
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
          {currentQuestion.question}
        </Typography>

        <RadioGroup
          value={userAnswers[currentQuestion.id] || ''}
          onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
        >
          {currentQuestion.options && currentQuestion.options.map((optionText, idx) => {
            const optionLabel = getOptionLabel(idx);
            const isUserSelected = userAnswers[currentQuestion.id] === optionLabel;
            // 修复：比较文字内容而不是标签
            const isCorrectOption = optionText === currentQuestion.correct;
            const isAnswered = !!answeredStatus[currentQuestion.id];
            
            const { borderColor, bgColor, textColor, showMark, markIcon, disabled } = 
              getOptionStyle(optionLabel, isAnswered, isUserSelected, isCorrectOption);
            
            return (
              <FormControlLabel
                key={idx}
                value={optionLabel}
                control={
                  <Radio 
                    sx={{ 
                      color: '#999',
                      '&.Mui-checked': {
                        color: isAnswered && isCorrectOption ? '#4CAF50' : 
                               (isAnswered && isUserSelected && !isCorrectOption ? '#f44336' : '#333')
                      }
                    }} 
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: textColor }}>
                      {optionLabel}. {optionText}
                    </Typography>
                    {showMark && markIcon}
                    {isAnswered && isCorrectOption && !isUserSelected && (
                      <Typography variant="caption" sx={{ color: '#4CAF50', ml: 0.5 }}>
                        (正确答案)
                      </Typography>
                    )}
                  </Box>
                }
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  border: `2px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  transition: 'all 0.2s ease',
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.95 : 1,
                  '&:hover': disabled ? {} : {
                    backgroundColor: '#fafafa',
                    borderColor: '#999'
                  }
                }}
                disabled={disabled}
              />
            );
          })}
        </RadioGroup>
      </Paper>

      {/* 反馈弹窗 - 点击后自动关闭并跳转下一题 */}
      {showFeedback && currentAnswered && (
        <Box
          onClick={closeFeedbackAndNext}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: 'relative',
              zIndex: 9999,
              animation: 'fadeIn 0.3s ease-in-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(-20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 3,
                borderRadius: 2,
                minWidth: 320,
                maxWidth: 450,
                border: `2px solid ${currentAnswered.isCorrect ? '#4CAF50' : '#f44336'}`,
                backgroundColor: 'white',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                {currentAnswered.isCorrect ? (
                  <CheckCircleIcon sx={{ fontSize: 48, color: '#4CAF50', mb: 1 }} />
                ) : (
                  <CancelIcon sx={{ fontSize: 48, color: '#f44336', mb: 1 }} />
                )}
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: currentAnswered.isCorrect ? '#4CAF50' : '#f44336'
                  }}
                >
                  {currentAnswered.isCorrect ? '回答正确！' : '回答错误'}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  你的答案: {currentAnswered.selectedLabel}. {currentAnswered.selectedText}
                </Typography>
                
                {!currentAnswered.isCorrect && (
                  <Typography variant="body2" sx={{ mb: 1, color: '#4CAF50', fontWeight: 'medium' }}>
                    正确答案: {currentAnswered.correctLabel}. {currentAnswered.correctAnswer}
                  </Typography>
                )}
              </Box>
              
              {currentAnswered.explanation && (
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 1, 
                  bgcolor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  mb: 2
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                    解析:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentAnswered.explanation}
                  </Typography>
                </Box>
              )}
              
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  display: 'block',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}
              >
                点击任意地方继续下一题
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handlePrev}
          disabled={currentIndex === 0}
          sx={{ color: '#333', borderColor: '#ccc', '&:hover': { borderColor: '#666' } }}
        >
          上一题
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {currentIndex === totalQuestions - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmitTest}
              disabled={isSubmitting || !isAllAnswered}
              sx={{ 
                bgcolor: isAllAnswered ? '#333' : '#ccc', 
                color: '#fff', 
                '&:hover': { bgcolor: isAllAnswered ? '#555' : '#ccc' } 
              }}
            >
              {isSubmitting ? '提交中...' : '提交测试'}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              sx={{ 
                bgcolor: isCurrentAnswered ? '#333' : '#ccc', 
                color: '#fff', 
                '&:hover': { bgcolor: isCurrentAnswered ? '#555' : '#ccc' } 
              }}
            >
              下一题
            </Button>
          )}
        </Box>
      </Box>

      {!isAllAnswered && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #eee' }}>
          <Typography variant="body2" color="text.secondary">
            还有 {totalQuestions - answeredCount} 题未作答
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SingleChoiceTest;