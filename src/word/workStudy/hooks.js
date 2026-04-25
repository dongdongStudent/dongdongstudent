import { useState, useRef, useEffect } from 'react';
import { message } from 'antd';
import { F_speak, F_translator } from "../../Function/weisimin.js";
import { 
  fetchWordsFromServer, syncWordsToServer, addWordToServer, deleteWordFromServer, updateWordTranslationAPI,
  generateOptions, shuffleLetters, playAudio, INITIAL_STATS, checkLogin
} from './utils.js';
import { addWordToReviewList } from '../wordReviewUtils.js';

// ========== 拖动 Hook ==========
export const useDrag = (initialPosition = { x: window.innerWidth / 2 - 250, y: 20 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

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

  return { position, isDragging, handleMouseDown };
};

// ========== 单词管理 Hook ==========
export const useWords = (getToken, wordName, onWordChange, navigate, onClose) => {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState("");
  const [translate, setTranslate] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingWord, setDeletingWord] = useState(null);
  const [editingWord, setEditingWord] = useState(null);
  const [editTranslation, setEditTranslation] = useState("");
  const lastSyncedRef = useRef(null);
  const roundWordsRef = useRef([]);

  const triggerChange = (updatedList, mode = 'reading', idx = 0) => {
    if (onWordChange) {
      onWordChange({
        allWords: updatedList,
        newWords: updatedList?.map(w => w.word) || [],
        currentMode: mode,
        activeWord: roundWordsRef.current[idx] || null,
        addWord: newWord,
        isPracticeMode: false
      });
    }
  };

  const fetchWords = async () => {
    if (!checkLogin(getToken, navigate, onClose)) return [];
    try {
      const fetched = await fetchWordsFromServer(getToken, wordName);
      setWords(fetched);
      lastSyncedRef.current = JSON.stringify(fetched);
      triggerChange(fetched);
      return fetched;
    } catch (err) {
      console.error("fetchWords 异常:", err);
      message.error("无法连接到服务器");
      return [];
    }
  };

  const syncData = async (wordsToSync = words) => {
    if (!getToken || !wordsToSync.length) return;
    addWordToReviewList(getToken(), wordName);

    const dataStr = JSON.stringify(wordsToSync);
    if (lastSyncedRef.current === dataStr) {
      message.info("数据未变动");
      return;
    }

    try {
      const data = await syncWordsToServer(getToken, wordName, wordsToSync);
      if (data.flag === 1) {
        message.success(`☁️ 进度已更新`);
        lastSyncedRef.current = JSON.stringify(data.content || wordsToSync);
        if (data.content) setWords(data.content);
      }
    } catch (err) {
      console.error("同步异常", err);
      message.error(`同步异常`);
    }
  };

  const addWord = async () => {
    if (!checkLogin(getToken, navigate, onClose) || !newWord.trim()) {
      message.warning('请输入单词');
      return false;
    }

    const trimmed = newWord.trim();
    if (words.some(w => w.word.toLowerCase() === trimmed.toLowerCase())) {
      message.warning(`单词 "${trimmed}" 已存在`);
      setNewWord("");
      setTranslate("");
      return false;
    }

    setIsAdding(true);
    try {
      const data = await addWordToServer(getToken, wordName, trimmed);
      if (data.flag === 1) {
        message.success(`单词 "${trimmed}" 添加成功`);
        setNewWord("");
        setTranslate("");
        await fetchWords();
        return true;
      } else {
        message.error(data.msg || "添加失败");
        return false;
      }
    } catch (err) {
      console.error("添加单词异常:", err);
      message.error("网络异常");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const deleteWord = async (wordText) => {
    if (!wordText || !checkLogin(getToken, navigate, onClose)) return false;

    const updated = words.filter(w => w.word !== wordText);
    setWords(updated);
    roundWordsRef.current = roundWordsRef.current.filter(w => w.word !== wordText);
    triggerChange(updated);

    try {
      const data = await deleteWordFromServer(getToken, wordName, wordText);
      if (data.flag !== 1) {
        message.error(data.msg || "删除失败");
        await fetchWords();
        return false;
      } else {
        message.success(`"${wordText}" 已删除`);
        return true;
      }
    } catch (err) {
      console.error("删除单词异常:", err);
      await fetchWords();
      message.error("网络异常");
      return false;
    }
  };

  const saveTranslation = async (wordObj) => {
    if (!editTranslation.trim()) {
      message.warning('翻译不能为空');
      return false;
    }

    if (editTranslation.trim() === wordObj.translation) {
      message.info('翻译未改变');
      setEditingWord(null);
      setEditTranslation("");
      return false;
    }

    try {
      const result = await updateWordTranslationAPI(getToken, wordObj.word, editTranslation.trim());
      
      if (result.flag === 1) {
        const updatedWords = words.map(w =>
          w.word === wordObj.word ? { ...w, translation: editTranslation.trim() } : w
        );
        setWords(updatedWords);
        if (roundWordsRef.current) {
          roundWordsRef.current = roundWordsRef.current.map(w =>
            w.word === wordObj.word ? { ...w, translation: editTranslation.trim() } : w
          );
        }
        setEditingWord(null);
        setEditTranslation("");
        message.success(`"${wordObj.word}" 翻译已更新`);
        return true;
      } else {
        message.error(result.message || '更新翻译失败');
        return false;
      }
    } catch (error) {
      console.error('更新翻译异常:', error);
      message.error('网络异常，更新失败');
      return false;
    }
  };

  const updateWordStatus = (word, mode, isCorrect) => {
    const updated = words.map(w =>
      w.word === word.word ? { ...w, status: { ...w.status, [mode]: isCorrect } } : w
    );
    setWords(updated);
    triggerChange(updated);
    return updated;
  };

  // ========== 重置单词所有熟练度 ==========
  const resetWordStatus = async (wordText) => {
    const word = words.find(w => w.word.toLowerCase() === wordText.toLowerCase());
    if (!word) {
      message.warning('单词不存在');
      return false;
    }
    
    // 重置所有模式的状态为 false
    const resetStatus = {
      reading: false,
      translation: false,
      listening: false,
      pronunciation: false,
      spelling: false
    };
    
    // 更新本地状态
    const updatedWords = words.map(w =>
      w.word === word.word ? { ...w, status: resetStatus } : w
    );
    setWords(updatedWords);
    
    // 同时更新 roundWordsRef
    if (roundWordsRef.current) {
      roundWordsRef.current = roundWordsRef.current.map(w =>
        w.word === word.word ? { ...w, status: resetStatus } : w
      );
    }
    
    // 同步到服务器
    try {
      await syncData(updatedWords);
      message.success(`"${word.word}" 的【英/中/听/读/拼】熟练度已全部重置，可以重新学习了`);
      return true;
    } catch (err) {
      console.error('同步失败:', err);
      message.error('重置失败，请重试');
      return false;
    }
  };

  return {
    words, setWords, roundWordsRef,
    newWord, setNewWord, translate, setTranslate,
    isAdding, deletingWord, setDeletingWord,
    editingWord, setEditingWord, editTranslation, setEditTranslation,
    fetchWords, syncData, addWord, deleteWord, saveTranslation, updateWordStatus, triggerChange,
    resetWordStatus
  };
};

// ========== 游戏模式 Hook ==========
export const useGameMode = (words, isPracticeMode, updateWordStatus, syncData, roundWordsRef) => {
  const [exerciseMode, setExerciseMode] = useState('reading');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [roundFinished, setRoundFinished] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [stats, setStats] = useState(INITIAL_STATS);
  
  const timerRef = useRef(null);

  const refreshPool = (mode = exerciseMode, source = words) => {
    if (!source.length) {
      console.log('没有单词数据');
      return;
    }
    
    console.log('刷新单词池，模式:', mode, '单词数:', source.length);
    
    if (isPracticeMode) {
      roundWordsRef.current = [...source];
    } else {
      // 学习模式：筛选出该模式未掌握的单词
      roundWordsRef.current = source.filter(w => {
        // 如果单词没有 status 对象，视为未掌握
        if (!w.status) return true;
        // 如果该模式的状态为 false 或 undefined，视为未掌握
        return !w.status[mode];
      });
    }
    
    console.log('过滤后单词数:', roundWordsRef.current.length);
    
    // 如果没有未掌握的单词，则使用全部单词
    if (roundWordsRef.current.length === 0 && source.length > 0) {
      roundWordsRef.current = [...source];
      message.info('🎉 所有单词已掌握！重新复习全部单词');
    }
    
    setCurrentIdx(0);
    setRoundFinished(false);
  };

  const resetAll = () => {
    setCurrentIdx(0);
    setRoundFinished(false);
    setFeedback(null);
    setShowOverlay(false);
    setIsLooping(false);
    setOptions([]);
    clearTimeout(timerRef.current);
  };

  const handleAnswer = (selectedText) => {
    if (showOverlay || !roundWordsRef.current.length || roundFinished) return;

    const target = roundWordsRef.current[currentIdx];
    const selected = options.find(o => o.displayText === selectedText);
    const isCorrect = selected?.originalWord === target.word;

    if (exerciseMode === 'translation' || !isCorrect) {
      F_speak(target.word);
    } else if (['reading', 'listening'].includes(exerciseMode)) {
      F_speak(target.word);
    }

    clearTimeout(timerRef.current);

    if (!isPracticeMode) {
      updateWordStatus(target, exerciseMode, isCorrect);
      setStats(prev => ({
        ...prev,
        [exerciseMode]: {
          total: prev[exerciseMode].total + 1,
          correct: prev[exerciseMode].correct + (isCorrect ? 1 : 0),
          wrong: prev[exerciseMode].wrong + (isCorrect ? 0 : 1)
        }
      }));
    } else {
      message.info('练习模式：结果不会被记录');
    }

    setFeedback({ isCorrect, correctWord: { ...target }, isPracticeMode, message: isCorrect ? '回答正确！' : '回答错误' });
    setShowOverlay(true);
  };

  const handleNext = () => {
    if (!showOverlay) return;
    setShowOverlay(false);

    const pool = roundWordsRef.current;
    if (currentIdx >= pool.length - 1) {
      setRoundFinished(true);
      if (!isPracticeMode) syncData(words);
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePronunciation = async (isPass) => {
    const target = roundWordsRef.current[currentIdx];

    if (!isPass) {
      F_speak(target.word);
    }

    if (!isPracticeMode) {
      updateWordStatus(target, 'pronunciation', isPass);
      setStats(prev => ({
        ...prev,
        pronunciation: {
          total: prev.pronunciation.total + 1,
          pass: prev.pronunciation.pass + (isPass ? 1 : 0),
          fail: prev.pronunciation.fail + (isPass ? 0 : 1)
        }
      }));
    } else {
      message.info('练习模式：结果不会被记录');
    }

    setFeedback({
      isCorrect: isPass,
      correctWord: { ...target },
      message: isPass ? "✅ 发音通过！" : "❌ 需要继续练习",
      isPracticeMode
    });
    setShowOverlay(true);
  };

  const handleModeSwitch = (mode) => {
    setExerciseMode(mode);
    resetAll();
    refreshPool(mode);
  };

  // 生成选项的 Effect
  useEffect(() => {
    const pool = roundWordsRef.current;
    if (pool.length && !showOverlay && !roundFinished) {
      const target = pool[currentIdx >= pool.length ? 0 : currentIdx];
      if (!['spelling', 'pronunciation'].includes(exerciseMode)) {
        setOptions(generateOptions(target, words, exerciseMode));
      }
      setFeedback(null);

      if (['reading', 'listening'].includes(exerciseMode) && !isLooping && exerciseMode !== 'translation') {
        F_speak(target.word);
      }
    } else {
      setOptions([]);
    }
  }, [currentIdx, exerciseMode, showOverlay, roundFinished, words]);

  // 听力循环 Effect
  useEffect(() => {
    if (exerciseMode === 'listening' && !roundFinished && !showOverlay) {
      const word = roundWordsRef.current[currentIdx]?.word;
      if (isLooping && word) {
        playAudio(word, isLooping, exerciseMode, showOverlay, timerRef);
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isLooping, showOverlay, currentIdx, exerciseMode]);

  return {
    exerciseMode, currentIdx, options, feedback, showOverlay, roundFinished, isLooping, stats,
    timerRef, setShowOverlay, setIsLooping, refreshPool, handleAnswer, handleNext, 
    handlePronunciation, handleModeSwitch, setStats
  };
};

// ========== 拼写 Hook ==========
export const useSpelling = (currentWord, showOverlay, roundFinished, isPracticeMode, updateWordStatus, setShowOverlay, setFeedback) => {
  const [availableLetters, setAvailableLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [isChecking, setIsChecking] = useState(false);

  const initSpelling = () => {
    if (!currentWord?.word) return;
    setAvailableLetters(shuffleLetters(currentWord.word));
    setSelectedLetters([]);
    setIsChecking(false);
  };

  const handleLetterClick = (letterId) => {
    if (showOverlay || isChecking) return;

    const letter = availableLetters.find(l => l.id === letterId);
    if (!letter || letter.used) return;

    setSelectedLetters(prev => [...prev, { ...letter }]);
    setAvailableLetters(prev =>
      prev.map(l => l.id === letterId ? { ...l, used: true } : l)
    );
  };

  const clearAllLetters = () => {
    if (showOverlay || isChecking) return;
    setAvailableLetters(prev => prev.map(l => ({ ...l, used: false })));
    setSelectedLetters([]);
  };

  const checkSpelling = () => {
    if (!currentWord) return;

    const userWord = selectedLetters.map(l => l.letter).join('');
    const isCorrect = userWord === currentWord.word.toLowerCase();

    setIsChecking(true);

    if (!isPracticeMode) {
      updateWordStatus(currentWord, 'spelling', isCorrect);
    } else {
      message.info('练习模式：结果不会被记录');
    }

    setFeedback({
      isCorrect,
      correctWord: { ...currentWord },
      message: isCorrect ? "✅ 拼写正确！" : `❌ 拼写错误，正确答案是: ${currentWord.word}`,
      isPracticeMode
    });
    setShowOverlay(true);
  };

  useEffect(() => {
    if (currentWord && !showOverlay && !roundFinished) {
      initSpelling();
    } else {
      setAvailableLetters([]);
      setSelectedLetters([]);
    }
  }, [currentWord, showOverlay, roundFinished]);

  return {
    availableLetters, selectedLetters, isChecking,
    handleLetterClick, clearAllLetters, checkSpelling
  };
};