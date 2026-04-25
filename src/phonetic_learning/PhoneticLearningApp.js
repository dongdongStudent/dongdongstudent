import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  LinearProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  School as SchoolIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Close as CloseIcon,
  Videocam as VideocamIcon,
  VolumeUp as VolumeUpIcon,
  EmojiEvents,
  Language as LanguageIcon
} from '@mui/icons-material';
import PhoneticTest from './PhoneticTest';
// 直接导入 JSON 数据
import phoneticDataJson from './phoneticData.json';

// 单词音频预加载管理器
class WordAudioPreloader {
  constructor() {
    this.loadedAudios = new Map();
  }

  preloadWordAudio(word) {
    if (this.loadedAudios.has(word)) return this.loadedAudios.get(word);

    const audioPath = `/phonetics/words/${word}.mp3`;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = audioPath;
    audio.load();

    this.loadedAudios.set(word, audio);
    return audio;
  }

  playWordAudio(word) {
    return new Promise((resolve, reject) => {
      let audio = this.loadedAudios.get(word);

      if (!audio) {
        audio = this.preloadWordAudio(word);
      }

      const onEnded = () => {
        audio.removeEventListener('ended', onEnded);
        resolve();
      };

      const onError = (err) => {
        audio.removeEventListener('error', onError);
        reject(err);
      };

      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      audio.currentTime = 0;
      audio.play().catch(reject);
    });
  }
}

// 视频预加载管理器（用于音标发音视频）
class PhoneticVideoPlayer {
  constructor() {
    this.loadedVideos = new Map();
  }

  playPhoneticVideo(symbol) {
    return new Promise((resolve, reject) => {
      const videoPath = `/phonetics/${symbol}.mp4`;

      const video = document.createElement('video');
      video.src = videoPath;
      video.muted = false;
      video.playsInline = true;
      video.preload = 'auto';
      video.style.display = 'none';
      document.body.appendChild(video);

      const onEnded = () => {
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('error', onError);
        setTimeout(() => {
          if (video.parentNode) video.parentNode.removeChild(video);
        }, 100);
        resolve();
      };

      const onError = (err) => {
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('error', onError);
        setTimeout(() => {
          if (video.parentNode) video.parentNode.removeChild(video);
        }, 100);
        reject(err);
      };

      video.addEventListener('ended', onEnded);
      video.addEventListener('error', onError);

      video.currentTime = 0;
      video.play().catch(reject);
    });
  }
}

// 简化的视频预加载管理器（用于口型视频大窗口）
class VideoPreloader {
  constructor() {
    this.loadedVideos = new Set();
    this.preloadLinks = new Set();
  }

  preloadVideo(videoPath) {
    if (this.loadedVideos.has(videoPath)) return;

    if (!this.preloadLinks.has(videoPath)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = videoPath;
      document.head.appendChild(link);
      this.preloadLinks.add(videoPath);
    }

    const hiddenVideo = document.createElement('video');
    hiddenVideo.preload = 'auto';
    hiddenVideo.src = videoPath;
    hiddenVideo.muted = true;
    hiddenVideo.style.display = 'none';
    document.body.appendChild(hiddenVideo);

    hiddenVideo.oncanplaythrough = () => {
      this.loadedVideos.add(videoPath);
      setTimeout(() => {
        if (hiddenVideo.parentNode) {
          hiddenVideo.parentNode.removeChild(hiddenVideo);
        }
      }, 1000);
    };

    hiddenVideo.load();
  }

  preloadBatch(videoPaths) {
    videoPaths.forEach(path => this.preloadVideo(path));
  }

  isLoaded(videoPath) {
    return this.loadedVideos.has(videoPath);
  }
}

