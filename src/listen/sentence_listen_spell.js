import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Box, Button, IconButton,
  Stack, CircularProgress, Grid, LinearProgress,
  List, ListItemButton, ListItemText,
  Card, CardActionArea, Avatar,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  PlayArrow, Pause, ArrowBack,
  Headset, ChevronRight, Backspace,
  School, MenuBook, Grade, LibraryBooks,
  Repeat, RepeatOne
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";

// ==================== 句子拆解工具函数 ====================
class SentenceSplitter {
  static splitSentence(text, options = {}) {
    const { preserveCase = false, minWordLength = 1, splitPattern = /\s+/ } = options;
    if (!text || typeof text !== 'string') return [];

    let processedText = text;
    const abbreviationMap = { "i'm":"im","I'm":"Im","i'll":"ill","I'll":"Ill","i've":"ive","I've":"Ive","i'd":"id","I'd":"Id","can't":"cant","don't":"dont","won't":"wont","isn't":"isnt","aren't":"arent","wasn't":"wasnt","weren't":"werent","hasn't":"hasnt","haven't":"havent","hadn't":"hadnt","doesn't":"doesnt","didn't":"didnt","couldn't":"couldnt","wouldn't":"wouldnt","shouldn't":"shouldnt","mustn't":"mustnt","needn't":"neednt","mightn't":"mightnt","ain't":"aint","let's":"lets","that's":"thats","what's":"whats","who's":"whos","where's":"wheres","when's":"whens","why's":"whys","how's":"hows","here's":"heres","there's":"theres","it's":"its","he's":"hes","she's":"shes","we're":"were","you're":"youre","they're":"theyre" };
    Object.keys(abbreviationMap).forEach(abbr => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      processedText = processedText.replace(regex, abbreviationMap[abbr]);
    });

