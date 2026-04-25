// components/SpellingTest.js
import React, { useState, useEffect, useRef } from 'react';
import { sentenceApi } from '../../api';
import { splitWords, shuffleArray } from './sentenceUtils';
import { spellingStyles } from './styles';
import { F_speak } from '../../../Function/weisimin';

const SpellingTest = ({ sentences, currentIndex, onComplete, onScoreUpdate, currentScore }) => {
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

  // 使用 F_speak 播放音频
  const playAudio = async () => {
    if (!currentSentence) {
      setAudioError(true);
      return;
    }

    try {
      await F_speak(currentSentence.text);
      audioPlayedRef.current = true;
      setAudioError(false);
    } catch (error) {
      console.error('播放音频失败:', error);
      setAudioError(true);
    }
  };

  useEffect(() => {
    if (!currentSentence) return;
    
    const words = splitWords(currentSentence.text);
    const shuffled = shuffleArray(words);
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
    };
  }, [currentIndex, currentSentence]);

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
        
        // 传递 'spelling' 模式参数
        if (correct) {
          await sentenceApi.incrementCorrect(currentSentence.id, 'spelling');
        } else {
          await sentenceApi.incrementWrong(currentSentence.id, 'spelling');
        }
        
        await sentenceApi.updateLastAnswerTime(currentSentence.id);
        
      } catch (error) {
        console.error('更新统计失败:', error);
      }
    }
  };

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

  const handleNext = () => {
    onComplete(isCorrect);
  };

  if (!currentSentence) return null;

  return (
    <div style={spellingStyles.card}>
      <div style={spellingStyles.topBar}>
        <button onClick={playAudio} style={spellingStyles.audioButton} title="播放音频">
          {audioError ? '⚠️' : '🔊'}
        </button>
        <span style={spellingStyles.chineseText}>{currentSentence.chinese}</span>
        {currentSentence.pass && <span style={spellingStyles.mastered}>✓</span>}
      </div>

      <div style={spellingStyles.progressRow}>
        <span style={spellingStyles.progressText}>{currentIndex + 1}/{sentences.length}</span>
      </div>

      <div style={spellingStyles.wordSlots}>
        {targetWords.map((word, i) => (
          <div 
            key={i} 
            style={{
              ...spellingStyles.wordSlot,
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

      <div style={spellingStyles.wordGrid}>
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
                ...spellingStyles.wordButton,
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

      {!showResult && (
        <div style={spellingStyles.actionBar}>
          <button 
            onClick={handleUndo} 
            style={{
              ...spellingStyles.actionButton,
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

      {showResult && (
        <div style={{
          ...spellingStyles.resultBox,
          backgroundColor: isCorrect ? '#10b98120' : '#ef444420',
          borderColor: isCorrect ? '#10b981' : '#ef4444'
        }}>
          <div style={spellingStyles.resultIcon}>{isCorrect ? '✅' : '❌'}</div>
          {!isCorrect && (
            <div style={spellingStyles.resultAnswer}>
              <div style={spellingStyles.resultLabel}>正确答案：</div>
              <div>{targetWords.join(' → ')}</div>
            </div>
          )}
          {isCorrect && (
            <div style={spellingStyles.resultAnswer}>
              <div>回答正确！</div>
            </div>
          )}
          <button onClick={handleNext} style={spellingStyles.nextButton}>
            {currentIndex < sentences.length - 1 ? '下一题 →' : '✓ 完成'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SpellingTest;