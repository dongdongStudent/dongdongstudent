// 辅助函数：检查是否为有效的单词或短语（不超过7个单词）
export const isValidText = (text) => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (/[\u4e00-\u9fa5]/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  return words.length > 0 && words.length <= 7;
};

// 辅助函数：获取单词数量
export const getWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// 辅助函数：检查是否为单词（不含空格或只有1个单词）
export const isSingleWord = (text) => {
  const words = text.trim().split(/\s+/);
  return words.length === 1;
};

// 检查是否为短文本（不需要拆分的文本）
export const isShortText = (text) => {
  if (!text) return true;
  const wordCount = getWordCount(text);
  return wordCount <= 7 && text.length <= 100;
};

// 句子拆分函数
export const splitTextIntoSentences = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const trimmed = text.trim();
  
  // 如果是短文本，直接返回
  if (isShortText(trimmed)) {
    return [trimmed];
  }
  
  const sentences = [];
  let currentSentence = '';
  
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    currentSentence += char;
    
    // 检查是否是句子结束符 (. ! ?)
    if (char === '.' || char === '!' || char === '?') {
      const nextChar = trimmed[i + 1];
      const isEndOfString = i === trimmed.length - 1;
      
      if (isEndOfString || nextChar === ' ' || nextChar === '\n' || nextChar === '\r') {
        const cleaned = currentSentence.trim();
        if (cleaned.length > 0) {
          sentences.push(cleaned);
        }
        currentSentence = '';
        if (nextChar === ' ' || nextChar === '\n' || nextChar === '\r') {
          i++;
        }
      }
    }
  }
  
  // 处理剩余内容
  if (currentSentence.trim().length > 0) {
    const remaining = currentSentence.trim();
    if (sentences.length === 0) {
      sentences.push(remaining);
    } else if (remaining.length > 0) {
      const lastIndex = sentences.length - 1;
      sentences[lastIndex] = sentences[lastIndex] + ' ' + remaining;
    }
  }
  
  // 如果没有拆分成多个句子，返回原文本
  if (sentences.length <= 1) {
    return [trimmed];
  }
  
  console.log('【句子拆分】共', sentences.length, '个句子');
  return sentences.filter(s => s.length > 0);
};