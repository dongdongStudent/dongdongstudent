import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Box, Button, IconButton,
  Stack, Chip, CircularProgress, Grid, LinearProgress, Zoom,
  List, ListItemButton, ListItemText, Divider, Alert,
  Card, CardContent, CardActionArea, Avatar, Badge,
  ToggleButton, ToggleButtonGroup, Tooltip
} from '@mui/material';
import {
  PlayArrow, Pause, ArrowBack,
  Headset, ChevronRight, AccessTime, Assignment,
  CheckCircle, Cancel, Info,
  School, MenuBook, Grade, LibraryBooks, Star,
  Repeat, RepeatOne  // 新增图标
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";

// ==================== 句子拆解工具函数 ====================

/**
 * 统一句子拆解管理器
 */
class SentenceSplitter {
  /**
   * 通用句子拆解函数 - 移除所有标点，处理缩写
   * @param {string} text - 要拆解的句子文本
   * @param {Object} options - 配置选项
   * @returns {Array} 拆解后的单词数组
   */
  static splitSentence(text, options = {}) {
    const {
      preserveCase = false,           // 是否保持大小写
      minWordLength = 1,              // 最小单词长度
      splitPattern = /\s+/,           // 初始分割模式
    } = options;

    if (!text || typeof text !== 'string') return [];

    console.log('原始文本:', text);

    // 1. 预处理：处理常见缩写和特殊字符
    let processedText = text;
    
    // 处理常见缩写，将其转换为没有标点的形式
    const abbreviationMap = {
      "i'm": "im",
      "I'm": "Im",
      "i'll": "ill",
      "I'll": "Ill",
      "i've": "ive",
      "I've": "Ive",
      "i'd": "id",
      "I'd": "Id",
      "can't": "cant",
      "don't": "dont",
      "won't": "wont",
      "isn't": "isnt",
      "aren't": "arent",
      "wasn't": "wasnt",
      "weren't": "werent",
      "hasn't": "hasnt",
      "haven't": "havent",
      "hadn't": "hadnt",
      "doesn't": "doesnt",
      "didn't": "didnt",
      "couldn't": "couldnt",
      "wouldn't": "wouldnt",
      "shouldn't": "shouldnt",
      "mustn't": "mustnt",
      "needn't": "neednt",
      "mightn't": "mightnt",
      "ain't": "aint",
      "let's": "lets",
      "that's": "thats",
      "what's": "whats",
      "who's": "whos",
      "where's": "wheres",
      "when's": "whens",
      "why's": "whys",
      "how's": "hows",
      "here's": "heres",
      "there's": "theres",
      "it's": "its",
      "he's": "hes",
      "she's": "shes",
      "we're": "were",
      "you're": "youre",
      "they're": "theyre"
    };

    // 替换所有缩写
    Object.keys(abbreviationMap).forEach(abbr => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      processedText = processedText.replace(regex, abbreviationMap[abbr]);
    });

    console.log('处理缩写后:', processedText);

    // 2. 移除所有标点符号（除了已经被处理的缩写中的撇号）
    processedText = processedText
      .replace(/[.,!?;'"()\[\]{}]/g, ' ')  // 移除标点
      .replace(/\s+/g, ' ')               // 合并多个空格
      .trim();

    console.log('移除标点后:', processedText);

    // 3. 按空格分割
    const rawWords = processedText.split(splitPattern);
    
    // 4. 清理和过滤
    const processedWords = rawWords.map(word => {
      let cleanedWord = word.trim();
      
      // 跳过空字符串
      if (cleanedWord === '') return '';
      
      // 处理大小写
      if (!preserveCase && cleanedWord.length > 0) {
        // 将单词转为小写，但保留首字母大写（如果原来是大写）
        if (/^[A-Z]/.test(cleanedWord) && cleanedWord.length > 1) {
          // 专有名词或句子开头的大写单词，保持首字母大写
          return cleanedWord.charAt(0) + cleanedWord.slice(1).toLowerCase();
        } else {
          // 其他情况转为全小写
          return cleanedWord.toLowerCase();
        }
      }
      
      return cleanedWord;
    });
    
    // 5. 过滤空字符串和短单词
    const result = processedWords.filter(w => w && w.length >= minWordLength);
    
    console.log('最终拆解结果:', result);
    return result;
  }

  /**
   * 智能句子拆解 - 专门处理连写和特殊格式
   * @param {string} text - 要拆解的句子文本
   * @returns {Array} 拆解后的单词数组
   */
  static splitSentenceIntelligently(text) {
    if (!text || typeof text !== 'string') return [];
    
    console.log('智能拆解 - 原始文本:', text);
    
    // 1. 处理连写情况：单词+标点+单词
    let normalizedText = text;
    
    // 模式匹配常见的连写情况
    const patterns = [
      // 处理点号后的连写：class.Good -> class Good
      { regex: /(\w+)([.,!?;])(\w+)/g, replacement: '$1 $3' },
      
      // 处理逗号后的连写：morning,class -> morning class
      { regex: /(\w+),(\w+)/g, replacement: '$1 $2' },
      
      // 处理空格+标点+单词的情况：已经在上面的replace中标点会被移除
    ];
    
    patterns.forEach(pattern => {
      normalizedText = normalizedText.replace(pattern.regex, pattern.replacement);
    });
    
    console.log('智能拆解 - 标准化后:', normalizedText);
    
    // 2. 使用标准拆解函数（移除所有标点）
    return this.splitSentence(normalizedText, {
      preserveCase: true,        // 保持大小写
      minWordLength: 1
    });
  }

  /**
   * 从SRT数据解析句子 - 移除所有标点
   * @param {string} srtText - SRT字幕文本
   * @param {Object} options - 拆解选项
   * @returns {Array} 解析后的句子数组
   */
  static fromSRT(srtText, options = {}) {
    const regex = /(\d+)\r?\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\r?\n([\s\S]*?)(?=\r?\n\r?\n|\r?\n*$)/g;
    const result = [];
    let match;
    
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const [hms, ms] = timeStr.split(',');
      const [h, m, s] = hms.split(':').map(parseFloat);
      return h * 3600 + m * 60 + s + parseFloat(ms) / 1000;
    };
    
    while ((match = regex.exec(srtText)) !== null) {
      const [, id, startTimeStr, endTimeStr, text] = match;
      const originalText = text.replace(/\r?\n/g, ' ').trim();
      
      console.log(`解析SRT句子 ${id}:`, originalText);
      
      // 使用智能拆解函数处理句子（移除所有标点）
      const words = this.splitSentenceIntelligently(originalText);
      
      result.push({
        id: parseInt(id),
        startTime: parseTime(startTimeStr),
        endTime: parseTime(endTimeStr),
        words,
        originalText,  // 保留原始文本用于显示
        wordCount: words.length,
        cleanText: words.join(' ') // 清理后的文本
      });
      
      console.log(`句子 ${id} 拆解结果:`, words);
    }
    
    return result;
  }

  /**
   * 从JSON数据解析句子
   * @param {Array|Object} jsonData - JSON数据
   * @param {Object} options - 拆解选项
   * @returns {Array} 解析后的句子数组
   */
  static fromJSON(jsonData, options = {}) {
    if (!jsonData) return [];
    
    // 处理数组或单个对象
    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
    
    return dataArray.map((item, index) => {
      const text = item.english || item.text || item.sentence || '';
      
      const words = this.splitSentenceIntelligently(text);
      
      return {
        id: item.id || index + 1,
        startTime: item.startTime || 0,
        endTime: item.endTime || 0,
        words,
        originalText: text,
        translation: item.chinese || item.translation || '',  // 中文翻译
        wordCount: words.length,
        metadata: {
          ...item,
          hasAudio: !!item.audio,
          hasTranslation: !!(item.chinese || item.translation)
        }
      };
    });
  }

  /**
   * 为拆解后的单词创建对象
   * @param {Array} words - 单词数组（已清理，无标点）
   * @param {number} sentenceIndex - 句子索引
   * @returns {Array} 单词对象数组
   */
  static createWordObjects(words, sentenceIndex) {
    return words.map((word, wordIndex) => {
      return {
        uid: `${sentenceIndex}-${wordIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        val: word,  // 存储清理后的单词（无标点）
        displayVal: word, // 显示值也是清理后的单词
        index: wordIndex,
        originalIndex: wordIndex,  // 原始顺序索引
        length: word.length,
        isCorrect: null,  // 是否正确（用于状态跟踪）
        selectedAt: null   // 选中时间戳
      };
    });
  }

  /**
   * 计算句子统计信息
   * @param {Array} sentences - 句子数组
   * @returns {Object} 统计信息
   */
  static calculateStats(sentences) {
    if (!sentences || !sentences.length) {
      return {
        totalSentences: 0,
        totalWords: 0,
        averageWordsPerSentence: 0,
        totalCharacters: 0,
        uniqueWords: 0,
        wordFrequency: {}
      };
    }

    const allWords = [];
    const wordFrequency = {};
    let totalCharacters = 0;

    sentences.forEach(sentence => {
      sentence.words.forEach(word => {
        allWords.push(word);
        totalCharacters += word.length;
        
        const lowerWord = word.toLowerCase();
        wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
      });
    });

    return {
      totalSentences: sentences.length,
      totalWords: allWords.length,
      averageWordsPerSentence: Math.round((allWords.length / sentences.length) * 10) / 10,
      totalCharacters,
      uniqueWords: Object.keys(wordFrequency).length,
      wordFrequency
    };
  }
}

// ==================== 主组件 ====================

const AutoFlowAddictiveListening = () => {
  const [playlistData, setPlaylistData] = useState({});
  const [grades, setGrades] = useState([]);
  const [currentGrade, setCurrentGrade] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [view, setView] = useState('grades');
  const navigate = useNavigate();

  const [subtitles, setSubtitles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userWords, setUserWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [score, setScore] = useState(100);
  const [hasFailed, setHasFailed] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 新增：播放模式状态
  const [playMode, setPlayMode] = useState('repeat'); // 'repeat' 或 'once'

  const audioRef = useRef(null);
  const loopTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const completionTimeRef = useRef(null);

  // ==================== 生命周期和辅助函数 ====================

  // 1. 实时时钟
  useEffect(() => {
    if (view !== 'result') {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [view]);

  // 2. 加载目录结构
  useEffect(() => {
    fetch('/SentenceListen/content.json')
      .then(res => res.json())
      .then(data => {
        console.log('加载的数据结构:', data);
        setPlaylistData(data);
        
        const gradeList = Object.keys(data).map(gradeKey => {
          const gradeData = data[gradeKey];
          return {
            id: gradeKey,
            name: gradeData.name,
            icon: getGradeIcon(gradeKey),
            unitCount: Object.keys(gradeData.units || {}).length
          };
        });
        
        setGrades(gradeList);
      })
      .catch(err => {
        console.error("JSON加载失败:", err);
        // 可以添加错误处理UI
      });
  }, []);

  // 辅助函数：获取年级图标
  const getGradeIcon = (gradeKey) => {
    if (gradeKey === 'special') return <Star />;
    if (gradeKey.includes('7')) return <School />;
    if (gradeKey.includes('8')) return <LibraryBooks />;
    if (gradeKey.includes('9')) return <Grade />;
    return <School />;
  };

  // 辅助函数：获取单元显示名称
  const getUnitDisplayName = (unitKey, unitData) => {
    return unitData?.name || unitKey;
  };

  const formatDateTime = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  };

  // ==================== 音频控制函数 ====================

  const stopPlayback = useCallback(() => {
    if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  // 修改：根据播放模式调整播放逻辑
  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    const item = subtitles[currentIndex];
    if (!audio || !item) return;

    stopPlayback();
    audio.currentTime = item.startTime;

    audio.play().then(() => {
      setIsPlaying(true);
      
      if (playMode === 'repeat') {
        // 重复播放模式：设置循环检测
        loopTimerRef.current = setInterval(() => {
          if (audio.currentTime >= item.endTime - 0.05) {
            audio.currentTime = item.startTime;
          }
        }, 30);
      } else {
        // 只播放一次模式：播放完成后停止
        const duration = item.endTime - item.startTime;
        setTimeout(() => {
          stopPlayback();
        }, duration * 1000 + 100); // 加100ms缓冲
      }
    }).catch(err => {
      console.warn("自动播放被浏览器拦截或音频未准备好:", err);
      setIsPlaying(false);
    });
  }, [currentIndex, subtitles, stopPlayback, playMode]);

  // 新增：处理音频结束事件
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioEnded = () => {
      if (playMode === 'once') {
        stopPlayback();
      }
    };

    audio.addEventListener('ended', handleAudioEnded);
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [playMode, stopPlayback]);

  // 自动播放效果
  useEffect(() => {
    if (view === 'quiz' && subtitles.length > 0) {
      const playTimer = setTimeout(() => {
        startPlayback();
      }, 300);
      return () => {
        clearTimeout(playTimer);
        stopPlayback();
      };
    }
  }, [currentIndex, view, subtitles.length, startPlayback, stopPlayback]);

  // ==================== 句子处理函数 ====================

  /**
   * 初始化句子 - 使用优化后的拆解方式
   */
  const initSentence = useCallback((sentenceIndex, sentencesData) => {
    if (!sentencesData || !sentencesData[sentenceIndex]) return;
    
    const sentence = sentencesData[sentenceIndex];
    
    console.log('初始化句子:', {
      index: sentenceIndex,
      originalText: sentence.originalText,
      cleanWords: sentence.words,
      wordCount: sentence.wordCount
    });
    
    // 使用增强的单词对象创建函数
    const wordObjects = SentenceSplitter.createWordObjects(sentence.words, sentenceIndex);
    
    console.log('创建的单词对象:', wordObjects.map(w => w.val));
    
    // 随机打乱顺序（用于拼写练习）
    const shuffledWords = [...wordObjects].sort(() => 0.5 - Math.random());
    
    setAvailableWords(shuffledWords);
    setUserWords([]);
    setShowAnswer(false);
  }, []);

  // ==================== 数据加载函数 ====================

  const loadLevelResources = useCallback((levelData, forceReload = false) => {
    if (!levelData) return;

    if (forceReload) {
      setSubtitles([]);
      setCurrentIndex(0);
      setUserWords([]);
      setAvailableWords([]);
    }

    setView('loading');

    const cacheBuster = forceReload ? `?t=${new Date().getTime()}` : '';

    fetch(levelData.srt + cacheBuster)
      .then(res => res.text())
      .then(text => {
        // 使用优化的SRT解析函数（移除所有标点）
        const parsedSubtitles = SentenceSplitter.fromSRT(text, {
          preserveCase: true
        });
        
        console.log('解析的句子数据:', {
          total: parsedSubtitles.length,
          stats: SentenceSplitter.calculateStats(parsedSubtitles),
          sample: parsedSubtitles[0] // 第一个句子示例
        });
        
        setSubtitles(parsedSubtitles);
        setCurrentIndex(0);
        initSentence(0, parsedSubtitles);
        setScore(100);

        startTimeRef.current = new Date();
        setView('quiz');
      })
      .catch((err) => {
        console.error("加载SRT失败:", err);
        alert("加载资源失败，请检查网络连接");
        setView('menu');
      });
  }, [initSentence]);

  // ==================== 用户交互处理函数 ====================

  const handleBackToMenu = () => {
    stopPlayback();
    setView('menu');
  };

  const handleWordClick = (wordObj) => {
    const currentSentence = subtitles[currentIndex];
    if (!currentSentence) return;
    
    const targetWords = currentSentence.words;
    const expectedWord = targetWords[userWords.length];
    
    if (wordObj.val === expectedWord) {
      // 答对的处理
      const newWords = [...userWords, wordObj.val];
      setUserWords(newWords);
      setAvailableWords(prev => prev.filter(w => w.uid !== wordObj.uid));

      if (newWords.length === targetWords.length) {
        stopPlayback();
        setTimeout(() => {
          if (currentIndex < subtitles.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            initSentence(nextIndex, subtitles);
          } else {
            completionTimeRef.current = new Date();
            setView('result');
          }
        }, 600);
      }
    } else {
      // 答错的扣分逻辑
      const totalWords = subtitles.reduce((sum, s) => sum + s.words.length, 0);
      const deductionPerWord = 100 / totalWords;

      const newScore = Math.max(0, score - deductionPerWord);
      setScore(Math.round(newScore * 100) / 100);

      setHasFailed(true);
      setTimeout(() => setHasFailed(false), 300);
    }
  };

  const handleShowAnswer = () => {
    if (!showAnswer && subtitles[currentIndex]) {
      const totalWords = subtitles.reduce((sum, s) => sum + s.words.length, 0);
      const deductionPerWord = 100 / totalWords;

      const target = subtitles[currentIndex].words;
      const remainingWords = target.length - userWords.length;

      const totalDeduction = deductionPerWord * remainingWords;
      const newScore = Math.max(0, score - totalDeduction);
      setScore(Math.round(newScore * 100) / 100);

      setShowAnswer(true);
    }
  };

  // 新增：切换播放模式
  const handlePlayModeChange = (event, newMode) => {
    if (newMode !== null) {
      setPlayMode(newMode);
      // 如果正在播放，需要重新启动播放以应用新的模式
      if (isPlaying) {
        stopPlayback();
        setTimeout(() => startPlayback(), 100);
      }
    }
  };

  // ==================== 视图渲染函数 ====================

  // ==================== 年级选择页面 ====================
  if (view === 'grades') {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Typography variant="h4" align="center" fontWeight="900" sx={{ color: '#1a237e', mb: 1 }}>
          📚 句子听力训练
        </Typography>
        <Button onClick={() => navigate("/")} sx={{ mb: 3 }}>
          返回主目录
        </Button>

        <Paper elevation={0} sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 2, mb: 4 }}>
          <Typography variant="body2" align="center" color="textSecondary">{formatDateTime(currentTime)}</Typography>
        </Paper>

        <Typography variant="h5" sx={{ mb: 3, color: '#424242', textAlign: 'center', fontWeight: 600 }}>
          请选择年级
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {grades.map((grade) => (
            <Grid item xs={12} sm={6} md={4} key={grade.id}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: '2px solid #e0e0e0',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: grade.id === 'special' ? '#ff9800' : '#3f51b5',
                    boxShadow: grade.id === 'special' 
                      ? '0 12px 20px rgba(255, 152, 0, 0.2)' 
                      : '0 12px 20px rgba(63, 81, 181, 0.2)'
                  }
                }}
                onClick={() => {
                  setCurrentGrade(grade.id);
                  setView('units');
                }}
              >
                <CardActionArea sx={{ height: '100%', p: 3 }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: grade.id === 'special' ? '#ff9800' : '#3f51b5',
                        margin: '0 auto 16px',
                        fontSize: '2rem'
                      }}
                    >
                      {grade.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" color="#1a237e" gutterBottom>
                      {grade.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {grade.unitCount} 个单元
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Badge 
                        badgeContent={grade.unitCount} 
                        color={grade.id === 'special' ? "warning" : "primary"} 
                      />
                    </Box>
                    {grade.id === 'special' && (
                      <Typography variant="caption" sx={{ 
                        mt: 1, 
                        display: 'block', 
                        color: '#ff9800',
                        fontWeight: 'bold'
                      }}>
                        特别练习
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
          选择年级开始听力训练
        </Typography>
      </Container>
    );
  }

  // ==================== 单元选择页面 ====================
  if (view === 'units' && currentGrade) {
    const gradeData = playlistData[currentGrade];
    if (!gradeData) return null;
    
    const units = gradeData.units || {};
    const unitKeys = Object.keys(units);
    
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
          <IconButton onClick={() => setView('grades')} sx={{ color: 'primary.main' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="900" sx={{ color: '#1a237e' }}>
              {gradeData.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              请选择学习单元
            </Typography>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 2, mb: 4 }}>
          <Typography variant="body2" align="center" color="textSecondary">{formatDateTime(currentTime)}</Typography>
        </Paper>

        {unitKeys.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
              暂无单元内容
            </Typography>
            <Typography variant="body2" color="textSecondary">
              该年级下还没有添加听力练习
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {unitKeys.map((unitKey, index) => {
              const unitData = units[unitKey];
              const itemCount = unitData?.items?.length || 0;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={unitKey}>
                  <Card
                    elevation={2}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: currentGrade === 'special' ? '#ff9800' : '#2196f3',
                        boxShadow: currentGrade === 'special'
                          ? '0 8px 16px rgba(255, 152, 0, 0.15)'
                          : '0 8px 16px rgba(33, 150, 243, 0.15)'
                      }
                    }}
                    onClick={() => {
                      setCurrentUnit(unitKey);
                      setView('menu');
                    }}
                  >
                    <CardActionArea sx={{ p: 2 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box sx={{
                          width: 56,
                          height: 56,
                          bgcolor: currentGrade === 'special' ? '#fff3e0' : '#e3f2fd',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          color: currentGrade === 'special' ? '#ff9800' : '#2196f3'
                        }}>
                          <MenuBook />
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="#1565c0" gutterBottom>
                          {getUnitDisplayName(unitKey, unitData)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          单元 {index + 1}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {itemCount} 个听力练习
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                          {[0, 1, 2].map((i) => (
                            <Box
                              key={i}
                              sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                bgcolor: i < (itemCount % 3 || 1) 
                                  ? (currentGrade === 'special' ? '#ff9800' : '#2196f3') 
                                  : '#e0e0e0'
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => setView('grades')}
          sx={{ width: '100%', py: 1.5, borderRadius: 2 }}
        >
          返回年级选择
        </Button>
      </Container>
    );
  }

  // ==================== 内容选择页面 ====================
  if (view === 'menu' && currentGrade && currentUnit) {
    const gradeData = playlistData[currentGrade];
    const unitData = gradeData?.units?.[currentUnit];
    const menuItems = unitData?.items || [];
    
    return (
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
          <IconButton onClick={() => setView('units')} sx={{ color: 'primary.main' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight="900" sx={{ color: '#1a237e' }}>
              {gradeData.name} · {getUnitDisplayName(currentUnit, unitData)}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              选择听力练习
            </Typography>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 2, mb: 3 }}>
          <Typography variant="body2" align="center" color="textSecondary">{formatDateTime(currentTime)}</Typography>
        </Paper>
        
        {menuItems.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
              暂无听力练习
            </Typography>
            <Typography variant="body2" color="textSecondary">
              该单元下还没有添加听力练习内容
            </Typography>
          </Paper>
        ) : (
          <>
            <Paper elevation={4} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <List sx={{ p: 0 }}>
                {menuItems.map((item, index) => (
                  <ListItemButton 
                    key={item.id || index} 
                    onClick={() => { 
                      setCurrentLevel(item); 
                      loadLevelResources(item); 
                    }} 
                    sx={{ 
                      py: 2.5, 
                      '&:hover': { bgcolor: '#e8eaf6' },
                      borderBottom: index < menuItems.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <Headset sx={{ mr: 2, color: '#3f51b5' }} />
                    <ListItemText 
                      primary={item.title} 
                      secondary={`ID: ${item.id}`}
                      primaryTypographyProps={{ fontWeight: 'bold', color: '#1a237e' }}
                      secondaryTypographyProps={{ fontSize: '0.8rem' }}
                    />
                    <ChevronRight color="action" />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => setView('units')}
              sx={{ width: '100%', mt: 3, py: 1.5, borderRadius: 2 }}
            >
              返回单元选择
            </Button>
          </>
        )}
      </Container>
    );
  }

  // ==================== 加载页面 ====================
  if (view === 'loading') {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3, color: '#3f51b5' }} />
          <Typography variant="h6" sx={{ mb: 2, color: '#1a237e' }}>
            正在加载听力资源...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            请稍候，正在准备音频和字幕
          </Typography>
          <LinearProgress sx={{ mt: 3, height: 6, borderRadius: 3 }} />
        </Paper>
      </Container>
    );
  }

  // ==================== 结算页面 ====================
  if (view === 'result') {
    // 使用记录的完成时间，不再更新
    const completionTime = completionTimeRef.current || new Date();
    const startTime = startTimeRef.current || completionTime;

    // 计算用时（固定值）
    const timeSpent = Math.round((completionTime.getTime() - startTime.getTime()) / 1000);

    // 格式化时间显示
    const formatTimeDisplay = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return minutes > 0 ? `${minutes}分${secs}秒` : `${secs}秒`;
    };

    const displayTime = formatTimeDisplay(timeSpent);
    const completionTimeStr = completionTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const completionDate = completionTime.toLocaleDateString();

    // 计算总单词数和每个单词的价值
    const totalWords = subtitles.reduce((sum, s) => sum + s.words.length, 0);
    const deductionPerWord = 100 / totalWords;

    // 计算正确率（基于扣分情况）
    const totalPossiblePoints = 100;
    const actualPoints = score;
    const accuracy = Math.round((actualPoints / totalPossiblePoints) * 100);

    // 计算错误数量和答对数量
    const totalErrors = Math.round((100 - score) / deductionPerWord);
    const correctAnswers = Math.max(0, totalWords - totalErrors);
    const totalQuestions = subtitles.length;

    // 获取成绩评级
    const getGrade = (percent) => {
      if (percent >= 90) return { text: '优秀', color: '#4caf50', emoji: '🏆' };
      if (percent >= 80) return { text: '良好', color: '#2196f3', emoji: '🎯' };
      if (percent >= 60) return { text: '及格', color: '#ff9800', emoji: '✅' };
      return { text: '加油', color: '#f44336', emoji: '💪' };
    };

    const grade = getGrade(accuracy);

    // 重新挑战时强制重新加载SRT
    const handleRestart = () => {
      if (currentLevel) {
        // 传递true参数强制重新加载
        loadLevelResources(currentLevel, true);
      }
    };

    // 返回单元选择页面
    const handleBackToUnits = () => {
      setView('units');
    };

    // 获取当前单元信息
    const gradeData = playlistData[currentGrade];
    const unitData = gradeData?.units?.[currentUnit];

    return (
      <Container maxWidth="sm" sx={{ mt: 5, py: 2 }}>
        {/* 返回按钮 */}
        <IconButton onClick={handleBackToUnits} sx={{ mb: 2, color: 'primary.main' }}>
          <ArrowBack />
        </IconButton>

        <Paper
          elevation={8}
          sx={{
            p: 3,
            borderRadius: 4,
            border: `4px solid ${grade.color}`,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
          {/* 顶部标题 */}
          <Typography variant="h4" sx={{
            fontWeight: '900',
            textAlign: 'center',
            color: '#1a237e',
            mb: 1,
            position: 'relative'
          }}>
            🎯 3_听力测试完成
          </Typography>
          <Typography variant="subtitle1" sx={{
            textAlign: 'center',
            color: 'text.secondary',
            mb: 3,
            fontWeight: 600
          }}>
            {currentLevel?.title} · {totalQuestions} 个句子 · {totalWords} 个单词
          </Typography>

          {/* 核心成绩区域 */}
          <Box sx={{
            textAlign: 'center',
            mb: 3,
            position: 'relative',
            backgroundColor: '#f8f9fa',
            borderRadius: 3,
            p: 2,
            border: '2px solid #e0e0e0'
          }}>
            {/* 分数和评级 */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 2
            }}>
              <Box sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                backgroundColor: `${grade.color}15`,
                border: `4px solid ${grade.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h2" sx={{
                  fontWeight: '900',
                  color: grade.color,
                  lineHeight: 1
                }}>
                  {accuracy}
                </Typography>
                <Typography variant="caption" sx={{
                  color: 'text.secondary',
                  fontWeight: 600
                }}>
                  分
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'left', ml: 2 }}>
                <Typography variant="h5" sx={{
                  fontWeight: '900',
                  color: grade.color
                }}>
                  {grade.emoji} {grade.text}
                </Typography>
                <Typography variant="body2" sx={{
                  color: 'text.secondary',
                  mt: 0.5
                }}>
                  最终得分: {score.toFixed(1)}
                </Typography>
              </Box>
            </Box>

            {/* 核心数据网格 */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {[
                { value: correctAnswers, label: '答对', color: '#4caf50', bgColor: '#e8f5e9' },
                { value: displayTime, label: '用时', color: '#ff9800', bgColor: '#fff3e0' },
                { value: totalErrors, label: '答错', color: '#f44336', bgColor: '#ffebee' },
                { value: totalWords, label: '总单词', color: '#2196f3', bgColor: '#e3f2fd' }
              ].map((item, index) => (
                <Grid item xs={6} key={index}>
                  <Paper sx={{
                    p: 1,
                    borderRadius: 2,
                    textAlign: 'center',
                    backgroundColor: item.bgColor,
                    border: `2px solid ${item.color}`
                  }}>
                    <Typography variant="h6" sx={{
                      fontWeight: 'bold',
                      color: item.color
                    }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: item.color,
                      fontWeight: 600
                    }}>
                      {item.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* 详细信息表格 */}
            <Paper sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.1)'
            }}>
              <Grid container spacing={0.5}>
                {[
                  { label: '测试类型:', value: '听力拼写', xs: 6 },
                  { label: '年级:', value: gradeData?.name || '未知年级', xs: 6 },
                  { label: '单元:', value: getUnitDisplayName(currentUnit, unitData) || '未知单元', xs: 6 },
                  { label: '正确率:', value: `${accuracy}%`, xs: 6, color: grade.color },
                  { label: '平均用时:', value: `${(timeSpent / totalQuestions).toFixed(1)}秒/句`, xs: 6 },
                  { label: '完成时间:', value: completionTimeStr, xs: 6 },
                  { label: '扣分次数:', value: `${totalErrors}次`, xs: 6, color: '#f44336' },
                  { label: '单词正确率:', value: `${Math.round((correctAnswers / totalWords) * 100)}%`, xs: 6, color: '#4caf50' },
                  { label: '每个单词价值:', value: `${deductionPerWord.toFixed(2)}分`, xs: 6 }
                ].map((item, index) => (
                  <Grid item xs={item.xs} key={index}>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 0.5,
                      flexWrap: 'wrap'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="caption" fontWeight="bold"
                        sx={{
                          color: item.color || 'inherit',
                          textAlign: 'right'
                        }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>

          {/* 成绩评价 */}
          <Alert
            severity={
              accuracy >= 90 ? "success" :
                accuracy >= 80 ? "info" :
                  accuracy >= 60 ? "warning" : "error"
            }
            sx={{
              mb: 2,
              fontWeight: 'bold',
              borderRadius: 2
            }}
            icon={false}
          >
            {accuracy >= 90 ? '🎉 太棒了！你的听力能力非常出色！' :
              accuracy >= 80 ? '👍 表现不错！继续努力可以更上一层楼！' :
                accuracy >= 60 ? '✅ 基础掌握良好，建议多练习！' :
                  '💪 需要加强听力练习，建议重新学习！'}
          </Alert>

          {/* 操作按钮 */}
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              startIcon={<ArrowBack />}
              onClick={handleBackToUnits}
              sx={{
                borderRadius: 2,
                py: 1,
                fontWeight: 'bold'
              }}
            >
              返回单元
            </Button>

            <Button
              fullWidth
              variant="contained"
              size="medium"
              color="primary"
              startIcon={<Assignment />}
              onClick={handleRestart}
              sx={{
                borderRadius: 2,
                py: 1,
                fontWeight: 'bold'
              }}
            >
              重新挑战
            </Button>
          </Stack>

          {/* 底部信息 */}
          <Typography variant="caption" sx={{
            display: 'block',
            textAlign: 'center',
            mt: 2,
            color: 'text.secondary',
            fontStyle: 'italic',
            fontSize: '0.7rem'
          }}>
            听力测试 · 完成时间: {completionDate} {completionTimeStr}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // ==================== 练习页面 ====================
  // 计算统计信息
  const totalWords = subtitles.reduce((sum, s) => sum + s.words.length, 0);
  const deductionPerWord = 100 / totalWords;
  const currentSentenceWords = subtitles[currentIndex]?.words.length || 0;
  const remainingWords = currentSentenceWords - userWords.length;
  const hintDeduction = remainingWords * deductionPerWord;

  // 计算已答对单词数
  const totalAnsweredCorrectly = subtitles.slice(0, currentIndex).reduce((sum, s) => sum + s.words.length, 0) + userWords.length;

  // 计算错误次数
  const totalErrors = Math.round((100 - score) / deductionPerWord);

  // 返回单元选择页面的函数
  const handleBackToUnits = () => {
    stopPlayback();
    setView('units');
  };

  // 获取当前单元信息
  const gradeData = playlistData[currentGrade];
  const unitData = gradeData?.units?.[currentUnit];

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <audio ref={audioRef} src={currentLevel?.audio} key={currentLevel?.audio} />

      {/* 顶部信息卡片 */}
      <Paper
        variant="outlined"
        sx={{
          mb: 2, p: 2, borderRadius: 3,
          bgcolor: '#fafafa',
          border: '2.5px solid #1a237e',
          boxShadow: '0 4px 12px rgba(26, 35, 126, 0.1)'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: '900', color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment fontSize="small" /> {currentLevel?.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {gradeData?.name} · {getUnitDisplayName(currentUnit, unitData)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <AccessTime sx={{ fontSize: 14 }} /> {formatDateTime(currentTime)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', px: 2, py: 0.5, bgcolor: '#1a237e', borderRadius: 2, minWidth: 100 }}>
            <Typography variant="h4" sx={{ fontWeight: '900', color: '#fff' }}>{score.toFixed(1)}</Typography>
            <Typography variant="caption" sx={{ color: '#cfd8dc', display: 'block' }}>当前得分</Typography>
          </Box>
        </Stack>

        {/* 统计信息网格 */}
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={3}>
            <Paper sx={{
              p: 1,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: '#e8f5e9',
              border: '1px solid #4caf50'
            }}>
              <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                <CheckCircle sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                已答对
              </Typography>
              <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold', mt: 0.5 }}>
                {totalAnsweredCorrectly}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{
              p: 1,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: '#ffebee',
              border: '1px solid #f44336'
            }}>
              <Typography variant="caption" sx={{ color: '#c62828', fontWeight: 'bold' }}>
                <Cancel sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                错误数
              </Typography>
              <Typography variant="h6" sx={{ color: '#c62828', fontWeight: 'bold', mt: 0.5 }}>
                {totalErrors}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{
              p: 1,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3'
            }}>
              <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 'bold' }}>
                总单词
              </Typography>
              <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 'bold', mt: 0.5 }}>
                {totalWords}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{
              p: 1,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: '#fff3e0',
              border: '1px solid #ff9800'
            }}>
              <Typography variant="caption" sx={{ color: '#ef6c00', fontWeight: 'bold' }}>
                <Info sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                错一个扣
              </Typography>
              <Typography variant="h6" sx={{ color: '#ef6c00', fontWeight: 'bold', mt: 0.5 }}>
                {deductionPerWord.toFixed(2)}分
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* 当前句子信息 */}
        <Box sx={{
          mt: 2,
          p: 1.5,
          bgcolor: '#f5f5f5',
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="caption" sx={{ color: '#616161', fontWeight: 'bold' }}>
            📝 第 {currentIndex + 1} 句: {currentSentenceWords} 个单词
          </Typography>
          <Typography variant="caption" sx={{ color: '#616161', fontWeight: 'bold' }}>
            🎯 已答: {userWords.length} / {currentSentenceWords}
          </Typography>
        </Box>
      </Paper>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleBackToUnits}
          startIcon={<ArrowBack />}
          sx={{ bgcolor: '#424242', color: '#fff', fontWeight: 'bold', '&:hover': { bgcolor: '#212121' } }}
        >
          返回单元
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(currentIndex / (subtitles.length || 1)) * 100}
            sx={{ height: 12, borderRadius: 6, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: '#00bcd4' } }}
          />
        </Box>
        <Typography variant="body2" fontWeight="900" color="#424242">{currentIndex + 1} / {subtitles.length}</Typography>
      </Stack>

      <Paper elevation={4} sx={{
        p: 4, borderRadius: 5, minHeight: 460, position: 'relative',
        border: hasFailed ? '4px solid #d32f2f' : '4px solid #e0e0e0',
        transition: 'all 0.2s', background: '#fff', textAlign: 'center'
      }}>
        <Box sx={{ mb: 4, minHeight: 60 }}>
          {showAnswer && <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: '900', display: 'block', mb: 1 }}>
            [ 提示已开启 -{hintDeduction.toFixed(1)}分 ]
          </Typography>}
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: showAnswer ? '#d32f2f' : '#1a237e', letterSpacing: 1 }}>
            {subtitles[currentIndex]?.words.map((w, i) => {
              const isAnswered = i < userWords.length;
              const isVisible = isAnswered || showAnswer;
              
              return (
                <span key={i} style={{
                  borderBottom: !isAnswered ? '2px solid #cfd8dc' : 'none',
                  margin: '0 6px',
                  color: isVisible ? 'inherit' : 'transparent',
                  display: 'inline-block'
                }}>
                  {w}
                </span>
              );
            })}
          </Typography>
        </Box>

        {/* 新增：播放模式切换区域 */}
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={3} sx={{ mb: 5 }}>
          <Tooltip title="播放模式">
            <ToggleButtonGroup
              value={playMode}
              exclusive
              onChange={handlePlayModeChange}
              aria-label="播放模式"
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  border: '2px solid #3f51b5',
                  '&.Mui-selected': {
                    backgroundColor: '#3f51b5',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#283593',
                    }
                  }
                }
              }}
            >
              <ToggleButton value="repeat" aria-label="重复播放">
                <Repeat fontSize="small" sx={{ mr: 1 }} />
                重复播放
              </ToggleButton>
              <ToggleButton value="once" aria-label="只播一次">
                <RepeatOne fontSize="small" sx={{ mr: 1 }} />
                只播一次
              </ToggleButton>
            </ToggleButtonGroup>
          </Tooltip>

          <Button
            variant="outlined"
            onClick={handleShowAnswer}
            disabled={showAnswer}
            sx={{ 
              borderRadius: 8, 
              px: 3, 
              color: '#d32f2f', 
              borderColor: '#d32f2f', 
              borderWidth: 2,
              fontWeight: 'bold'
            }}
          >
            {showAnswer ? "提示中" : `查看答案 (-${hintDeduction.toFixed(1)}分)`}
          </Button>

          <IconButton
            onClick={() => isPlaying ? stopPlayback() : startPlayback()}
            sx={{ 
              width: 84, 
              height: 84, 
              bgcolor: isPlaying ? '#d32f2f' : '#1a237e', 
              color: '#fff',
              '&:hover': {
                bgcolor: isPlaying ? '#c62828' : '#283593'
              }
            }}
          >
            {isPlaying ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
          </IconButton>
        </Stack>

        {/* 当前播放模式提示 */}
        <Box sx={{ mb: 3 }}>
          <Chip
            icon={playMode === 'repeat' ? <Repeat /> : <RepeatOne />}
            label={playMode === 'repeat' ? '当前模式：重复播放' : '当前模式：只播放一次'}
            color={playMode === 'repeat' ? 'primary' : 'secondary'}
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Grid container spacing={1.5} justifyContent="center">
          {availableWords.map((word) => (
            <Grid item key={word.uid}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => handleWordClick(word)}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2, 
                  borderWidth: 2, 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem', 
                  color: '#424242', 
                  borderColor: '#cfd8dc',
                  '&:hover': {
                    borderColor: '#1a237e',
                    backgroundColor: '#e8eaf6'
                  }
                }}
              >
                {word.displayVal}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default AutoFlowAddictiveListening;