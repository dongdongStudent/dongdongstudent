import { message } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { F_speak, F_translator } from "../Function/weisimin.js";
import { addWordToReviewList, F_get_words_study } from './wordReviewUtils.js';

// ==================== 常量配置 ====================
const API_BASE = 'https://www.ddstudent.xyz/server/english/update_words_study';
const MODES = ['reading', 'translation', 'listening', 'pronunciation', 'spelling'];
const MODE_DISPLAY = {
  reading: '📖 英选',
  translation: '✍️ 中选',
  listening: '🎧 听力',
  pronunciation: '🎤 朗读',
  spelling: '🧩 拼图'
};

// ==================== 主组件 ====================
const VocabularyMaster = ({ onClose, getToken, clickWork, onWordChange, net, G_word_name }) => {
  const navigate = useNavigate();
  
  // ========== 状态合并 ==========
  const [state, setState] = useState({
    words: [],
    exerciseMode: 'reading',
    currentIdx: 0,
    options: [],
    feedback: null,
    showOverlay: false,
    roundFinished: false,
    isRightPanelCollapsed: false,
    isMaskEnabled: true,
    newWord: "",
    isAdding: false,
    isLooping: false,
    translate: "",
    isPracticeMode: false,
    availableLetters: [],
    selectedLetters: [],
    isChecking: false,
    deletingWord: null,
    isSimpleMode: false, // 新增简洁模式状态
    stats: {
      listening: { total: 0, correct: 0, wrong: 0 },
      reading: { total: 0, correct: 0, wrong: 0 },
      translation: { total: 0, correct: 0, wrong: 0 },
      pronunciation: { total: 0, pass: 0, fail: 0 },
      spelling: { total: 0, correct: 0, wrong: 0 }
    }
  });

  const timerRef = useRef(null);
  const roundWordsRef = useRef([]);
  const lastSyncedRef = useRef(null);
  
  // 拖动相关
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 250, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  // ========== 工具函数 ==========
  const checkLogin = () => {
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

  const getMasteryLevel = (status = {}) => Object.values(status).filter(v => v).length;
  
  const getStatusColor = (level) => 
    ['#ff5252', '#ffab40', '#2196f3', '#4caf50'][level] || '#ff5252';

  const playAudio = (text) => {
    if (!text) return;
    clearTimeout(timerRef.current);
    F_speak(text);
    if (state.isLooping && state.exerciseMode === 'listening' && !state.showOverlay) {
      timerRef.current = setTimeout(() => F_speak(text), 2500);
    }
  };

  const triggerChange = (updatedList, mode = state.exerciseMode, idx = state.currentIdx) => {
    if (onWordChange) {
      onWordChange({
        allWords: updatedList,
        newWords: updatedList?.map(w => w.word) || [],
        currentMode: mode,
        activeWord: roundWordsRef.current[idx] || null,
        addWord: state.newWord,
        isPracticeMode: state.isPracticeMode
      });
    }
  };

  const refreshPool = (mode = state.exerciseMode, source = state.words) => {
    if (!source.length) return;
    roundWordsRef.current = state.isPracticeMode 
      ? [...source]
      : source.filter(w => !w.status?.[mode]);
    setState(prev => ({ 
      ...prev, 
      currentIdx: 0, 
      roundFinished: false,
      selectedLetters: [],
      availableLetters: [],
      isChecking: false 
    }));
  };

  const resetAll = () => {
    setState(prev => ({
      ...prev,
      currentIdx: 0,
      roundFinished: false,
      feedback: null,
      showOverlay: false,
      selectedLetters: [],
      availableLetters: [],
      isChecking: false,
      isLooping: false,
      options: []
    }));
    clearTimeout(timerRef.current);
  };

  // ========== 拖动功能 ==========
  const handleMouseDown = (e) => {
    if (!e.target.closest('.drag-handle')) return;
    e.preventDefault();
    
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.x,
      startTop: position.y
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      if (!dragRef.current.isDragging) return;
      
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      const newX = Math.max(0, Math.min(dragRef.current.startLeft + deltaX, window.innerWidth - 550));
      const newY = Math.max(0, Math.min(dragRef.current.startTop + deltaY, window.innerHeight - 60));
      
      setPosition({ x: newX, y: newY });
    };

    const handleUp = () => {
      dragRef.current.isDragging = false;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  // ========== 数据操作 ==========
  const fetchWords = async () => {
    if (!checkLogin() || !getToken) return;
    try {
      const data = await F_get_words_study(getToken, G_word_name);
      const fetched = Array.isArray(data) ? data : [];
      setState(prev => ({ ...prev, words: fetched }));
      lastSyncedRef.current = JSON.stringify(fetched);
      triggerChange(fetched);
      refreshPool(state.exerciseMode, fetched);
    } catch (err) {
      console.error("fetchWords 异常:", err);
      message.error("无法连接到服务器");
    }
  };

  const syncData = async (words = state.words) => {
    if (!checkLogin() || !getToken || !words.length) return;
    addWordToReviewList(getToken, G_word_name);
    
    const dataStr = JSON.stringify(words);
    if (lastSyncedRef.current === dataStr) {
      message.info("数据未变动");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/${G_word_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': getToken },
        body: JSON.stringify({ type: 'sync_progress', vocabularyData: words })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.flag === 1) {
          message.success(`☁️ 进度已更新`);
          lastSyncedRef.current = JSON.stringify(data.content || words);
          if (data.content) setState(prev => ({ ...prev, words: data.content }));
        }
      }
    } catch (err) {
      console.error("同步异常", err);
      message.error(`同步异常`);
    }
  };

  const handleAddWord = async () => {
    if (!checkLogin() || !state.newWord.trim()) {
      message.warning('请输入单词');
      return;
    }
    
    const trimmed = state.newWord.trim();
    if (state.words.some(w => w.word.toLowerCase() === trimmed.toLowerCase())) {
      message.warning(`单词 "${trimmed}" 已存在`);
      setState(prev => ({ ...prev, newWord: "", translate: "" }));
      return;
    }

    setState(prev => ({ ...prev, isAdding: true }));
    try {
      const res = await fetch(`${API_BASE}/${G_word_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': getToken },
        body: JSON.stringify({ type: 'add', word: trimmed })
      });
      const data = await res.json();
      if (data.flag === 1) {
        message.success(`单词 "${trimmed}" 添加成功`);
        setState(prev => ({ ...prev, newWord: "", translate: "" }));
        const refreshed = await F_get_words_study(getToken, G_word_name);
        setState(prev => ({ ...prev, words: refreshed }));
        lastSyncedRef.current = JSON.stringify(refreshed);
        refreshPool(state.exerciseMode, refreshed);
        triggerChange(refreshed);
      } else {
        message.error(data.msg || "添加失败");
      }
    } catch (err) {
      console.error("添加单词异常:", err);
      message.error("网络异常");
    } finally {
      setState(prev => ({ ...prev, isAdding: false }));
    }
  };

  const handleDeleteWord = async (wordText) => {
    if (!wordText || !checkLogin()) return;
    
    const updated = state.words.filter(w => w.word !== wordText);
    setState(prev => ({ ...prev, words: updated }));
    roundWordsRef.current = roundWordsRef.current.filter(w => w.word !== wordText);
    
    if (!roundWordsRef.current.length) setState(prev => ({ ...prev, currentIdx: 0 }));
    else if (state.currentIdx >= roundWordsRef.current.length) {
      setState(prev => ({ ...prev, currentIdx: roundWordsRef.current.length - 1 }));
    }
    
    triggerChange(updated);
    
    try {
      const res = await fetch(`${API_BASE}/${G_word_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': getToken },
        body: JSON.stringify({ type: 'delete', word: wordText })
      });
      const data = await res.json();
      if (data.flag !== 1) {
        message.error(data.msg || "删除失败");
        fetchWords();
      } else {
        message.success(`"${wordText}" 已删除`);
      }
    } catch (err) {
      console.error("删除单词异常:", err);
      fetchWords();
      message.error("网络异常");
    }
  };

  // ========== 拼写相关 ==========
  const initSpelling = () => {
    const word = roundWordsRef.current[state.currentIdx]?.word;
    if (!word) return;
    
    const letters = word.toLowerCase().split('');
    const shuffled = letters
      .sort(() => Math.random() - 0.5)
      .map((letter, id) => ({ id, letter, used: false }));
    
    setState(prev => ({ 
      ...prev, 
      availableLetters: shuffled, 
      selectedLetters: [], 
      isChecking: false 
    }));
  };

  const handleLetterClick = (letterId) => {
    if (state.showOverlay || state.isChecking) return;
    
    const letter = state.availableLetters.find(l => l.id === letterId);
    if (!letter || letter.used) return;

    setState(prev => ({
      ...prev,
      selectedLetters: [...prev.selectedLetters, { ...letter }],
      availableLetters: prev.availableLetters.map(l => 
        l.id === letterId ? { ...l, used: true } : l
      )
    }));
  };

  const handleRemoveLetter = (index) => {
    if (state.showOverlay || state.isChecking) return;
    
    const letter = state.selectedLetters[index];
    if (!letter) return;

    setState(prev => ({
      ...prev,
      selectedLetters: prev.selectedLetters.filter((_, i) => i !== index),
      availableLetters: prev.availableLetters.map(l => 
        l.id === letter.id ? { ...l, used: false } : l
      )
    }));
  };

  const clearAllLetters = () => {
    if (state.showOverlay || state.isChecking) return;
    setState(prev => ({
      ...prev,
      availableLetters: prev.availableLetters.map(l => ({ ...l, used: false })),
      selectedLetters: []
    }));
  };

  const checkSpelling = () => {
    if (!checkLogin()) return;
    
    const target = roundWordsRef.current[state.currentIdx];
    const userWord = state.selectedLetters.map(l => l.letter).join('');
    const isCorrect = userWord === target.word.toLowerCase();

    setState(prev => ({ ...prev, isChecking: true }));

    if (!state.isPracticeMode) {
      const updated = state.words.map(w =>
        w.word === target.word ? { ...w, status: { ...w.status, spelling: isCorrect } } : w
      );
      setState(prev => ({ ...prev, words: updated }));
      triggerChange(updated);
      
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          spelling: {
            total: prev.stats.spelling.total + 1,
            correct: prev.stats.spelling.correct + (isCorrect ? 1 : 0),
            wrong: prev.stats.spelling.wrong + (isCorrect ? 0 : 1)
          }
        }
      }));
    } else {
      message.info('练习模式：结果不会被记录');
    }

    setState(prev => ({
      ...prev,
      feedback: {
        isCorrect,
        correctWord: { ...target },
        message: isCorrect ? "✅ 拼写正确！" : `❌ 拼写错误，正确答案是: ${target.word}`,
        isPracticeMode: prev.isPracticeMode
      },
      showOverlay: true
    }));
  };

  // ========== 选项生成 ==========
  const generateOptions = (target) => {
    const others = state.words.filter(w => w.word !== target.word);
    if (others.length < 3) {
      const virtual = [
        { word: '选项A', translation: '虚拟选项A' },
        { word: '选项B', translation: '虚拟选项B' },
        { word: '选项C', translation: '虚拟选项C' }
      ];
      return [target, ...virtual.slice(0, 3)].map(opt => ({
        ...opt,
        displayText: state.exerciseMode === 'translation' ? opt.word : opt.translation,
        originalWord: opt.word
      })).sort(() => Math.random() - 0.5);
    }

    const candidates = [...others].sort(() => Math.random() - 0.5).slice(0, 6);
    const distractors = candidates.slice(0, 3);
    
    return [target, ...distractors].map(opt => ({
      ...opt,
      displayText: state.exerciseMode === 'translation' ? opt.word : opt.translation,
      originalWord: opt.word
    })).sort(() => Math.random() - 0.5);
  };

  // ========== 处理函数 ==========
  const handleAnswer = (selectedText) => {
    if (!checkLogin() || ['pronunciation', 'spelling'].includes(state.exerciseMode)) return;
    if (state.showOverlay || !roundWordsRef.current.length || state.roundFinished) return;
    
    const target = roundWordsRef.current[state.currentIdx];
    const selected = state.options.find(o => o.displayText === selectedText);
    const isCorrect = selected?.originalWord === target.word;

    if (state.exerciseMode === 'translation' || !isCorrect) {
      F_speak(target.word);
    } else if (['reading', 'listening'].includes(state.exerciseMode)) {
      F_speak(target.word);
    }

    clearTimeout(timerRef.current);

    if (!state.isPracticeMode) {
      const updated = state.words.map(w =>
        w.word === target.word ? { ...w, status: { ...w.status, [state.exerciseMode]: isCorrect } } : w
      );
      setState(prev => ({ ...prev, words: updated }));
      triggerChange(updated);
      
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [state.exerciseMode]: {
            total: prev.stats[state.exerciseMode].total + 1,
            correct: prev.stats[state.exerciseMode].correct + (isCorrect ? 1 : 0),
            wrong: prev.stats[state.exerciseMode].wrong + (isCorrect ? 0 : 1)
          }
        }
      }));
    } else {
      message.info('练习模式：结果不会被记录');
    }

    setState(prev => ({
      ...prev,
      feedback: { isCorrect, correctWord: { ...target }, isPracticeMode: prev.isPracticeMode },
      showOverlay: true
    }));
  };

  const handleNext = () => {
    if (!state.showOverlay) return;
    setState(prev => ({ ...prev, showOverlay: false }));
    
    const pool = roundWordsRef.current;
    if (state.currentIdx >= pool.length - 1) {
      setState(prev => ({ ...prev, roundFinished: true }));
      if (!state.isPracticeMode) syncData(state.words);
    } else {
      const nextIdx = state.currentIdx + 1;
      setState(prev => ({ 
        ...prev, 
        currentIdx: nextIdx,
        selectedLetters: [],
        availableLetters: [],
        isChecking: false
      }));
      triggerChange(state.words, state.exerciseMode, nextIdx);
    }
  };

  const handlePronunciation = (isPass) => {
    if (!checkLogin()) return;
    
    const target = roundWordsRef.current[state.currentIdx];
    
    if (!state.isPracticeMode) {
      const updated = state.words.map(w =>
        w.word === target.word ? { ...w, status: { ...w.status, pronunciation: isPass } } : w
      );
      setState(prev => ({ ...prev, words: updated }));
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          pronunciation: {
            total: prev.stats.pronunciation.total + 1,
            pass: prev.stats.pronunciation.pass + (isPass ? 1 : 0),
            fail: prev.stats.pronunciation.fail + (isPass ? 0 : 1)
          }
        }
      }));
    } else {
      message.info('练习模式：结果不会被记录');
    }

    setState(prev => ({
      ...prev,
      feedback: {
        isCorrect: isPass,
        correctWord: { ...target },
        message: isPass ? "✅ 发音通过！" : "❌ 需要继续练习",
        isPracticeMode: prev.isPracticeMode
      },
      showOverlay: true
    }));
  };

  const handleModeSwitch = (mode) => {
    setState(prev => ({ ...prev, exerciseMode: mode }));
    resetAll();
    refreshPool(mode);
    triggerChange(state.words, mode, 0);
  };

  // ========== Effects ==========
  useEffect(() => {
    if (clickWork?.trim()) {
      setState(prev => ({ ...prev, newWord: clickWork.trim() }));
      F_translator(clickWork).then(t => setState(prev => ({ ...prev, translate: t })));
      F_speak(clickWork);
    }
  }, [clickWork]);

  useEffect(() => {
    if (checkLogin()) {
      if (clickWork?.trim()) {
        F_translator(clickWork).then(t => setState(prev => ({ ...prev, translate: t })));
        F_speak(clickWork);
      }
      fetchWords();
    }
  }, []);

  useEffect(() => {
    if (state.exerciseMode === 'listening' && !state.roundFinished && !state.showOverlay) {
      const word = roundWordsRef.current[state.currentIdx]?.word;
      if (state.isLooping && word) playAudio(word);
    }
    return () => clearTimeout(timerRef.current);
  }, [state.isLooping, state.showOverlay, state.currentIdx, state.exerciseMode]);

  useEffect(() => {
    const pool = roundWordsRef.current;
    if (pool.length && !state.showOverlay && !state.roundFinished) {
      const target = pool[state.currentIdx >= pool.length ? 0 : state.currentIdx];
      
      if (!['spelling', 'pronunciation'].includes(state.exerciseMode)) {
        setState(prev => ({ ...prev, options: generateOptions(target) }));
      }
      
      setState(prev => ({ ...prev, feedback: null }));

      if (['reading', 'listening'].includes(state.exerciseMode) && !state.isLooping && state.exerciseMode !== 'translation') {
        F_speak(target.word);
      }
    } else {
      setState(prev => ({ ...prev, options: [] }));
    }
  }, [state.currentIdx, state.exerciseMode, state.showOverlay, state.roundFinished, state.words]);

  useEffect(() => {
    if (state.exerciseMode === 'spelling' && roundWordsRef.current.length && !state.showOverlay && !state.roundFinished) {
      initSpelling();
    } else {
      setState(prev => ({ ...prev, availableLetters: [], selectedLetters: [] }));
    }
  }, [state.currentIdx, state.exerciseMode, state.showOverlay, state.roundFinished]);

  // ========== 渲染辅助 ==========
  const renderWordCard = (w) => {
    const level = getMasteryLevel(w.status);
    const isMastered = level === 5;
    return (
      <div key={w.word} style={{ ...simpleStyles.card, borderLeftColor: getStatusColor(level), opacity: isMastered ? 0.6 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: isMastered ? '#888' : '#fff' }}>{w.word}</span>
              <span onClick={() => F_speak(w.word)} style={{ cursor: 'pointer', fontSize: '12px' }}>🔊</span>
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>{w.translation || '暂无翻译'}</div>
            <div style={simpleStyles.miniPills}>
              {['reading', 'translation', 'listening', 'pronunciation', 'spelling'].map(m => (
                <span key={m} style={{ color: w.status?.[m] ? '#4caf50' : '#444' }}>
                  {m === 'reading' ? '英' : m === 'translation' ? '中' : m === 'listening' ? '听' : m === 'pronunciation' ? '读' : '拼'}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => handleDeleteWord(w.word)} style={simpleStyles.deleteBtn}>
            {state.deletingWord === w.word ? "⏳" : "🗑️"}
          </button>
        </div>
      </div>
    );
  };

  const getAccuracy = () => {
    const stat = state.stats[state.exerciseMode];
    if (!stat) return 0;
    if (state.exerciseMode === 'pronunciation') {
      return stat.total ? ((stat.pass / stat.total) * 100).toFixed(1) : 0;
    }
    return stat.total ? ((stat.correct / stat.total) * 100).toFixed(1) : 0;
  };

  // ========== 样式 ==========
  const s = {
    appWrapper: { position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)', display: 'flex', height: '80vh', backgroundColor: '#121212', color: '#fff', borderRadius: '20px', overflow: 'hidden', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', zIndex: 1, transition: 'width 0.3s' },
    leftPanel: { flex: 1, minWidth: 0, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    rightPanel: { backgroundColor: '#181818', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', transition: 'all 0.3s' },
    header: { padding: '12px 15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    inputContainer: { display: 'flex', gap: '8px', marginBottom: '15px', alignItems: 'center' },
    wordInput: { flex: 2, position: 'relative', display: 'flex', alignItems: 'center' },
    hornButton: { position: 'absolute', left: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ffab40', zIndex: 2 },
    input: { width: '100%', padding: '6px 45px 6px 32px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '12px', height: '32px' },
    addBtn: { backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', width: '50px', height: '32px' },
    translate: { position: 'absolute', right: '5px', padding: '0 8px', height: '22px', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #0e639c 0%, #063d61 100%)', borderRadius: '4px', fontSize: '11px', color: '#fff' },
    toolbar: { display: 'flex', gap: '8px', marginBottom: '15px' },
    toolBtn: { padding: '6px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' },
    statsBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#1e1e1e', borderRadius: '10px', marginBottom: '15px', fontSize: '11px' },
    modeBadge: { backgroundColor: '#0e639c', padding: '2px 8px', borderRadius: '5px' },
    modeToggle: { display: 'flex', gap: '8px', marginBottom: '15px' },
    modeBtn: { flex: 1, padding: '8px', borderRadius: '8px', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '11px' },
    questionBox: { height: '320px', display: 'flex', backgroundColor: '#1a1a1a', borderRadius: '15px', marginBottom: '15px', border: '1px solid #333', padding: '10px', overflow: 'hidden' },
    questionText: { fontSize: '32px', fontWeight: 'bold', textAlign: 'center', width: '100%', overflowY: 'auto', display: 'flex' },
    speakerBtn: { padding: '10px 20px', borderRadius: '8px', backgroundColor: '#0e639c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
    loopBtn: { padding: '5px 15px', borderRadius: '20px', background: 'none', cursor: 'pointer', fontSize: '11px' },
    optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    optionBtn: { padding: '18px 10px', borderRadius: '10px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', cursor: 'pointer', fontSize: '13px' },
    deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '12px' },
    card: { padding: '10px', marginBottom: '8px', borderRadius: '8px', borderLeft: '5px solid', backgroundColor: '#1e1e1e' },
    miniPills: { display: 'flex', gap: '8px', fontSize: '9px', marginTop: '5px' },
    globalCaptureLayer: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
    floatingPrompt: { marginBottom: '30px', backgroundColor: '#fff', color: '#000', padding: '10px 30px', borderRadius: '30px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center' },
    listArea: { flex: 1, overflowY: 'auto', padding: '12px' },
    maskOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#181818', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#fff' },
    closeBtn: { background: '#333', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', width: '24px', height: '24px', borderRadius: '50%' }
  };

  // 简洁模式样式 - 一行布局
  const simpleStyles = {
    container: {
      position: 'fixed',
      left: position.x,
      top: position.y,
      width: '550px',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '1px solid #334155',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      zIndex: 10000,
      transition: isDragging ? 'none' : 'all 0.2s',
      opacity: isDragging ? 0.95 : 1,
    },
    handle: {
      padding: '8px 15px',
      background: '#2d3a4f',
      borderRadius: '12px 12px 0 0',
      cursor: 'grab',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #40536d',
      userSelect: 'none'
    },
    title: {
      color: '#818cf8',
      fontWeight: 'bold',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    wordCount: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    content: {
      padding: '12px 15px'
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    wordInput: {
      flex: 2,
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    hornButton: {
      position: 'absolute',
      left: '5px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#ffab40',
      zIndex: 2,
      padding: '4px'
    },
    input: {
      width: '100%',
      padding: '8px 40px 8px 32px',
      backgroundColor: '#1a1a1a',
      border: '1px solid #444',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '14px',
      outline: 'none'
    },
    translate: {
      position: 'absolute',
      right: '5px',
      padding: '0 8px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #0e639c 0%, #063d61 100%)',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#fff'
    },
    addBtn: {
      backgroundColor: '#4caf50',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      width: '60px',
      height: '38px',
      flexShrink: 0,
      fontWeight: 'bold'
    },
    fullModeBtn: {
      backgroundColor: '#3b82f6',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      width: '70px',
      height: '38px',
      flexShrink: 0,
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px'
    },
    closeBtn: {
      background: '#ef4444',
      border: 'none',
      color: 'white',
      width: '38px',
      height: '38px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    card: {
      padding: '8px',
      marginBottom: '6px',
      backgroundColor: '#1e293b',
      borderRadius: '6px',
      borderLeft: '3px solid'
    },
    miniPills: {
      display: 'flex',
      gap: '6px',
      fontSize: '9px',
      marginTop: '4px'
    },
    deleteBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      opacity: 0.5,
      fontSize: '12px'
    }
  };

  if (!getToken && state.words.length === 0) {
    return (
      <div style={{ ...s.appWrapper, width: '400px', height: '300px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔒</div>
        <h3>需要登录</h3>
        <p style={{ color: '#aaa', margin: '20px 0' }}>请先登录以使用词汇大师功能</p>
        <div>
          <button onClick={() => navigate('/')} style={{ ...s.addBtn, width: '100px', marginRight: '10px' }}>登录</button>
          <button onClick={onClose} style={{ ...s.addBtn, backgroundColor: '#333', width: '100px' }}>关闭</button>
        </div>
      </div>
    );
  }

  const currentWord = roundWordsRef.current[state.currentIdx];
  const totalWords = state.words.reduce((sum, w) => sum + w.word.split(' ').length, 0);
  const deductionPerWord = 100 / (totalWords || 1);

  // 渲染题目内容的辅助函数
  const renderQuestionContent = () => {
    if (!currentWord) return null;

    switch (state.exerciseMode) {
      case 'reading':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>{currentWord.word}</div>
            <button onClick={() => playAudio(currentWord.word)} style={{ ...s.toolBtn, backgroundColor: '#673ab7' }}>🔊 发音</button>
          </div>
        );

      case 'translation':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '20px', marginBottom: '15px' }}>{currentWord.translation}</div>
            <button onClick={() => playAudio(currentWord.word)} style={s.speakerBtn}>🔊 发音</button>
          </div>
        );

      case 'listening':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <button onClick={() => playAudio(currentWord.word)} style={s.speakerBtn}>🔊 单次播放</button>
            <button onClick={() => setState(prev => ({ ...prev, isLooping: !prev.isLooping }))} 
              style={{ ...s.loopBtn, color: state.isLooping ? '#ffab40' : '#888', marginTop: '10px' }}>
              {state.isLooping ? '🔁 自动循环中' : '➡️ 开启无限循环'}
            </button>
          </div>
        );

      case 'pronunciation':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{currentWord.word}</div>
            <div style={{ marginBottom: '15px', color: '#aaa' }}>
              {currentWord.translation} 
              <span onClick={() => F_speak(currentWord.word)} style={{ cursor: 'pointer', marginLeft: '8px' }}>🔊</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handlePronunciation(true)} style={{ ...s.speakerBtn, backgroundColor: '#4caf50' }}>✅ 通过</button>
              <button onClick={() => handlePronunciation(false)} style={{ ...s.speakerBtn, backgroundColor: '#ef4444' }}>❌ 不通过</button>
            </div>
          </div>
        );

      case 'spelling':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px', color: '#a5b4fc' }}>{currentWord.translation}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '15px', flexWrap: 'wrap' }}>
              {currentWord.word.split('').map((_, i) => (
                <div key={i} style={{
                  width: '40px', height: '45px', borderBottom: '3px solid #cfd8dc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', color: i < state.selectedLetters.length ? '#10b981' : 'transparent',
                  backgroundColor: i < state.selectedLetters.length ? '#1a2a3a' : 'transparent'
                }}>
                  {currentWord.word[i]}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '15px', width: '100%' }}>
              {state.availableLetters.map(l => (
                <button key={l.id} onClick={() => handleLetterClick(l.id)} disabled={l.used}
                  style={{ padding: '10px', backgroundColor: l.used ? '#555' : '#0e639c', color: '#fff', border: 'none', borderRadius: '6px', opacity: l.used ? 0.5 : 1 }}>
                  {l.letter}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={checkSpelling} disabled={state.selectedLetters.length !== currentWord.word.length}
                style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px' }}>✅ 检查</button>
              <button onClick={clearAllLetters} disabled={!state.selectedLetters.length}
                style={{ padding: '8px 16px', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '6px' }}>🗑️ 清空</button>
              <button onClick={() => playAudio(currentWord.word)} style={{ padding: '8px 16px', backgroundColor: '#0e639c', color: '#fff', border: 'none', borderRadius: '6px' }}>🔊 发音</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // 如果开启简洁模式，渲染简洁界面 - 一行布局
  if (state.isSimpleMode) {
    return (
      <div style={simpleStyles.container}>
        {/* 标题栏 - 可拖动区域 */}
        <div 
          className="drag-handle"
          style={simpleStyles.handle}
          onMouseDown={handleMouseDown}
        >
          <div style={simpleStyles.title}>
            <span>📚 单词添加器</span>
            <span style={simpleStyles.wordCount}>{state.words.length}</span>
          </div>
        </div>

        {/* 内容区域 - 一行布局 */}
        <div style={simpleStyles.content}>
          <div style={simpleStyles.row}>
            {/* 输入区域 */}
            <div style={simpleStyles.wordInput}>
              <button onClick={() => playAudio(state.newWord)} style={simpleStyles.hornButton}>📢</button>
              <input
                value={state.newWord}
                onChange={e => {
                  setState(prev => ({ ...prev, newWord: e.target.value }));
                  if (e.target.value.trim()) {
                    F_translator(e.target.value).then(t => setState(prev => ({ ...prev, translate: t })));
                  } else {
                    setState(prev => ({ ...prev, translate: "" }));
                  }
                }}
                onKeyDown={e => e.key === 'Enter' && handleAddWord()}
                onPaste={e => F_translator(e.clipboardData.getData('text')).then(t => setState(prev => ({ ...prev, translate: t })))}
                placeholder="添加新词"
                style={simpleStyles.input}
              />
              {state.translate && <div style={simpleStyles.translate}>{state.translate}</div>}
            </div>
            
            <button onClick={handleAddWord} style={simpleStyles.addBtn} disabled={state.isAdding}>
              {state.isAdding ? '...' : '添加'}
            </button>
            
            <button 
              onClick={() => setState(prev => ({ ...prev, isSimpleMode: false }))}
              style={simpleStyles.fullModeBtn}
            >
              <span>完整</span>
            </button>
            
            <button onClick={onClose} style={simpleStyles.closeBtn}>✕</button>
          </div>
        </div>
      </div>
    );
  }

  // 完整模式渲染
  return (
    <div style={{ ...s.appWrapper, width: state.isRightPanelCollapsed ? '430px' : '850px' }}>
      {state.showOverlay && (
        <div style={s.globalCaptureLayer} onClick={handleNext}>
          <div style={s.floatingPrompt}>
            {state.feedback?.isPracticeMode && <span style={{ color: '#ffab40', marginRight: '10px' }}>🧪 练习模式</span>}
            {state.feedback?.message ? `${state.feedback.message} - 点击继续` : '点击任意位置继续'}
          </div>
        </div>
      )}

      <div style={s.leftPanel}>
        {/* 头部添加简洁模式切换按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#818cf8' }}>词汇大师</h3>
          <button 
            onClick={() => setState(prev => ({ ...prev, isSimpleMode: true }))}
            style={{ ...s.toolBtn, backgroundColor: '#10b981' }}
          >
            ✨ 简洁模式
          </button>
        </div>

        {/* 输入区 */}
        <div style={s.inputContainer}>
          <div style={s.wordInput}>
            <button onClick={() => playAudio(state.newWord)} style={s.hornButton}>📢</button>
            <input
              value={state.newWord}
              onChange={e => {
                setState(prev => ({ ...prev, newWord: e.target.value }));
                if (e.target.value.trim()) {
                  F_translator(e.target.value).then(t => setState(prev => ({ ...prev, translate: t })));
                } else {
                  setState(prev => ({ ...prev, translate: "" }));
                }
              }}
              onKeyDown={e => e.key === 'Enter' && handleAddWord()}
              onPaste={e => F_translator(e.clipboardData.getData('text')).then(t => setState(prev => ({ ...prev, translate: t })))}
              placeholder="添加新词"
              style={s.input}
            />
            {state.translate && <div style={s.translate}>{state.translate}</div>}
          </div>
          <button onClick={handleAddWord} style={s.addBtn} disabled={state.isAdding}>
            {state.isAdding ? '...' : '添加'}
          </button>
        </div>

        {/* 工具栏 */}
        <div style={s.toolbar}>
          <button onClick={() => {
            const mode = !state.isPracticeMode;
            setState(prev => ({ ...prev, isPracticeMode: mode }));
            resetAll();
            refreshPool();
            message.info(mode ? '🧪 练习模式' : '📚 学习模式');
          }} style={{ ...s.toolBtn, backgroundColor: state.isPracticeMode ? '#ffab40' : '#0e639c', flex: 1 }}>
            {state.isPracticeMode ? '🧪 练习模式' : '📚 学习模式'}
          </button>
          {state.isRightPanelCollapsed && (
            <button onClick={() => setState(prev => ({ ...prev, isRightPanelCollapsed: false }))} style={{ ...s.toolBtn, width: '30px' }}>◀</button>
          )}
        </div>

        {/* 统计 */}
        <div style={s.statsBar}>
          <span style={s.modeBadge}>{MODE_DISPLAY[state.exerciseMode]}</span>
          {!state.roundFinished && roundWordsRef.current.length > 0 && (
            <span>进度: <span style={{ color: '#ffab40' }}>{state.currentIdx + 1}/{roundWordsRef.current.length}</span></span>
          )}
          <span>正确率: <span style={{ color: getAccuracy() >= 80 ? '#4caf50' : getAccuracy() >= 60 ? '#ffab40' : '#ff5252' }}>{getAccuracy()}%</span></span>
        </div>

        {/* 模式切换 */}
        <div style={s.modeToggle}>
          {MODES.map(m => (
            <button key={m} onClick={() => handleModeSwitch(m)} style={{
              ...s.modeBtn,
              backgroundColor: state.exerciseMode === m ? '#0e639c' : '#333',
              border: state.exerciseMode === m ? '2px solid #ffab40' : 'none'
            }}>{MODE_DISPLAY[m]}</button>
          ))}
        </div>

        {/* 题目区 */}
        <div style={{ ...s.questionBox, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!state.words.length ? <div style={s.statItem}>请先添加单词</div> : (
            !roundWordsRef.current.length ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px' }}>🌟</div>
                <div style={{ fontSize: '18px', color: '#4caf50' }}>
                  {state.isPracticeMode ? '练习模式已遍历所有单词' : '此模式已全会！'}
                </div>
              </div>
            ) : state.roundFinished ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: '#ffab40', marginBottom: '20px' }}>
                  {state.isPracticeMode ? '🏁 练习完成' : '🏁 本轮已完成'}
                </div>
                <button onClick={refreshPool} style={s.speakerBtn}>🔄 再测一轮</button>
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!state.showOverlay ? (
                  renderQuestionContent()
                ) : (
                  <div style={{ textAlign: 'center', color: state.feedback?.isCorrect ? '#4caf50' : '#f44336' }}>
                    <div style={{ fontSize: '60px' }}>{state.feedback?.isCorrect ? '✓' : '×'}</div>
                    <div style={{ fontSize: '18px', margin: '10px 0' }}>{state.feedback?.message || (state.feedback?.isCorrect ? '回答正确！' : '回答错误')}</div>
                    <div style={{ fontSize: '16px', marginTop: '10px' }}>
                      单词: {state.feedback?.correctWord?.word}<br/>
                      翻译: {state.feedback?.correctWord?.translation}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* 选项区 */}
        {!['pronunciation', 'spelling'].includes(state.exerciseMode) && !state.showOverlay && !state.roundFinished && roundWordsRef.current.length > 0 && (
          <div style={s.optionsGrid}>
            {state.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(opt.displayText)} style={s.optionBtn}
                disabled={state.showOverlay || !roundWordsRef.current.length || state.roundFinished}>
                {opt.displayText}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 右侧面板 */}
      <div style={{ ...s.rightPanel, width: state.isRightPanelCollapsed ? 0 : 330, opacity: state.isRightPanelCollapsed ? 0 : 1 }}>
        <div style={s.header}>
          <span>词库管理 ({state.words.length})</span>
          <div>
            <button onClick={() => setState(prev => ({ ...prev, isRightPanelCollapsed: true }))} style={s.iconBtn}>▶</button>
            <button onClick={() => setState(prev => ({ ...prev, isMaskEnabled: !prev.isMaskEnabled }))} 
              style={{ ...s.iconBtn, color: state.isMaskEnabled ? '#ffab40' : '#888' }}>
              {state.isMaskEnabled ? '🔒' : '🔓'}
            </button>
            <button onClick={onClose} style={s.closeBtn}>✕</button>
          </div>
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          {state.isMaskEnabled && !state.showOverlay && <div style={s.maskOverlay}>🛡️ 练习中已遮盖</div>}
          <div style={{ ...s.listArea, filter: state.isMaskEnabled && !state.showOverlay ? 'blur(15px)' : 'none' }}>
            {[...state.words].sort((a,b) => getMasteryLevel(a.status) - getMasteryLevel(b.status)).map(renderWordCard)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularyMaster;