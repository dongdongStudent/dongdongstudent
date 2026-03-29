import React, { useState, useEffect, useCallback } from 'react';

// ==================== 单词拆分工具 ====================
export const splitWords = (text) => {
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

// ==================== 音频播放组件 (紧凑版) ====================
export const AudioPlayer = ({ text, autoPlay = true, compact = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const speak = useCallback(() => {
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
  }, [text]);

  useEffect(() => {
    if (autoPlay && text && !hasPlayed) {
      const timer = setTimeout(speak, 500);
      return () => {
        clearTimeout(timer);
        window.speechSynthesis?.cancel();
      };
    }
  }, [text, autoPlay, hasPlayed, speak]);

  // 紧凑模式
  if (compact) {
    return (
      <div style={styles.compactAudioPlayer}>
        <button 
          onClick={speak} 
          style={{
            ...styles.compactPlayButton,
            opacity: isPlaying ? 0.5 : 1,
            cursor: isPlaying ? 'not-allowed' : 'pointer'
          }} 
          disabled={isPlaying}
          title={isPlaying ? '正在播放' : hasPlayed ? '重新播放' : '播放'}
        >
          {isPlaying ? '🔊' : hasPlayed ? '🔈' : '🔇'}
        </button>
        <span style={styles.compactStatus}>
          {isPlaying ? '播放中' : hasPlayed ? '已播放' : ''}
        </span>
      </div>
    );
  }

  // 默认模式 (保留原样)
  return (
    <div style={styles.audioPlayer}>
      <div style={{ fontSize: '32px', marginBottom: '5px' }}>
        {isPlaying ? '🔊' : hasPlayed ? '🔈' : '⏳'}
      </div>
      <div style={styles.audioStatus}>
        {isPlaying ? '播放中' : hasPlayed ? '已播放' : '准备'}
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
        {isPlaying ? '⋯' : '重播'}
      </button>
    </div>
  );
};

// ==================== 样式 ====================
export const styles = {
  // 紧凑音频播放器样式
  compactAudioPlayer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#312e81',
    padding: '4px 8px',
    borderRadius: '20px',
    width: 'fit-content'
  },
  compactPlayButton: {
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
  compactStatus: {
    color: '#a5b4fc',
    fontSize: '11px',
    fontWeight: 'bold',
    marginRight: '4px'
  },
  // 默认音频播放器样式 (精简版)
  audioPlayer: {
    backgroundColor: '#312e81',
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '15px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  audioStatus: {
    color: '#a5b4fc',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  playButton: {
    padding: '4px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  card: {
    backgroundColor: '#2d3a4f',
    padding: '20px',
    borderRadius: '14px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    color: 'white'
  },
  chineseBox: {
    backgroundColor: '#1e293b',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#a5b4fc',
    border: '2px solid #10b981',
    lineHeight: '1.4'
  },
  wordSlots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '15px',
    minHeight: '50px',
    padding: '12px',
    backgroundColor: '#1e293b',
    borderRadius: '10px',
    flexWrap: 'wrap'
  },
  wordSlot: {
    minWidth: '70px',
    height: '40px',
    borderBottom: '2px solid #cfd8dc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '4px',
    padding: '0 6px',
    transition: 'all 0.2s'
  },
  wordGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#1a2a3a',
    borderRadius: '10px',
    marginBottom: '12px'
  },
  wordButton: {
    padding: '8px 6px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  button: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    transition: 'all 0.2s'
  }
};

// ==================== 全局动画样式 ====================
export const addGlobalStyles = () => {
  // 检查是否已经添加过
  if (document.getElementById('global-animation-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'global-animation-styles';
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
  `;
  document.head.appendChild(style);
};