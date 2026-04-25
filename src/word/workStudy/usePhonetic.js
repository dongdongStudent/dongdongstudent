// workStudy/usePhonetic.js
import { useState, useEffect, useRef, useCallback } from 'react';

// 全局音标缓存
const globalPhoneticCache = new Map();

// 转换音标为显示格式
export const convertPhonetic = (phonetic) => {
  if (!phonetic) return '';
  
  let result = phonetic;
  
  // 1. 先处理双元音（用临时占位符，避免被单元音替换拆散）
  // 使用不会出现在音标中的字符作为占位符
  result = result.replace(/aʊ/g, '§1§');
  result = result.replace(/aɪ/g, '§2§');
  result = result.replace(/eɪ/g, '§3§');
  result = result.replace(/ɔɪ/g, '§4§');
  result = result.replace(/əʊ/g, '§5§');
  result = result.replace(/ɪə/g, '§6§');
  result = result.replace(/eə/g, '§7§');
  result = result.replace(/ʊə/g, '§8§');
  
  // 2. 处理单元音映射
  const singleReplacements = [
    ['ɐ', 'ʌ'],
    ['ɑ', 'ɑː'],
    ['a', 'æ'],
    ['ɜ', 'ɜː'],
    ['ɔ', 'ɔː'],
    ['i', 'iː'],
    ['u', 'uː'],
  ];
  
  for (const [from, to] of singleReplacements) {
    const regex = new RegExp(from, 'g');
    result = result.replace(regex, to);
  }
  
  // 3. 恢复双元音
  result = result.replace(/§1§/g, 'aʊ');
  result = result.replace(/§2§/g, 'aɪ');
  result = result.replace(/§3§/g, 'eɪ');
  result = result.replace(/§4§/g, 'ɔɪ');
  result = result.replace(/§5§/g, 'əʊ');
  result = result.replace(/§6§/g, 'ɪə');
  result = result.replace(/§7§/g, 'eə');
  result = result.replace(/§8§/g, 'ʊə');
  
  return result;
};

// 获取音频文件名
export const getAudioFileName = (phoneme) => {
  return phoneme;
};

// 从服务器获取音标
const fetchPhoneticFromServer = async (word, getToken) => {
  const lowerWord = word.toLowerCase().trim();
  
  try {
    const token = typeof getToken === 'function' ? getToken() : getToken;
    
    const response = await fetch(
      `https://www.ddstudent.xyz/server/resource/get_phonetic?word=${encodeURIComponent(lowerWord)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        }
      }
    );
    
    const data = await response.json();
    
    console.log(`获取音标 ${word}:`, data); // 调试用
    
    if (data.flag === 1 && data.content) {
      const converted = convertPhonetic(data.content);
      console.log(`转换后: ${data.content} -> ${converted}`); // 调试用
      return converted;
    } else {
      return `/${lowerWord}/`;
    }
  } catch (error) {
    console.error('获取音标失败:', error);
    return `/${lowerWord}/`;
  }
};

// Hook: 获取单个单词音标
export const usePhonetic = (word, getToken, autoFetch = true) => {
  const [phonetic, setPhonetic] = useState('');
  const [loading, setLoading] = useState(false);
  const currentWordRef = useRef(null);
  const versionRef = useRef(0);

  const fetchPhonetic = useCallback(async (targetWord, forceRefresh = false) => {
    if (!targetWord) {
      setPhonetic('');
      return;
    }
    
    const lowerWord = targetWord.toLowerCase().trim();
    const currentVersion = ++versionRef.current;
    currentWordRef.current = lowerWord;
    
    if (!forceRefresh && globalPhoneticCache.has(lowerWord)) {
      if (currentWordRef.current === lowerWord && currentVersion === versionRef.current) {
        setPhonetic(globalPhoneticCache.get(lowerWord));
      }
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await fetchPhoneticFromServer(targetWord, getToken);
      globalPhoneticCache.set(lowerWord, result);
      if (currentWordRef.current === lowerWord && currentVersion === versionRef.current) {
        setPhonetic(result);
      }
    } catch (err) {
      const fallback = `/${lowerWord}/`;
      globalPhoneticCache.set(lowerWord, fallback);
      if (currentWordRef.current === lowerWord && currentVersion === versionRef.current) {
        setPhonetic(fallback);
      }
    } finally {
      if (currentWordRef.current === lowerWord && currentVersion === versionRef.current) {
        setLoading(false);
      }
    }
  }, [getToken]);

  useEffect(() => {
    if (autoFetch && word) {
      fetchPhonetic(word);
    } else if (!word) {
      setPhonetic('');
      currentWordRef.current = null;
    }
  }, [word, autoFetch, fetchPhonetic]);

  return { phonetic, loading, refetch: () => fetchPhonetic(word, true) };
};

// 同步获取音标（仅从缓存获取）
export const getPhoneticSync = (word) => {
  if (!word) return '';
  const lower = word.toLowerCase().trim();
  const cached = globalPhoneticCache.get(lower);
  return cached ? convertPhonetic(cached) : null;
};

// 清除指定单词的缓存
export const clearPhoneticCache = (word) => {
  if (word) {
    const lower = word.toLowerCase().trim();
    globalPhoneticCache.delete(lower);
  } else {
    globalPhoneticCache.clear();
  }
};