import React, { useState, useEffect, useRef } from 'react';
import { sentenceApi } from './api';
import { AudioPlayer, styles as globalStyles } from './utils';

// ==================== 改进的单词拆分函数 ====================
const splitWords = (text) => {
  if (!text) return [];
  
  // 使用正则表达式匹配单词（包括带连字符和撇号的）
  // \b 单词边界，[\w'-]+ 匹配字母、数字、下划线、连字符、撇号
  const words = text.match(/\b[\w'-]+\b/g) || [];
  
  return words;
};

// ==================== 测试组件 ====================
const SentenceTest = ({ sentences, currentIndex, onComplete, onScoreUpdate, currentScore }) => {
  const [shuffledWords, setShuffledWords] = useState([]);
  const [userWords, setUserWords] = useState([]);
  const [wordStatus, setWordStatus] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sortOrder, setSortOrder] = useState('random');
  const [lastSelectedWord, setLastSelectedWord] = useState(null);
  
  // 添加音频相关的ref和state
  const audioPlayedRef = useRef(false);
  const [audioError, setAudioError] = useState(false);

  const currentSentence = sentences[currentIndex];
  const targetWords = currentSentence ? splitWords(currentSentence.text) : [];

  // 根据排序方式打乱单词
  const shuffleWords = (words, order) => {
    const wordsCopy = [...words];
    
    switch(order) {
      case 'random':
        return wordsCopy.sort(() => Math.random() - 0.5);
      case 'alphabetical':
        return wordsCopy.sort((a, b) => a.localeCompare(b));
      case 'reverse-alpha':
        return wordsCopy.sort((a, b) => b.localeCompare(a));
      case 'length':
        return wordsCopy.sort((a, b) => a.length - b.length);
      case 'length-desc':
        return wordsCopy.sort((a, b) => b.length - a.length);
      default:
        return wordsCopy.sort(() => Math.random() - 0.5);
    }
  };

  // 手动触发音频播放
  const playAudio = () => {
    if (!currentSentence || !window.speechSynthesis) {
      setAudioError(true);
      return;
    }

    try {
      // 取消任何正在播放的音频
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentSentence.text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      
      utterance.onend = () => {
        console.log('音频播放完成');
      };
      
      utterance.onerror = (event) => {
        console.error('音频播放错误:', event);
        setAudioError(true);
      };
      
      window.speechSynthesis.speak(utterance);
      audioPlayedRef.current = true;
      setAudioError(false);
    } catch (error) {
      console.error('播放音频失败:', error);
      setAudioError(true);
    }
  };

  // 初始化当前句子的单词
  useEffect(() => {
    if (!currentSentence) return;
    
    const words = splitWords(currentSentence.text);
    
    const shuffled = shuffleWords(words, sortOrder);
    setShuffledWords(shuffled);
    
    const status = {};
    shuffled.forEach((word, i) => { 
      status[`${word}-${i}`] = true; 
    });
    setWordStatus(status);
    setUserWords([]);
    setShowResult(false);
    setLastSelectedWord(null);
    audioPlayedRef.current = false; // 重置播放标记
    setAudioError(false); // 重置错误状态
    
    // 尝试播放音频
    const timer = setTimeout(() => {
      if (!audioPlayedRef.current) {
        playAudio();
      }
    }, 500);
    
    return () => {
      clearTimeout(timer);
      // 清理正在播放的音频
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentIndex, currentSentence, sortOrder]);

  // 处理单词点击
  const handleWordClick = async (word, index) => {
    if (showResult) return;
    
    const wordKey = `${word}-${index}`;
    if (!wordStatus[wordKey]) return;
    
    setLastSelectedWord({ word, index, wordKey });
    
    setWordStatus(prev => ({ ...prev, [wordKey]: false }));
    const newUserWords = [...userWords, word];
    setUserWords(newUserWords);

    if (newUserWords.length === targetWords.length) {
      const correct = newUserWords.join(' ') === targetWords.join(' ');
      setIsCorrect(correct);
      setShowResult(true);
      
      if (!correct) onScoreUpdate(Math.max(0, currentScore - 10));
      
      try {
        await sentenceApi.increment(currentSentence.id);
        
        if (correct) {
          await sentenceApi.incrementCorrect(currentSentence.id);
        } else {
          await sentenceApi.incrementWrong(currentSentence.id);
        }
        
        await sentenceApi.updateLastAnswerTime(currentSentence.id);
        
      } catch (error) {
        console.error('更新统计失败:', error);
      }
    }
  };

  // 撤回上一个选择的单词
  const handleUndo = () => {
    if (showResult || !lastSelectedWord || userWords.length === 0) return;
    
    const { word, index, wordKey } = lastSelectedWord;
    
    setWordStatus(prev => ({ ...prev, [wordKey]: true }));
    const newUserWords = userWords.slice(0, -1);
    setUserWords(newUserWords);
    setLastSelectedWord(null);
    
    if (showResult) {
      setShowResult(false);
    }
  };

  // 重置当前题目
  const handleReset = () => {
    if (!currentSentence) return;
    
    const words = splitWords(currentSentence.text);
    const shuffled = shuffleWords(words, sortOrder);
    setShuffledWords(shuffled);
    
    const status = {};
    shuffled.forEach((word, i) => { 
      status[`${word}-${i}`] = true; 
    });
    setWordStatus(status);
    setUserWords([]);
    setShowResult(false);
    setLastSelectedWord(null);
  };

  // 改变排序方式
  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  // 下一题
  const handleNext = () => {
    onComplete(isCorrect);
  };

  if (!currentSentence) return null;

  return (
    <div style={globalStyles.card}>
      {/* 极简音频和中文 - 合并为一行 */}
      <div style={styles.topBar}>
        <button 
          onClick={playAudio}
          style={styles.audioButton}
          title="播放音频"
        >
          {audioError ? '⚠️' : '🔊'}
        </button>
        <span style={styles.chineseText}>{currentSentence.chinese}</span>
        {currentSentence.pass && <span style={styles.mastered}>✓</span>}
      </div>

      {/* 进度和排序 - 极简行 */}
      <div style={styles.progressRow}>
        <span style={styles.progressText}>#{currentIndex + 1}/{sentences.length}</span>
        <select 
          value={sortOrder} 
          onChange={handleSortChange}
          style={styles.sortSelect}
          disabled={showResult}
        >
          <option value="random">🎲</option>
          <option value="alphabetical">🔤</option>
          <option value="reverse-alpha">🔠</option>
          <option value="length">📏↑</option>
          <option value="length-desc">📐↓</option>
        </select>
      </div>

      {/* 单词填空位 - 紧凑显示 */}
      <div style={globalStyles.wordSlots}>
        {targetWords.map((word, i) => (
          <div 
            key={i} 
            style={{
              ...globalStyles.wordSlot,
              color: i < userWords.length ? '#10b981' : 'transparent',
              backgroundColor: i < userWords.length ? '#1a2a3a' : 'transparent',
              borderColor: i < userWords.length ? '#10b981' : '#cfd8dc',
              fontSize: '13px',
              padding: '6px 10px'
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {/* 单词选择区 - 紧凑按钮 */}
      <div style={globalStyles.wordGrid}>
        {shuffledWords.map((word, index) => {
          const wordKey = `${word}-${index}`;
          const disabled = !wordStatus[wordKey] || showResult;
          const isLastSelected = lastSelectedWord && 
                                lastSelectedWord.word === word && 
                                lastSelectedWord.index === index;
          
          return (
            <button
              key={index}
              onClick={() => handleWordClick(word, index)}
              disabled={disabled}
              style={{
                ...globalStyles.wordButton,
                backgroundColor: disabled ? '#4b5563' : '#3b82f6',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: isLastSelected ? '1px solid #ffd700' : 'none',
                fontSize: '13px',
                padding: '6px 10px',
                position: 'relative'
              }}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* 操作按钮区 - 紧凑双按钮 */}
      {!showResult && (
        <div style={styles.actionBar}>
          <button onClick={handleReset} style={styles.actionButton}>🔄</button>
          <button 
            onClick={handleUndo} 
            style={{
              ...styles.actionButton,
              backgroundColor: '#f59e0b',
              opacity: userWords.length === 0 || !lastSelectedWord ? 0.5 : 1
            }}
            disabled={userWords.length === 0 || !lastSelectedWord}
          >
            ↩️
          </button>
          <span style={styles.sortHint}>
            {sortOrder === 'random' ? '🎲' :
             sortOrder === 'alphabetical' ? '🔤' :
             sortOrder === 'reverse-alpha' ? '🔠' :
             sortOrder === 'length' ? '📏↑' : '📐↓'}
          </span>
        </div>
      )}

      {/* 结果提示 - 极简 */}
      {showResult && (
        <div style={{
          ...styles.resultBox,
          backgroundColor: isCorrect ? '#10b98120' : '#ef444420',
          borderColor: isCorrect ? '#10b981' : '#ef4444'
        }}>
          <div style={styles.resultIcon}>{isCorrect ? '✅' : '❌'}</div>
          {!isCorrect && (
            <div style={styles.resultAnswer}>{targetWords.join(' ')}</div>
          )}
          <button onClick={handleNext} style={styles.nextButton}>
            {currentIndex < sentences.length - 1 ? '→' : '✓'}
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== 极简样式 ====================
const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    backgroundColor: '#1e293b',
    borderRadius: '4px',
    padding: '4px 8px'
  },
  audioButton: {
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '14px',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  chineseText: {
    color: '#ffd700',
    fontSize: '13px',
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  mastered: {
    color: '#10b981',
    fontSize: '12px',
    marginLeft: '4px'
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  progressText: {
    fontSize: '11px',
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    padding: '4px 8px',
    borderRadius: '12px'
  },
  sortSelect: {
    padding: '4px 6px',
    backgroundColor: '#1e293b',
    color: 'white',
    border: '1px solid #4b5563',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none',
    width: '60px'
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    gap: '6px'
  },
  actionButton: {
    padding: '6px 10px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    minWidth: '36px'
  },
  sortHint: {
    fontSize: '11px',
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    padding: '4px 8px',
    borderRadius: '12px'
  },
  resultBox: {
    marginTop: '10px',
    padding: '10px',
    borderRadius: '6px',
    textAlign: 'center',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px'
  },
  resultIcon: {
    fontSize: '20px',
    minWidth: '24px'
  },
  resultAnswer: {
    color: 'white',
    fontSize: '12px',
    backgroundColor: '#1e293b',
    padding: '4px 8px',
    borderRadius: '4px',
    flex: 1,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  nextButton: {
    padding: '4px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '32px'
  }
};

export default SentenceTest;