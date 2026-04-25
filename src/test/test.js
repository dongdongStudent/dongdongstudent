import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, Chip, TextField, InputAdornment,
  Card, CardContent, Alert, Snackbar, CircularProgress, Tooltip
} from '@mui/material';
import {
  Search as SearchIcon, 
  VolumeUp as VolumeUpIcon, 
  Clear as ClearIcon,
  History as HistoryIcon, 
  School as SchoolIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// 导入原始音标数据
import rawPhoneticDict from './phoneticDict.json';

// ========== 音标转换函数 ==========
const convertPhonetic = (ipa) => {
  if (!ipa) return ipa;
  
  // 音标符号转换表
  const conversions = {
    'ɐ': 'ə',      // 近开央元音 → 中央元音
    'ɹ': 'r',      // 齿龈近音 → 齿龈颤音
    'ɫ': 'l',      // 软腭化齿龈边音 → 普通 l
    'ɡ': 'g',      // 不同字体的 g
    'ɛ': 'e',      // 半开前不圆唇元音 → 半闭前不圆唇元音
  };
  
  let result = ipa;
  for (const [oldChar, newChar] of Object.entries(conversions)) {
    result = result.replace(new RegExp(oldChar, 'g'), newChar);
  }
  
  return result;
};

// 转换整个音标词典
const phoneticDict = Object.keys(rawPhoneticDict).reduce((acc, word) => {
  acc[word] = convertPhonetic(rawPhoneticDict[word]);
  return acc;
}, {});

const PhoneticQueryApp = () => {
  const [inputWord, setInputWord] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('phonetic_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });
  const [suggestions, setSuggestions] = useState([]);

  // 获取本地音标
  const getLocalPhonetic = (word) => {
    const lowerWord = word.toLowerCase();
    if (phoneticDict[lowerWord]) {
      return phoneticDict[lowerWord];
    }
    return null;
  };

  // 查询音标
  const searchPhonetic = () => {
    const word = inputWord.trim().toLowerCase();
    if (!word) {
      showMessage('请输入单词', 'warning');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      try {
        const localIpa = getLocalPhonetic(word);
        
        if (localIpa) {
          const result = {
            word: inputWord.trim(),
            ipa: localIpa,
            found: true,
            source: '本地词典'
          };
          setSearchResult(result);
          saveToHistory(word, localIpa);
          showMessage(`✅ 查询成功：${localIpa}`, 'success');
        } else {
          const result = {
            word: inputWord.trim(),
            ipa: '📖 未收录此单词',
            found: false,
            source: '无数据'
          };
          setSearchResult(result);
          showMessage(`❌ 单词 "${word}" 未收录`, 'error');
        }
      } catch (error) {
        console.error('查询失败:', error);
        showMessage('❌ 查询失败，请重试', 'error');
      } finally {
        setLoading(false);
        setSuggestions([]);
      }
    }, 100);
  };

  // 保存历史
  const saveToHistory = (word, ipa) => {
    const newHistory = [
      { word, ipa, timestamp: Date.now() },
      ...history.filter(h => h.word !== word)
    ].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('phonetic_history', JSON.stringify(newHistory));
  };

  // 清除所有历史
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('phonetic_history');
    showMessage('历史记录已清除', 'info');
  };

  // 删除单条历史
  const removeFromHistory = (wordToRemove) => {
    const newHistory = history.filter(item => item.word !== wordToRemove);
    setHistory(newHistory);
    localStorage.setItem('phonetic_history', JSON.stringify(newHistory));
    showMessage('已删除', 'info');
  };

  // 英式发音
  const speakBritish = () => {
    if (!searchResult?.found) return;
    setSpeaking(true);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(searchResult.word);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // 复制音标
  const copyToClipboard = () => {
    if (searchResult?.found) {
      navigator.clipboard.writeText(searchResult.ipa);
      showMessage('✅ 音标已复制到剪贴板', 'success');
    }
  };

  const showMessage = (text, severity) => {
    setMessage({ open: true, text, severity });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      searchPhonetic();
    }
  };

  const selectSuggestion = (word) => {
    setInputWord(word);
    setSuggestions([]);
  };

  // 获取建议（本地词典）
  useEffect(() => {
    if (inputWord.trim().length > 0) {
      const matches = Object.keys(phoneticDict)
        .filter(word => word.startsWith(inputWord.toLowerCase()))
        .slice(0, 8);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [inputWord]);

  const dictSize = Object.keys(phoneticDict).length;

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2
    }}>
      <Box sx={{ maxWidth: 700, width: '100%' }}>
        {/* 标题卡片 */}
        <Paper elevation={0} sx={{
          bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 4, p: 3, mb: 3, textAlign: 'center'
        }}>
          <SchoolIcon sx={{ fontSize: 48, color: '#1e3c72' }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            🇬🇧 英式音标查询
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            Received Pronunciation (RP) · 标准英式发音 · 纯本地离线
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
            <Chip label={`📚 本地词库 ${dictSize.toLocaleString()} 词`} size="small" color="primary" />
            <Chip label="🔒 完全离线" size="small" color="success" />
            <Chip label="⚡ 毫秒级查询" size="small" color="info" />
          </Box>
        </Paper>

        {/* 搜索卡片 */}
        <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              placeholder="输入单词，例如：parent, library, beautiful"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#1e3c72' }} />
                  </InputAdornment>
                ),
                endAdornment: inputWord && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setInputWord('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  bgcolor: 'white',
                  '&:hover fieldset': {
                    borderColor: '#1e3c72',
                  },
                }
              }}
            />
            
            {/* 自动完成建议 */}
            {suggestions.length > 0 && (
              <Paper sx={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                zIndex: 10,
                borderTop: 'none',
                borderRadius: 0,
                boxShadow: 3,
                maxHeight: 300,
                overflow: 'auto'
              }}>
                {suggestions.map((suggestion, idx) => (
                  <Box
                    key={idx}
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f0f0f0' },
                      borderBottom: idx < suggestions.length - 1 ? '1px solid #e0e0e0' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {suggestion}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {phoneticDict[suggestion]}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}
          </Box>
          
          <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={searchPhonetic}
              disabled={loading}
              sx={{ 
                bgcolor: '#1e3c72', 
                py: 1.5, 
                '&:hover': { bgcolor: '#2a5298' },
                fontSize: '1rem'
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : '🔍 查询音标'}
            </Button>
          </Box>
        </Paper>

        {/* 结果卡片 */}
        {searchResult && (
          <Card sx={{ borderRadius: 4, mb: 3, animation: 'fadeIn 0.3s' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold" sx={{ color: '#1e3c72', mb: 1 }}>
                {searchResult.word}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                {searchResult.found ? (
                  <Chip label="📚 本地词典" size="small" color="primary" />
                ) : (
                  <Chip label="❌ 未收录" size="small" color="error" />
                )}
                <Chip label="🇬🇧 英式 RP" size="small" color="info" />
              </Box>

              <Paper sx={{ 
                bgcolor: '#e8f4f8', 
                p: 3, 
                borderRadius: 2, 
                my: 2, 
                position: 'relative',
                transition: 'all 0.3s'
              }}>
                <Typography 
                  variant="h4" 
                  fontFamily="'Lucida Sans', 'Lucida Sans Regular', monospace" 
                  fontWeight="bold"
                  color={searchResult.found ? '#1a237e' : '#f44336'}
                  sx={{ letterSpacing: '1px' }}
                >
                  {searchResult.ipa}
                </Typography>
                {searchResult.found && (
                  <Tooltip title="复制音标">
                    <IconButton 
                      size="small" 
                      sx={{ position: 'absolute', top: 8, right: 8 }} 
                      onClick={copyToClipboard}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Paper>

              {searchResult.found && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={speakBritish} 
                    disabled={speaking} 
                    startIcon={<VolumeUpIcon />}
                    sx={{ bgcolor: '#1e3c72', '&:hover': { bgcolor: '#2a5298' }, py: 1 }}
                  >
                    {speaking ? '🔊 发音中...' : '🇬🇧 英式发音'}
                  </Button>
                </Box>
              )}

              {!searchResult.found && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  💡 提示：单词可能不在词库中，或请检查拼写
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* 历史记录 */}
        {history.length > 0 && (
          <Paper elevation={2} sx={{ borderRadius: 4, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon fontSize="small" color="primary" />
                <Typography fontWeight="bold">最近查询 ({history.length})</Typography>
              </Box>
              <Button size="small" onClick={clearHistory} startIcon={<DeleteIcon />} color="error">
                清空全部
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {history.map((item, i) => (
                <Chip 
                  key={i} 
                  label={item.word} 
                  variant="outlined" 
                  color="primary"
                  onClick={() => {
                    setInputWord(item.word);
                    setSearchResult({ 
                      word: item.word, 
                      ipa: item.ipa, 
                      found: true, 
                      source: '本地词典' 
                    });
                  }}
                  onDelete={() => removeFromHistory(item.word)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* 统计信息 */}
        <Box sx={{ textAlign: 'center', mt: 2, color: 'rgba(255,255,255,0.7)' }}>
          <Typography variant="caption">
            📖 共收录 {dictSize.toLocaleString()} 个单词 · 完全离线运行 · 无需网络
          </Typography>
        </Box>

        <Snackbar 
          open={message.open} 
          autoHideDuration={2000} 
          onClose={() => setMessage({ ...message, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={message.severity} variant="filled">
            {message.text}
          </Alert>
        </Snackbar>
      </Box>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default PhoneticQueryApp;