// workStudy/phoneticPlayer.js
import React, { useState, useEffect } from 'react';

// 音素到MP3文件的映射（直接使用音素文本作为文件名）
const phonemeToMp3 = (phonemeText) => {
  return `/phonetics/${phonemeText}.mp3`;
};

// 播放音素MP3
const playPhonemeAudio = (phonemeText) => {
  const mp3Path = phonemeToMp3(phonemeText);
  const audio = new Audio(mp3Path);
  audio.play().catch(err => {
    console.error('播放音素失败:', phonemeText, err);
  });
};

// workStudy/phoneticPlayer.js - splitPhonetic 函数保持不变
// 确保 aʊ 被识别为双元音

export const splitPhonetic = (phonetic) => {
  if (!phonetic) return [];
  
  let cleanPhonetic = phonetic.replace(/^\//, '').replace(/\/$/, '');
  
  const phonemes = [];
  let i = 0;
  
  while (i < cleanPhonetic.length) {
    let char = cleanPhonetic[i];
    let nextChar = cleanPhonetic[i + 1];
    let nextNextChar = cleanPhonetic[i + 2];
    
    // 处理三字符音标
    if (
      (char === 'a' && nextChar === 'ɪ' && nextNextChar === 'ə') ||
      (char === 'a' && nextChar === 'ʊ' && nextNextChar === 'ə')
    ) {
      phonemes.push({ text: char + nextChar + nextNextChar, key: `${char}${nextChar}${nextNextChar}_${i}` });
      i += 3;
      continue;
    }
    
    // 处理双字符双元音（关键：aʊ 必须在这里被识别）
    if (
      (char === 'a' && nextChar === 'ʊ') ||  // aʊ - how, now
      (char === 'a' && nextChar === 'ɪ') ||  // aɪ - my, like
      (char === 'e' && nextChar === 'ɪ') ||  // eɪ - day, make
      (char === 'ɔ' && nextChar === 'ɪ') ||  // ɔɪ - boy, toy
      (char === 'ə' && nextChar === 'ʊ') ||  // əʊ - go, no
      (char === 'ɪ' && nextChar === 'ə') ||  // ɪə - here, near
      (char === 'e' && nextChar === 'ə') ||  // eə - there, care
      (char === 'ʊ' && nextChar === 'ə')     // ʊə - pure, cure
    ) {
      phonemes.push({ text: char + nextChar, key: `${char}${nextChar}_${i}` });
      i += 2;
      continue;
    }
    
    // 处理带长音符号的单元音
    if (
      (char === 'ɔ' && nextChar === 'ː') ||
      (char === 'i' && nextChar === 'ː') ||
      (char === 'ɑ' && nextChar === 'ː') ||
      (char === 'ɜ' && nextChar === 'ː') ||
      (char === 'u' && nextChar === 'ː') ||
      (char === 'ʌ' && nextChar === 'ː')
    ) {
      phonemes.push({ text: char + nextChar, key: `${char}${nextChar}_${i}` });
      i += 2;
      continue;
    }
    
    // 处理破擦音
    if (
      (char === 'd' && nextChar === 'ʒ') ||
      (char === 't' && nextChar === 'ʃ') ||
      (char === 't' && nextChar === 's') ||
      (char === 'd' && nextChar === 'z') ||
      (char === 't' && nextChar === 'r') ||
      (char === 'd' && nextChar === 'r')
    ) {
      phonemes.push({ text: char + nextChar, key: `${char}${nextChar}_${i}` });
      i += 2;
      continue;
    }
    
    // 处理重音符号
    if (char === 'ˈ' || char === 'ˌ') {
      phonemes.push({ text: char, key: `${char}_${i}`, isStress: true, noSound: true });
      i++;
      continue;
    }
    
    // 单个字符音标
    if (char.trim() && char !== 'ː') {
      phonemes.push({ text: char, key: `${char}_${i}` });
    }
    i++;
  }
  
  return phonemes;
};

// 播放音素
export const playPhoneme = (phoneme) => {
  if (!phoneme || !phoneme.text) return;
  if (phoneme.isStress || phoneme.noSound) return;
  
  playPhonemeAudio(phoneme.text);
};

// ========== 音标点击发音组件 ==========
export const PhoneticPlayer = ({ 
  phonetic, 
  style, 
  compact = false 
}) => {
  const [phonemes, setPhonemes] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (phonetic) {
      const split = splitPhonetic(phonetic);
      setPhonemes(split);
    } else {
      setPhonemes([]);
    }
  }, [phonetic]);

  const handlePhonemeClick = (phoneme, index) => {
    setActiveIndex(index);
    playPhoneme(phoneme);
    
    setTimeout(() => {
      setActiveIndex(-1);
    }, 300);
  };

  if (!phonemes.length) {
    return (
      <div 
        style={{ 
          ...style, 
          color: '#a5b4fc'
        }}
      >
        {phonetic || '暂无音标'}
      </div>
    );
  }

  const defaultStyles = {
    container: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: compact ? '4px' : '10px',
      fontFamily: 'monospace',
      ...style
    },
    phoneme: {
      padding: compact ? '4px 8px' : '8px 14px',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: '#2d3a4f',
      color: '#a5b4fc',
      fontSize: compact ? '13px' : '22px',
      fontWeight: '500',
      userSelect: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    phonemeActive: {
      backgroundColor: '#4caf50',
      color: '#fff',
      transform: 'scale(1.08)',
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
    },
    stress: {
      backgroundColor: '#ffab40',
      color: '#fff',
      fontSize: compact ? '12px' : '18px',
      padding: compact ? '2px 6px' : '4px 10px',
      opacity: 0.85
    }
  };

  return (
    <div style={defaultStyles.container}>
      {phonemes.map((phoneme, index) => (
        <span
          key={phoneme.key || index}
          onClick={() => handlePhonemeClick(phoneme, index)}
          style={{
            ...defaultStyles.phoneme,
            ...(phoneme.isStress ? defaultStyles.stress : {}),
            ...(activeIndex === index ? defaultStyles.phonemeActive : {})
          }}
          title={phoneme.isStress ? '重音标记（不发音）' : `点击发音: ${phoneme.text}`}
        >
          {phoneme.text}
        </span>
      ))}
    </div>
  );
};