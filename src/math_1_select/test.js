// src/math_1_select/test.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  IconButton,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { mathApi } from './api';

const SingleChoiceTest = ({ dataSource, questions, drawType, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState({}); // 记录已回答的题目
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImmediateFeedback, setShowImmediateFeedback] = useState(false); // 即时反馈显示

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handleAnswerSelect = (questionId, answer) => {
    const currentQuestion = questions.find(q => q.id === questionId);
    const isCorrect = answer === currentQuestion?.answer;
    
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    setAnsweredQuestions(prev => ({
      ...prev,
      [questionId]: {
        answer,
        isCorrect,
        correctAnswer: currentQuestion?.answer,
        explanation: currentQuestion?.explanation,
        timestamp: new Date().toISOString()
      }
    }));
    
    // 显示即时反馈（即使更改答案也显示）
    setShowImmediateFeedback(true);
    
    // 不再自动隐藏反馈，用户需要手动点击关闭
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setShowImmediateFeedback(false); // 切换题目时关闭反馈
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setShowImmediateFeedback(false); // 切换题目时关闭反馈
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    try {
      // 计算得分
      let correctCount = 0;
      const results = questions.map(q => {
        const userAnswer = userAnswers[q.id];
        const isCorrect = userAnswer === q.answer;
        if (isCorrect) correctCount++;
        
        return {
          questionId: q.id,
          userAnswer,
          correctAnswer: q.answer,
          isCorrect,
          question: q.question,
          explanation: q.explanation
        };
      });

      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      // 提交结果到服务器
      const testData = {
        dataSource,
        drawType,
        questions: questions.map(q => q.id),
        userAnswers,
        // 添加正确答案映射
        correctAnswers: questions.reduce((acc, q) => {
          acc[q.id] = q.answer;
          return acc;
        }, {}),
        score,
        correctCount,
        totalQuestions,
        timestamp: new Date().toISOString()
      };

      const response = await mathApi.submitTestResult(testData);
      
      setTestResults({
        score,
        correctCount,
        totalQuestions,
        results,
        serverResponse: response
      });
      setShowResults(true);
    } catch (error) {
      console.error('提交测试结果失败:', error);
      // 即使提交失败也显示本地结果
      let correctCount = 0;
      const results = questions.map(q => {
        const userAnswer = userAnswers[q.id];
        const isCorrect = userAnswer === q.answer;
        if (isCorrect) correctCount++;
        
        return {
          questionId: q.id,
          userAnswer,
          correctAnswer: q.answer,
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
        serverResponse: null
      });
      setShowResults(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setTestResults(null);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  if (showResults && testResults) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
            测试完成
          </Typography>
          
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold',
              color: '#000',
              mb: 1
            }}>
              {testResults.score}分
            </Typography>
            <Typography variant="body1" color="text.secondary">
              正确 {testResults.correctCount}/{testResults.totalQuestions} 题
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mb: 2 }}>
            错题详情
          </Typography>
          
          <Box sx={{ maxHeight: 400, overflow: 'auto', mb: 3 }}>
            {testResults.results
              .filter(result => !result.isCorrect) // 只显示错误的题目
              .map((result, idx) => (
                <Box 
                  key={result.questionId} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    borderRadius: 1, 
                    border: '1px solid #e0e0e0',
                    bgcolor: '#fafafa'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      错题 {idx + 1}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      fontWeight: 'medium'
                    }}>
                      错误
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {result.question}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      你的答案: {result.userAnswer ? `选项 ${result.userAnswer}` : '未作答'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      正确答案: 选项 {result.correctAnswer || '未知'}
                    </Typography>
                  </Box>
                  
                  {result.explanation && (
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 1, 
                      bgcolor: '#f5f5f5',
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
              ))}
            
            {/* 如果没有错题，显示提示信息 */}
            {testResults.results.filter(result => !result.isCorrect).length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  恭喜！本次测试没有错题
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

  if (!currentQuestion) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          暂无题目
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* 简洁进度条和题号 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            第 {currentIndex + 1} / {totalQuestions} 题
          </Typography>
          <Typography variant="body2" color="text.secondary">
            已作答: {Object.keys(userAnswers).length}/{totalQuestions}
          </Typography>
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

      {/* 简洁题目卡片 */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
          {currentQuestion.question}
        </Typography>

        <RadioGroup
          value={userAnswers[currentQuestion.id] || ''}
          onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
        >
          {currentQuestion.options && currentQuestion.options.map((option, idx) => {
            // 处理选项格式：可能是字符串或对象
            const optionLabel = option.label || String.fromCharCode(65 + idx);
            const optionText = option.text || option;
            
            // 检查这个选项是否是正确答案
            const isCorrectAnswer = optionLabel === currentQuestion.answer;
            // 检查用户是否选择了这个选项
            const isUserSelected = userAnswers[currentQuestion.id] === optionLabel;
            // 检查这个题目是否已经回答过
            const isAnswered = answeredQuestions[currentQuestion.id];
            
            // 简洁样式 - 黑白模式
            let borderColor = '#ddd';
            let bgColor = 'transparent';
            
            if (isUserSelected) {
              if (isAnswered && isAnswered.isCorrect) {
                borderColor = '#333';
                bgColor = '#f5f5f5';
              } else if (isAnswered && !isAnswered.isCorrect) {
                borderColor = '#999';
                bgColor = '#f9f9f9';
              } else {
                borderColor = '#333';
                bgColor = '#f5f5f5';
              }
            } else if (isAnswered && isCorrectAnswer) {
              // 如果题目已回答过，且这个选项是正确答案
              borderColor = '#333';
              bgColor = '#f5f5f5';
            }
            
            return (
              <FormControlLabel
                key={idx}
                value={optionLabel}
                control={<Radio sx={{ color: '#333' }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 'medium',
                      color: isCorrectAnswer && isAnswered ? '#000' : '#333'
                    }}>
                      {optionLabel}. {optionText}
                    </Typography>
                    {isCorrectAnswer && isAnswered && (
                      <Typography variant="caption" sx={{ ml: 1, color: '#666' }}>
                        (正确答案)
                      </Typography>
                    )}
                  </Box>
                }
                sx={{
                  mb: 1.5,
                  p: 1,
                  borderRadius: 1,
                  border: `1px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  '&:hover': isAnswered ? {} : {
                    backgroundColor: '#fafafa'
                  },
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'all 0.1s ease',
                  opacity: isAnswered ? 0.9 : 1
                }}
                disabled={isAnswered} // 回答后锁定选项
              />
            );
          })}
        </RadioGroup>
      </Paper>

      {/* 简洁黑白悬浮反馈 - 点击任意地方触发下一题 */}
      {showImmediateFeedback && answeredQuestions[currentQuestion.id] && (
        <Box
          onClick={() => {
            setShowImmediateFeedback(false);
            // 如果不是最后一题，自动进入下一题
            if (currentIndex < totalQuestions - 1) {
              handleNext();
            }
          }}
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
                minWidth: 350,
                maxWidth: 500,
                border: '1px solid #ddd',
                backgroundColor: 'white',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                position: 'relative',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 1,
                    color: answeredQuestions[currentQuestion.id].isCorrect ? '#4CAF50' : '#f44336'
                  }}
                >
                  {answeredQuestions[currentQuestion.id].isCorrect ? '✓ 回答正确' : '✗ 回答错误'}
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    你的答案: 选项 {answeredQuestions[currentQuestion.id].answer || '未选择'}
                  </Typography>
                  
                  {!answeredQuestions[currentQuestion.id].isCorrect && (
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                      正确答案: 选项 {answeredQuestions[currentQuestion.id].correctAnswer || '未知'}
                    </Typography>
                  )}
                </Box>
                
                {answeredQuestions[currentQuestion.id].explanation && (
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    bgcolor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    mb: 2
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      解析:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {answeredQuestions[currentQuestion.id].explanation}
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
                  {currentIndex < totalQuestions - 1 
                    ? '点击任意地方进入下一题' 
                    : '点击任意地方返回'}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* 简洁导航按钮 */}
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
              variant="outlined"
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              sx={{ color: '#333', borderColor: '#333', '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              {isSubmitting ? '提交中...' : '提交测试'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              sx={{ color: '#333', borderColor: '#333', '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              下一题
            </Button>
          )}
        </Box>
      </Box>

      {/* 简洁提示信息 */}
      {Object.keys(userAnswers).length < totalQuestions && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #eee' }}>
          <Typography variant="body2" color="text.secondary">
            还有 {totalQuestions - Object.keys(userAnswers).length} 题未作答
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SingleChoiceTest;
