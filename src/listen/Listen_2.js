import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
  CircularProgress,
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  CheckCircle,
  Visibility,
  Refresh,
  ArrowBack,
  Shuffle,
  RotateLeft,
  Psychology,
  Translate,
  Repeat,
  RepeatOne,
  AccessTime,
  CalendarMonth,
  CalendarViewWeek,
  Numbers,
  Undo
} from '@mui/icons-material';

// 导入外部的语音函数
import { F_speak } from "../Function/weisimin.js";
import { useNavigate } from "react-router-dom";

const WordMemoryApp = () => {
  // TTS相关状态
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatInterval] = useState(2000); // 固定重复间隔
  const [repeatCount, setRepeatCount] = useState(0);
  const navigate = useNavigate();

  // 主要状态
  const [currentWord, setCurrentWord] = useState(null);
  const [wordList, setWordList] = useState([]);
  const [remainingWords, setRemainingWords] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false); // 是否显示答案（英文+翻译）
  const [showQuestion, setShowQuestion] = useState(false); // 是否显示问题区域

  // 筛选和设置
  const [wordCategory, setWordCategory] = useState('');
  const [autoPlay, setAutoPlay] = useState(true);
  const [shuffleMode, setShuffleMode] = useState(true);
  const [showFileList, setShowFileList] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const repeatTimerRef = useRef(null);
  const repeatCountRef = useRef(0);
  const speechQueueRef = useRef([]); // 语音队列
  const isSpeakingRef = useRef(false); // 使用ref跟踪语音状态
  const lastSpeechTextRef = useRef(''); // 记录最后一次播放的文本

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (repeatTimerRef.current) {
        clearInterval(repeatTimerRef.current);
      }
      // 清理语音队列
      speechQueueRef.current = [];
      isSpeakingRef.current = false;
    };
  }, []);

  // 优化的语音播放函数
  const speakText = (text) => {
    if (typeof F_speak !== 'function') {
      console.error('F_speak函数未正确导入');
      return;
    }

    // 如果正在说话，添加到队列
    if (isSpeakingRef.current) {
      console.log('语音正在播放，添加到队列:', text);
      speechQueueRef.current.push(text);
      return;
    }

    // 记录最后一次播放的文本
    lastSpeechTextRef.current = text;

    try {
      // 设置语音状态
      setIsSpeaking(true);
      isSpeakingRef.current = true;

      console.log('开始播放语音:', text);

      // 使用F_speak播放语音
      F_speak(text);

      // 根据文本长度估计播放时间
      const estimatedDuration = Math.max(text.length * 80, 1500);

      // 设置一个超时来标记语音播放结束
      const speechTimeout = setTimeout(() => {
        console.log('语音播放完成:', text);
        setIsSpeaking(false);
        isSpeakingRef.current = false;

        // 检查队列中是否有待播放的语音
        if (speechQueueRef.current.length > 0) {
          const nextText = speechQueueRef.current.shift();
          console.log('从队列中播放下一个语音:', nextText);
          // 延迟一下再播放下一个，确保状态已更新
          setTimeout(() => speakText(nextText), 300);
        }
      }, estimatedDuration);

      // 清理函数
      return () => {
        clearTimeout(speechTimeout);
      };

    } catch (error) {
      console.error('语音播放错误:', error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;

      // 尝试播放下一个
      if (speechQueueRef.current.length > 0) {
        const nextText = speechQueueRef.current.shift();
        setTimeout(() => speakText(nextText), 500);
      }
    }
  };

  // 停止语音播放
  const stopSpeaking = () => {
    console.log('停止语音播放');

    // 清除语音队列
    speechQueueRef.current = [];

    // 重置状态
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  };

  // 开始重复朗读当前单词
  const startRepeating = (wordToRepeat = null) => {
    const word = wordToRepeat || currentWord;
    if (!word) return;

    console.log('开始重复朗读:', word.english);
    setIsRepeating(true);
    setRepeatCount(1);
    repeatCountRef.current = 1;

    // 清除可能存在的旧计时器
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
    }

    // 停止当前可能正在播放的语音
    stopSpeaking();

    // 清空语音队列
    speechQueueRef.current = [];

    // 延迟一点开始播放，确保状态已重置
    setTimeout(() => {
      // 立即朗读第一次
      speakText(word.english);

      // 设置重复计时器
      repeatTimerRef.current = setInterval(() => {
        console.log('重复朗读:', word.english);

        // 先停止当前语音
        stopSpeaking();

        // 延迟一点再开始新的播放
        setTimeout(() => {
          speakText(word.english);
          setRepeatCount(prev => prev + 1);
          repeatCountRef.current += 1;
        }, 300);

      }, repeatInterval + 500); // 增加一点延迟，避免冲突
    }, 300);
  };

  // 停止重复朗读
  const stopRepeating = () => {
    console.log('停止重复朗读');
    setIsRepeating(false);
    setRepeatCount(0);
    repeatCountRef.current = 0;

    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }

    // 停止语音播放
    stopSpeaking();
  };

  // 切换重复朗读状态
  const toggleRepeating = () => {
    console.log('切换重复状态，当前:', isRepeating);
    if (isRepeating) {
      stopRepeating();
    } else {
      startRepeating();
    }
  };

  // 加载单词数据
  const loadWordData = (category) => {
    console.log('加载类别数据:', category);

    // 停止当前可能正在进行的语音
    stopSpeaking();
    stopRepeating();

    let data = [];

    switch (category) {
      case 'months':
        // 月份数据
        data = [
          { id: 'month_1', english: "January", chinese: "一月", pinyin: "Yī yuè", order: 1 },
          { id: 'month_2', english: "February", chinese: "二月", pinyin: "Èr yuè", order: 2 },
          { id: 'month_3', english: "March", chinese: "三月", pinyin: "Sān yuè", order: 3 },
          { id: 'month_4', english: "April", chinese: "四月", pinyin: "Sì yuè", order: 4 },
          { id: 'month_5', english: "May", chinese: "五月", pinyin: "Wǔ yuè", order: 5 },
          { id: 'month_6', english: "June", chinese: "六月", pinyin: "Liù yuè", order: 6 },
          { id: 'month_7', english: "July", chinese: "七月", pinyin: "Qī yuè", order: 7 },
          { id: 'month_8', english: "August", chinese: "八月", pinyin: "Bā yuè", order: 8 },
          { id: 'month_9', english: "September", chinese: "九月", pinyin: "Jiǔ yuè", order: 9 },
          { id: 'month_10', english: "October", chinese: "十月", pinyin: "Shí yuè", order: 10 },
          { id: 'month_11', english: "November", chinese: "十一月", pinyin: "Shíyī yuè", order: 11 },
          { id: 'month_12', english: "December", chinese: "十二月", pinyin: "Shí'èr yuè", order: 12 }
        ];
        break;

      case 'weekdays':
        // 星期数据
        data = [
          { id: 'weekday_1', english: "Monday", chinese: "星期一", pinyin: "Xīngqī yī", order: 1 },
          { id: 'weekday_2', english: "Tuesday", chinese: "星期二", pinyin: "Xīngqī èr", order: 2 },
          { id: 'weekday_3', english: "Wednesday", chinese: "星期三", pinyin: "Xīngqī sān", order: 3 },
          { id: 'weekday_4', english: "Thursday", chinese: "星期四", pinyin: "Xīngqī sì", order: 4 },
          { id: 'weekday_5', english: "Friday", chinese: "星期五", pinyin: "Xīngqī wǔ", order: 5 },
          { id: 'weekday_6', english: "Saturday", chinese: "星期六", pinyin: "Xīngqī liù", order: 6 },
          { id: 'weekday_7', english: "Sunday", chinese: "星期日", pinyin: "Xīngqī rì", order: 7 }
        ];
        break;

      case 'numbers':
        // 数字数据（1-20）
        data = [
          { id: 'number_1', english: "One", chinese: "一", pinyin: "Yī", order: 1 },
          { id: 'number_2', english: "Two", chinese: "二", pinyin: "Èr", order: 2 },
          { id: 'number_3', english: "Three", chinese: "三", pinyin: "Sān", order: 3 },
          { id: 'number_4', english: "Four", chinese: "四", pinyin: "Sì", order: 4 },
          { id: 'number_5', english: "Five", chinese: "五", pinyin: "Wǔ", order: 5 },
          { id: 'number_6', english: "Six", chinese: "六", pinyin: "Liù", order: 6 },
          { id: 'number_7', english: "Seven", chinese: "七", pinyin: "Qī", order: 7 },
          { id: 'number_8', english: "Eight", chinese: "八", pinyin: "Bā", order: 8 },
          { id: 'number_9', english: "Nine", chinese: "九", pinyin: "Jiǔ", order: 9 },
          { id: 'number_10', english: "Ten", chinese: "十", pinyin: "Shí", order: 10 },
          { id: 'number_11', english: "Eleven", chinese: "十一", pinyin: "Shíyī", order: 11 },
          { id: 'number_12', english: "Twelve", chinese: "十二", pinyin: "Shí'èr", order: 12 },
          { id: 'number_13', english: "Thirteen", chinese: "十三", pinyin: "Shísān", order: 13 },
          { id: 'number_14', english: "Fourteen", chinese: "十四", pinyin: "Shísì", order: 14 },
          { id: 'number_15', english: "Fifteen", chinese: "十五", pinyin: "Shíwǔ", order: 15 },
          { id: 'number_16', english: "Sixteen", chinese: "十六", pinyin: "Shíliù", order: 16 },
          { id: 'number_17', english: "Seventeen", chinese: "十七", pinyin: "Shíqī", order: 17 },
          { id: 'number_18', english: "Eighteen", chinese: "十八", pinyin: "Shíbā", order: 18 },
          { id: 'number_19', english: "Nineteen", chinese: "十九", pinyin: "Shíjiǔ", order: 19 },
          { id: 'number_20', english: "Twenty", chinese: "二十", pinyin: "Èrshí", order: 20 }
        ];
        break;

      case 'times':
        // 时间表达数据
        data = [
          { id: 'time_1', english: "What time is it?", chinese: "现在几点了？", pinyin: "Xiànzài jǐ diǎn le?", order: 1 },
          { id: 'time_2', english: "It's one o'clock.", chinese: "一点钟。", pinyin: "Yī diǎn zhōng.", order: 2 },
          { id: 'time_3', english: "It's two o'clock.", chinese: "两点钟。", pinyin: "Liǎng diǎn zhōng.", order: 3 },
          { id: 'time_4', english: "It's three o'clock.", chinese: "三点钟。", pinyin: "Sān diǎn zhōng.", order: 4 },
          { id: 'time_5', english: "It's four o'clock.", chinese: "四点钟。", pinyin: "Sì diǎn zhōng.", order: 5 },
          { id: 'time_6', english: "It's five o'clock.", chinese: "五点钟。", pinyin: "Wǔ diǎn zhōng.", order: 6 },
          { id: 'time_7', english: "It's six o'clock.", chinese: "六点钟。", pinyin: "Liù diǎn zhōng.", order: 7 },
          { id: 'time_8', english: "It's seven o'clock.", chinese: "七点钟。", pinyin: "Qī diǎn zhōng.", order: 8 },
          { id: 'time_9', english: "It's eight o'clock.", chinese: "八点钟。", pinyin: "Bā diǎn zhōng.", order: 9 },
          { id: 'time_10', english: "It's nine o'clock.", chinese: "九点钟。", pinyin: "Jiǔ diǎn zhōng.", order: 10 },
          { id: 'time_11', english: "It's ten o'clock.", chinese: "十点钟。", pinyin: "Shí diǎn zhōng.", order: 11 },
          { id: 'time_12', english: "It's eleven o'clock.", chinese: "十一点钟。", pinyin: "Shíyī diǎn zhōng.", order: 12 },
          { id: 'time_13', english: "It's twelve o'clock.", chinese: "十二点钟。", pinyin: "Shí'èr diǎn zhōng.", order: 13 },
          { id: 'time_14', english: "It's half past one.", chinese: "一点半。", pinyin: "Yī diǎn bàn.", order: 14 },
          { id: 'time_15', english: "It's a quarter past two.", chinese: "两点一刻。", pinyin: "Liǎng diǎn yī kè.", order: 15 },
          { id: 'time_16', english: "It's a quarter to three.", chinese: "两点三刻。", pinyin: "Liǎng diǎn sān kè.", order: 16 },
          { id: 'time_17', english: "It's ten past four.", chinese: "四点十分。", pinyin: "Sì diǎn shí fēn.", order: 17 },
          { id: 'time_18', english: "It's twenty past five.", chinese: "五点二十分。", pinyin: "Wǔ diǎn èrshí fēn.", order: 18 },
          { id: 'time_19', english: "It's twenty-five to six.", chinese: "五点三十五分。", pinyin: "Wǔ diǎn sānshíwǔ fēn.", order: 19 },
          { id: 'time_20', english: "It's five to seven.", chinese: "六点五十五分。", pinyin: "Liù diǎn wǔshíwǔ fēn.", order: 20 }
        ];
        break;

      default:
        data = [];
    }

    setWordList(data);

    // 是否洗牌
    let initialWords = [...data];
    if (shuffleMode) {
      for (let i = initialWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialWords[i], initialWords[j]] = [initialWords[j], initialWords[i]];
      }
    }

    setRemainingWords(initialWords);
    setUsedWords([]);
    setWordCategory(category);
    setShowFileList(false);
    setCurrentWord(null);
    setShowAnswer(false);
    setShowQuestion(false);

    // 延迟一点开始第一个单词，确保状态已重置
    setTimeout(() => {
      if (initialWords.length > 0) {
        const firstWord = initialWords[0];
        console.log('设置第一个单词:', firstWord.english);
        setCurrentWord(firstWord);
        setRemainingWords(initialWords.slice(1));

        if (autoPlay) {
          // 延迟一点再播放，避免冲突
          setTimeout(() => {
            speakText(firstWord.english);
          }, 500);
        }
      }
    }, 300);
  };

  // 抽取下一个单词
  const drawNextWord = () => {
    console.log('抽取下一个单词');

    // 如果当前正在重复，保存重复状态
    const wasRepeating = isRepeating;

    // 先停止当前可能正在进行的语音和重复
    stopSpeaking();

    // 重置显示状态
    setShowAnswer(false);
    setShowQuestion(false);

    if (remainingWords.length === 0) {
      // 一轮结束，重置
      console.log('一轮结束，重新开始');
      let newWords = [...wordList];
      if (shuffleMode) {
        for (let i = newWords.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newWords[i], newWords[j]] = [newWords[j], newWords[i]];
        }
      }
      setRemainingWords(newWords);
      setUsedWords([]);
    }

    if (remainingWords.length > 0) {
      const nextWord = remainingWords[0];
      console.log('设置新单词:', nextWord.english);

      // 设置新单词
      setCurrentWord(nextWord);
      setRemainingWords(remainingWords.slice(1));

      // 延迟一点确保状态已更新
      setTimeout(() => {
        // 自动播放新单词
        if (autoPlay) {
          speakText(nextWord.english);
        }

        // 如果之前是重复状态，为新单词开始重复
        if (wasRepeating) {
          console.log('为新单词恢复重复状态');
          // 延迟一点确保单词已设置
          setTimeout(() => {
            startRepeating(nextWord);
          }, 800);
        }
      }, 300);
    }
  };

  // 朗读当前单词
  const speakCurrentWord = () => {
    if (currentWord && currentWord.english) {
      console.log('朗读当前单词:', currentWord.english);

      // 如果正在重复，先停止重复
      if (isRepeating) {
        stopRepeating();
      }

      // 停止当前可能正在播放的语音
      stopSpeaking();

      // 延迟一点再播放
      setTimeout(() => {
        speakText(currentWord.english);
      }, 300);
    }
  };

  // 切换朗读状态
  const toggleSpeaking = () => {
    console.log('切换朗读状态，当前:', isSpeaking);

    if (isSpeakingRef.current) {
      // 如果正在说话，停止
      stopSpeaking();
      // 如果正在重复，也停止重复
      if (isRepeating) {
        stopRepeating();
      }
    } else {
      // 如果没在说话，开始播放
      speakCurrentWord();
    }
  };

  // 处理"我知道了"
  const handleIKnow = () => {
    if (!currentWord) return;

    console.log('我知道了:', currentWord.english);

    // 保存当前的重复状态
    const wasRepeating = isRepeating;

    // 将当前单词移到已使用列表
    setUsedWords([...usedWords, currentWord]);

    // 抽取下一个单词（这个函数会处理重复状态的延续）
    drawNextWord();
  };

  // 处理"我不知道" - 显示答案
  const handleIDontKnow = () => {
    if (!currentWord) return;

    console.log('我不知道，显示答案:', currentWord.english);

    // 显示答案（英文+翻译）
    setShowAnswer(true);
  };

  // 显示答案按钮点击事件
  const handleShowAnswer = () => {
    console.log('显示答案');
    setShowAnswer(true);
  };

  // 返回答题界面（隐藏答案）
  const handleBackToQuestion = () => {
    console.log('返回答题界面');
    setShowAnswer(false);
  };

  // 显示问题区域（可以点击显示问题内容）
  const handleShowQuestion = () => {
    console.log('显示问题区域');
    setShowQuestion(true);
  };

  // 重新开始当前轮次
  const restartCurrentRound = () => {
    console.log('重新开始当前轮次');

    // 停止重复朗读和语音
    stopRepeating();
    stopSpeaking();

    let newWords = [...wordList];
    if (shuffleMode) {
      for (let i = newWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newWords[i], newWords[j]] = [newWords[j], newWords[i]];
      }
    }

    setRemainingWords(newWords);
    setUsedWords([]);
    setCurrentWord(null);
    setShowAnswer(false);
    setShowQuestion(false);

    // 延迟一点开始新单词
    setTimeout(() => {
      if (newWords.length > 0) {
        const firstWord = newWords[0];
        console.log('重新开始，第一个单词:', firstWord.english);
        setCurrentWord(firstWord);
        setRemainingWords(newWords.slice(1));

        if (autoPlay) {
          setTimeout(() => {
            speakText(firstWord.english);
          }, 500);
        }
      }
    }, 300);
  };

  // 获取类别标题
  const getCategoryTitle = () => {
    switch (wordCategory) {
      case 'months': return '月份单词';
      case 'weekdays': return '星期单词';
      case 'numbers': return '数字单词';
      case 'times': return '时间表达';
      default: return '听力训练';
    }
  };

  // 获取类别图标
  const getCategoryIcon = () => {
    switch (wordCategory) {
      case 'months': return '📅';
      case 'weekdays': return '📆';
      case 'numbers': return '🔢';
      case 'times': return '🕐';
      default: return '🎧';
    }
  };

  // 渲染选择界面
  const renderCategorySelection = () => (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" color="primary" gutterBottom>
          🎯 听力训练
        </Typography>

        <button onClick={() => navigate("/0")}>
          返回主目录
        </button>

        <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 4 }}>
          选择要学习的类别
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: 180,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}
              onClick={() => loadWordData('months')}
            >
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <CalendarMonth sx={{ fontSize: 48, mb: 2, color: '#1976d2' }} />
                <Typography variant="h6" gutterBottom>月份</Typography>
                <Typography variant="body2" color="text.secondary">
                  12个月份的英文表达
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: 180,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}
              onClick={() => loadWordData('weekdays')}
            >
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <CalendarViewWeek sx={{ fontSize: 48, mb: 2, color: '#1976d2' }} />
                <Typography variant="h6" gutterBottom>星期</Typography>
                <Typography variant="body2" color="text.secondary">
                  7个星期的英文表达
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: 180,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}
              onClick={() => loadWordData('numbers')}
            >
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <Numbers sx={{ fontSize: 48, mb: 2, color: '#1976d2' }} />
                <Typography variant="h6" gutterBottom>数字</Typography>
                <Typography variant="body2" color="text.secondary">
                  1-20数字的英文表达
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: 180,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}
              onClick={() => loadWordData('times')}
            >
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <AccessTime sx={{ fontSize: 48, mb: 2, color: '#1976d2' }} />
                <Typography variant="h6" gutterBottom>时间表达</Typography>
                <Typography variant="body2" color="text.secondary">
                  具体时间的英文读法
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>学习模式设置</Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button
                variant={shuffleMode ? "contained" : "outlined"}
                startIcon={<Shuffle />}
                onClick={() => setShuffleMode(!shuffleMode)}
                color="primary"
              >
                {shuffleMode ? '随机顺序' : '顺序学习'}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant={autoPlay ? "contained" : "outlined"}
                startIcon={<PlayArrow />}
                onClick={() => setAutoPlay(!autoPlay)}
                color="secondary"
              >
                {autoPlay ? '自动朗读' : '手动朗读'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>听力训练说明：</strong>
            <br />• 点击卡片选择学习类别
            <br />• 系统会自动朗读英文内容（看不见文字）
            <br />• 根据听到的内容做出判断
            <br />• 点击"我听懂了"表示听懂了，进入下一个
            <br />• 点击"没听懂"会显示答案（英文+翻译）
            <br />• 显示答案后可以点击"返回"回到听力界面
            <br />• 音频播放不受"返回"操作影响
            <br />• 点击"重复朗读"可以反复听当前内容
            <br />• 点击"显示答案"可以主动查看当前内容
          </Typography>
        </Alert>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>纯听力模式：</strong>
            <br />• 默认情况下，看不到任何文字内容
            <br />• 只能通过听来理解内容
            <br />• 只有显示答案时才能看到英文和翻译
            <br />• 可以随时返回听力界面继续练习
            <br />• 真正训练你的英语听力能力
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );

  // 渲染学习界面
  const renderLearningSession = () => {
    if (isLoading) {
      return (
        <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            加载中...
          </Typography>
        </Container>
      );
    }

    if (!currentWord) {
      return (
        <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            准备开始听力训练
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              // 确保有单词可以学习
              if (remainingWords.length > 0) {
                const nextWord = remainingWords[0];
                setCurrentWord(nextWord);
                setRemainingWords(remainingWords.slice(1));

                if (autoPlay) {
                  speakText(nextWord.english);
                }
              }
            }}
            sx={{ mt: 2 }}
          >
            开始听力训练
          </Button>
        </Container>
      );
    }

    return (
      <Container maxWidth="sm" sx={{ mt: 2, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, backgroundColor: '#f8f9fa' }}>
          {/* 学习进度 */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" component="h1" color="primary">
                {getCategoryIcon()} {getCategoryTitle()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`${usedWords.length + 1}/${wordList.length}`}
                  color="secondary"
                  size="small"
                />
                {isRepeating && (
                  <Chip
                    icon={<Repeat />}
                    label={`重复: ${repeatCount}`}
                    color="warning"
                    size="small"
                  />
                )}
                {isSpeaking && (
                  <Chip
                    label="播放中"
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                )}
                {showAnswer && (
                  <Chip
                    icon={<Translate />}
                    label="答案已显示"
                    color="success"
                    size="small"
                  />
                )}
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={(usedWords.length / wordList.length) * 100}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 1
              }}
            />
          </Box>

          {/* 当前内容卡片 */}
          <Card sx={{ mb: 3, borderRadius: 2, backgroundColor: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 4, minHeight: 250 }}>

              {/* 答案区域 - 只有在显示答案时才显示 */}
              {showAnswer ? (
                <Box>
                  {/* 返回按钮 */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Undo />}
                      onClick={handleBackToQuestion}
                      size="small"
                    >
                      返回听力
                    </Button>
                  </Box>

                  {/* 英文内容 */}
                  <Typography
                    variant="h1"
                    component="div"
                    sx={{
                      mb: 3,
                      fontWeight: 'bold',
                      color: '#1976d2',
                      fontSize: wordCategory === 'times' ?
                        { xs: '2.5rem', sm: '3rem' } :
                        { xs: '3rem', sm: '4rem' }
                    }}
                  >
                    {currentWord.english}
                  </Typography>

                  {/* 翻译区域 */}
                  <Box sx={{
                    mt: 3,
                    p: 3,
                    backgroundColor: '#e8f5e9',
                    borderRadius: 2,
                    border: '2px solid #4caf50'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Translate color="success" />
                      <Typography variant="h6" color="success.main">
                        中文翻译
                      </Typography>
                    </Box>

                    <Typography variant="h4" component="div" color="success.main" gutterBottom>
                      {currentWord.chinese}
                    </Typography>
                    {currentWord.pinyin && (
                      <Typography variant="h5" component="div" color="text.secondary">
                        {currentWord.pinyin}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                /* 问题区域 - 不显示任何文字内容 */
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <Box sx={{
                    mb: 4,
                    width: '100%',
                    height: '80px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#999',
                        fontStyle: 'italic'
                      }}
                    >
                      🎧 请仔细听...
                    </Typography>
                  </Box>

                  {/* 显示问题内容的按钮 */}
                  {!showQuestion ? (
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={handleShowQuestion}
                      sx={{ mb: 2 }}
                    >
                      显示问题内容
                    </Button>
                  ) : (
                    <Box sx={{
                      mb: 3,
                      p: 2,
                      backgroundColor: '#f0f7ff',
                      borderRadius: 2,
                      border: '1px dashed #1976d2'
                    }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 'bold',
                          color: '#1976d2'
                        }}
                      >
                        {currentWord.english}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        （这是问题内容）
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* 如果是时间类别，显示额外信息 */}
              {wordCategory === 'times' && showAnswer && (
                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={<AccessTime />}
                    label="时间表达"
                    color="info"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Box>
              )}

              {/* 重复状态提示 */}
              {isRepeating && (
                <Box sx={{
                  mb: 2,
                  p: 1,
                  backgroundColor: '#fff8e1',
                  borderRadius: 1,
                  border: '1px solid #ffd54f'
                }}>
                  <Typography variant="caption" color="warning.dark">
                    🔁 正在重复朗读，每 3 秒一次
                    <br />
                    已重复: {repeatCount} 次
                  </Typography>
                </Box>
              )}

              {/* 朗读控制区域 - 始终显示，不受答案显示状态影响 */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
                {/* 主播放按钮 */}
                <IconButton
                  onClick={toggleSpeaking}
                  sx={{
                    backgroundColor: isSpeaking ? 'secondary.main' : 'primary.main',
                    color: 'white',
                    width: 60,
                    height: 60,
                    '&:hover': { backgroundColor: isSpeaking ? 'secondary.dark' : 'primary.dark' }
                  }}
                >
                  {isSpeaking ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
                </IconButton>

                {/* 重复朗读按钮 */}
                <IconButton
                  onClick={toggleRepeating}
                  sx={{
                    backgroundColor: isRepeating ? 'warning.main' : 'primary.light',
                    color: isRepeating ? 'white' : 'primary.main',
                    width: 60,
                    height: 60,
                    '&:hover': { backgroundColor: isRepeating ? 'warning.dark' : 'primary.main' }
                  }}
                >
                  {isRepeating ? <RepeatOne sx={{ fontSize: 32 }} /> : <Repeat sx={{ fontSize: 32 }} />}
                </IconButton>

                {/* 重新播放按钮 */}
                <Tooltip title="重新播放">
                  <IconButton
                    onClick={speakCurrentWord}
                    sx={{
                      backgroundColor: 'primary.light',
                      color: 'primary.main',
                      width: 50,
                      height: 50,
                      '&:hover': { backgroundColor: 'primary.main', color: 'white' }
                    }}
                  >
                    <Refresh sx={{ fontSize: 24 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>

          {/* 控制按钮 - 根据是否显示答案显示不同的按钮 */}
          {showAnswer ? (
            /* 显示答案时的控制按钮 */
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    startIcon={<Undo />}
                    onClick={handleBackToQuestion}
                    fullWidth
                    sx={{
                      height: 56,
                      fontSize: '1rem',
                      borderRadius: 2
                    }}
                  >
                    返回听力
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<CheckCircle />}
                    onClick={() => {
                      // 保存单词到已使用列表
                      setUsedWords([...usedWords, currentWord]);
                      // 抽取下一个单词
                      drawNextWord();
                    }}
                    fullWidth
                    sx={{
                      height: 56,
                      fontSize: '1rem',
                      borderRadius: 2
                    }}
                  >
                    下一个
                  </Button>
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ textAlign: 'center', mt: 1 }}>
                • 返回听力：隐藏答案，继续练习当前内容
                <br />
                • 下一个：进入下一个学习内容
              </Typography>
            </Box>
          ) : (
            /* 不显示答案时的控制按钮 */
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<CheckCircle />}
                    onClick={handleIKnow}
                    fullWidth
                    sx={{
                      height: 56,
                      fontSize: '1.1rem',
                      borderRadius: 2
                    }}
                  >
                    我听懂了
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="large"
                    startIcon={<Psychology />}
                    onClick={handleIDontKnow}
                    fullWidth
                    sx={{
                      height: 56,
                      fontSize: '1.1rem',
                      borderRadius: 2,
                      borderWidth: 2
                    }}
                  >
                    没听懂
                  </Button>
                </Grid>
              </Grid>

              {/* 显示答案按钮 - 只在没有显示答案时显示 */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Visibility />}
                  onClick={handleShowAnswer}
                  sx={{ mb: 1 }}
                >
                  显示答案
                </Button>
                <Typography variant="caption" color="text.secondary" display="block">
                  点击查看完整答案（英文+翻译），可以随时返回听力界面
                </Typography>
              </Box>
            </Box>
          )}

          {/* 全局控制 */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<RotateLeft />}
              onClick={restartCurrentRound}
            >
              重新开始
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => {
                // 停止所有重复和语音
                stopRepeating();
                stopSpeaking();
                setShowFileList(true);
              }}
            >
              选择类别
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  };

  return (
    <>
      {showFileList ? renderCategorySelection() : renderLearningSession()}
    </>
  );
};

export default WordMemoryApp;