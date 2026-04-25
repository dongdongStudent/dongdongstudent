import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  VolumeUp as VolumeUpIcon,
  EmojiEvents,
  Replay as ReplayIcon,
  Home as HomeIcon,
  Hearing as HearingIcon
} from '@mui/icons-material';

// 音标数据（包含视频文件路径）
const phoneticData = {
  longVowels: {
    items: [
      { symbol: 'ɑː', example: 'car', videoFile: 'ɑː.mp4' },
      { symbol: 'ɔː', example: 'door', videoFile: 'ɔː.mp4' },
      { symbol: 'ɜː', example: 'bird', videoFile: 'ɜː.mp4' },
      { symbol: 'iː', example: 'see', videoFile: 'iː.mp4' },
      { symbol: 'uː', example: 'too', videoFile: 'uː.mp4' }
    ]
  },
  shortVowels: {
    items: [
      { symbol: 'ɪ', example: 'bit', videoFile: 'ɪ.mp4' },
      { symbol: 'e', example: 'bed', videoFile: 'e.mp4' },
      { symbol: 'æ', example: 'cat', videoFile: 'æ.mp4' },
      { symbol: 'ʌ', example: 'cup', videoFile: 'ʌ.mp4' },
      { symbol: 'ɒ', example: 'hot', videoFile: 'ɒ.mp4' },
      { symbol: 'ʊ', example: 'book', videoFile: 'ʊ.mp4' },
      { symbol: 'ə', example: 'about', videoFile: 'ə.mp4' }
    ]
  },
  diphthongs: {
    items: [
      { symbol: 'eɪ', example: 'day', videoFile: 'eɪ.mp4' },
      { symbol: 'aɪ', example: 'my', videoFile: 'aɪ.mp4' },
      { symbol: 'ɔɪ', example: 'boy', videoFile: 'ɔɪ.mp4' },
      { symbol: 'əʊ', example: 'go', videoFile: 'əʊ.mp4' },
      { symbol: 'aʊ', example: 'now', videoFile: 'aʊ.mp4' },
      { symbol: 'ɪə', example: 'here', videoFile: 'ɪə.mp4' },
      { symbol: 'eə', example: 'chair', videoFile: 'eə.mp4' },
      { symbol: 'ʊə', example: 'tour', videoFile: 'ʊə.mp4' }
    ]
  },
  voicedConsonants: {
    items: [
      { symbol: 'b', example: 'boy', videoFile: 'b.mp4' },
      { symbol: 'd', example: 'dog', videoFile: 'd.mp4' },
      { symbol: 'g', example: 'go', videoFile: 'g.mp4' },
      { symbol: 'v', example: 'very', videoFile: 'v.mp4' },
      { symbol: 'ð', example: 'this', videoFile: 'ð.mp4' },
      { symbol: 'z', example: 'zoo', videoFile: 'z.mp4' },
      { symbol: 'ʒ', example: 'vision', videoFile: 'ʒ.mp4' },
      { symbol: 'r', example: 'red', videoFile: 'r.mp4' }
    ]
  },
  voicelessConsonants: {
    items: [
      { symbol: 'p', example: 'pen', videoFile: 'p.mp4' },
      { symbol: 't', example: 'ten', videoFile: 't.mp4' },
      { symbol: 'k', example: 'cat', videoFile: 'k.mp4' },
      { symbol: 'f', example: 'five', videoFile: 'f.mp4' },
      { symbol: 'θ', example: 'think', videoFile: 'θ.mp4' },
      { symbol: 's', example: 'see', videoFile: 's.mp4' },
      { symbol: 'ʃ', example: 'she', videoFile: 'ʃ.mp4' },
      { symbol: 'h', example: 'he', videoFile: 'h.mp4' }
    ]
  },
  voicedAffricates: {
    items: [
      { symbol: 'dʒ', example: 'jump', videoFile: 'dʒ.mp4' },
      { symbol: 'dz', example: 'beds', videoFile: 'dz.mp4' },
      { symbol: 'dr', example: 'drive', videoFile: 'dr.mp4' }
    ]
  },
  voicelessAffricates: {
    items: [
      { symbol: 'tʃ', example: 'chair', videoFile: 'tʃ.mp4' },
      { symbol: 'ts', example: 'cats', videoFile: 'ts.mp4' },
      { symbol: 'tr', example: 'tree', videoFile: 'tr.mp4' }
    ]
  },
  otherConsonants: {
    items: [
      { symbol: 'j', example: 'yes', videoFile: 'j.mp4' },
      { symbol: 'w', example: 'we', videoFile: 'w.mp4' },
      { symbol: 'm', example: 'man', videoFile: 'm.mp4' },
      { symbol: 'n', example: 'no', videoFile: 'n.mp4' },
      { symbol: 'ŋ', example: 'sing', videoFile: 'ŋ.mp4' },
      { symbol: 'l', example: 'like', videoFile: 'l.mp4' }
    ]
  }
};