    processedText = processedText.replace(/[.,!?;'"()\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
    const rawWords = processedText.split(splitPattern);
    const processedWords = rawWords.map(word => {
      let cleanedWord = word.trim();
      if (cleanedWord === '') return '';
      if (!preserveCase && cleanedWord.length > 0) {
        if (/^[A-Z]/.test(cleanedWord) && cleanedWord.length > 1) {
          return cleanedWord.charAt(0) + cleanedWord.slice(1).toLowerCase();
        } else {
          return cleanedWord.toLowerCase();
        }
      }
      return cleanedWord;
    });
    return processedWords.filter(w => w && w.length >= minWordLength);
  }

  static splitSentenceIntelligently(text) {
    if (!text || typeof text !== 'string') return [];
    let normalizedText = text;
    const patterns = [
      { regex: /(\w+)([.,!?;])(\w+)/g, replacement: '$1 $3' },
      { regex: /(\w+),(\w+)/g, replacement: '$1 $2' },
    ];
    patterns.forEach(pattern => { normalizedText = normalizedText.replace(pattern.regex, pattern.replacement); });
    return this.splitSentence(normalizedText, { preserveCase: true, minWordLength: 1 });
  }

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
      const words = this.splitSentenceIntelligently(originalText);
      result.push({
        id: parseInt(id), startTime: parseTime(startTimeStr),
        endTime: parseTime(endTimeStr), words, originalText,
        wordCount: words.length, cleanText: words.join(' ')
      });
    }
    return result;
  }

  static fromJSON(jsonData, options = {}) {
    if (!jsonData) return [];
    
    // 支持两种JSON格式：
    // 1. 新格式：包含metadata和sentences的对象
    // 2. 旧格式：句子数组
    
    // 检查是否是新格式（包含sentences字段）
    if (jsonData.sentences && Array.isArray(jsonData.sentences)) {
      return jsonData.sentences.map((sentence, index) => {
        const text = sentence.text || sentence.originalText || '';
        const words = sentence.words || this.splitSentenceIntelligently(text);
        return {
          id: sentence.id || index + 1,
          startTime: sentence.startTime || 0,
          endTime: sentence.endTime || 0,
          words,
          originalText: text,
          translation: sentence.translation || '',
          wordCount: words.length,
          cleanText: words.join(' '),
          metadata: { 
            ...sentence,
            hasTranslation: !!(sentence.translation)
          }
        };
      });
    }
    
    // 旧格式：直接是句子数组
    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
    return dataArray.map((item, index) => {
      const text = item.english || item.text || item.sentence || '';
      const words = this.splitSentenceIntelligently(text);
      return {
        id: item.id || index + 1,
        startTime: item.startTime || 0,
        endTime: item.endTime || 0,
        words, originalText: text,
        translation: item.chinese || item.translation || '',
        wordCount: words.length,
        cleanText: words.join(' '),
        metadata: { ...item, hasAudio: !!item.audio, hasTranslation: !!(item.chinese || item.translation) }
      };
    });
  }

  static createWordObjects(words, sentenceIndex) {
    return words.map((word, wordIndex) => ({
      uid: `${sentenceIndex}-${wordIndex}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
      val: word, displayVal: word, index: wordIndex, originalIndex: wordIndex,
      length: word.length, isCorrect: null, selectedAt: null
    }));
  }

  static calculateStats(sentences) {
    if (!sentences || !sentences.length) {
      return { totalSentences:0, totalWords:0, averageWordsPerSentence:0, totalCharacters:0, uniqueWords:0, wordFrequency:{} };
    }
    const allWords = []; const wordFrequency = {}; let totalCharacters = 0;
    sentences.forEach(s => { s.words.forEach(w => { allWords.push(w); totalCharacters += w.length; const lw = w.toLowerCase(); wordFrequency[lw] = (wordFrequency[lw]||0)+1; }); });
    return {
      totalSentences: sentences.length, totalWords: allWords.length,
      averageWordsPerSentence: Math.round((allWords.length/sentences.length)*10)/10,
      totalCharacters, uniqueWords: Object.keys(wordFrequency).length, wordFrequency
    };
  }
}

// ==================== 主组件 ====================
const AutoFlowAddictiveListening = () => {
  const [playlistData, setPlaylistData] = useState({});
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [grades, setGrades] = useState([]);
  const [currentGrade, setCurrentGrade] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [view, setView] = useState('versions');
  const navigate = useNavigate();

  const [subtitles, setSubtitles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userWords, setUserWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [score, setScore] = useState(100);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [playMode, setPlayMode] = useState('repeat');

  const audioRef = useRef(null);
  const loopTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const completionTimeRef = useRef(null);

  // ==================== 生命周期 ====================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [view]);

  useEffect(() => {
    fetch('/SentenceListen/content.json')
      .then(res => res.json())
      .then(data => {
        setPlaylistData(data);
        const versionList = Object.keys(data).map(versionKey => ({
          id: versionKey,
          name: versionKey,
          icon: '📚',
          gradeCount: Object.keys(data[versionKey] || {}).length
        }));
        setVersions(versionList);
      })
      .catch(err => console.error('加载失败', err));
  }, []);

  useEffect(() => {
    if (!currentVersion || !playlistData[currentVersion]) return;
    const versionData = playlistData[currentVersion];
    const gradeList = Object.keys(versionData).map(gk => ({
      id: gk,
      name: versionData[gk].name,
      icon: gk.includes('7') ? <School/> : gk.includes('8') ? <LibraryBooks/> : <Grade/>,
      unitCount: Object.keys(versionData[gk]?.units || {}).length
    }));
    setGrades(gradeList);
  }, [currentVersion, playlistData]);

  // ==================== 音频控制 ====================
  const stopPlayback = useCallback(() => {
    if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    const a = audioRef.current; 
    const it = subtitles[currentIndex];
    
    if (!a) {
      console.error('音频元素未找到');
      return;
    }
    
    if (!it) {
      console.error('当前句子未找到');
      return;
    }
    
    // 检查音频源是否设置
    if (!a.src) {
      console.error('音频源未设置，currentLevel?.audio:', currentLevel?.audio);
      return;
    }
    
    stopPlayback(); 
    a.currentTime = it.startTime;
    
    a.play().then(() => {
      setIsPlaying(true);
      console.log('音频开始播放，模式:', playMode);
      
      if (playMode === 'repeat') {
        loopTimerRef.current = setInterval(() => {
          if (a.currentTime >= it.endTime - 0.05) {
            a.currentTime = it.startTime;
          }
        }, 30);
      } else {
        setTimeout(() => stopPlayback(), (it.endTime - it.startTime)*1000 + 100);
      }
    }).catch((err) => {
      console.error('播放失败:', err);
      setIsPlaying(false);
      
      // 提供更详细的错误信息
      if (err.name === 'NotAllowedError') {
        console.error('浏览器阻止了自动播放，请先点击页面其他位置');
      } else if (err.name === 'NotSupportedError') {
        console.error('音频格式不支持或文件损坏');
      }
    });
  }, [currentIndex, subtitles, stopPlayback, playMode, currentLevel]);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const end = () => playMode === 'once' && stopPlayback();
    a.addEventListener('ended', end);
    return () => a.removeEventListener('ended', end);
  }, [playMode, stopPlayback]);

  useEffect(() => {
    if (view === 'quiz' && subtitles.length) {
      const t = setTimeout(startPlayback, 300);
      return () => { clearTimeout(t); stopPlayback(); };
    }
  }, [currentIndex, view, subtitles.length, startPlayback, stopPlayback]);

  // ==================== 句子初始化 ====================
  const initSentence = useCallback((idx, sents) => {
    if (!sents || !sents[idx]) return;
    const words = SentenceSplitter.createWordObjects(sents[idx].words, idx);
    setAvailableWords([...words].sort(() => 0.5 - Math.random()));
    setUserWords([]);
    setShowAnswer(false);
  }, []);

  // ==================== 加载资源 ====================
  const loadLevelResources = useCallback((level, force = false) => {
    if (!level) return;
    setView('loading');
    if (force) { setSubtitles([]); setCurrentIndex(0); setUserWords([]); setAvailableWords([]); }
    const cache = force ? `?t=${Date.now()}` : '';
    
    console.log('加载资源:', level);
    console.log('文件路径:', level.srt + cache);
    console.log('音频路径:', level.audio);
    
    // 检查文件扩展名，决定使用哪种解析方式
    const filePath = level.srt + cache;
    const isJSON = filePath.toLowerCase().endsWith('.json');
    
    fetch(filePath)
      .then(r => {
        if (isJSON) {
          return r.json(); // JSON文件直接解析为JSON
        } else {
          return r.text(); // SRT文件作为文本处理
        }
      })
      .then(data => {
        let subs;
        if (isJSON) {
          subs = SentenceSplitter.fromJSON(data, {preserveCase:true});
          console.log('从JSON加载的句子数:', subs.length);
        } else {
          subs = SentenceSplitter.fromSRT(data, {preserveCase:true});
          console.log('从SRT加载的句子数:', subs.length);
        }
        
        setSubtitles(subs); 
        setCurrentIndex(0); 
        initSentence(0, subs);
        setScore(100); 
        startTimeRef.current = new Date(); 
        setView('quiz');
        
        // 确保音频元素加载
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
            console.log('音频元素已加载，src:', audioRef.current.src);
          }
        }, 100);
      })
      .catch((err) => { 
        console.error('加载失败:', err);
        alert('加载失败: ' + err.message); 
        setView('menu'); 
      });
  }, [initSentence]);

  // ==================== 交互 ====================
  const handleBackToVersions = () => { stopPlayback(); setView('versions'); };
  const handleBackToGrades = () => { stopPlayback(); setView('grades'); };
  const handleBackToUnits = () => { stopPlayback(); setView('units'); };

  // 核心修改：选什么填什么，对错都允许
  const handleWordClick = (wo) => {
    const s = subtitles[currentIndex];
    if (!s || showAnswer) return;

    // 不管对错，直接填入
    const newUserWords = [...userWords, wo.val];
    setUserWords(newUserWords);
    setAvailableWords(prev => prev.filter(x => x.uid !== wo.uid));

    // 判断是否填完句子
    if (newUserWords.length === s.words.length) {
      // 计算错误扣分
      const totalWords = subtitles.reduce((a, b) => a + b.words.length, 0);
      const perWordScore = totalWords ? 100 / totalWords : 0;
      const correctCount = s.words.filter((w, i) => newUserWords[i] === w).length;
      const errorCount = s.words.length - correctCount;
      setScore(prev => Math.max(0, prev - errorCount * perWordScore));

      // 自动下一句
      stopPlayback();
      setTimeout(() => {
        if (currentIndex < subtitles.length - 1) {
          setCurrentIndex(currentIndex + 1);
          initSentence(currentIndex + 1, subtitles);
        } else {
          completionTimeRef.current = new Date();
          setView('result');
        }
      }, 600);
    }
  };

  // 撤销
  const handleUndo = () => {
    if (userWords.length === 0 || showAnswer) return;
    const lastWord = userWords.at(-1);
    const wordObj = SentenceSplitter.createWordObjects([lastWord], currentIndex)[0];

    setUserWords(prev => prev.slice(0, -1));
    setAvailableWords(prev => [...prev, wordObj].sort(() => 0.5 - Math.random()));
  };

  // 查看答案：自动填正确答案，锁死
  const handleShowAnswer = () => {
    if (showAnswer) return;
    const s = subtitles[currentIndex];
    if (!s) return;

    // 扣掉这题所有分
    const totalWords = subtitles.reduce((a, b) => a + b.words.length, 0);
    const perWordScore = totalWords ? 100 / totalWords : 0;
    setScore(prev => Math.max(0, prev - s.words.length * perWordScore));

    setUserWords(s.words);
    setShowAnswer(true);
  };

  const handlePlayModeChange = (_, m) => {
    if (m) { setPlayMode(m); if (isPlaying) { stopPlayback(); setTimeout(startPlayback,100); } }
  };

  // ==================== 版本选择 ====================
  if (view === 'versions') {
    return (
      <Container maxWidth="md" sx={{mt:5}}>
        <Typography variant="h4" align="center" fontWeight={900} sx={{color:'#1a237e',mb:2}}>
          🎧 句子听力测试
        </Typography>
        <Button onClick={()=>navigate('/')} sx={{mb:3}}>返回主目录</Button>

        <Typography variant="h5" align="center" sx={{mb:4}}>选择教材版本</Typography>

        <Grid container spacing={3}>
          {versions.map(v => (
            <Grid item xs={12} sm={6} md={4} key={v.id}>
              <Card elevation={4} sx={{borderRadius:3, border:'2px solid #e0e0e0', cursor:'pointer',
                '&:hover':{transform:'translateY(-6px)', boxShadow:'0 12px 24px rgba(0,0,0,0.1)'}}}
                onClick={()=>{ setCurrentVersion(v.id); setView('grades'); }}>
                <CardActionArea sx={{p:3}}>
                  <Box sx={{textAlign:'center'}}>
                    <Typography variant="h3" sx={{mb:2}}>{v.icon}</Typography>
                    <Typography variant="h6" fontWeight="bold">{v.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{v.gradeCount} 个年级</Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // ==================== 年级选择 ====================
  if (view === 'grades') {
    return (
      <Container maxWidth="md" sx={{mt:5}}>
        <Box sx={{display:'flex',alignItems:'center',mb:3,gap:2}}>
          <IconButton onClick={handleBackToVersions}><ArrowBack/></IconButton>
          <Typography variant="h4" fontWeight={900} color="#1a237e">{currentVersion}</Typography>
        </Box>
        <Grid container spacing={3}>
          {grades.map(g => (
            <Grid item xs={12} sm={6} md={4} key={g.id}>
              <Card elevation={3} sx={{borderRadius:3, border:'2px solid #e0e0e0', cursor:'pointer',
                '&:hover':{transform:'translateY(-6px)', boxShadow:'0 10px 20px rgba(0,0,0,0.1)'}}}
                onClick={()=>{ setCurrentGrade(g.id); setView('units'); }}>
                <CardActionArea sx={{p:3,textAlign:'center'}}>
                  <Avatar sx={{width:70,height:70,bgcolor:'#3f51b5',mb:2}}>{g.icon}</Avatar>
                  <Typography variant="h6" fontWeight="bold">{g.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{g.unitCount} 单元</Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // ==================== 单元选择 ====================
  if (view === 'units' && currentVersion && currentGrade) {
    const gData = playlistData[currentVersion]?.[currentGrade];
    const units = gData?.units || {};
    const keys = Object.keys(units);

    return (
      <Container maxWidth="md" sx={{mt:4}}>
        <Box sx={{display:'flex',alignItems:'center',mb:3,gap:2}}>
          <IconButton onClick={handleBackToGrades}><ArrowBack/></IconButton>
          <Box>
            <Typography variant="h5" fontWeight={900}>{gData?.name}</Typography>
            <Typography variant="body2" color="text.secondary">选择单元</Typography>
          </Box>
        </Box>
        <Grid container spacing={2}>
          {keys.map((uk,i) => (
            <Grid item xs={12} sm={6} md={4} key={uk}>
              <Card elevation={2} sx={{borderRadius:2,cursor:'pointer'}}
                onClick={()=>{ setCurrentUnit(uk); setView('menu'); }}>
                <CardActionArea sx={{p:2,textAlign:'center'}}>
                  <MenuBook sx={{fontSize:32,color:'#2196f3',mb:1}}/>
                  <Typography variant="subtitle1" fontWeight="bold">{units[uk]?.name || uk}</Typography>
                  <Typography variant="caption" color="text.secondary">{(units[uk]?.items?.length||0)} 个练习</Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // ==================== 菜单选择 ====================
  if (view === 'menu' && currentVersion && currentGrade && currentUnit) {
    const items = playlistData[currentVersion][currentGrade].units[currentUnit]?.items || [];
    return (
      <Container maxWidth="sm" sx={{mt:4}}>
        <Box sx={{display:'flex',alignItems:'center',mb:3,gap:2}}>
          <IconButton onClick={handleBackToUnits}><ArrowBack/></IconButton>
          <Box>
            <Typography variant="h5" fontWeight={900}>{playlistData[currentVersion][currentGrade].units[currentUnit]?.name}</Typography>
            <Typography variant="body2" color="text.secondary">选择测试</Typography>
          </Box>
        </Box>
        <Paper elevation={4} sx={{borderRadius:3,overflow:'hidden'}}>
          <List sx={{p:0}}>
            {items.map((itm,i) => (
              <ListItemButton key={i} onClick={()=>{ setCurrentLevel(itm); loadLevelResources(itm); }} sx={{py:2}}>
                <Headset sx={{mr:2,color:'#3f51b5'}}/>
                <ListItemText primary={itm.title} secondary={`ID: ${itm.id}`} primaryTypographyProps={{fontWeight:'bold'}}/>
                <ChevronRight/>
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Container>
    );
  }

  // ==================== 加载页 ====================
  if (view === 'loading') {
    return (
      <Container maxWidth="sm" sx={{mt:10}}>
        <Paper sx={{p:4,textAlign:'center',borderRadius:3}}>
          <CircularProgress size={60} sx={{mb:3}}/>
          <Typography variant="h6">加载中...</Typography>
        </Paper>
      </Container>
    );
  }

  // ==================== 结果页 ====================
  if (view === 'result') {
    const end = completionTimeRef.current || new Date();
    const start = startTimeRef.current || end;
    const sec = Math.round((end-start)/1000);
    const fmt = (s) => { const m=Math.floor(s/60); const sc=s%60; return m>0?`${m}分${sc}秒`:`${sc}秒`; };
    const totalW = subtitles.reduce((a,b)=>a+b.words.length,0);
    const acc = Math.round(score);
    const err = Math.round(((100 - score) / 100) * totalW);
    const cor = Math.max(0, totalW - err);

    const g = acc>=90?{t:'优秀',c:'#4caf50',e:'🏆'}:acc>=80?{t:'良好',c:'#2196f3',e:'🎯'}:acc>=60?{t:'及格',c:'#ff9800',e:'✅'}:{t:'加油',c:'#f44336',e:'💪'};

    return (
      <Container maxWidth="sm" sx={{mt:5}}>
        <IconButton onClick={handleBackToUnits} sx={{mb:2}}><ArrowBack/></IconButton>
        <Paper elevation={8} sx={{p:3,borderRadius:4,border:`4px solid ${g.c}`}}>
          <Typography variant="h4" align="center" sx={{fontWeight:900,mb:1}}>测试完成</Typography>
          <Typography align="center" color="text.secondary" sx={{mb:3}}>{currentLevel?.title}</Typography>
          <Box sx={{textAlign:'center',mb:3}}>
            <Box sx={{width:100,height:100,borderRadius:'50%',margin:'0 auto',border:`4px solid ${g.c}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <Typography variant="h2" sx={{fontWeight:900,color:g.c}}>{acc}</Typography>
              <Typography variant="caption">分</Typography>
            </Box>
            <Typography variant="h5" sx={{mt:2,color:g.c,fontWeight:900}}>{g.e} {g.t}</Typography>
          </Box>
          <Grid container spacing={1.5} sx={{mb:2}}>
            <Grid item xs={6}><Paper sx={{p:1,textAlign:'center',bgcolor:'#e8f5e9'}}><Typography variant="h6" color="#4caf50">{cor}</Typography><Typography variant="caption">正确</Typography></Paper></Grid>
            <Grid item xs={6}><Paper sx={{p:1,textAlign:'center',bgcolor:'#ffebee'}}><Typography variant="h6" color="#f44336">{err}</Typography><Typography variant="caption">错误</Typography></Paper></Grid>
            <Grid item xs={6}><Paper sx={{p:1,textAlign:'center',bgcolor:'#fff3e0'}}><Typography variant="h6" color="#ff9800">{fmt(sec)}</Typography><Typography variant="caption">用时</Typography></Paper></Grid>
            <Grid item xs={6}><Paper sx={{p:1,textAlign:'center',bgcolor:'#e3f2fd'}}><Typography variant="h6" color="#2196f3">{totalW}</Typography><Typography variant="caption">总单词</Typography></Paper></Grid>
          </Grid>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" onClick={handleBackToUnits}>返回</Button>
            <Button fullWidth variant="contained" onClick={()=>loadLevelResources(currentLevel,true)}>重考</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // ==================== 测试主界面 ====================
  const totalW = subtitles.reduce((a,b)=>a+b.words.length,0);
  const curLen = subtitles[currentIndex]?.words.length || 0;

  return (
    <Container maxWidth="md" sx={{mt:2}}>
      <audio 
        ref={audioRef} 
        src={currentLevel?.audio}
        preload="auto"
        onError={(e) => console.error('音频加载错误:', e)}
        onCanPlay={() => console.log('音频可以播放')}
        onLoadStart={() => console.log('音频开始加载')}
      />

      <Paper variant="outlined" sx={{mb:2,p:2,borderRadius:3,border:'2.5px solid #1a237e'}}>
        <Stack direction="row" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={900} color="#1a237e">{currentLevel?.title}</Typography>
          </Box>
          <Box sx={{bgcolor:'#1a237e',px:2,py:0.5,borderRadius:2,minWidth:80,textAlign:'center'}}>
            <Typography variant="h5" sx={{color:'#fff',fontWeight:900}}>{score.toFixed(0)}</Typography>
            <Typography variant="caption" sx={{color:'#cfd8dc'}}>得分</Typography>
          </Box>
        </Stack>
      </Paper>

      <Stack direction="row" alignItems="center" spacing={2} sx={{mb:2}}>
        <Button variant="contained" onClick={handleBackToUnits} sx={{bgcolor:'#424242'}} startIcon={<ArrowBack/>}>返回</Button>
        <Box sx={{flexGrow:1}}><LinearProgress variant="determinate" value={(currentIndex/subtitles.length)*100} sx={{height:12,borderRadius:6}}/></Box>
        <Typography fontWeight={900}>{currentIndex+1}/{subtitles.length}</Typography>
      </Stack>

      <Paper elevation={4} sx={{p:4,borderRadius:5,minHeight:460}}>
        <Box sx={{mb:4,minHeight:60,textAlign:'center'}}>
          <Typography variant="h5" sx={{fontWeight:'bold'}}>
            {subtitles[currentIndex]?.words.map((w,i) => (
              <span key={i} style={{margin:'0 6px',borderBottom:i>=userWords.length&&!showAnswer?'2px solid #cfd8dc':'none'}}>
                {showAnswer ? w : (userWords[i] ?? '')}
              </span>
            ))}
          </Typography>
        </Box>

        <Stack direction="row" justifyContent="center" spacing={2} sx={{mb:4}}>
          <ToggleButtonGroup value={playMode} exclusive onChange={handlePlayModeChange} size="small">
            <ToggleButton value="repeat"><Repeat/> 重复</ToggleButton>
            <ToggleButton value="once"><RepeatOne/> 一次</ToggleButton>
          </ToggleButtonGroup>

          <Button variant="outlined" startIcon={<Backspace/>} onClick={handleUndo} disabled={userWords.length===0 || showAnswer}>撤销</Button>
          <Button variant="outlined" color="error" disabled={showAnswer} onClick={handleShowAnswer}>查看答案</Button>

          <IconButton 
            onClick={() => {
              console.log('播放按钮点击，isPlaying:', isPlaying);
              console.log('currentLevel:', currentLevel);
              console.log('audioRef.current:', audioRef.current);
              console.log('audio src:', audioRef.current?.src);
              
              if (isPlaying) {
                stopPlayback();
              } else {
                // 先确保用户交互
                startPlayback();
              }
            }} 
            sx={{
              width:80,
              height:80,
              bgcolor:isPlaying?'#d32f2f':'#1a237e',
              color:'#fff',
              '&:hover': {
                bgcolor:isPlaying?'#b71c1c':'#0d1b6e'
              }
            }}
          >
            {isPlaying ? <Pause fontSize="large"/> : <PlayArrow fontSize="large"/>}
          </IconButton>
        </Stack>

        <Grid container spacing={1.5} justifyContent="center">
          {availableWords.map(w => (
            <Grid item key={w.uid}>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={()=>handleWordClick(w)} 
                disabled={showAnswer}
                sx={{textTransform:'none',fontSize:'1.1rem',fontWeight:'bold'}}
              >
                {w.displayVal}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default AutoFlowAddictiveListening;
