import React, { useState, useEffect } from 'react';
import { F_speak, stopAllSpeak } from "../Function/weisimin.js";
import { sentenceApi } from '../test/api';

// ==================== 句子拆解工具 ====================
const splitWords = (text) => {
  if (!text) return [];
  
  // 先处理特殊缩写，将它们临时替换为占位符
  let processedText = text;
  
  // 常见缩写列表
  const contractions = [
    "I'm", "i'm", "I'll", "i'll", "I've", "i've", "I'd", "i'd",
    "you're", "you'll", "you've", "you'd",
    "he's", "he'll", "he'd",
    "she's", "she'll", "she'd",
    "it's", "it'll", "it'd",
    "we're", "we'll", "we've", "we'd",
    "they're", "they'll", "they've", "they'd",
    "that's", "that'll", "that'd",
    "what's", "what'll", "what'd",
    "where's", "where'll", "where'd",
    "when's", "when'll", "when'd",
    "why's", "why'd",
    "how's", "how'll", "how'd",
    "can't", "cannot",
    "don't", "doesn't", "didn't",
    "won't", "wouldn't",
    "shouldn't", "couldn't",
    "mustn't", "needn't",
    "isn't", "aren't", "wasn't", "weren't",
    "hasn't", "haven't", "hadn't",
    "let's"
  ];

  // 为每个缩写创建正则表达式，确保单词边界
  contractions.forEach(contraction => {
    const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
    // 将缩写中的撇号替换为特殊占位符
    const placeholder = contraction.replace("'", "@@@");
    processedText = processedText.replace(regex, placeholder);
  });

  // 移除标点符号（但保留单词内部的占位符）
  processedText = processedText
    .replace(/[.,!?;:"()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 分割单词
  const words = processedText.split(' ').filter(w => w && w.length > 0);
  
  // 将占位符恢复为原始的缩写形式
  return words.map(word => word.replace(/@@@/g, "'"));
};

// ==================== 句子听写模式 ====================
const SentenceListeningMode = ({ sentence, onComplete, onScoreUpdate, currentScore, totalSentences }) => {
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [gameState, setGameState] = useState('playing');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sentence) {
      setUserInput('');
      setShowResult(false);
      setHasAutoPlayed(false);
      setGameState('playing');
      setIsSubmitting(false);
    }
  }, [sentence]);

  useEffect(() => {
    if (sentence && !hasAutoPlayed) {
      const timer = setTimeout(() => {
        speak();
        setHasAutoPlayed(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sentence, hasAutoPlayed]);

  const speak = () => {
    if (sentence) {
      stopAllSpeak();
      F_speak(sentence.text);
    }
  };

  // 处理整个区域的点击，用于进入下一题
  const handleAreaClick = () => {
    if (gameState === 'result') {
      onComplete(isCorrect);
    }
  };

  const handleSubmit = async () => {
    if (gameState !== 'playing' || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const targetText = sentence.text.trim();
    const isAnswerCorrect = userInput.trim().toLowerCase() === targetText.toLowerCase();
    
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    setGameState('result');
    
    if (!isAnswerCorrect) {
      onScoreUpdate(Math.max(0, currentScore - (100 / totalSentences)));
    }
    
    // 更新后端统计
    try {
      await sentenceApi.updateStats(sentence.id, {
        correct: isAnswerCorrect,
        wrong: !isAnswerCorrect,
        extraction: true
      }, 'sentences');
    } catch (error) {
      console.error('更新统计失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && gameState === 'playing' && userInput.trim() && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <div 
      onClick={handleAreaClick}
      style={{
        cursor: gameState === 'result' ? 'pointer' : 'default',
        transition: 'all 0.2s'
      }}
    >
      <div style={{
        backgroundColor: '#2d3a4f',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: gameState === 'result' ? (isCorrect ? '3px solid #10b981' : '3px solid #ef4444') : 'none',
        opacity: 1
      }}>
        {/* 音频播放区域 */}
        <div style={{
          backgroundColor: '#312e81',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔊</div>
          <div style={{ color: '#a5b4fc', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
            {hasAutoPlayed ? '✅ 已自动播放一遍' : '⏳ 正在播放音频...'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              speak();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔁 重新播放
          </button>
        </div>

        {/* 翻译切换按钮 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTranslation(!showTranslation);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: showTranslation ? '#10b981' : '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {showTranslation ? '📖 隐藏翻译' : '📖 显示翻译'}
          </button>
        </div>

        {/* 中文翻译 */}
        {showTranslation && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#a5b4fc',
            border: '2px solid #10b981'
          }}>
            {sentence?.chinese || '加载中...'}
          </div>
        )}

        {/* 输入区域 */}
        <div style={{ marginBottom: '20px' }}>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onClick={(e) => e.stopPropagation()}
            disabled={gameState !== 'playing' || isSubmitting}
            placeholder="在这里输入你听到的句子... (Ctrl+Enter 提交)"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '15px',
              backgroundColor: '#1e293b',
              color: 'white',
              border: gameState === 'playing' ? '2px solid #3b82f6' : '2px solid #4b5563',
              borderRadius: '8px',
              fontSize: '18px',
              fontFamily: 'inherit',
              resize: 'vertical',
              opacity: gameState === 'playing' ? 1 : 0.7
            }}
          />
          {gameState === 'playing' && (
            <div style={{ textAlign: 'right', marginTop: '5px', color: '#94a3b8', fontSize: '12px' }}>
              按 Ctrl+Enter 快速提交
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        {gameState === 'playing' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              disabled={!userInput.trim() || isSubmitting}
              style={{
                padding: '12px 30px',
                backgroundColor: userInput.trim() && !isSubmitting ? '#10b981' : '#4b5563',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: userInput.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                opacity: userInput.trim() && !isSubmitting ? 1 : 0.5
              }}
            >
              {isSubmitting ? '⏳ 提交中...' : '提交答案'}
            </button>
          </div>
        )}

        {/* 结果显示 */}
        {showResult && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isCorrect ? '#10b981' : '#ef4444',
            border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
            animation: 'fadeIn 0.3s ease',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>
              {isCorrect ? '✅' : '❌'}
            </div>
            <div>
              {isCorrect ? '拼写正确！' : `正确答案: ${sentence.text}`}
            </div>
            <div style={{ fontSize: '14px', marginTop: '10px', color: '#94a3b8' }}>
              点击任意位置进入下一题
            </div>
          </div>
        )}
      </div>
      
      {/* 添加动画样式 */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

// ==================== 单词拼写模式（基于句子拆解） ====================
const WordSpellingMode = ({ sentence, onComplete, onScoreUpdate, currentScore, totalSentences }) => {
  const [userWords, setUserWords] = useState([]);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [wordStatus, setWordStatus] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [gameState, setGameState] = useState('playing');

  useEffect(() => {
    if (sentence) {
      const words = splitWords(sentence.text);
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffled);
      
      const initialStatus = {};
      shuffled.forEach((word, index) => {
        initialStatus[`${word}-${index}`] = true;
      });
      setWordStatus(initialStatus);
      setUserWords([]);
      setShowResult(false);
      setHasAutoPlayed(false);
      setGameState('playing');
    }
  }, [sentence]);

  useEffect(() => {
    if (sentence && !hasAutoPlayed) {
      const timer = setTimeout(() => {
        speak();
        setHasAutoPlayed(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sentence, hasAutoPlayed]);

  const speak = () => {
    if (sentence) {
      stopAllSpeak();
      F_speak(sentence.text);
    }
  };

  // 处理整个区域的点击，用于进入下一题
  const handleAreaClick = () => {
    if (gameState === 'result') {
      onComplete(isCorrect);
    }
  };

  const handleWordClick = (word, index) => {
    if (gameState !== 'playing') return;
    
    const wordKey = `${word}-${index}`;
    if (!wordStatus[wordKey]) return;
    
    setWordStatus(prev => ({
      ...prev,
      [wordKey]: false
    }));
    
    const newUserWords = [...userWords, word];
    setUserWords(newUserWords);

    const targetWords = splitWords(sentence.text);
    
    if (newUserWords.length === targetWords.length) {
      const correct = newUserWords.join(' ') === targetWords.join(' ');
      setIsCorrect(correct);
      setShowResult(true);
      setGameState('result');
      
      if (!correct) {
        onScoreUpdate(Math.max(0, currentScore - (100 / totalSentences)));
      }
      
      // 更新后端统计
      try {
        sentenceApi.updateStats(sentence.id, {
          correct: correct,
          wrong: !correct,
          extraction: true
        }, 'sentences');
      } catch (error) {
        console.error('更新统计失败:', error);
      }
    }
  };

  const targetWords = splitWords(sentence?.text || '');

  return (
    <div 
      onClick={handleAreaClick}
      style={{
        cursor: gameState === 'result' ? 'pointer' : 'default',
        transition: 'all 0.2s'
      }}
    >
      <div style={{
        backgroundColor: '#2d3a4f',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: gameState === 'result' ? (isCorrect ? '3px solid #10b981' : '3px solid #ef4444') : 'none',
        opacity: 1
      }}>
        {/* 音频播放区域 */}
        <div style={{
          backgroundColor: '#312e81',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔊</div>
          <div style={{ color: '#a5b4fc', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
            {hasAutoPlayed ? '✅ 已自动播放一遍' : '⏳ 正在播放音频...'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              speak();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔁 重新播放
          </button>
        </div>

        {/* 翻译切换按钮 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTranslation(!showTranslation);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: showTranslation ? '#10b981' : '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {showTranslation ? '📖 隐藏翻译' : '📖 显示翻译'}
          </button>
        </div>

        {/* 中文翻译 */}
        {showTranslation && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#a5b4fc',
            border: '2px solid #10b981'
          }}>
            {sentence?.chinese || '加载中...'}
          </div>
        )}

        {/* 单词填空区域 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px',
          minHeight: '50px',
          padding: '15px',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          flexWrap: 'wrap'
        }}>
          {targetWords.map((word, i) => (
            <div key={i} style={{
              minWidth: '80px',
              height: '50px',
              borderBottom: '3px solid #cfd8dc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: i < userWords.length ? '#10b981' : 'transparent',
              backgroundColor: i < userWords.length ? '#1a2a3a' : 'transparent',
              borderRadius: '4px',
              padding: '0 5px'
            }}>
              {word}
            </div>
          ))}
        </div>

        {/* 单词选择区域 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '10px',
          backgroundColor: '#1a2a3a',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          {shuffledWords.map((word, index) => {
            const wordKey = `${word}-${index}`;
            const isDisabled = !wordStatus[wordKey] || gameState !== 'playing';
            
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleWordClick(word, index);
                }}
                disabled={isDisabled}
                style={{
                  padding: '15px 10px',
                  backgroundColor: isDisabled ? '#4b5563' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1
                }}
              >
                {word}
              </button>
            );
          })}
        </div>

        {/* 结果显示 */}
        {showResult && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isCorrect ? '#10b981' : '#ef4444',
            border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
            animation: 'fadeIn 0.3s ease',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>
              {isCorrect ? '✅' : '❌'}
            </div>
            <div>
              {isCorrect ? '拼写正确！' : `正确答案: ${targetWords.join(' ')}`}
            </div>
            <div style={{ fontSize: '14px', marginTop: '10px', color: '#94a3b8' }}>
              点击任意位置进入下一题
            </div>
          </div>
        )}
      </div>
      
      {/* 添加动画样式 */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

// ==================== 主组件 ====================
const SentenceListeningTest = ({ 
  sentence, 
  onComplete, 
  onScoreUpdate, 
  currentScore, 
  totalSentences,
  mode = 'sentence' // 'sentence' 或 'word'
}) => {
  if (mode === 'word') {
    return (
      <WordSpellingMode
        sentence={sentence}
        onComplete={onComplete}
        onScoreUpdate={onScoreUpdate}
        currentScore={currentScore}
        totalSentences={totalSentences}
      />
    );
  }
  
  return (
    <SentenceListeningMode
      sentence={sentence}
      onComplete={onComplete}
      onScoreUpdate={onScoreUpdate}
      currentScore={currentScore}
      totalSentences={totalSentences}
    />
  );
};

export default SentenceListeningTest;