const PhoneticTest = ({ open, onClose }) => {
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  // 获取所有音标项
  const getAllPhoneticItems = () => {
    const allItems = [];
    Object.values(phoneticData).forEach(category => {
      category.items.forEach(item => {
        allItems.push(item);
      });
    });
    return allItems;
  };

  // 生成选项（音标选项）
  const generateSymbolOptions = (correctSymbol, allItems) => {
    const allSymbols = [...new Set(allItems.map(item => item.symbol))];
    const others = allSymbols.filter(s => s !== correctSymbol);
    const shuffled = [...others].sort(() => 0.5 - Math.random());
    const wrongOptions = shuffled.slice(0, 3);
    const options = [correctSymbol, ...wrongOptions];
    return options.sort(() => 0.5 - Math.random());
  };

  // 播放音标的正确发音（使用视频文件）
  const playPhoneticSound = (symbol) => {
    return new Promise((resolve, reject) => {
      const allItems = getAllPhoneticItems();
      const foundItem = allItems.find(item => item.symbol === symbol);
      
      if (!foundItem) {
        reject(new Error('未找到音标'));
        return;
      }
      
      const videoPath = `/phonetics/${foundItem.videoFile}`;
      
      // 创建隐藏的audio元素来播放视频的音频
      const audio = new Audio();
      audio.src = videoPath;
      audio.preload = 'auto';
      
      audio.oncanplaythrough = () => {
        setPlaying(true);
        audio.play().catch(err => {
          console.error('播放失败:', err);
          reject(err);
        });
      };
      
      audio.onended = () => {
        setPlaying(false);
        resolve();
      };
      
      audio.onerror = (err) => {
        console.error('音频加载失败:', err);
        setPlaying(false);
        reject(err);
      };
      
      // 存储到ref以便清理
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioRef.current = audio;
    });
  };

  // 自动播放当前题目的音标
  const autoPlayCurrent = () => {
    if (testQuestions[currentIndex]) {
      playPhoneticSound(testQuestions[currentIndex].correctAnswer).catch(err => {
        console.error('自动播放失败:', err);
      });
    }
  };

  // 生成测试题目
  const generateTest = () => {
    const allItems = getAllPhoneticItems();
    // 随机选择15个题目
    const shuffled = [...allItems].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 15);
    
    const questions = selected.map(item => ({
      id: Math.random(),
      question: `请听音标发音，选择正确的音标`,
      correctAnswer: item.symbol,
      options: generateSymbolOptions(item.symbol, allItems),
      exampleWord: item.example,
      videoFile: item.videoFile
    }));
    
    setTestQuestions(questions);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer('');
    setTestCompleted(false);
    setScore(0);
  };

  // 开始测试
  const startTest = () => {
    generateTest();
    setTestStarted(true);
  };

  // 提交答案
  const submitAnswer = () => {
    if (!selectedAnswer) {
      showMessage('请选择一个答案', 'warning');
      return;
    }
    
    const currentQuestion = testQuestions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const newAnswers = [...answers, {
      question: currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect: isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      videoFile: currentQuestion.videoFile
    }];
    setAnswers(newAnswers);
    
    if (isCorrect) {
      setScore(score + 1);
      showMessage('回答正确！', 'success');
    } else {
      showMessage(`回答错误！正确答案是：/${currentQuestion.correctAnswer}/`, 'error');
    }
    
    if (currentIndex + 1 < testQuestions.length) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer('');
        // 自动播放下一题
        setTimeout(() => {
          autoPlayCurrent();
        }, 500);
      }, 1000);
    } else {
      setTimeout(() => {
        setTestCompleted(true);
      }, 1000);
    }
  };

  // 重新开始
  const restartTest = () => {
    generateTest();
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer('');
    setTestCompleted(false);
    setScore(0);
  };

  // 关闭测试
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setTestStarted(false);
    setTestCompleted(false);
    setTestQuestions([]);
    setAnswers([]);
    onClose();
  };

  const showMessage = (text, severity = 'success') => {
    setMessage({ open: true, text, severity });
  };

  // 计算正确率
  const getScorePercentage = () => {
    return testQuestions.length ? Math.round((score / testQuestions.length) * 100) : 0;
  };

  // 获取评级
  const getRating = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return { text: '优秀！', color: '#4caf50', icon: '🏆' };
    if (percentage >= 70) return { text: '良好！', color: '#2196f3', icon: '👍' };
    if (percentage >= 60) return { text: '及格', color: '#ff9800', icon: '📚' };
    return { text: '需要加强', color: '#f44336', icon: '💪' };
  };

  // 进入新题目时自动播放
  useEffect(() => {
    if (testStarted && !testCompleted && testQuestions.length > 0) {
      autoPlayCurrent();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentIndex, testStarted, testCompleted]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          color: '#fff',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents sx={{ color: '#ffd700' }} />
          <Typography variant="h6">音标听力测试</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, minHeight: 400 }}>
        {!testStarted ? (
          // 测试设置界面
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
              🎧 音标听力测试
            </Typography>
            <Typography variant="body1" sx={{ color: '#aaa', mb: 4 }}>
              听音标发音，选择正确的音标符号
            </Typography>
            
            <Card sx={{ 
              bgcolor: '#2a2a2a', 
              mb: 4, 
              p: 3,
              borderRadius: 3
            }}>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                测试说明：
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc', textAlign: 'left' }}>
                • 共15道听力选择题<br/>
                • 每道题会自动播放一个音标的正确发音<br/>
                • 你需要从4个选项中选择正确的音标<br/>
                • 可以点击喇叭图标重复播放<br/>
                • 测试完成后会显示分数和错题
              </Typography>
            </Card>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                onClick={startTest}
                sx={{ 
                  bgcolor: '#1a237e', 
                  '&:hover': { bgcolor: '#0d1757' },
                  px: 4,
                  py: 1.5
                }}
              >
                开始测试
              </Button>
            </Box>
          </Box>
        ) : testCompleted ? (
          // 测试结果界面
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" gutterBottom>
              测试完成！
            </Typography>
            
            <Box sx={{ my: 4 }}>
              <Typography variant="h2" sx={{ color: getRating().color, fontWeight: 'bold' }}>
                {score}/{testQuestions.length}
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {getScorePercentage()}分
              </Typography>
              <Chip
                label={`${getRating().text} ${getRating().icon}`}
                sx={{
                  mt: 2,
                  bgcolor: getRating().color,
                  color: '#fff',
                  fontSize: '1rem',
                  p: 2
                }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ color: '#aaa', mb: 1 }}>
                答对 {score} 题，答错 {testQuestions.length - score} 题
              </Typography>
              <LinearProgress
                variant="determinate"
                value={getScorePercentage()}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#333',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getRating().color
                  }
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={restartTest}
                sx={{ color: '#fff', borderColor: '#555' }}
              >
                重新测试
              </Button>
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={handleClose}
                sx={{ bgcolor: '#1a237e' }}
              >
                返回学习
              </Button>
            </Box>
            
            {/* 错题本 */}
            {answers.filter(a => !a.isCorrect).length > 0 && (
              <Box sx={{ mt: 4, textAlign: 'left' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  错题回顾
                </Typography>
                {answers.filter(a => !a.isCorrect).map((answer, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: '#2a2a2a',
                      borderLeft: `4px solid #f44336`
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="body1">
                        第 {answers.indexOf(answer) + 1} 题
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => playPhoneticSound(answer.correctAnswer)}
                        sx={{ color: '#4caf50' }}
                      >
                        <VolumeUpIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#f44336' }}>
                      你的答案：/{answer.userAnswer}/
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50' }}>
                      正确答案：/{answer.correctAnswer}/
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          // 答题界面
          <Box>
            {/* 进度条 */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  第 {currentIndex + 1} / {testQuestions.length} 题
                </Typography>
                <Typography variant="body2">
                  得分: {score}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={((currentIndex + 1) / testQuestions.length) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#333',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#1a237e'
                  }
                }}
              />
            </Box>
            
            {/* 听力题目区域 */}
            <Paper
              sx={{
                p: 4,
                mb: 3,
                bgcolor: '#2a2a2a',
                textAlign: 'center',
                borderRadius: 2
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#aaa', mb: 2 }}>
                  🎧 请听音标发音
                </Typography>
                <IconButton
                  onClick={() => playPhoneticSound(testQuestions[currentIndex]?.correctAnswer)}
                  disabled={playing}
                  sx={{
                    color: '#fff',
                    bgcolor: '#1a237e',
                    '&:hover': { bgcolor: '#0d1757' },
                    width: 80,
                    height: 80,
                    mb: 2
                  }}
                >
                  {playing ? (
                    <HearingIcon sx={{ fontSize: 40, animation: 'pulse 0.5s infinite' }} />
                  ) : (
                    <VolumeUpIcon sx={{ fontSize: 40 }} />
                  )}
                </IconButton>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  点击喇叭播放音标发音
                </Typography>
              </Box>
            </Paper>
            
            {/* 选项 - 音标选项 */}
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                选择正确的音标：
              </Typography>
              <RadioGroup
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
              >
                <Grid container spacing={2}>
                  {testQuestions[currentIndex]?.options.map((option, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: selectedAnswer === option ? '#1a237e' : '#2a2a2a',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: selectedAnswer === option ? '#1a237e' : '#3a3a3a'
                          }
                        }}
                        onClick={() => setSelectedAnswer(option)}
                      >
                        <FormControlLabel
                          value={option}
                          control={<Radio sx={{ color: '#fff' }} />}
                          label={
                            <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                              /{option}/
                            </Typography>
                          }
                          sx={{ width: '100%', m: 0 }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            </FormControl>
            
            {/* 提交按钮 */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={submitAnswer}
              disabled={!selectedAnswer}
              sx={{
                mt: 3,
                bgcolor: '#1a237e',
                '&:hover': { bgcolor: '#0d1757' }
              }}
            >
              提交答案
            </Button>
          </Box>
        )}
      </DialogContent>

      <Snackbar
        open={message.open}
        autoHideDuration={1500}
        onClose={() => setMessage({ ...message, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={message.severity} variant="filled">
          {message.text}
        </Alert>
      </Snackbar>

      {/* 动画样式 */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </Dialog>
  );
};

export default PhoneticTest;