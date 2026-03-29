// test.js - 修复点击冲突，确保先显示反馈再进入下一题
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControl,
  LinearProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  Fade,
  Zoom,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EmojiEvents as EmojiEventsIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Quiz as QuizIcon,
  Edit as EditIcon,
  Spellcheck as SpellcheckIcon,
  Input as InputIcon,
  Shuffle as ShuffleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { sentenceApi } from './api';
import { F_speak } from '../Function/weisimin.js';

// 动画效果
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: 24,
  overflow: 'hidden',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

// 模式定义
const MODES = {
  choice: { label: '选择题', icon: <QuizIcon />, color: 'primary' },
  cloze: { label: '选择填空', icon: <EditIcon />, color: 'secondary' },
  input: { label: '输入填空', icon: <InputIcon />, color: 'warning' }
};

const SentenceTest = ({ 
  mode, 
  bank, 
  questionCount = 5, 
  specificId = null,
  specificIds = null,
  onBack 
}) => {
  // ========== 状态管理 ==========
  const [questions, setQuestions] = useState([]);
  const [allWords, setAllWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blankIndex, setBlankIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [inputAnswer, setInputAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [questionOptions, setQuestionOptions] = useState({});
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showNextHint, setShowNextHint] = useState(false);
  
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const currentQuestion = questions[currentIndex];
  const modeConfig = MODES[mode];
  const totalQuestions = questions.length;

  // 调试信息 - 查看当前题目的数据结构
  useEffect(() => {
    if (currentQuestion) {
      console.log('========== 当前题目详情 ==========');
      console.log('题目ID:', currentQuestion.id);
      console.log('英文:', currentQuestion.english);
      console.log('中文:', currentQuestion.chinese);
      console.log('words数组:', currentQuestion.words);
      console.log('words类型:', Array.isArray(currentQuestion.words) ? '数组' : typeof currentQuestion.words);
      console.log('words长度:', currentQuestion.words?.length);
      console.log('blankIndex:', blankIndex);
      console.log('================================');
    }
  }, [currentQuestion, blankIndex]);

  useEffect(() => {
    generateQuestions();
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, bank, questionCount, specificId, specificIds]);

  useEffect(() => {
    if (autoSpeak && currentQuestion) {
      setTimeout(() => F_speak(currentQuestion.english), 100);
    }
  }, [currentIndex, currentQuestion, autoSpeak]);

  useEffect(() => {
    if (mode === 'input' && !answered && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [currentIndex, mode, answered]);

  useEffect(() => {
    setShowNextHint(false);
  }, [currentIndex]);

  useEffect(() => {
    const handleInteraction = (event) => {
      // 处理点击事件
      if (event.type === 'click') {
        // 检查点击的目标是否是选项或按钮
        const target = event.target;
        const isOption = target.closest('.MuiPaper-root') && 
                        target.closest('.MuiGrid-root') && 
                        !target.closest('button');
        const isButton = target.closest('button');
        
        // 如果不是点击选项或按钮，并且已经回答，且不是最后一题
        if (!isOption && !isButton && answered && currentIndex < totalQuestions - 1) {
          console.log('点击空白区域，进入下一题');
          handleNext();
        }
      }
      
      // 处理键盘事件
      if (event.type === 'keydown') {
        // 检查是否是回车键
        if (event.key === 'Enter' || event.keyCode === 13) {
          // 只有当已经回答、且不是最后一题时，才处理回车事件
          if (answered && currentIndex < totalQuestions - 1) {
            console.log('按下回车键，进入下一题');
            event.preventDefault();
            handleNext();
          }
        }
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [answered, currentIndex, totalQuestions]);

  const startTimer = () => {
    timerRef.current = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const generateChoiceOptions = (currentWord, allWords) => {
    const correct = currentWord.translation;
    
    const otherWords = allWords.filter(w => w.id !== currentWord.id);
    const shuffled = [...otherWords].sort(() => 0.5 - Math.random());
    const wrongOptions = shuffled.slice(0, 3).map(w => w.translation);
    
    while (wrongOptions.length < 3) {
      const defaultOptions = ['正确选项', '错误选项1', '错误选项2', '错误选项3'];
      const fallback = defaultOptions.find(opt => !wrongOptions.includes(opt) && opt !== correct);
      if (fallback) {
        wrongOptions.push(fallback);
      } else {
        wrongOptions.push(`选项${wrongOptions.length + 1}`);
      }
    }
    
    const allOptions = [correct, ...wrongOptions];
    return allOptions.sort(() => 0.5 - Math.random());
  };

  const generateClozeOptions = (currentQuestion, blankIndex, allWords) => {
    if (!currentQuestion || !currentQuestion.words || blankIndex >= currentQuestion.words.length) {
      return [];
    }
    
    const blankWord = currentQuestion.words[blankIndex];
    
    const allPossibleWords = [];
    allWords.forEach(word => {
      const words = word.word.split(' ');
      words.forEach(w => {
        if (w && w !== blankWord && !allPossibleWords.includes(w)) {
          allPossibleWords.push(w);
        }
      });
    });
    
    const shuffled = [...allPossibleWords].sort(() => 0.5 - Math.random());
    const wrongOptions = shuffled.slice(0, 3);
    
    const commonWords = ['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'with', 'by', 'and', 'or', 'but'];
    while (wrongOptions.length < 3) {
      const fallback = commonWords.find(w => !wrongOptions.includes(w) && w !== blankWord);
      if (fallback) {
        wrongOptions.push(fallback);
      } else {
        wrongOptions.push(`word${wrongOptions.length + 1}`);
      }
    }
    
    const allOptions = [blankWord, ...wrongOptions];
    return allOptions.sort(() => 0.5 - Math.random());
  };

  // 安全地获取单词数组
  const getSafeWordsArray = (question) => {
    if (!question) return [];
    
    let wordsArray = question.words;
    
    // 如果 words 不存在，从 english 拆分
    if (!wordsArray) {
      console.log('words不存在，从english拆分:', question.english);
      wordsArray = question.english.split(' ');
      return wordsArray;
    }
    
    // 如果 words 是字符串，手动拆分
    if (typeof wordsArray === 'string') {
      console.log('words是字符串，手动拆分:', wordsArray);
      wordsArray = wordsArray.split(' ');
      return wordsArray;
    }
    
    // 如果 words 是数组但第一个元素包含空格，重新拆分
    if (Array.isArray(wordsArray) && wordsArray.length === 1 && wordsArray[0].includes(' ')) {
      console.log('数组元素包含空格，重新拆分:', wordsArray[0]);
      wordsArray = wordsArray[0].split(' ');
      return wordsArray;
    }
    
    return wordsArray;
  };

  const generateQuestions = async () => {
    setLoading(true);
    try {
      if (specificIds && specificIds.length > 0) {
        console.log('========== test.js 接收到数据 ==========');
        console.log('【接收到的参数】');
        console.log('- mode:', mode);
        console.log('- bank:', bank?.name);
        console.log('- specificIds:', specificIds);
        
        const wordsRes = await sentenceApi.getWords(bank.file);
        if (wordsRes.flag === 1) {
          const words = wordsRes.content.words || [];
          setAllWords(words);
          
          const selectedWords = words.filter(word => specificIds.includes(word.id));
          
          if (selectedWords.length === 0) {
            console.error('❌ 未找到任何匹配的单词!');
            setError('未找到选中的单词');
            setLoading(false);
            return;
          }
          
          // 为每个选中的单词生成题目，确保 words 数组正确
          const generatedQuestions = selectedWords.map((word) => {
            // 重要：确保 words 数组正确拆分
            const wordsArray = word.word.split(' ');
            
            console.log(`处理单词: ${word.word} -> 拆分后:`, wordsArray);
            
            return {
              id: word.id,
              english: word.word,
              chinese: word.translation,
              words: wordsArray,
              options: word.options || {}
            };
          });
          
          console.log('【生成的题目】');
          console.log('- 题目数量:', generatedQuestions.length);
          console.log('- 题目详情:', generatedQuestions.map(q => ({ 
            id: q.id, 
            english: q.english, 
            chinese: q.chinese,
            words: q.words
          })));
          
          setQuestions(generatedQuestions);
          
          if (mode === 'choice') {
            const optionsCache = {};
            generatedQuestions.forEach(q => {
              const word = words.find(w => w.id === q.id);
              if (word) {
                optionsCache[q.id] = generateChoiceOptions(word, words);
              }
            });
            setQuestionOptions(optionsCache);
            console.log('【选择题选项生成完成】');
          }
          
          // 为填空模式设置初始填空位置
          if (mode !== 'choice' && generatedQuestions[0]) {
            const firstQuestionWords = getSafeWordsArray(generatedQuestions[0]);
            const maxIndex = firstQuestionWords.length - 1;
            const newBlankIndex = Math.floor(Math.random() * (maxIndex + 1));
            setBlankIndex(newBlankIndex);
            console.log('【填空位置】初始blankIndex:', newBlankIndex, '最大索引:', maxIndex);
            console.log('【填空单词】', firstQuestionWords[newBlankIndex]);
          }
          
          setLoading(false);
          console.log('========== 题目生成完成 ==========');
          return;
        }
      }
      
      console.log('没有 specificIds，使用服务器生成逻辑');
      const testRes = await sentenceApi.generateTest(bank.file, { 
        testType: mode,
        questionCount 
      });
      
      if (testRes.flag === 1 && testRes.content.questions?.length > 0) {
        console.log('服务器返回的题目:', testRes.content.questions);
        
        const generatedQuestions = testRes.content.questions.map((q) => {
          // 统一处理所有模式，确保都有 words 数组
          const wordText = q.word || q.english || '';
          const wordsArray = wordText.split(' ');
          
          console.log(`服务器单词: ${wordText} -> 拆分后:`, wordsArray);
          
          return {
            id: q.id,
            english: wordText,
            chinese: q.translation || q.chinese || '',
            words: wordsArray,
            options: q.options || {}
          };
        });
        
        setQuestions(generatedQuestions);
        
        const wordsRes = await sentenceApi.getWords(bank.file);
        if (wordsRes.flag === 1) {
          const words = wordsRes.content.words || [];
          setAllWords(words);
          
          if (mode === 'choice') {
            const optionsCache = {};
            generatedQuestions.forEach(q => {
              const word = words.find(w => w.id === q.id);
              if (word) {
                optionsCache[q.id] = generateChoiceOptions(word, words);
              }
            });
            setQuestionOptions(optionsCache);
          }
        }
        
        if (mode !== 'choice' && generatedQuestions[0]) {
          const firstQuestionWords = getSafeWordsArray(generatedQuestions[0]);
          const maxIndex = firstQuestionWords.length - 1;
          const newBlankIndex = Math.floor(Math.random() * (maxIndex + 1));
          setBlankIndex(newBlankIndex);
          console.log('【填空位置】初始blankIndex:', newBlankIndex, '最大索引:', maxIndex);
          console.log('【填空单词】', firstQuestionWords[newBlankIndex]);
        }
      } else {
        console.log('使用本地数据生成题目');
        const wordsRes = await sentenceApi.getWords(bank.file);
        if (wordsRes.flag === 1) {
          const words = wordsRes.content.words || [];
          setAllWords(words);
          
          let selectedWords;
          if (specificId) {
            const word = words.find(w => w.id === specificId);
            selectedWords = word ? [word] : [];
          } else {
            const shuffled = [...words].sort(() => 0.5 - Math.random());
            selectedWords = shuffled.slice(0, questionCount);
          }
          
          const generatedQuestions = selectedWords.map((word) => {
            const wordsArray = word.word.split(' ');
            console.log(`本地单词: ${word.word} -> 拆分后:`, wordsArray);
            
            return {
              id: word.id,
              english: word.word,
              chinese: word.translation,
              words: wordsArray,
              options: word.options || {}
            };
          });
          
          setQuestions(generatedQuestions);
          
          if (mode === 'choice') {
            const optionsCache = {};
            generatedQuestions.forEach(q => {
              const word = words.find(w => w.id === q.id);
              if (word) {
                optionsCache[q.id] = generateChoiceOptions(word, words);
              }
            });
            setQuestionOptions(optionsCache);
          }
          
          if (mode !== 'choice' && generatedQuestions[0]) {
            const firstQuestionWords = getSafeWordsArray(generatedQuestions[0]);
            const maxIndex = firstQuestionWords.length - 1;
            const newBlankIndex = Math.floor(Math.random() * (maxIndex + 1));
            setBlankIndex(newBlankIndex);
            console.log('【填空位置】初始blankIndex:', newBlankIndex, '最大索引:', maxIndex);
            console.log('【填空单词】', firstQuestionWords[newBlankIndex]);
          }
        }
      }
    } catch (err) {
      console.error('❌ 生成测试失败:', err);
      setError('生成测试失败');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentOptions = () => {
    if (!currentQuestion) return [];
    
    if (mode === 'choice') {
      if (currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.length >= 4) {
        return currentQuestion.options;
      }
      return questionOptions[currentQuestion.id] || [currentQuestion.chinese, '选项1', '选项2', '选项3'];
      
    } else if (mode === 'cloze') {
      const safeWords = getSafeWordsArray(currentQuestion);
      if (!safeWords || blankIndex >= safeWords.length) {
        return [];
      }
      const blankWord = safeWords[blankIndex];
      
      const wordOptions = currentQuestion.options?.[blankWord];
      if (wordOptions && Array.isArray(wordOptions) && wordOptions.length >= 4) {
        return wordOptions;
      }
      
      return generateClozeOptions({...currentQuestion, words: safeWords}, blankIndex, allWords);
    }
    return [];
  };

  const handleChoiceAnswer = (option) => {
    if (answered) return;
    const isCorrect = option === currentQuestion.chinese;
    
    setSelected(option);
    setAnswered(true);
    setShowNextHint(true); // 显示下一步提示
    
    // 创建反馈信息，包含解析
    const feedbackMessage = {
      isCorrect, 
      correct: currentQuestion.chinese, 
      userAnswer: option,
      explanation: isCorrect 
        ? '✓ 回答正确！' 
        : `✗ 正确答案是 "${currentQuestion.chinese}"`
    };
    
    setFeedback(feedbackMessage);
    
    const resultItem = { 
      wordId: currentQuestion.id, 
      userAnswer: option,
      correct: currentQuestion.chinese,
      isCorrect: isCorrect,
      responseTime: 0
    };
    
    setResults(prev => [...prev, resultItem]);
    
    if (isCorrect) setScore(prev => prev + 1);
  };

  const handleClozeAnswer = (option) => {
    if (answered) return;
    
    if (!currentQuestion) {
      setError('题目数据错误');
      return;
    }
    
    const safeWords = getSafeWordsArray(currentQuestion);
    
    if (!safeWords || safeWords.length === 0) {
      setError('题目数据错误');
      return;
    }
    
    if (blankIndex < 0 || blankIndex >= safeWords.length) {
      console.error('blankIndex 无效:', blankIndex);
      setBlankIndex(0);
      setError('题目格式错误，请重试');
      return;
    }
    
    const correctWord = safeWords[blankIndex];
    if (!correctWord) {
      setError('题目数据错误');
      return;
    }
    
    const isCorrect = option === correctWord;
    
    setUserAnswer(option);
    setAnswered(true);
    setShowNextHint(true); // 显示下一步提示
    
    // 创建反馈信息，包含解析
    const feedbackMessage = {
      isCorrect, 
      correct: correctWord, 
      userAnswer: option,
      explanation: isCorrect 
        ? `✓ 回答正确！填空处应填 "${correctWord}"`
        : `✗ 填空处应填 "${correctWord}"，您的答案是 "${option}"`
    };
    
    setFeedback(feedbackMessage);
    
    const resultItem = { 
      wordId: currentQuestion.id, 
      userAnswer: option,
      correct: correctWord,
      isCorrect: isCorrect,
      responseTime: 0
    };
    
    setResults(prev => [...prev, resultItem]);
    
    if (isCorrect) setScore(prev => prev + 1);
  };

  const handleInputAnswer = () => {
    if (answered) return;
    
    if (!inputAnswer.trim()) {
      setError('请输入答案');
      return;
    }
    
    if (!currentQuestion) {
      setError('题目数据错误');
      return;
    }
    
    const safeWords = getSafeWordsArray(currentQuestion);
    
    if (!safeWords || safeWords.length === 0) {
      console.error('safeWords 无效:', safeWords);
      setError('题目数据错误');
      return;
    }
    
    if (blankIndex < 0 || blankIndex >= safeWords.length) {
      console.error('blankIndex 无效:', blankIndex, 'words长度:', safeWords.length);
      const validIndex = 0;
      setBlankIndex(validIndex);
      setError('题目格式错误，请重试');
      return;
    }
    
    const correctWord = safeWords[blankIndex];
    
    if (!correctWord) {
      console.error('correctWord 是 undefined, blankIndex:', blankIndex, 'words:', safeWords);
      setError('题目数据错误');
      return;
    }
    
    const isCorrect = inputAnswer.trim().toLowerCase() === correctWord.toLowerCase();
    
    setAnswered(true);
    setError('');
    setShowNextHint(true); // 显示下一步提示
    
    // 创建反馈信息，包含解析
    const feedbackMessage = {
      isCorrect, 
      correct: correctWord, 
      userAnswer: inputAnswer,
      explanation: isCorrect 
        ? `✓ 回答正确！填空处应填 "${correctWord}"`
        : `✗ 填空处应填 "${correctWord}"，您的答案是 "${inputAnswer}"`
    };
    
    setFeedback(feedbackMessage);
    
    const resultItem = { 
      wordId: currentQuestion.id, 
      userAnswer: inputAnswer,
      correct: correctWord,
      isCorrect: isCorrect,
      responseTime: 0
    };
    
    setResults(prev => {
      const newResults = [...prev, resultItem];
      return newResults;
    });
    
    if (isCorrect) setScore(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
      resetQuestion();
    } else {
      handleComplete();
    }
  };

  const resetQuestion = () => {
    setSelected('');
    setUserAnswer('');
    setInputAnswer('');
    setAnswered(false);
    setFeedback(null);
    setError('');
    setShowNextHint(false);
    
    if (mode !== 'choice' && currentQuestion) {
      const safeWords = getSafeWordsArray(currentQuestion);
      if (safeWords && safeWords.length > 0) {
        const maxIndex = safeWords.length - 1;
        const newBlankIndex = Math.floor(Math.random() * (maxIndex + 1));
        console.log('重置填空位置:', newBlankIndex, '总单词数:', safeWords.length);
        setBlankIndex(newBlankIndex);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleComplete = () => {
    stopTimer();
    
    if (!results || results.length === 0) {
      console.warn('results 为空');
      setError('没有答题记录');
      setShowResult(true);
      return;
    }
    
    const formattedResults = results.map((r) => ({
      wordId: r?.wordId || 0,
      userAnswer: r?.userAnswer || '',
      correct: r?.correct || '',
      isCorrect: r?.isCorrect || false,
      responseTime: r?.responseTime || 0
    }));
    
    const missingCorrect = formattedResults.filter(r => !r.correct);
    if (missingCorrect.length > 0) {
      console.error('有结果项缺失 correct 字段:', missingCorrect);
      setError('数据格式错误，请重试');
      setShowResult(true);
      return;
    }
    
    sentenceApi.submitTest(bank.file, {
      testType: mode,
      results: formattedResults,
      timeSpent: timeSpent
    })
    .then(res => {
      if (res.flag === 1) {
        console.log('✅ 测试结果提交成功:', res.content);
      } else {
        console.error('❌ 测试结果提交失败:', res.message);
        setError(res.message || '提交失败');
      }
      setShowResult(true);
    })
    .catch(err => {
      console.error('❌ 提交测试结果失败:', err);
      setError('提交失败：' + err.message);
      setShowResult(true);
    });
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">正在生成题目...</Typography>
          <LinearProgress sx={{ mt: 2, width: 300 }} />
        </Paper>
      </Box>
    );
  }

  if (error || !questions.length) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>{error || '暂无题目'}</Alert>
          <Button variant="contained" onClick={onBack} startIcon={<ArrowBackIcon />}>返回</Button>
        </Paper>
      </Box>
    );
  }

  if (showResult) {
    const accuracy = Math.round((score / totalQuestions) * 100);
    return (
      <Zoom in={true}>
        <StyledCard>
          <CardContent sx={{ p: 4 }}>
            <Stack alignItems="center" spacing={3}>
              <EmojiEventsIcon sx={{ fontSize: 80, color: '#FFD700' }} />
              <Typography variant="h4">测试完成！</Typography>
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={6}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                    <Typography variant="h3" color="success.main">{score}</Typography>
                    <Typography>答对</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#ffebee' }}>
                    <Typography variant="h3" color="error.main">{totalQuestions - score}</Typography>
                    <Typography>答错</Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Paper sx={{ width: '100%', p: 3 }}>
                <Typography variant="h6" align="center">正确率: {accuracy}%</Typography>
                <LinearProgress variant="determinate" value={accuracy} sx={{ height: 10, borderRadius: 5 }} />
                <Typography sx={{ mt: 1 }} align="center">用时: {formatTime(timeSpent)}</Typography>
              </Paper>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="outlined" onClick={onBack}>返回</Button>
              </Stack>
            </Stack>
          </CardContent>
        </StyledCard>
      </Zoom>
    );
  }

  return (
    <Box 
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} 
      ref={containerRef}
    >
      {/* 顶部栏 */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Grid container alignItems="center">
          <Grid item xs={4}>
            <Stack direction="row" spacing={1}>
              <Chip label={`${currentIndex + 1}/${totalQuestions}`} color="primary" />
              <Chip label={modeConfig.label} color={modeConfig.color} size="small" />
            </Stack>
          </Grid>
          <Grid item xs={4}>
            <LinearProgress variant="determinate" value={(results.length / totalQuestions) * 100} />
          </Grid>
          <Grid item xs={4}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
              <FormControlLabel
                control={<Switch checked={autoSpeak} onChange={() => setAutoSpeak(!autoSpeak)} size="small" />}
                label={autoSpeak ? <VolumeUpIcon /> : <VolumeOffIcon />}
              />
              <Typography>得分: {score}/{results.length}</Typography>
              <Typography>用时: {formatTime(timeSpent)}</Typography>
              <IconButton onClick={onBack} size="small" sx={{ color: '#666' }}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* 题目卡片 */}
      <Zoom in={true} key={currentIndex}>
        <StyledCard>
          <Box sx={{ p: 3, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', color: 'white' }}>
            <Stack direction="row" justifyContent="flex-end">
              <IconButton onClick={() => F_speak(currentQuestion.english)} sx={{ color: 'white' }}>
                <VolumeUpIcon />
              </IconButton>
              {mode !== 'choice' && (
                <IconButton onClick={() => setShowHint(!showHint)} sx={{ color: 'white' }}>
                  <SpellcheckIcon />
                </IconButton>
              )}
            </Stack>
            
            <Box sx={{ textAlign: 'center' }}>
              {mode === 'choice' ? (
                <Typography variant="h3" fontWeight="bold">{currentQuestion.english}</Typography>
              ) : (
                <>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ flexWrap: 'wrap' }}>
                    <Typography variant="h4" sx={{ fontStyle: 'italic', bgcolor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: 3 }}>
                      {(() => {
                        // 获取安全的单词数组
                        const safeWords = getSafeWordsArray(currentQuestion);
                        
                        // 确保 blankIndex 有效
                        const safeBlankIndex = (safeWords && safeWords.length > 0 && blankIndex < safeWords.length) 
                          ? blankIndex 
                          : 0;
                        
                        // 如果 safeBlankIndex 变了，更新状态
                        if (safeBlankIndex !== blankIndex) {
                          setTimeout(() => setBlankIndex(safeBlankIndex), 0);
                        }
                        
                        return safeWords && safeWords.length > 0 
                          ? safeWords.map((w, i) => i === safeBlankIndex ? '____' : w).join(' ')
                          : currentQuestion.english;
                      })()}
                    </Typography>
                  </Stack>
                  
                  {/* 显示中文翻译 - 为第二和第三模式添加 */}
                  <Typography variant="h6" sx={{ mt: 2, color: 'rgba(255,255,255,0.9)' }}>
                    {currentQuestion.chinese}
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {/* 提示 */}
            {mode !== 'choice' && showHint && (() => {
              const safeWords = getSafeWordsArray(currentQuestion);
              const safeBlankIndex = (safeWords && safeWords.length > 0 && blankIndex < safeWords.length) 
                ? blankIndex 
                : 0;
              return safeWords && safeWords[safeBlankIndex] && (
                <Alert severity="info" sx={{ mb: 3, justifyContent: 'center' }}>
                  当前填空: "{safeWords[safeBlankIndex]}"
                </Alert>
              );
            })()}

            {/* 选项区域 */}
            {mode === 'choice' ? (
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup value={selected}>
                  <Grid container spacing={2} justifyContent="center">
                    {getCurrentOptions().map((option, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Paper
                          sx={{
                            p: 2,
                            border: '2px solid',
                            borderColor: selected === option ? (feedback?.isCorrect ? '#4caf50' : '#f44336') : '#e0e0e0',
                            borderRadius: 3,
                            cursor: answered ? 'default' : 'pointer',
                            bgcolor: selected === option ? (feedback?.isCorrect ? '#e8f5e8' : '#ffebee') : 'white',
                            '&:hover': !answered && { borderColor: '#2196f3', bgcolor: '#e3f2fd' },
                            textAlign: 'center'
                          }}
                          onClick={() => !answered && handleChoiceAnswer(option)}
                        >
                          <Typography align="center">{option}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              </FormControl>
            ) : mode === 'cloze' ? (
              <Grid container spacing={2} justifyContent="center">
                {getCurrentOptions().map((option, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Paper
                      sx={{
                        p: 2,
                        border: '2px solid',
                        borderColor: userAnswer === option ? (feedback?.isCorrect ? '#4caf50' : '#f44336') : '#e0e0e0',
                        borderRadius: 3,
                        cursor: answered ? 'default' : 'pointer',
                        bgcolor: userAnswer === option ? (feedback?.isCorrect ? '#e8f5e8' : '#ffebee') : 'white',
                        '&:hover': !answered && { borderColor: '#2196f3', bgcolor: '#e3f2fd' },
                        textAlign: 'center'
                      }}
                      onClick={() => !answered && handleClozeAnswer(option)}
                    >
                      <Typography align="center">{option}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ maxWidth: 500, width: '100%' }}>
                  <TextField
                    fullWidth
                    label="请输入答案"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!answered) {
                          handleInputAnswer();
                        }
                      }
                    }}
                    disabled={answered}
                    error={!!error}
                    helperText={error}
                    inputRef={inputRef}
                    autoFocus
                  />
                  {!answered && (
                    <Button 
                      fullWidth 
                      variant="contained" 
                      sx={{ mt: 3 }} 
                      onClick={handleInputAnswer}
                      disabled={!inputAnswer.trim()}
                    >
                      检查答案
                    </Button>
                  )}
                </Box>
              </Box>
            )}

            {/* 反馈和解析 */}
            {feedback && (
              <Fade in={true}>
                <Paper 
                  sx={{ 
                    mt: 3, 
                    p: 2, 
                    bgcolor: feedback.isCorrect ? '#e8f5e8' : '#ffebee',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: feedback.isCorrect ? '#4caf50' : '#f44336'
                  }}
                >
                  <Typography 
                    variant="body1" 
                    align="center"
                    sx={{ 
                      color: feedback.isCorrect ? '#2e7d32' : '#c62828',
                      fontWeight: 500,
                      mb: 1
                    }}
                  >
                    {feedback.explanation}
                  </Typography>
                  
                  {/* 显示正确答案对比 */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 3,
                    mt: 1,
                    pt: 1,
                    borderTop: '1px dashed',
                    borderColor: feedback.isCorrect ? '#4caf50' : '#f44336'
                  }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">您的答案</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {feedback.userAnswer}
                      </Typography>
                    </Box>
                    {!feedback.isCorrect && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">正确答案</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {feedback.correct}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Fade>
            )}
          </CardContent>
        </StyledCard>
      </Zoom>

      {/* 点击提示 - 所有模式统一 */}
      {answered && showNextHint && currentIndex < totalQuestions - 1 && (
        <Paper sx={{ p: 1.5, mt: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
          <Typography variant="body2" color="primary">
            ✨ 点击屏幕空白处 或 按回车键 进入下一题 ✨
          </Typography>
        </Paper>
      )}
      
      {currentIndex === totalQuestions - 1 && answered && (
        <Paper sx={{ p: 1.5, mt: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
          <Typography variant="body2" color="success.main">
            🎉 已完成所有题目，点击下方按钮提交结果 🎉
          </Typography>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleComplete}
            sx={{ mt: 1 }}
            fullWidth
          >
            提交测试结果
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default SentenceTest;