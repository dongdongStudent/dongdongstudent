// components/SentenceViewer/helpers.js

// 根据正确率自动判断是否掌握（支持区分模式）
// 规则：正确率 >= 80% 且总回答次数 >= 3，才算掌握
export const recalculateMastery = (sentence, mode = 'spelling') => {
  let correctCount, wrongCount;
  
  if (mode === 'listening') {
    correctCount = sentence.listening_correct_count || 0;
    wrongCount = sentence.listening_wrong_count || 0;
  } else {
    correctCount = sentence.spelling_correct_count || 0;
    wrongCount = sentence.spelling_wrong_count || 0;
  }
  
  const totalCount = correctCount + wrongCount;
  
  if (totalCount < 3) {
    return false;
  }
  
  const accuracy = (correctCount / totalCount) * 100;
  return accuracy >= 80;
};

// 批量重新计算所有句子的掌握状态
export const recalculateAllMastery = (sentencesArray) => {
  return sentencesArray.map(sentence => ({
    ...sentence,
    pass: recalculateMastery(sentence, 'spelling') || recalculateMastery(sentence, 'listening'),
    spelling_pass: recalculateMastery(sentence, 'spelling'),
    listening_pass: recalculateMastery(sentence, 'listening')
  }));
};

// 计算单个模式的胜率
export const calculateModeWinRate = (sentence, mode) => {
  let correct, wrong;
  if (mode === 'listening') {
    correct = sentence.listening_correct_count || 0;
    wrong = sentence.listening_wrong_count || 0;
  } else {
    correct = sentence.spelling_correct_count || 0;
    wrong = sentence.spelling_wrong_count || 0;
  }
  const total = correct + wrong;
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
};

// 计算胜率
export const calculateWinRate = (correct, wrong) => {
  const total = correct + wrong;
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
};

// 格式化日期
export const formatDate = (dateStr) => {
  if (!dateStr) return '从未';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取掌握状态颜色
export const getMasteryColor = (pass) => {
  return pass ? '#4CAF50' : '#FF9800';
};

// 获取排序图标（新增）
export const getSortIcon = (sortConfig, key) => {
  if (sortConfig.key !== key) return '↕️';
  return sortConfig.direction === 'asc' ? '↑' : '↓';
};

// 排序函数
export const getSortedSentences = (sentences, sortConfig) => {
  const sorted = [...sentences];
  const { key, direction } = sortConfig;
  
  sorted.sort((a, b) => {
    let aValue, bValue;
    
    switch(key) {
      case 'text':
        aValue = a.text || '';
        bValue = b.text || '';
        break;
      case 'chinese':
        aValue = a.chinese || '';
        bValue = b.chinese || '';
        break;
      case 'extraction':
        aValue = a.extraction_count || 0;
        bValue = b.extraction_count || 0;
        break;
      case 'correct':
        aValue = a.correct_count || 0;
        bValue = b.correct_count || 0;
        break;
      case 'wrong':
        aValue = a.wrong_count || 0;
        bValue = b.wrong_count || 0;
        break;
      case 'spelling_correct':
        aValue = a.spelling_correct_count || 0;
        bValue = b.spelling_correct_count || 0;
        break;
      case 'spelling_wrong':
        aValue = a.spelling_wrong_count || 0;
        bValue = b.spelling_wrong_count || 0;
        break;
      case 'listening_correct':
        aValue = a.listening_correct_count || 0;
        bValue = b.listening_correct_count || 0;
        break;
      case 'listening_wrong':
        aValue = a.listening_wrong_count || 0;
        bValue = b.listening_wrong_count || 0;
        break;
      case 'pass':
        aValue = a.pass ? 1 : 0;
        bValue = b.pass ? 1 : 0;
        break;
      case 'time':
        aValue = new Date(a.time || 0).getTime();
        bValue = new Date(b.time || 0).getTime();
        break;
      case 'last_answer':
        aValue = a.last_answer_time ? new Date(a.last_answer_time).getTime() : 0;
        bValue = b.last_answer_time ? new Date(b.last_answer_time).getTime() : 0;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};