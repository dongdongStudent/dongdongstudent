import React, { useState, useEffect, useCallback } from 'react';
import { sentenceApi } from './api';

// ==================== 工具函数 ====================
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

// ==================== 音频播放组件 ====================
const AudioPlayer = ({ text, autoPlay = true, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [error, setError] = useState(null);

  // 使用 Web Speech API 播放音频
  const speak = useCallback(() => {
    if (!text) {
      setError('没有文本可以播放');
      return;
    }

    // 检查浏览器是否支持语音合成
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError('您的浏览器不支持语音合成');
      return;
    }

    // 停止当前播放
    window.speechSynthesis.cancel();

    // 创建语音实例
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // 语速稍慢，适合学习
    utterance.pitch = 1;
    utterance.volume = 1;

    // 获取可用的声音
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => 
      voice.lang.includes('en-US') || voice.lang.includes('en-GB')
    );
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    // 事件监听
    utterance.onstart = () => {
      setIsPlaying(true);
      setHasPlayed(true);
      setError(null);
      if (onPlay) onPlay();
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (event) => {
      console.error('语音播放错误:', event);
      setIsPlaying(false);
      setError('播放失败: ' + event.error);
    };

    // 开始播放
    window.speechSynthesis.speak(utterance);
  }, [text, onPlay]);

  // 自动播放
  useEffect(() => {
    if (autoPlay && text && !hasPlayed && !error) {
      const timer = setTimeout(() => {
        speak();
      }, 500);
      return () => {
        clearTimeout(timer);
        // 组件卸载时停止播放
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [autoPlay, text, hasPlayed, error, speak]);

  return (
    <div style={{
      backgroundColor: '#312e81',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '10px' }}>
        {isPlaying ? '🔊' : error ? '❌' : '🔈'}
      </div>
      <div style={{ 
        color: error ? '#ef4444' : '#a5b4fc', 
        fontSize: '16px', 
        fontWeight: 'bold', 
        marginBottom: '10px' 
      }}>
        {error ? error : (
          hasPlayed 
            ? (isPlaying ? '🔊 正在播放...' : '✅ 已播放') 
            : '⏳ 准备播放...'
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          speak();
        }}
        style={{
          padding: '8px 16px',
          backgroundColor: isPlaying ? '#6b7280' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: isPlaying ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: isPlaying ? 0.7 : 1
        }}
        disabled={isPlaying}
      >
        {isPlaying ? '⏳ 播放中...' : '🔁 重新播放'}
      </button>
    </div>
  );
};

// ==================== 句子拼写模式 ====================
const SentenceSpellingMode = ({ sentence, onComplete, onScoreUpdate, currentScore, totalSentences }) => {
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [gameState, setGameState] = useState('playing');
  const [attempts, setAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 重置状态当句子改变时
  useEffect(() => {
    if (sentence) {
      setUserInput('');
      setShowResult(false);
      setGameState('playing');
      setAttempts(0);
      setIsSubmitting(false);
    }
  }, [sentence]);

  // 处理提交
  const handleSubmit = async () => {
    if (gameState !== 'playing' || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const targetText = sentence.text.trim();
    const isAnswerCorrect = userInput.trim().toLowerCase() === targetText.toLowerCase();
    
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    setGameState('result');
    setAttempts(prev => prev + 1);
    
    // 错误扣分
    if (!isAnswerCorrect) {
      const deductAmount = 100 / totalSentences;
      onScoreUpdate(Math.max(0, currentScore - deductAmount));
    }
    
    // 更新后端统计
    try {
      await sentenceApi.updateSentenceStats(sentence.id, {
        correct: isAnswerCorrect,
        wrong: !isAnswerCorrect,
        extraction: true
      });
    } catch (error) {
      console.error('更新统计失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 点击区域进入下一题
  const handleAreaClick = () => {
    if (gameState === 'result') {
      onComplete(isCorrect);
    }
  };

  // 键盘快捷键 (Ctrl+Enter 提交)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && gameState === 'playing' && userInput.trim() && !isSubmitting) {
      handleSubmit();
    }
  };

  // 标记为已掌握
  const handleMarkMastered = async (e) => {
    e.stopPropagation();
    try {
      await sentenceApi.markAsMastered(sentence.id);
      // 直接进入下一题
      onComplete(true);
    } catch (error) {
      console.error('标记失败:', error);
    }
  };

  // 跳过当前句子
  const handleSkip = (e) => {
    e.stopPropagation();
    onComplete(false);
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
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* 音频播放器 */}
        <AudioPlayer text={sentence.text} autoPlay={true} />

        {/* 操作按钮栏 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '15px',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
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
              cursor: 'pointer',
              flex: 1,
              minWidth: '120px'
            }}
          >
            {showTranslation ? '📖 隐藏翻译' : '📖 显示翻译'}
          </button>
          
          {gameState === 'playing' && (
            <>
              <button
                onClick={handleMarkMastered}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flex: 1,
                  minWidth: '120px'
                }}
              >
                ⭐ 标记已掌握
              </button>
              
              <button
                onClick={handleSkip}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flex: 1,
                  minWidth: '120px'
                }}
              >
                ⏭️ 跳过
              </button>
            </>
          )}
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
              opacity: gameState === 'playing' ? 1 : 0.7,
              outline: 'none',
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
                opacity: userInput.trim() && !isSubmitting ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? '⏳ 提交中...' : '提交答案'}
            </button>
          </div>
        )}

        {/* 结果显示 */}
        {showResult && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isCorrect ? '#10b981' : '#ef4444',
            border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>
              {isCorrect ? '✅' : '❌'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              {isCorrect ? '拼写正确！' : '拼写错误'}
            </div>
            {!isCorrect && (
              <div style={{
                backgroundColor: '#1e293b',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '10px',
              }}>
                <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '5px' }}>
                  正确答案:
                </div>
                <div style={{ color: 'white', fontSize: '20px' }}>
                  {sentence.text}
                </div>
              </div>
            )}
            <div style={{ fontSize: '14px', marginTop: '15px', color: '#94a3b8' }}>
              点击任意位置进入下一题
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== 单词拼写模式 ====================
const WordSpellingMode = ({ sentence, onComplete, onScoreUpdate, currentScore, totalSentences }) => {
  const [userWords, setUserWords] = useState([]);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [wordStatus, setWordStatus] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [gameState, setGameState] = useState('playing');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化单词
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
      setGameState('playing');
      setIsSubmitting(false);
    }
  }, [sentence]);

  // 处理单词点击
  const handleWordClick = async (word, index) => {
    if (gameState !== 'playing' || isSubmitting) return;
    
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
      setIsSubmitting(true);
      
      const correct = newUserWords.join(' ') === targetWords.join(' ');
      setIsCorrect(correct);
      setShowResult(true);
      setGameState('result');
      
      if (!correct) {
        onScoreUpdate(Math.max(0, currentScore - (100 / totalSentences)));
      }
      
      // 更新后端统计
      try {
        await sentenceApi.updateSentenceStats(sentence.id, {
          correct: correct,
          wrong: !correct,
          extraction: true
        });
      } catch (error) {
        console.error('更新统计失败:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 点击区域进入下一题
  const handleAreaClick = () => {
    if (gameState === 'result') {
      onComplete(isCorrect);
    }
  };

  // 重置当前题目
  const handleReset = (e) => {
    e.stopPropagation();
    if (gameState !== 'playing') return;
    
    const words = splitWords(sentence.text);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    
    const initialStatus = {};
    shuffled.forEach((word, index) => {
      initialStatus[`${word}-${index}`] = true;
    });
    setWordStatus(initialStatus);
    setUserWords([]);
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
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* 音频播放器 */}
        <AudioPlayer text={sentence.text} autoPlay={true} />

        {/* 操作按钮栏 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '15px',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
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
              cursor: 'pointer',
              flex: 1,
              minWidth: '120px'
            }}
          >
            {showTranslation ? '📖 隐藏翻译' : '📖 显示翻译'}
          </button>
          
          {gameState === 'playing' && (
            <button
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                flex: 1,
                minWidth: '120px'
              }}
            >
              🔄 重新排列
            </button>
          )}
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
              minWidth: '60px',
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '12px',
          padding: '10px',
          backgroundColor: '#1a2a3a',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          {shuffledWords.map((word, index) => {
            const wordKey = `${word}-${index}`;
            const isDisabled = !wordStatus[wordKey] || gameState !== 'playing' || isSubmitting;
            
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
                  opacity: isDisabled ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.backgroundColor = '#3b82f6';
                  }
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
    </div>
  );
};

// ==================== 练习页面组件 ====================
const SentencePractice = () => {
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(100);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('sentence'); // 'sentence' 或 'word'
  const [stats, setStats] = useState({ total: 0, mastered: 0, unmastered: 0 });
  const [error, setError] = useState(null);

  // 加载句子
  const loadSentences = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sentenceApi.getSentences({ 
        status: 'unmastered', 
        limit: 10, 
        random: 'true' 
      });
      setSentences(data.sentences);
      setStats(data.meta);
      setCurrentIndex(0);
      setScore(100);
    } catch (error) {
      console.error('获取句子失败:', error);
      setError('加载失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSentences();
  }, []);

  // 完成一个句子
  const handleComplete = (isCorrect) => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 所有题目完成
      const correctCount = sentences.filter((_, i) => i < sentences.length).length;
      const accuracy = (correctCount / sentences.length * 100).toFixed(1);
      
      // 显示完成对话框
      if (window.confirm(`🎉 练习完成！\n得分: ${score.toFixed(1)}分\n正确率: ${accuracy}%\n\n是否重新开始？`)) {
        loadSentences();
      }
    }
  };

  // 切换模式
  const toggleMode = () => {
    setMode(mode === 'sentence' ? 'word' : 'sentence');
  };

  // 重新开始
  const handleRestart = () => {
    if (window.confirm('确定要重新开始吗？')) {
      loadSentences();
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 2s linear infinite' }}>⏳</div>
          <div>加载句子中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', backgroundColor: '#2d3a4f', padding: '30px', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <div style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</div>
          <button
            onClick={loadSentences}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', backgroundColor: '#2d3a4f', padding: '30px', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
          <div style={{ fontSize: '20px', marginBottom: '20px' }}>暂无未掌握的句子</div>
          <div style={{ color: '#94a3b8', marginBottom: '20px' }}>
            总句子: {stats.total} | 已掌握: {stats.mastered}
          </div>
          <button
            onClick={loadSentences}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            刷新
          </button>
        </div>
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* 顶部统计栏 */}
      <div style={{
        backgroundColor: '#2d3a4f',
        borderRadius: '12px',
        padding: '15px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>进度:</span>
            <span style={{ color: 'white', fontWeight: 'bold', marginLeft: '5px' }}>
              {currentIndex + 1}/{sentences.length}
            </span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>得分:</span>
            <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '5px' }}>
              {score.toFixed(1)}
            </span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>总句子:</span>
            <span style={{ color: 'white', fontWeight: 'bold', marginLeft: '5px' }}>
              {stats.total}
            </span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>已掌握:</span>
            <span style={{ color: '#8b5cf6', fontWeight: 'bold', marginLeft: '5px' }}>
              {stats.mastered}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={toggleMode}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'sentence' ? '#3b82f6' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {mode === 'sentence' ? '📝 句子模式' : '🔤 单词模式'}
          </button>
          
          <button
            onClick={handleRestart}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            🔄 重新开始
          </button>
        </div>
      </div>

      {/* 主练习区域 */}
      {mode === 'sentence' ? (
        <SentenceSpellingMode
          sentence={currentSentence}
          onComplete={handleComplete}
          onScoreUpdate={setScore}
          currentScore={score}
          totalSentences={sentences.length}
        />
      ) : (
        <WordSpellingMode
          sentence={currentSentence}
          onComplete={handleComplete}
          onScoreUpdate={setScore}
          currentScore={score}
          totalSentences={sentences.length}
        />
      )}

      {/* 底部进度条 */}
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: '#4b5563',
        borderRadius: '2px',
        marginTop: '20px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${((currentIndex + 1) / sentences.length) * 100}%`,
          height: '100%',
          backgroundColor: '#10b981',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* 添加动画样式 */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          button {
            transition: all 0.2s ease;
          }
          
          button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          
          textarea:focus {
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
            outline: none;
          }
        `}
      </style>
    </div>
  );
};

// ==================== 导出组件 ====================
// 默认导出练习页面组件
export default SentencePractice;

// 同时导出各个子组件供其他文件使用
export { 
  SentenceSpellingMode,
  WordSpellingMode,
  AudioPlayer,
  splitWords
};