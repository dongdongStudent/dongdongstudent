import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  TextField,
  Collapse
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const ClozeTestView = ({
  questions = [],
  answers = {},
  confirmedAnswers = {},
  onSetAnswers = () => {},
  onConfirm = () => {},
  onSubmit = () => {},
  checkAnswer = () => false,
  loading = false,
  passage = null
}) => {
  const [results, setResults] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState({});

  const handleAnswerChange = (questionId, value) => {
    onSetAnswers(prev => ({ ...prev, [questionId]: value }));
    setResults(prev => ({ ...prev, [questionId]: null }));
  };

  const handleCheck = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const answer = answers[questionId];
    if (!answer?.trim()) return;

    // 先确认答案
    onConfirm(questionId);
    
    // 检查答案是否正确 - 直接传递答案字符串
    const isCorrect = checkAnswer(question, answer);
    
    // 设置结果
    setResults(prev => ({ 
      ...prev, 
      [questionId]: { 
        isCorrect,
        userAnswer: answer,
        correctAnswer: question.correctForm 
      } 
    }));
  };

  const handleSubmit = () => {
    setShowResults(true);
    onSubmit({ 
      questionIds: questions.map(q => q.id),
      answers: questions.map(q => answers[q.id] || ''),
      timeSpent: 0
    });
  };

  const toggleExplanation = (questionId) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // 空状态
  if (!questions.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">暂无题目，请先抽取题目</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* 所给词列表 - 放在最顶部 */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 4, 
          bgcolor: '#f8f9fa',
          border: '1px solid #e0e0e0',
          borderRadius: 2
        }}
      >
        <Typography 
          variant="subtitle1" 
          sx={{ 
            mb: 1, 
            color: '#666',
            fontSize: '0.9rem'
          }}
        >
          所给词:
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {passage?.givenWords.map((word, i) => (
            <Typography
              key={i}
              sx={{ 
                fontSize: '1.3rem', 
                fontWeight: 600,
                color: '#1a237e',
                borderBottom: '2px solid #1a237e',
                pb: 0.5
              }}
            >
              {word}
            </Typography>
          ))}
        </Box>
      </Paper>

      {/* 题目列表 - 一行一题 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {questions.map((q, index) => {
          const isConfirmed = confirmedAnswers[q.id];
          const result = results[q.id];
          const answer = answers[q.id] || '';
          const isExpanded = expandedExplanations[q.id];

          return (
            <Paper 
              key={q.id} 
              sx={{ 
                p: 2.5, 
                bgcolor: 'white',
                width: '100%'
              }}
            >
              {/* 题号和句子 */}
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.7,
                    color: '#333',
                    fontSize: '1rem'
                  }}
                >
                  <span style={{ 
                    fontWeight: 'bold', 
                    marginRight: '12px',
                    color: '#1a237e'
                  }}>
                    {q.number}.
                  </span>
                  {q.sentence}
                </Typography>
              </Box>

              {/* 输入区域 */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="输入答案"
                  value={answer}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  disabled={isConfirmed}
                  sx={{ 
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: isConfirmed ? '#f5f5f5' : '#fff',
                      '& fieldset': {
                        borderColor: isConfirmed && result ? (result.isCorrect ? '#4caf50' : '#f44336') : '#ccc',
                        borderWidth: isConfirmed && result ? 2 : 1
                      }
                    }
                  }}
                />
                
                {!isConfirmed ? (
                  <Button
                    variant="contained"
                    onClick={() => handleCheck(q.id)}
                    disabled={!answer.trim()}
                    sx={{ 
                      minWidth: 70,
                      bgcolor: '#1a237e',
                      '&:hover': { bgcolor: '#283593' },
                      fontWeight: 500
                    }}
                  >
                    核对
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 70 }}>
                    {result && (
                      <>
                        {result.isCorrect ? (
                          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 28 }} />
                        ) : (
                          <CancelIcon sx={{ color: '#f44336', fontSize: 28 }} />
                        )}
                      </>
                    )}
                  </Box>
                )}
              </Box>

              {/* 显示正确答案（如果错误） */}
              {isConfirmed && result && !result.isCorrect && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 500 }}>
                    正确答案: {result.correctAnswer}
                  </Typography>
                </Box>
              )}

              {/* 答案解析按钮 - 只在确认后显示 */}
              {isConfirmed && q.explanation && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    startIcon={<LightbulbIcon />}
                    endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => toggleExplanation(q.id)}
                    sx={{ 
                      color: '#ff8f00',
                      '&:hover': { bgcolor: 'rgba(255, 143, 0, 0.05)' }
                    }}
                  >
                    查看解析
                  </Button>
                  
                  <Collapse in={isExpanded}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        mt: 1, 
                        bgcolor: '#fff8e1',
                        borderColor: '#ffb300',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#333', lineHeight: 1.6 }}>
                        {q.explanation}
                      </Typography>
                      {q.source?.exam && (
                        <Chip
                          size="small"
                          label={q.source.exam}
                          sx={{ mt: 1, bgcolor: '#ffb300', color: '#fff', fontSize: '0.7rem' }}
                        />
                      )}
                    </Paper>
                  </Collapse>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>

      {/* 提交按钮 */}
      {Object.keys(confirmedAnswers).length === questions.length && questions.length > 0 && !showResults && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ 
              px: 5, 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600
            }}
          >
            {loading ? '提交中...' : '提交答案'}
          </Button>
        </Box>
      )}

      {/* 结果显示 */}
      {showResults && (
        <Paper sx={{ p: 3, mt: 4, bgcolor: '#e8f5e9', textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom color="success.main" sx={{ fontWeight: 600 }}>
            练习完成！
          </Typography>
          <Typography variant="body1" sx={{ color: '#2e7d32' }}>
            共 {questions.length} 题
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ClozeTestView;