import React, { useState, useEffect } from 'react';
import { sentenceApi } from './api';

// ==================== 单词拆分工具 ====================
const splitWords = (text) => {
  if (!text) return [];
  
  // 处理常见缩写
  let processedText = text;
  const contractions = [
    "I'm", "i'm", "I'll", "i'll", "I've", "i've", "I'd", "i'd",
    "you're", "you'll", "you've", "you'd", "he's", "he'll", "he'd",
    "she's", "she'll", "she'd", "it's", "it'll", "it'd",
    "we're", "we'll", "we've", "we'd", "they're", "they'll", "they've", "they'd",
    "that's", "that'll", "that'd", "what's", "what'll", "what'd",
    "can't", "cannot", "don't", "doesn't", "didn't", "won't", "wouldn't",
    "shouldn't", "couldn't", "mustn't", "isn't", "aren't", "wasn't", "weren't"
  ];

  contractions.forEach(contraction => {
    const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
    const placeholder = contraction.replace("'", "@@@");
    processedText = processedText.replace(regex, placeholder);
  });

  // 移除标点
  processedText = processedText
    .replace(/[.,!?;:"()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = processedText.split(' ').filter(w => w && w.length > 0);
  return words.map(word => word.replace(/@@@/g, "'"));
};

// ==================== 音频播放 ====================
const AudioPlayer = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const speak = () => {
    if (!text || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    utterance.onstart = () => { 
      setIsPlaying(true); 
      setHasPlayed(true); 
    };
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (text && !hasPlayed) {
      const timer = setTimeout(speak, 500);
      return () => {
        clearTimeout(timer);
        window.speechSynthesis?.cancel();
      };
    }
  }, [text]);

  return (
    <div style={styles.audioPlayer}>
      <div style={{ fontSize: '48px', marginBottom: '10px' }}>
        {isPlaying ? '🔊' : hasPlayed ? '🔈' : '⏳'}
      </div>
      <div style={styles.audioStatus}>
        {isPlaying ? '正在播放...' : hasPlayed ? '已播放' : '准备播放...'}
      </div>
      <button 
        onClick={speak} 
        style={{
          ...styles.playButton,
          opacity: isPlaying ? 0.5 : 1,
          cursor: isPlaying ? 'not-allowed' : 'pointer'
        }} 
        disabled={isPlaying}
      >
        {isPlaying ? '播放中' : '重新播放'}
      </button>
    </div>
  );
};

// ==================== 句子查看器组件 ====================
const SentenceViewer = ({ sentences, onClose, onSelectSentence }) => {
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('time');

  // 过滤和排序句子
  const getFilteredSentences = () => {
    let filtered = [...sentences];
    
    if (filter === 'mastered') {
      filtered = filtered.filter(s => s.pass === true);
    } else if (filter === 'unmastered') {
      filtered = filtered.filter(s => s.pass !== true);
    }
    
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(s => 
        s.text?.toLowerCase().includes(search) || 
        s.chinese?.toLowerCase().includes(search)
      );
    }
    
    filtered.sort((a, b) => {
      if (sortBy === 'text') {
        return (a.text || '').localeCompare(b.text || '');
      } else if (sortBy === 'correct') {
        return (b.correct_count || 0) - (a.correct_count || 0);
      } else {
        return new Date(b.time || 0) - new Date(a.time || 0);
      }
    });
    
    return filtered;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSentences = getFilteredSentences();

  return (
    <div style={styles.viewerOverlay}>
      <div style={styles.viewerContainer}>
        <div style={styles.viewerHeader}>
          <h2 style={styles.viewerTitle}>📚 句子库查看器</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* 过滤栏 */}
        <div style={styles.viewerFilterBar}>
          <input
            type="text"
            placeholder="搜索句子或中文..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={styles.viewerSearch}
          />
          
          <div style={styles.viewerFilterGroup}>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.viewerSelect}>
              <option value="all">全部句子</option>
              <option value="mastered">已掌握</option>
              <option value="unmastered">未掌握</option>
            </select>
            
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.viewerSelect}>
              <option value="time">按时间</option>
              <option value="text">按字母</option>
              <option value="correct">按正确率</option>
            </select>
          </div>
        </div>

        {/* 统计 */}
        <div style={styles.viewerStats}>
          <span style={{...styles.viewerStatBadge, backgroundColor: '#2196F3'}}>
            总数: {sentences.length}
          </span>
          <span style={{...styles.viewerStatBadge, backgroundColor: '#4CAF50'}}>
            已掌握: {sentences.filter(s => s.pass === true).length}
          </span>
          <span style={{...styles.viewerStatBadge, backgroundColor: '#FF9800'}}>
            未掌握: {sentences.filter(s => s.pass !== true).length}
          </span>
        </div>

        {/* 句子列表 */}
        <div style={styles.viewerList}>
          {filteredSentences.map((sentence, index) => (
            <div 
              key={sentence.id} 
              style={styles.viewerItem}
              onClick={() => {
                onSelectSentence(index);
                onClose();
              }}
            >
              <div style={styles.viewerItemHeader}>
                <span style={styles.viewerItemIndex}>#{index + 1}</span>
                <span style={{
                  ...styles.viewerItemBadge,
                  backgroundColor: sentence.pass ? '#4CAF50' : '#FF9800'
                }}>
                  {sentence.pass ? '✅ 已掌握' : '⏳ 学习中'}
                </span>
              </div>
              
              <div style={styles.viewerItemEnglish}>📖 {sentence.text}</div>
              <div style={styles.viewerItemChinese}>🌏 {sentence.chinese}</div>
              
              <div style={styles.viewerItemStats}>
                <span>📊 {sentence.extraction_count || 0}</span>
                <span>✅ {sentence.correct_count || 0}</span>
                <span>❌ {sentence.wrong_count || 0}</span>
                <span>⏰ {formatDate(sentence.time)}</span>
              </div>
            </div>
          ))}

          {filteredSentences.length === 0 && (
            <div style={styles.viewerEmpty}>
              没有找到匹配的句子
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== 主测试组件 ====================
const SentenceTest = () => {
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [userWords, setUserWords] = useState([]);
  const [wordStatus, setWordStatus] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(100);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState('sentences');
  const [availableFiles, setAvailableFiles] = useState([]);
  const [showViewer, setShowViewer] = useState(false);

  // 加载文件列表
  useEffect(() => {
    loadFileList();
  }, []);

  const loadFileList = async () => {
    try {
      const result = await sentenceApi.getSentenceFiles();
      if (result.flag === 1) {
        setAvailableFiles(result.content.files);
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
    }
  };

  // 加载句子
  const loadSentences = async () => {
    setLoading(true);
    setMessage('加载中...');
    try {
      const result = await sentenceApi.getSentences(selectedFile);
      if (result?.sentences) {
        const sentencesArray = Object.entries(result.sentences).map(([id, data]) => ({ 
          id, 
          ...data 
        }));
        setSentences(sentencesArray);
        setCurrentIndex(0);
        setScore(100);
        setMessage(`加载成功，共 ${sentencesArray.length} 个句子`);
      } else {
        setMessage('加载失败：数据格式错误');
      }
    } catch (error) {
      setMessage('加载失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始化当前句子的单词
  useEffect(() => {
    if (sentences.length === 0 || !sentences[currentIndex]) return;
    
    const words = splitWords(sentences[currentIndex].text);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    
    const status = {};
    shuffled.forEach((word, i) => { 
      status[`${word}-${i}`] = true; 
    });
    setWordStatus(status);
    setUserWords([]);
    setShowResult(false);
  }, [currentIndex, sentences]);

  // 处理单词点击
  const handleWordClick = (word, index) => {
    if (showResult) return;
    
    const wordKey = `${word}-${index}`;
    if (!wordStatus[wordKey]) return;
    
    setWordStatus(prev => ({ ...prev, [wordKey]: false }));
    const newUserWords = [...userWords, word];
    setUserWords(newUserWords);

    const targetWords = splitWords(sentences[currentIndex].text);
    
    if (newUserWords.length === targetWords.length) {
      const correct = newUserWords.join(' ') === targetWords.join(' ');
      setIsCorrect(correct);
      setShowResult(true);
      
      if (!correct) setScore(prev => Math.max(0, prev - 10));
      
      // 更新统计
      sentenceApi.updateSentenceStats(sentences[currentIndex].id, {
        correct, 
        wrong: !correct, 
        extraction: true
      }, selectedFile).catch(console.error);
    }
  };

  // 重置当前题目
  const handleReset = () => {
    if (!sentences[currentIndex]) return;
    
    const words = splitWords(sentences[currentIndex].text);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    
    const status = {};
    shuffled.forEach((word, i) => { 
      status[`${word}-${i}`] = true; 
    });
    setWordStatus(status);
    setUserWords([]);
    setShowResult(false);
  };

  // 下一题
  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setMessage('恭喜！已完成所有句子');
      setShowResult(false);
    }
  };

  // 重新开始
  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(100);
    setMessage('重新开始');
  };

  // 跳转到指定句子
  const handleSelectSentence = (index) => {
    setCurrentIndex(index);
    setShowResult(false);
  };

  const currentSentence = sentences[currentIndex];
  const targetWords = currentSentence ? splitWords(currentSentence.text) : [];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📝 句子听力测试</h1>
      
      {/* 控制栏 */}
      <div style={styles.controlBar}>
        <div style={styles.fileSelector}>
          <select 
            value={selectedFile} 
            onChange={(e) => setSelectedFile(e.target.value)} 
            style={styles.select}
          >
            <option value="sentences">sentences.json (默认)</option>
            {availableFiles.map(file => (
              <option key={file} value={file.replace('.json', '')}>
                {file}
              </option>
            ))}
          </select>
          <button 
            onClick={loadSentences} 
            style={styles.button} 
            disabled={loading}
          >
            {loading ? '加载中...' : '📂 加载句子'}
          </button>
          {sentences.length > 0 && (
            <button 
              onClick={() => setShowViewer(true)} 
              style={{...styles.button, backgroundColor: '#8b5cf6'}}
            >
              📚 查看所有句子
            </button>
          )}
        </div>
        
        <div style={styles.scoreSection}>
          <span style={styles.score}>得分: {score}</span>
          {sentences.length > 0 && (
            <button onClick={handleRestart} style={styles.restartButton}>
              🔄 重新开始
            </button>
          )}
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {/* 主内容 */}
      {currentSentence ? (
        <div style={styles.card}>
          {/* 音频和中文 */}
          <AudioPlayer text={currentSentence.text} />
          
          <div style={styles.chineseBox}>
            {currentSentence.chinese}
          </div>

          {/* 进度信息 */}
          <div style={styles.progressInfo}>
            <span>第 {currentIndex + 1} / {sentences.length} 题</span>
            {currentSentence.pass && <span style={styles.mastered}>✅ 已掌握</span>}
          </div>

          {/* 单词填空位 */}
          <div style={styles.wordSlots}>
            {targetWords.map((word, i) => (
              <div 
                key={i} 
                style={{
                  ...styles.wordSlot,
                  color: i < userWords.length ? '#10b981' : 'transparent',
                  backgroundColor: i < userWords.length ? '#1a2a3a' : 'transparent',
                  borderColor: i < userWords.length ? '#10b981' : '#cfd8dc'
                }}
              >
                {word}
              </div>
            ))}
          </div>

          {/* 单词选择区 */}
          <div style={styles.wordGrid}>
            {shuffledWords.map((word, index) => {
              const wordKey = `${word}-${index}`;
              const disabled = !wordStatus[wordKey] || showResult;
              return (
                <button
                  key={index}
                  onClick={() => handleWordClick(word, index)}
                  disabled={disabled}
                  style={{
                    ...styles.wordButton,
                    backgroundColor: disabled ? '#4b5563' : '#3b82f6',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  {word}
                </button>
              );
            })}
          </div>

          {/* 重置按钮 */}
          {!showResult && (
            <div style={styles.resetSection}>
              <button onClick={handleReset} style={styles.resetButton}>
                🔄 重新排列单词
              </button>
            </div>
          )}

          {/* 结果和下一题 */}
          {showResult && (
            <div style={{
              ...styles.resultBox,
              backgroundColor: isCorrect ? '#10b98120' : '#ef444420',
              borderColor: isCorrect ? '#10b981' : '#ef4444'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                {isCorrect ? '✅' : '❌'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                {isCorrect ? '正确！' : '错误！'}
              </div>
              {!isCorrect && (
                <div style={styles.correctAnswer}>
                  <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '5px' }}>
                    正确答案:
                  </div>
                  <div style={{ color: 'white', fontSize: '18px' }}>
                    {targetWords.join(' ')}
                  </div>
                </div>
              )}
              <button onClick={handleNext} style={styles.nextButton}>
                {currentIndex < sentences.length - 1 ? '下一题 →' : '完成 ✓'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
            点击"加载句子"开始测试
          </div>
          {sentences.length === 0 && (
            <button onClick={loadSentences} style={styles.startButton}>
              🚀 开始测试
            </button>
          )}
        </div>
      )}

      {/* 进度条 */}
      {sentences.length > 0 && (
        <div style={styles.progress}>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill, 
              width: `${((currentIndex + 1) / sentences.length) * 100}%`
            }} />
          </div>
        </div>
      )}

      {/* 句子查看器模态框 */}
      {showViewer && (
        <SentenceViewer 
          sentences={sentences}
          onClose={() => setShowViewer(false)}
          onSelectSentence={handleSelectSentence}
        />
      )}
    </div>
  );
};

// ==================== 样式 ====================
const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    position: 'relative'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
    fontSize: '28px'
  },
  controlBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    flexWrap: 'wrap',
    gap: '10px'
  },
  fileSelector: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flex: 2,
    minWidth: '250px',
    flexWrap: 'wrap'
  },
  select: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '150px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  },
  scoreSection: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  score: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#10b981',
    backgroundColor: '#e8f5e8',
    padding: '5px 15px',
    borderRadius: '20px'
  },
  restartButton: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  message: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '15px',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#2d3a4f',
    padding: '25px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    color: 'white'
  },
  audioPlayer: {
    backgroundColor: '#312e81',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  audioStatus: {
    color: '#a5b4fc',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  playButton: {
    padding: '8px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  chineseBox: {
    backgroundColor: '#1e293b',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#a5b4fc',
    border: '2px solid #10b981',
    lineHeight: '1.5'
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    fontSize: '14px'
  },
  mastered: {
    color: '#10b981',
    fontWeight: 'bold'
  },
  wordSlots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
    minHeight: '60px',
    padding: '15px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    flexWrap: 'wrap'
  },
  wordSlot: {
    minWidth: '80px',
    height: '50px',
    borderBottom: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '6px',
    padding: '0 8px',
    transition: 'all 0.2s'
  },
  wordGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '12px',
    padding: '15px',
    backgroundColor: '#1a2a3a',
    borderRadius: '12px',
    marginBottom: '15px'
  },
  wordButton: {
    padding: '12px 8px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  resetSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px'
  },
  resetButton: {
    padding: '10px 20px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  resultBox: {
    marginTop: '20px',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '2px solid',
    animation: 'fadeIn 0.3s ease'
  },
  correctAnswer: {
    backgroundColor: '#1e293b',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '10px',
    marginBottom: '15px'
  },
  nextButton: {
    padding: '12px 40px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  startButton: {
    marginTop: '20px',
    padding: '15px 40px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  progress: {
    marginTop: '20px'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease'
  },
  // 查看器样式
  viewerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  viewerContainer: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  },
  viewerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee'
  },
  viewerTitle: {
    margin: 0,
    color: '#333',
    fontSize: '24px'
  },
  closeButton: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    border: 'none',
    backgroundColor: '#f0f0f0',
    color: '#666',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  viewerFilterBar: {
    display: 'flex',
    gap: '15px',
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
    flexWrap: 'wrap'
  },
  viewerSearch: {
    flex: 2,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    minWidth: '200px'
  },
  viewerFilterGroup: {
    display: 'flex',
    gap: '10px',
    flex: 1,
    minWidth: '200px'
  },
  viewerSelect: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px'
  },
  viewerStats: {
    display: 'flex',
    gap: '10px',
    padding: '0 20px 15px',
    flexWrap: 'wrap'
  },
  viewerStatBadge: {
    padding: '5px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  viewerList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 20px',
    maxHeight: 'calc(90vh - 200px)'
  },
  viewerItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid #e0e0e0'
  },
  viewerItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  viewerItemIndex: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#e0e0e0',
    padding: '2px 8px',
    borderRadius: '12px'
  },
  viewerItemBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  viewerItemEnglish: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px'
  },
  viewerItemChinese: {
    fontSize: '14px',
    color: '#2e7d32',
    marginBottom: '10px',
    padding: '8px',
    backgroundColor: '#e8f5e8',
    borderRadius: '5px'
  },
  viewerItemStats: {
    display: 'flex',
    gap: '15px',
    fontSize: '12px',
    color: '#666',
    flexWrap: 'wrap'
  },
  viewerEmpty: {
    textAlign: 'center',
    padding: '40px',
    color: '#999'
  }
};

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  ${styles.viewerItem}:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    border-color: #2196F3;
  }
  
  ${styles.closeButton}:hover {
    background-color: #f44336;
    color: white;
  }
`;
document.head.appendChild(style);

export default SentenceTest;