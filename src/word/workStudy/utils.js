// workStudy/utils.js
import { message } from 'antd';
import { F_speak, F_translator } from "../../Function/weisimin.js";
import { addWordToReviewList, F_get_words_study } from '../wordReviewUtils.js';

export const API_BASE = 'https://www.ddstudent.xyz/server/english/update_words_study';

export const MODES = ['reading', 'translation', 'listening', 'pronunciation', 'spelling'];

export const MODE_DISPLAY = {
  reading: '📖 英选',
  translation: '✍️ 中选',
  listening: '🎧 听力',
  pronunciation: '🎤 朗读',
  spelling: '🧩 拼图'
};

export const INITIAL_STATS = {
  listening: { total: 0, correct: 0, wrong: 0 },
  reading: { total: 0, correct: 0, wrong: 0 },
  translation: { total: 0, correct: 0, wrong: 0 },
  pronunciation: { total: 0, pass: 0, fail: 0 },
  spelling: { total: 0, correct: 0, wrong: 0 }
};

// ========== 登录检查 ==========
export const checkLogin = (getToken, navigate, onClose) => {
  if (!getToken) {
    message.warning('请先登录');
    setTimeout(() => {
      if (window.confirm('是否跳转到登录页面？')) navigate('/');
      else onClose?.();
    }, 500);
    return false;
  }
  return true;
};

// ========== 单词熟练度 ==========
export const getMasteryLevel = (status = {}) => Object.values(status).filter(v => v).length;

export const getStatusColor = (level) =>
  ['#ff5252', '#ffab40', '#2196f3', '#4caf50'][level] || '#ff5252';

// ========== 音频播放 ==========
export const playAudio = (text, isLooping = false, exerciseMode = '', showOverlay = false, timerRef = null) => {
  if (!text) return;
  clearTimeout(timerRef?.current);
  F_speak(text);
  if (isLooping && exerciseMode === 'listening' && !showOverlay) {
    timerRef.current = setTimeout(() => F_speak(text), 2500);
  }
};

// ========== 选项生成 ==========
export const generateOptions = (target, allWords, exerciseMode) => {
  const others = allWords.filter(w => w.word !== target.word);
  if (others.length < 3) {
    const virtual = [
      { word: '选项A', translation: '虚拟选项A' },
      { word: '选项B', translation: '虚拟选项B' },
      { word: '选项C', translation: '虚拟选项C' }
    ];
    return [target, ...virtual.slice(0, 3)].map(opt => ({
      ...opt,
      displayText: exerciseMode === 'translation' ? opt.word : opt.translation,
      originalWord: opt.word
    })).sort(() => Math.random() - 0.5);
  }

  const candidates = [...others].sort(() => Math.random() - 0.5).slice(0, 6);
  const distractors = candidates.slice(0, 3);

  return [target, ...distractors].map(opt => ({
    ...opt,
    displayText: exerciseMode === 'translation' ? opt.word : opt.translation,
    originalWord: opt.word
  })).sort(() => Math.random() - 0.5);
};

// ========== 拼写字母打乱 ==========
export const shuffleLetters = (word) => {
  const letters = word.toLowerCase().split('');
  return letters
    .sort(() => Math.random() - 0.5)
    .map((letter, id) => ({ id, letter, used: false }));
};

// ========== 获取正确率 ==========
export const getAccuracy = (stats, mode) => {
  const stat = stats[mode];
  if (!stat) return 0;
  if (mode === 'pronunciation') {
    return stat.total ? ((stat.pass / stat.total) * 100).toFixed(1) : 0;
  }
  return stat.total ? ((stat.correct / stat.total) * 100).toFixed(1) : 0;
};

// ========== API 调用 ==========
export const fetchWordsFromServer = async (getToken, wordName) => {
  const data = await F_get_words_study(getToken(), wordName);
  return Array.isArray(data) ? data : [];
};

export const syncWordsToServer = async (getToken, wordName, words) => {
  const res = await fetch(`${API_BASE}/${wordName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': getToken() },
    body: JSON.stringify({ type: 'sync_progress', vocabularyData: words })
  });
  return res.json();
};

export const addWordToServer = async (getToken, wordName, word) => {
  const res = await fetch(`${API_BASE}/${wordName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': getToken() },
    body: JSON.stringify({ type: 'add', word })
  });
  return res.json();
};

export const deleteWordFromServer = async (getToken, wordName, word) => {
  const res = await fetch(`${API_BASE}/${wordName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': getToken() },
    body: JSON.stringify({ type: 'delete', word })
  });
  return res.json();
};

export const updateWordTranslationAPI = async (getToken, word, translation) => {
  const response = await fetch('https://www.ddstudent.xyz/server/resource/update_word_translation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getToken()
    },
    body: JSON.stringify({ word, translation })
  });
  return response.json();
};