// components/ListeningTest.js
import React, { useState, useEffect, useRef } from 'react';
import { sentenceApi } from '../../api';
import { listeningStyles } from './styles';
import { F_speak } from '../../../Function/weisimin';

const ListeningTest = ({ sentences, currentIndex, onComplete, onScoreUpdate, currentScore }) => {
  const [showResult, setShowResult] = useState(false);
  const [isUnderstood, setIsUnderstood] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showText, setShowText] = useState(false); // 控制英文+中文显示
  const audioPlayedRef = useRef(false);
  const autoNextTimerRef = useRef(null);

  const currentSentence = sentences[currentIndex];

  const playAudio = async () => {
    if (!currentSentence) {
      setAudioError(true);
      return;
    }

    try {
      setIsPlaying(true);
      setAudioError(false);
      
      await F_speak(currentSentence.text);
      
      audioPlayedRef.current = true;
      setAudioError(false);
    } catch (error) {
      console.error('播放音频失败:', error);
      setAudioError(true);
    } finally {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!currentSentence) return;
    
    setShowResult(false);
    setHasAnswered(false);
    setIsPlaying(false);
    setAudioError(false);
    setShowText(false); // 重置显示状态
    audioPlayedRef.current = false;
    
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    
    const timer = setTimeout(() => {
      if (!audioPlayedRef.current) {
        playAudio();
      }
    }, 300);
    
    return () => {
      clearTimeout(timer);
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, [currentIndex, currentSentence]);

  const handleAnswer = async (understood) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    
    setIsUnderstood(understood);
    
    if (!understood) {
      onScoreUpdate(Math.max(0, currentScore - 10));
    } else {
      onScoreUpdate(currentScore + 5);
    }
    
    try {
      await sentenceApi.increment(currentSentence.id);
      
      if (understood) {
        await sentenceApi.incrementCorrect(currentSentence.id, 'listening');
      } else {
        await sentenceApi.incrementWrong(currentSentence.id, 'listening');
      }
      
      await sentenceApi.updateLastAnswerTime(currentSentence.id);
      
    } catch (error) {
      console.error('更新统计失败:', error);
    }

    if (understood) {
      setShowResult(true);
      autoNextTimerRef.current = setTimeout(() => {
        onComplete(true);
      }, 800);
    } else {
      setShowResult(true);
    }
  };

  const handleNext = () => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    onComplete(isUnderstood);
  };

  if (!currentSentence) return null;

  return (
    <div style={listeningStyles.card}>
      <div style={listeningStyles.audioSection}>
        <button 
          onClick={playAudio}
          style={{
            ...listeningStyles.playButton,
            animation: isPlaying ? 'pulse 1s ease-in-out infinite' : 'none'
          }}
          disabled={isPlaying}
        >
          {isPlaying ? '🔊 播放中...' : (audioError ? '⚠️ 点击重试' : '🔊 播放音频')}
        </button>
        <div style={listeningStyles.hint}>
          {audioError ? '音频播放失败，请检查网络连接' : '点击按钮或等待自动播放'}
        </div>
      </div>

      {/* 整合的英文+中文显示区域 */}
      <div style={listeningStyles.textSection}>
        <div style={listeningStyles.textHeader}>
          <div style={listeningStyles.textLabel}>📝 句子内容：</div>
          <button 
            onClick={() => setShowText(!showText)}
            style={listeningStyles.toggleTextButton}
            title={showText ? "隐藏内容" : "显示内容"}
          >
            {showText ? '🙈 隐藏' : '👀 显示'}
          </button>
        </div>
        
        {showText ? (
          <div style={listeningStyles.textContent}>
            <div style={listeningStyles.englishText}>
              <span style={listeningStyles.langLabel}>🇬🇧 英文：</span>
              {currentSentence.text}
            </div>
            <div style={listeningStyles.chineseText}>
              <span style={listeningStyles.langLabel}>📖 中文：</span>
              {currentSentence.chinese}
            </div>
          </div>
        ) : (
          <div style={listeningStyles.textHidden}>
            <span style={listeningStyles.textHiddenSymbol}>?????</span>
            <span style={listeningStyles.textHiddenHint}>点击"显示"查看句子内容（英文+中文）</span>
          </div>
        )}
      </div>

      {!showResult ? (
        <div style={listeningStyles.buttonGroup}>
          <button 
            onClick={() => handleAnswer(true)} 
            style={listeningStyles.passButton}
          >
            ✅ 听懂了
          </button>
          <button 
            onClick={() => handleAnswer(false)} 
            style={listeningStyles.failButton}
          >
            ❌ 没听懂
          </button>
        </div>
      ) : (
        <div style={{
          ...listeningStyles.resultBox,
          backgroundColor: isUnderstood ? '#10b98120' : '#ef444420',
          borderColor: isUnderstood ? '#10b981' : '#ef4444'
        }}>
          <div style={listeningStyles.resultIcon}>
            {isUnderstood ? '✅ 听懂了！即将进入下一题...' : '❌ 没听懂'}
          </div>
          {!isUnderstood && (
            <div style={listeningStyles.resultAnswer}>
              <div style={listeningStyles.resultLabel}>原句：</div>
              <div style={listeningStyles.resultText}>{currentSentence.text}</div>
              <div style={listeningStyles.resultChinese}>{currentSentence.chinese}</div>
              <div style={{...listeningStyles.resultLabel, marginTop: '8px'}}>💡 建议：</div>
              <div style={listeningStyles.resultText}>多听几遍，尝试跟读练习</div>
            </div>
          )}
          {isUnderstood && (
            <div style={listeningStyles.resultAnswer}>
              <div>👍 很好！0.8秒后自动进入下一题～</div>
            </div>
          )}
          {!isUnderstood && (
            <button onClick={handleNext} style={listeningStyles.nextButton}>
              {currentIndex < sentences.length - 1 ? '下一题 →' : '✓ 完成测试'}
            </button>
          )}
        </div>
      )}

      <div style={listeningStyles.progressRow}>
        <span style={listeningStyles.progressText}>
          {currentIndex + 1} / {sentences.length}
        </span>
        <span style={listeningStyles.scoreText}>得分: {currentScore}</span>
      </div>
    </div>
  );
};

export default ListeningTest;