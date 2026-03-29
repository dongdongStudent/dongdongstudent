import React, { useState, useEffect, useRef } from 'react';
import { sentenceApi } from './api';
import { styles as globalStyles } from './utils';

// ==================== 单词拆分函数 ====================
const splitWords = (text) => {
  if (!text) return [];
  
  // 使用正则表达式匹配单词（包括带连字符和撇号的）
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
  const [lastSelectedWord, setLastSelectedWord] = useState(null);
  
  const audioPlayedRef = useRef(false);
  const [audioError, setAudioError] = useState(false);

  const currentSentence = sentences[currentIndex];
  const targetWords = currentSentence ? splitWords(currentSentence.text) : [];

  // 随机打乱单词
  const shuffleWords = (words) => {
    const wordsCopy = [...words];
    return wordsCopy.sort(() => Math.random() - 0.5);
  };

  // 手动触发音频播放
  const playAudio = () => {
    if (!currentSentence || !window.speechSynthesis) {
      setAudioError(true);
      return;
    }

    try {
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
    
    const shuffled = shuffleWords(words);
    setShuffledWords(shuffled);
    
    const status = {};
    shuffled.forEach((word, i) => { 
      status[`${word}-${i}`] = true; 
    });
    setWordStatus(status);
    setUserWords([]);
    setShowResult(false);
    setLastSelectedWord(null);
    audioPlayedRef.current = false;
    setAudioError(false);
    
    const timer = setTimeout(() => {
      if (!audioPlayedRef.current) {
        playAudio();
      }
    }, 500);
    
    return () => {
      clearTimeout(timer);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentIndex, currentSentence]);

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
      const correct = newUserWords.every((userWord, idx) => 
        userWord.toLowerCase() === targetWords[idx].toLowerCase()
      );
      
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

  // 下一题
  const handleNext = () => {
    onComplete(isCorrect);
  };

  if (!currentSentence) return null;

  return (
    <div style={globalStyles.card}>
      {/* 顶部栏 */}
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

      {/* 进度 */}
      <div style={styles.progressRow}>
        <span style={styles.progressText}>{currentIndex + 1}/{sentences.length}</span>
      </div>

      {/* 单词填空位 */}
      <div style={globalStyles.wordSlots}>
        {targetWords.map((word, i) => (
          <div 
            key={i} 
            style={{
              ...globalStyles.wordSlot,
              backgroundColor: i < userWords.length ? '#2d3a4f' : 'transparent',
              color: i < userWords.length ? '#10b981' : '#94a3b8',
              fontSize: '14px',
              padding: '8px 12px'
            }}
          >
            {i < userWords.length ? userWords[i] : '______'}
          </div>
        ))}
      </div>

      {/* 单词选择区 */}
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
                border: isLastSelected ? '2px solid #ffd700' : 'none',
                fontSize: '14px',
                padding: '8px 12px'
              }}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* 操作按钮区 */}
      {!showResult && (
        <div style={styles.actionBar}>
          <button 
            onClick={handleUndo} 
            style={{
              ...styles.actionButton,
              backgroundColor: '#f59e0b',
              opacity: userWords.length === 0 || !lastSelectedWord ? 0.5 : 1,
              cursor: userWords.length === 0 || !lastSelectedWord ? 'not-allowed' : 'pointer'
            }}
            disabled={userWords.length === 0 || !lastSelectedWord}
            title="撤回上一个单词"
          >
            ↩️ 撤回
          </button>
        </div>
      )}

      {/* 结果提示 */}
      {showResult && (
        <div style={{
          ...styles.resultBox,
          backgroundColor: isCorrect ? '#10b98120' : '#ef444420',
          borderColor: isCorrect ? '#10b981' : '#ef4444'
        }}>
          <div style={styles.resultIcon}>{isCorrect ? '✅' : '❌'}</div>
          {!isCorrect && (
            <div style={styles.resultAnswer}>
              <div style={styles.resultLabel}>正确答案：</div>
              <div>{targetWords.join(' → ')}</div>
            </div>
          )}
          {isCorrect && (
            <div style={styles.resultAnswer}>
              <div>回答正确！</div>
            </div>
          )}
          <button onClick={handleNext} style={styles.nextButton}>
            {currentIndex < sentences.length - 1 ? '下一题 →' : '✓ 完成'}
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== 样式 ====================
const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '8px 12px'
  },
  audioButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  chineseText: {
    color: '#ffd700',
    fontSize: '14px',
    flex: 1
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
    marginBottom: '15px'
  },
  progressText: {
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    padding: '4px 12px',
    borderRadius: '12px'
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '12px',
    gap: '10px'
  },
  actionButton: {
    padding: '8px 24px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  resultBox: {
    marginTop: '15px',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px'
  },
  resultIcon: {
    fontSize: '24px',
    minWidth: '32px'
  },
  resultAnswer: {
    color: 'white',
    fontSize: '13px',
    backgroundColor: '#1e293b',
    padding: '6px 12px',
    borderRadius: '6px',
    flex: 1,
    textAlign: 'left'
  },
  resultLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '4px'
  },
  nextButton: {
    padding: '6px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  }
};

export default SentenceTest;