const PhoneticLearningApp = () => {
  // 直接从导入的 JSON 中获取数据
  const phoneticData = phoneticDataJson.phoneticData;
  const phoneticSymbols = phoneticDataJson.phoneticSymbols;

  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [speakingWord, setSpeakingWord] = useState(null);
  const [playingPhoneticId, setPlayingPhoneticId] = useState(null);
  const [showMouthGuide, setShowMouthGuide] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [showChinese, setShowChinese] = useState(true);
  
  const videoRef = useRef(null);
  const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });
  const preloader = useRef(new VideoPreloader());
  const wordAudioPreloader = useRef(new WordAudioPreloader());
  const phoneticVideoPlayer = useRef(new PhoneticVideoPlayer());
  const preloadTimer = useRef(null);
  const isSwitchingRef = useRef(false);

  // 将音标字符串拆分成独立的音标符号（过滤重音符号）
  const splitPhoneticString = (phoneticStr) => {
    if (!phoneticSymbols.length) return [];
    
    let str = phoneticStr.replace(/\//g, '');
    const result = [];
    let i = 0;

    while (i < str.length) {
      let matched = false;

      for (const symbol of phoneticSymbols) {
        if (str.startsWith(symbol, i)) {
          result.push(symbol);
          i += symbol.length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        const char = str[i];
        if (char === 'ˈ' || char === 'ˌ') {
          i++;
        } else {
          result.push(char);
          i++;
        }
      }
    }

    return result;
  };

  // 查找音标对应的单词列表（返回包含 word, phonetic, translation 的对象数组）
  const findWordsBySymbol = (symbol) => {
    if (!phoneticData || Object.keys(phoneticData).length === 0) return [];
    
    const allCategories = [
      ...(phoneticData.longVowels?.items || []),
      ...(phoneticData.shortVowels?.items || []),
      ...(phoneticData.diphthongs?.items || []),
      ...(phoneticData.voicedConsonants?.items || []),
      ...(phoneticData.voicelessConsonants?.items || []),
      ...(phoneticData.voicedAffricates?.items || []),
      ...(phoneticData.voicelessAffricates?.items || []),
      ...(phoneticData.otherConsonants?.items || [])
    ];
    const found = allCategories.find(item => item.symbol === symbol);
    return found ? found.words : [];
  };

  const playPhoneticSound = async (phoneticSymbol, uniqueId, event) => {
    if (event) event.stopPropagation();

    if (phoneticSymbol === 'ˈ' || phoneticSymbol === 'ˌ' || phoneticSymbol.length === 0) {
      console.log('⚠️ 跳过无效音标:', phoneticSymbol);
      return;
    }

    console.log('🎬 播放音标视频:', phoneticSymbol, 'ID:', uniqueId);
    setPlayingPhoneticId(uniqueId);

    try {
      await phoneticVideoPlayer.current.playPhoneticVideo(phoneticSymbol);
      console.log('✅ 音标视频播放完成:', phoneticSymbol);
    } catch (error) {
      console.error('❌ 音标视频播放失败:', error);
      showMessage(`音标视频不存在: ${phoneticSymbol}.mp4`, 'error');
    } finally {
      setTimeout(() => setPlayingPhoneticId(null), 500);
    }
  };

  // 收集所有视频路径并预加载
  useEffect(() => {
    if (!phoneticData) return;
    
    const allVideoPaths = [];
    Object.values(phoneticData).forEach(category => {
      category.items?.forEach(item => {
        allVideoPaths.push(`/phonetics/${item.videoFile}`);
      });
    });

    const batchSize = 5;
    let currentIndex = 0;

    const loadBatch = () => {
      const batch = allVideoPaths.slice(currentIndex, currentIndex + batchSize);
      if (batch.length > 0) {
        preloader.current.preloadBatch(batch);
        currentIndex += batchSize;
        preloadTimer.current = setTimeout(loadBatch, 100);
      }
    };

    preloadTimer.current = setTimeout(loadBatch, 1000);

    return () => {
      if (preloadTimer.current) {
        clearTimeout(preloadTimer.current);
      }
    };
  }, [phoneticData]);

  // 预加载所有单词音频
  useEffect(() => {
    if (!phoneticData) return;
    
    const allWords = [];
    Object.values(phoneticData).forEach(category => {
      category.items?.forEach(item => {
        item.words?.forEach(wordObj => {
          if (!allWords.includes(wordObj.word.toLowerCase())) {
            allWords.push(wordObj.word.toLowerCase());
          }
        });
      });
    });

    setTimeout(() => {
      allWords.forEach(word => {
        wordAudioPreloader.current.preloadWordAudio(word);
      });
    }, 2000);
  }, [phoneticData]);

  // 鼠标悬停预加载
  const handleMouseEnter = (videoFile) => {
    const videoPath = `/phonetics/${videoFile}`;
    preloader.current.preloadVideo(videoPath);
  };

  // 播放单词发音
  const playWordSound = async (word, event) => {
    event.stopPropagation();
    console.log('🔊 播放单词:', word);
    setSpeakingWord(word);

    try {
      await wordAudioPreloader.current.playWordAudio(word);
      console.log('✅ 发音完成:', word);
    } catch (error) {
      console.error('❌ 发音失败:', error);
      showMessage(`单词音频不存在: ${word}.mp3`, 'error');
    } finally {
      setTimeout(() => setSpeakingWord(null), 500);
    }
  };

  // 播放视频（大窗口口型视频）
  const playVideo = (symbol, videoFile) => {
    console.log('🎬 点击音标观看口型视频:', symbol);

    setPlaying(symbol);
    setSelectedSymbol({ symbol, chinese: '' });

    const videoPath = `/phonetics/${videoFile}`;
    const newVideoInfo = {
      symbol: symbol,
      videoPath: videoPath,
      videoFile: videoFile,
      words: findWordsBySymbol(symbol)
    };

    if (videoOpen && currentVideo?.symbol === symbol && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.error('重新播放失败:', err));
      setTimeout(() => setPlaying(null), 100);
      return;
    }

    isSwitchingRef.current = true;
    setCurrentVideo(newVideoInfo);

    if (!videoOpen) {
      setVideoOpen(true);
    }

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = videoPath;

        const playPromise = videoRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('快速播放失败，尝试重新加载:', error);
            videoRef.current.load();
            setTimeout(() => {
              videoRef.current.play().catch(err => console.error('重新加载后播放失败:', err));
            }, 50);
          });
        }
      }

      setTimeout(() => {
        isSwitchingRef.current = false;
      }, 200);
    }, 50);

    setTimeout(() => setPlaying(null), 100);
  };

  const handleVideoClose = () => {
    setVideoOpen(false);
    setCurrentVideo(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleVideoError = () => {
    showMessage(`视频文件不存在: ${currentVideo?.videoFile}`, 'error');
  };

  const showMessage = (text, severity = 'success') => {
    setMessage({ open: true, text, severity });
  };

  // 渲染音标单元格
  const renderPhoneticCell = (item, index) => (
    <Box
      key={index}
      onClick={() => playVideo(item.symbol, item.videoFile)}
      onMouseEnter={() => handleMouseEnter(item.videoFile)}
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        p: 0.5,
        m: 0.3,
        minWidth: 65,
        borderRadius: 1.5,
        transition: 'all 0.15s ease',
        bgcolor: playing === item.symbol ? '#e3f2fd' : 'transparent',
        border: '1px solid #999',
        '&:hover': {
          bgcolor: '#f5f5f5',
          transform: 'scale(1.02)',
          border: '1px solid #1a237e'
        },
        position: 'relative'
      }}
    >
      <VideocamIcon sx={{ position: 'absolute', top: 2, right: 2, fontSize: 12, color: '#999' }} />
      <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#1a237e', fontSize: '1rem' }}>
        /{item.symbol}/
      </Typography>
      {showChinese && (
        <Typography variant="caption" color="primary" sx={{ fontSize: '0.65rem' }}>
          {item.chinese}
        </Typography>
      )}
      {playing === item.symbol && (
        <LinearProgress sx={{ width: '100%', mt: 0.3, borderRadius: 1, height: 2 }} />
      )}
    </Box>
  );

  // 计算总数
  const totalLongVowels = phoneticData.longVowels?.items?.length || 0;
  const totalShortVowels = phoneticData.shortVowels?.items?.length || 0;
  const totalDiphthongs = phoneticData.diphthongs?.items?.length || 0;
  const totalVoiced = phoneticData.voicedConsonants?.items?.length || 0;
  const totalVoiceless = phoneticData.voicelessConsonants?.items?.length || 0;
  const totalVoicedAff = phoneticData.voicedAffricates?.items?.length || 0;
  const totalVoicelessAff = phoneticData.voicelessAffricates?.items?.length || 0;
  const totalOthers = phoneticData.otherConsonants?.items?.length || 0;

  const totalVowels = totalLongVowels + totalShortVowels + totalDiphthongs;
  const totalConsonants = totalVoiced + totalVoiceless + totalVoicedAff + totalVoicelessAff + totalOthers;
  const totalAll = totalVowels + totalConsonants;

  return (
    <Box sx={{
      height: '100vh',
      bgcolor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 顶部导航 */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1a237e',
          color: 'white',
          p: 1,
          borderRadius: 0,
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon sx={{ fontSize: 24 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
              英语音标学习软件
            </Typography>
            <Chip
              label={`共${totalAll}个音标`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', height: 20, fontSize: '0.7rem' }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={showChinese ? "隐藏中文（测试模式）" : "显示中文（学习模式）"}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showChinese}
                    onChange={(e) => setShowChinese(e.target.checked)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4caf50',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LanguageIcon sx={{ fontSize: '0.9rem' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {showChinese ? '中文' : '隐藏'}
                    </Typography>
                  </Box>
                }
                labelPlacement="start"
                sx={{
                  margin: 0,
                  color: 'white',
                  '& .MuiFormControlLabel-label': {
                    marginRight: 0.5,
                    color: 'white'
                  }
                }}
              />
            </Tooltip>

            <Tooltip title="音标测试">
              <IconButton size="small" sx={{ color: 'white' }} onClick={() => setTestDialogOpen(true)}>
                <EmojiEvents fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="口型要领">
              <IconButton size="small" sx={{ color: 'white' }} onClick={() => setShowMouthGuide(!showMouthGuide)}>
                <RecordVoiceOverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.8, display: 'block' }}>
          💡 点击音标观看口型视频 | 点击📹图标也是口型视频 • 元音{totalVowels}个 | 辅音{totalConsonants}个
          {!showChinese && <span style={{ marginLeft: '8px', color: '#ffeb3b' }}>🔒 中文已隐藏 - 测试模式</span>}
        </Typography>
      </Paper>

      {/* 表格形式显示所有音标 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden', border: '3px solid #1a237e' }}>
          <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1a237e' }}>
                <TableCell sx={{ bgcolor: '#1a237e', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', width: '120px', py: 0.5, borderRight: '2px solid #fff' }}>
                  大类
                </TableCell>
                <TableCell sx={{ bgcolor: '#1a237e', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', width: '130px', py: 0.5, borderRight: '2px solid #fff' }}>
                  分类
                </TableCell>
                <TableCell sx={{ bgcolor: '#1a237e', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', py: 0.5 }}>
                  音标（按顺序）
                </TableCell>
                <TableCell sx={{ bgcolor: '#1a237e', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', width: '60px', textAlign: 'center', py: 0.5 }}>
                  数量
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* 元音 - 长元音 */}
              <TableRow sx={{ borderBottom: '2px solid #000' }}>
                <TableCell rowSpan={3} sx={{
                  bgcolor: '#fce4ec',
                  fontWeight: 'bold',
                  verticalAlign: 'middle',
                  fontSize: '0.85rem',
                  py: 0.5,
                  borderRight: '3px solid #1a237e',
                  borderBottom: '2px solid #000'
                }}>
                  元音
                </TableCell>
                <TableCell sx={{ bgcolor: '#fce4ec', fontSize: '0.8rem', py: 0.5, borderRight: '2px solid #ccc' }}>长元音</TableCell>
                <TableCell sx={{ bgcolor: '#fce4ec', py: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {phoneticData.longVowels?.items?.map((item, idx) => renderPhoneticCell(item, idx))}
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: '#fce4ec', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}>
                  {totalLongVowels}
                </TableCell>
              </TableRow>

              {/* 元音 - 短元音 */}
              <TableRow sx={{ borderBottom: '2px solid #000' }}>
                <TableCell sx={{ bgcolor: '#fce4ec', fontSize: '0.8rem', py: 0.5, borderRight: '2px solid #ccc' }}>短元音</TableCell>
                <TableCell sx={{ bgcolor: '#fce4ec', py: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {phoneticData.shortVowels?.items?.map((item, idx) => renderPhoneticCell(item, idx))}
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: '#fce4ec', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}>
                  {totalShortVowels}
                </TableCell>
              </TableRow>

              {/* 元音 - 双元音 */}
              <TableRow sx={{ borderBottom: '3px solid #1a237e' }}>
                <TableCell sx={{ bgcolor: '#fce4ec', fontSize: '0.8rem', py: 0.5, borderRight: '2px solid #ccc' }}>双元音</TableCell>
                <TableCell sx={{ bgcolor: '#fce4ec', py: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {phoneticData.diphthongs?.items?.map((item, idx) => renderPhoneticCell(item, idx))}
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: '#fce4ec', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}>
                  {totalDiphthongs}
                </TableCell>
              </TableRow>

              {/* 辅音 - 浊辅音 */}
              <TableRow sx={{ borderBottom: '2px solid #000' }}>
                <TableCell rowSpan={5} sx={{
                  bgcolor: '#e8eaf6',
                  fontWeight: 'bold',
                  verticalAlign: 'middle',
                  fontSize: '0.85rem',
                  py: 0.5,
                  borderRight: '3px solid #1a237e',
                  borderBottom: '2px solid #000'
                }}>
                  辅音
                </TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', fontSize: '0.8rem', py: 0.5, borderRight: '2px solid #ccc' }}>浊辅音</TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', py: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {phoneticData.voicedConsonants?.items?.map((item, idx) => renderPhoneticCell(item, idx))}
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}>
                  {totalVoiced}
                </TableCell>
              </TableRow>

              {/* 辅音 - 清辅音 */}
              <TableRow sx={{ borderBottom: '2px solid #000' }}>
                <TableCell sx={{ bgcolor: '#e8eaf6', fontSize: '0.8rem', py: 0.5, borderRight: '2px solid #ccc' }}>清辅音</TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', py: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {phoneticData.voicelessConsonants?.items?.map((item, idx) => renderPhoneticCell(item, idx))}
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}>
                  {totalVoiceless}
                </TableCell>
              </TableRow>

              {/* 辅音 - 浊辅音（破擦音） */}
              <TableRow sx={{ borderBottom: '2px solid #000' }}>
                <TableCell sx={{ bgcolor: '#e8eaf6', fontSize: '0.8rem', py: 0.5, borderRight: '2px solid #ccc' }}>浊辅音（破擦音）</TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', py: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {phoneticData.voicedAffricates?.items?.map((item, idx) => renderPhoneticCell(item, idx))}
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}>
                  {totalVoicedAff}
                </TableCell>
              </TableRow>

              {/* 辅音 - 清辅音（破擦音） */}
              <TableRow sx={{ borderBottom: '2px solid #000' }}>
                <TableCell sx={{ bgcolor: '#e8eaf6', fontSize: '0.8rem', py: 0.5, borderRight: '2px solid #ccc' }}>清辅音（破擦音）</TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', py: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {phoneticData.voicelessAffricates?.items?.map((item, idx) => renderPhoneticCell(item, idx))}
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}>
                  {totalVoicelessAff}
                </TableCell>
              </TableRow>

              {/* 辅音 - 浊辅音（半元音/鼻音/边音） */}
              <TableRow sx={{ borderBottom: '3px solid #1a237e' }}>
                <TableCell sx={{ bgcolor: '#e8eaf6', fontSize: '0.8rem', py: 0.5, borderRight: '2px solid #ccc' }}>浊辅音（半元音/鼻音/边音）</TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', py: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {phoneticData.otherConsonants?.items?.map((item, idx) => renderPhoneticCell(item, idx))}
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: '#e8eaf6', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}>
                  {totalOthers}
                </TableCell>
              </TableRow>

              {/* 总计行 */}
              <TableRow sx={{ bgcolor: '#fff3e0', borderTop: '3px solid #1a237e' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', py: 0.5, borderRight: '3px solid #1a237e' }}>
                  总计
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}>
                  元音{totalVowels}个 + 辅音{totalConsonants}个
                </TableCell>
                <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: '#e65100', py: 0.5 }}>
                  {totalAll}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Fade in={videoOpen} timeout={200}>
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            top: 70,
            right: 16,
            width: 480,
            maxWidth: '90vw',
            borderRadius: 2,
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: 5,
            bgcolor: '#1a1a1a',
            border: '1px solid #333',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <Box sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 2,
            bgcolor: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconButton size="small" sx={{ color: 'white', p: 0.5 }} onClick={handleVideoClose}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* 修改后的视频部分 - 完整显示视频 */}
          <Box sx={{ 
            position: 'relative', 
            bgcolor: '#000', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: 200
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              preload="auto"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: 280,
                objectFit: 'contain',
                display: 'block'
              }}
              onError={handleVideoError}
            >
              <source src={currentVideo?.videoPath || ''} type="video/mp4" />
              您的浏览器不支持视频播放。
            </video>

            <Box sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}>
              /{currentVideo?.symbol || ''}/ - 口型视频
            </Box>
          </Box>

          <Box sx={{
            p: 1.5,
            bgcolor: '#2a2a2a',
            borderTop: '1px solid #444'
          }}>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5
            }}>
              {currentVideo?.words && currentVideo.words.map((wordObj, wordIdx) => {
                const phoneticStr = wordObj.phonetic;
                const splitPhonetics = splitPhoneticString(phoneticStr);

                return (
                  <Tooltip key={wordIdx} arrow placement="top">
                    <Chip
                      label={
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Box
                              onClick={(e) => playWordSound(wordObj.word, e)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                bgcolor: speakingWord === wordObj.word ? '#4caf50' : 'transparent',
                                px: 0.5,
                                py: 0.2,
                                borderRadius: 1,
                                transition: 'background-color 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#1a237e',
                                  color: 'white'
                                }
                              }}
                            >
                              <Typography
                                variant="h6"
                                sx={{
                                  fontSize: '1.25rem',
                                  fontWeight: 600,
                                  color: '#fff',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                {wordObj.word}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                              {splitPhonetics.map((ph, phIdx) => {
                                const uniqueId = `${wordIdx}_${phIdx}_${ph}`;
                                return (
                                  <Tooltip key={phIdx} arrow>
                                    <Box
                                      onClick={(e) => playPhoneticSound(ph, uniqueId, e)}
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        px: 0.75,
                                        py: 0.3,
                                        borderRadius: 1,
                                        transition: 'background-color 0.2s ease',
                                        bgcolor: playingPhoneticId === uniqueId ? '#4caf50' : '#444',
                                        '&:hover': {
                                          bgcolor: '#1a237e'
                                        }
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: '0.9rem',
                                          color: '#fff',
                                          fontFamily: 'monospace',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {ph}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          </Box>
                          {showChinese && wordObj.translation && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.7rem',
                                color: '#aaa',
                                mt: 0.3,
                                ml: 0.5
                              }}
                            >
                              {wordObj.translation}
                            </Typography>
                          )}
                        </Box>
                      }
                      icon={<VolumeUpIcon sx={{ fontSize: '1.1rem', color: '#ccc' }} />}
                      onClick={(e) => playWordSound(wordObj.word, e)}
                      sx={{
                        cursor: 'pointer',
                        height: 'auto',
                        py: 0.5,
                        px: 1,
                        bgcolor: speakingWord === wordObj.word ? '#4caf50' : '#3a3a3a',
                        color: '#fff',
                        minWidth: '180px',
                        transition: 'background-color 0.2s ease',
                        '& .MuiChip-label': {
                          px: 1.5,
                          py: 0.2,
                          color: '#fff'
                        },
                        '& .MuiChip-icon': {
                          ml: 1,
                          mr: 0.5,
                          alignSelf: 'flex-start',
                          mt: 0.5
                        },
                        '&:hover': {
                          bgcolor: '#1a237e',
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' },
                          '& .MuiTypography-root': { color: 'white' },
                          '& .MuiTypography-caption': { color: '#ddd', bgcolor: 'rgba(255,255,255,0.2)' }
                        }
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* 口型要领面板 */}
      <Collapse in={showMouthGuide && selectedSymbol}>
        <Paper
          elevation={3}
          sx={{
            m: 1,
            p: 1.5,
            bgcolor: '#e3f2fd',
            borderRadius: 2,
            borderLeft: '4px solid #1a237e',
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#1a237e', fontWeight: 'bold', fontSize: '0.9rem' }}>
                发音要领：/{selectedSymbol?.symbol}/
              </Typography>
              <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                👆 点击音标卡片观看详细的口型发音视频
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowMouthGuide(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Collapse>

      {/* 消息提示 */}
      <Snackbar
        open={message.open}
        autoHideDuration={2000}
        onClose={() => setMessage({ ...message, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={message.severity} variant="filled" sx={{ fontSize: '0.8rem' }}>
          {message.text}
        </Alert>
      </Snackbar>

      {/* 音标测试对话框 */}
      <PhoneticTest
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
      />

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
    </Box>
  );
};

export default PhoneticLearningApp;