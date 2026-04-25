import React, { useState, useEffect, useRef, useCallback } from 'react';
import { F_speak, stopAllSpeak } from "../Function/weisimin.js";
import { message } from 'antd';

// 从 review_center.js 导入默认导出
import SentenceCenter from '../sentence/review_center.js';

// ==================== 常量配置 ====================
const API_BASE = 'https://www.ddstudent.xyz/server/english/sync_peppa_learning';
const LOOP_INTERVAL = 3000;
const AUTO_NEXT_DELAY = 100;

// ==================== 自定义Hooks ====================

// 数据同步Hook
const useDataSync = (getToken) => {
  const lastSyncedRef = useRef(null);

  const syncToServer = useCallback(async (data) => {
    if (!getToken || !data) return false;

    const dataStr = JSON.stringify(data);
    if (lastSyncedRef.current === dataStr) return true;

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': getToken },
        body: JSON.stringify({ type: 'sync_peppa_progress', learningData: data })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.flag === 1) {
          lastSyncedRef.current = dataStr;
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("同步失败:", err);
      return false;
    }
  }, [getToken]);

  const loadFromServer = useCallback(async () => {
    if (!getToken) return null;
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': getToken },
        body: JSON.stringify({ type: 'get_peppa_data' })
      });
      if (res.ok) {
        const data = await res.json();
        return data.flag === 1 ? data.content : null;
      }
    } catch (err) {
      console.error("加载失败:", err);
    }
    return null;
  }, [getToken]);

  return { syncToServer, loadFromServer };
};

// 循环播放Hook
const useLoopPlayer = (isActive, onPlay) => {
  const timerRef = useRef(null);
  const countRef = useRef(0);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    stopAllSpeak();
    countRef.current = 0;
  }, []);

  const start = useCallback(() => {
    stop();
    if (!isActive) return;
    const play = () => {
      onPlay?.();
      countRef.current++;
      timerRef.current = setTimeout(play, LOOP_INTERVAL);
    };
    timerRef.current = setTimeout(play, 500);
  }, [isActive, onPlay, stop]);

  useEffect(() => {
    if (isActive) start();
    else stop();
    return stop;
  }, [isActive, start, stop]);

  return { stop, playCount: countRef.current };
};

// 拖动Hook
const useDraggable = (initialPos, size) => {
  const [position, setPosition] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ isDragging: false });

  const handleMouseDown = useCallback((e) => {
    if (!e.target.closest('.floating-handle')) return;
    e.preventDefault();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.x,
      startTop: position.y
    };
    setIsDragging(true);
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      if (!dragRef.current.isDragging) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      const newX = Math.max(0, Math.min(dragRef.current.startLeft + deltaX, window.innerWidth - size.width));
      const newY = Math.max(0, Math.min(dragRef.current.startLeft + deltaY, window.innerHeight - size.height));
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
  }, [isDragging, size]);

  return { position, isDragging, handleMouseDown };
};

// ==================== 子组件 ====================
const ModeSelector = ({ currentMode, difficultCount, onSelectMode, hideLists }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '5px',
    marginBottom: '10px',
    position: 'relative'
  }}>
    <div onClick={() => onSelectMode('LEARN')} style={{
      background: currentMode === 'LEARN' ? '#10b981' : '#2d3a4f',
      padding: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      textAlign: 'center',
      border: currentMode === 'LEARN' ? '2px solid #34d399' : '1px solid #40536d',
      position: 'relative',
    }}>
      <div style={{ fontSize: '18px' }}>📖</div>
      <div style={{ fontWeight: 'bold', fontSize: '12px' }}>学习模式</div>
      <span 
        style={{ 
          position: 'absolute',
          top: '5px',
          right: '5px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: hideLists ? '#ef4444' : '#10b981',
          boxShadow: hideLists ? '0 0 5px #ef4444' : '0 0 5px #10b981',
          transition: 'all 0.3s ease'
        }} 
        title={hideLists ? '列表已隐藏' : '列表已显示'}
      />
    </div>

    <div onClick={() => difficultCount > 0 && onSelectMode('REVIEW')} style={{
      background: currentMode === 'REVIEW' ? '#f59e0b' : '#2d3a4f',
      padding: '8px',
      borderRadius: '8px',
      cursor: difficultCount > 0 ? 'pointer' : 'not-allowed',
      textAlign: 'center',
      border: currentMode === 'REVIEW' ? '2px solid #fbbf24' : '1px solid #40536d',
      opacity: difficultCount === 0 && currentMode !== 'REVIEW' ? 0.5 : 1,
      position: 'relative',
    }}>
      <div style={{ fontSize: '18px' }}>🔄</div>
      <div style={{ fontWeight: 'bold', fontSize: '12px' }}>复习模式</div>
      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
        {difficultCount > 0 ? `${difficultCount}个待复习` : '暂无复习'}
      </div>
      <span 
        style={{ 
          position: 'absolute',
          top: '5px',
          right: '5px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: hideLists ? '#ef4444' : '#10b981',
          boxShadow: hideLists ? '0 0 5px #ef4444' : '0 0 5px #10b981',
          transition: 'all 0.3s ease'
        }} 
        title={hideLists ? '列表已隐藏' : '列表已显示'}
      />
    </div>
  </div>
);

const ProgressBar = ({ current, total, color }) => {
  const percentage = (current / total) * 100;
  return (
    <div style={{ width: '100%', height: '4px', background: '#2d3a4f', borderRadius: '2px' }}>
      <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
    </div>
  );
};

const SentenceList = ({ sentences, title, color, onSelect, onRemove, isHidden }) => {
  if (isHidden) return null;

  return (
    <div className="list-box" style={{ backgroundColor: '#2d3a4f', borderRadius: '6px', padding: '6px' }}>
      <div className="list-title" style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color }}>{title}</span>
        <span className="list-count" style={{ background: '#475569', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>{sentences.length}</span>
      </div>
      <div className="list-scroll" style={{ overflowY: 'auto', maxHeight: '140px' }}>
        {sentences.slice(0, 8).map((s, i) => (
          <div
            key={s.id || i}
            className="list-item"
            style={{
              padding: '4px 6px',
              marginBottom: '2px',
              background: '#1e293b',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={(e) => {
              e.stopPropagation();
              try {
                F_speak(s.text);
              } catch (error) {
                console.error('声音播放失败:', error);
              }
              setTimeout(() => {
                onSelect(s.id);
              }, 10);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e293b';
            }}
          >
            <span className="item-text" style={{ flex: 1 }}>
              {s.text}
            </span>
            <button
              className="item-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(s.id);
              }}
              style={{
                background: '#7f1d1d',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 6px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {sentences.length > 8 && <div style={{ fontSize: '9px', textAlign: 'center', color: '#94a3b8' }}>...</div>}
      </div>
    </div>
  );
};

// ==================== 主组件 ====================
const ListeningTestPro = ({ 
  onClose, 
  getToken, 
  onWordChange, 
  onHideListsChange,
  sentencesData = [] // 新增：从外部传入的句子数据
}) => {
  const [showTestCenter, setShowTestCenter] = useState(false);

  const [uiState, setUiState] = useState({
    testState: 'CONFIG',
    currentMode: 'LEARN',
    isLoopMode: false,
    isFloating: true,
    isCollapsed: false,
    hideLists: false,
  });

  const [dataState, setDataState] = useState({
    loading: true,
    activeQueue: [],
    reviewQueue: [],
    currentIndex: 0,
  });

  const [learningState, setLearningState] = useState({
    understoodSentences: [],
    difficultSentences: [],
  });

  const [userResponse, setUserResponse] = useState(null);
  const [displaySentence, setDisplaySentence] = useState(null);

  const isProcessingRef = useRef(false);
  const autoSaveTimeoutRef = useRef(null);

  const { syncToServer, loadFromServer } = useDataSync(getToken);
  const { position, isDragging, handleMouseDown } = useDraggable(
    { x: window.innerWidth - 520, y: 100 },
    { width: 480, height: 720 }
  );

  const { stop: stopLoop, playCount } = useLoopPlayer(
    uiState.isLoopMode && uiState.testState === 'TESTING' && uiState.currentMode === 'LEARN' && userResponse === null,
    () => {
      const queue = uiState.currentMode === 'REVIEW' ? dataState.reviewQueue : dataState.activeQueue;
      const sentence = queue[dataState.currentIndex];
      if (sentence) F_speak(sentence.text);
    }
  );

  const saveData = useCallback(() => {
    syncToServer({
      ...learningState,
      timestamp: Date.now()
    });
  }, [learningState, syncToServer]);

  const autoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveData();
    }, 2000);
  }, [saveData]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // 从服务器加载学习进度
        const serverData = await loadFromServer();
        if (serverData) {
          setLearningState({
            understoodSentences: serverData.understoodSentences || [],
            difficultSentences: serverData.difficultSentences || [],
          });
        }

        // 如果有外部传入的句子数据，设置学习队列
        if (sentencesData && sentencesData.length > 0) {
          setDataState(prev => ({
            ...prev,
            activeQueue: sentencesData,
            loading: false
          }));
          
          // 播放第一句
          if (sentencesData[0]?.text) {
            setTimeout(() => {
              F_speak(sentencesData[0].text);
            }, 500);
          }
        } else {
          setDataState(prev => ({ ...prev, loading: false }));
          message.warning('没有可学习的句子数据');
        }
      } catch (err) {
        console.error("初始化失败:", err);
        setDataState(prev => ({ ...prev, loading: false }));
        message.error('加载失败: ' + err.message);
      }
    };

    if (!getToken) {
      setTimeout(() => {
        if (window.confirm('您尚未登录，是否回到主页登录？')) {
          window.location.href = '/';
        } else {
          onClose?.();
        }
      }, 100);
    } else {
      init();
    }
  }, [getToken, sentencesData]);

  const currentQueue = uiState.currentMode === 'REVIEW' ? dataState.reviewQueue : dataState.activeQueue;
  const currentSentence = currentQueue[dataState.currentIndex];
  const totalInQueue = currentQueue.length;

  const handleSentenceClick = useCallback((sentenceId) => {
    if (onWordChange) onWordChange({ sentenceId });

    let clickedSentence = null;
    clickedSentence = learningState.understoodSentences.find(s => s.id === sentenceId);
    if (!clickedSentence) {
      clickedSentence = learningState.difficultSentences.find(s => s.id === sentenceId);
    }
    if (!clickedSentence) {
      clickedSentence = currentQueue.find(s => s.id === sentenceId);
    }

    if (clickedSentence) {
      stopLoop();
      setDisplaySentence(clickedSentence);
      const indexInQueue = currentQueue.findIndex(s => s.id === sentenceId);
      if (indexInQueue !== -1) {
        setDataState(prev => ({ ...prev, currentIndex: indexInQueue }));
      }
      setUserResponse(null);
    }
  }, [learningState, currentQueue, onWordChange, stopLoop]);

  const handleAudioAreaClick = useCallback(() => {
    const sentenceToPlay = displaySentence || currentSentence;
    if (!sentenceToPlay) return;
    F_speak(sentenceToPlay.text);
  }, [displaySentence, currentSentence]);

  const handleMark = useCallback((sentenceId, text, type) => {
    const isDifficult = type === 'DIFFICULT';
    const targetList = isDifficult ? 'difficultSentences' : 'understoodSentences';
    const otherList = isDifficult ? 'understoodSentences' : 'difficultSentences';

    setLearningState(prev => {
      if (prev[targetList].some(s => s.id === sentenceId)) return prev;
      const newItem = { id: sentenceId, text, fullText: text, timestamp: Date.now() };
      return {
        ...prev,
        [targetList]: [...prev[targetList], newItem],
        [otherList]: prev[otherList].filter(s => s.id !== sentenceId)
      };
    });
    autoSave();
  }, [autoSave]);

  const handleUserResponse = useCallback((response) => {
    if (userResponse !== null || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setUserResponse(response);
    stopLoop();

    if (currentSentence) {
      const id = currentSentence.id || dataState.currentIndex;
      const isDifficult = response === 'NOT_UNDERSTOOD';
      handleMark(id, currentSentence.text, isDifficult ? 'DIFFICULT' : 'UNDERSTOOD');
    }

    setTimeout(() => {
      const nextIdx = dataState.currentIndex + 1;
      const queue = uiState.currentMode === 'REVIEW' ? dataState.reviewQueue : dataState.activeQueue;

      if (nextIdx >= queue.length) {
        if (uiState.currentMode === 'REVIEW') {
          message.success("🎉 复习完成！");
          setUiState(prev => ({ ...prev, currentMode: 'LEARN' }));
          setDataState(prev => ({ ...prev, currentIndex: 0 }));
          setDisplaySentence(null);

          if (dataState.activeQueue[0]?.text) {
            F_speak(dataState.activeQueue[0].text);
            if (dataState.activeQueue[0]?.id !== undefined) {
              handleSentenceClick(dataState.activeQueue[0].id);
            } else {
              handleSentenceClick(0);
            }
          }
          autoSave();
        } else {
          setUiState(prev => ({ ...prev, testState: 'DONE' }));
          autoSave();
        }
      } else {
        setDataState(prev => ({ ...prev, currentIndex: nextIdx }));
        setUserResponse(null);
        setDisplaySentence(null);

        const nextSentence = queue[nextIdx];
        if (nextSentence) {
          F_speak(nextSentence.text);
          if (nextSentence.id !== undefined) {
            handleSentenceClick(nextSentence.id);
          } else {
            handleSentenceClick(nextIdx);
          }
        }
      }
      isProcessingRef.current = false;
    }, AUTO_NEXT_DELAY);
  }, [currentSentence, dataState, uiState.currentMode, userResponse, stopLoop, handleMark, handleSentenceClick, autoSave]);

  const navigateSentence = useCallback((direction) => {
    if (userResponse !== null || isProcessingRef.current) return;
    const newIndex = dataState.currentIndex + direction;
    if (newIndex < 0 || newIndex >= currentQueue.length) {
      if (direction < 0) message.info("已经是第一句");
      return;
    }
    stopLoop();
    setDataState(prev => ({ ...prev, currentIndex: newIndex }));
    setUserResponse(null);
    setDisplaySentence(null);
    const sentence = currentQueue[newIndex];
    if (sentence) {
      F_speak(sentence.text);
      if (sentence.id !== undefined) handleSentenceClick(sentence.id);
      else handleSentenceClick(newIndex);
    }
  }, [currentQueue, dataState.currentIndex, userResponse, stopLoop, handleSentenceClick]);

  const removeUnderstoodSentence = useCallback((id) => {
    setLearningState(prev => ({
      ...prev,
      understoodSentences: prev.understoodSentences.filter(x => x.id !== id)
    }));
    autoSave();
  }, [autoSave]);

  const removeDifficultSentence = useCallback((id) => {
    setLearningState(prev => ({
      ...prev,
      difficultSentences: prev.difficultSentences.filter(x => x.id !== id)
    }));
    autoSave();
  }, [autoSave]);

  const startLearn = useCallback(() => {
    if (dataState.activeQueue.length === 0) {
      message.warning("没有可学习的句子");
      return;
    }

    setDataState(prev => ({ ...prev, currentIndex: 0 }));
    setUiState(prev => ({ ...prev, testState: 'TESTING', currentMode: 'LEARN', isCollapsed: false }));
    setUserResponse(null);
    setDisplaySentence(null);
    stopLoop();

    if (dataState.activeQueue[0]?.text) {
      F_speak(dataState.activeQueue[0].text);
      if (dataState.activeQueue[0]?.id !== undefined) handleSentenceClick(dataState.activeQueue[0].id);
      else handleSentenceClick(0);
    }
  }, [dataState.activeQueue, handleSentenceClick]);

  const startReview = useCallback(() => {
    if (learningState.difficultSentences.length === 0) {
      message.warning("没有需要复习的句子");
      return;
    }

    setDataState(prev => ({ ...prev, reviewQueue: learningState.difficultSentences, currentIndex: 0 }));
    setUiState(prev => ({ ...prev, testState: 'TESTING', currentMode: 'REVIEW' }));
    setUserResponse(null);
    setDisplaySentence(null);

    if (learningState.difficultSentences[0]?.text) {
      F_speak(learningState.difficultSentences[0].text);
      if (learningState.difficultSentences[0]?.id !== undefined) {
        handleSentenceClick(learningState.difficultSentences[0].id);
      } else {
        handleSentenceClick(0);
      }
    }
  }, [learningState.difficultSentences, handleSentenceClick]);

  const switchMode = useCallback((mode) => {
    if (mode === 'REVIEW' && learningState.difficultSentences.length === 0) {
      message.warning("没有需要复习的句子");
      return;
    }
    mode === 'REVIEW' ? startReview() : startLearn();
  }, [learningState.difficultSentences.length, startReview, startLearn]);

  const toggleHideLists = useCallback(() => {
    setUiState(prev => {
      const newHideLists = !prev.hideLists;
      if (onHideListsChange) {
        onHideListsChange(newHideLists);
      }
      message.info(!newHideLists ? '列表已显示' : '列表已隐藏');
      return { ...prev, hideLists: newHideLists };
    });
  }, [onHideListsChange]);

  if (dataState.loading) return <div className="dark-app">加载中...</div>;

  const styles = `
    .dark-app { min-height: 100vh; background: #0f172a; color: #e2e8f0; }
    .floating-window { background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; }
    .floating-handle { background: #2d3a4f; padding: 8px 12px; cursor: grab; border-bottom: 1px solid #40536d; display: flex; justify-content: space-between; align-items: center; }
    .floating-handle:active { cursor: grabbing; }
    .handle-btn { background: #334155; border: none; color: #fff; cursor: pointer; width: 24px; height: 24px; border-radius: 4px; }
    .content { padding: 12px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .control-bar { display: flex; justify-content: space-between; align-items: center; background: #2d3a4f; padding: 6px 10px; border-radius: 6px; }
    .back-btn { background: #475569; color: #e2e8f0; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
    .loop-toggle { background: #475569; border: none; color: #e2e8f0; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
    .loop-toggle.active { background: #6366f1; box-shadow: 0 0 8px #6366f1; }
    .hide-lists-toggle {
      background: ${uiState.hideLists ? '#10b981' : '#475569'};
      border: none;
      color: #e2e8f0;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      margin-left: 5px;
    }
    .stats-row { display: flex; gap: 8px; background: #2d3a4f; padding: 8px; border-radius: 6px; }
    .stat-item { flex: 1; text-align: center; }
    .stat-value { font-weight: bold; font-size: 16px; color: #818cf8; }
    .audio-area { background: #312e81; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .audio-icon { font-size: 24px; }
    .sentence-text { flex: 1; font-size: 13px; }
    .response-row { display: flex; gap: 8px; margin-top: 5px; }
    .response-btn { flex: 1; padding: 8px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-understood { background: #10b981; color: white; }
    .btn-understood.selected { background: #065f46; border: 1px solid #10b981; }
    .btn-difficult { background: #ef4444; color: white; }
    .btn-difficult.selected { background: #7f1d1d; border: 1px solid #ef4444; }
    .nav-row { display: flex; gap: 8px; justify-content: center; margin-top: 5px; }
    .nav-btn { background: #475569; border: none; color: #e2e8f0; padding: 4px 12px; border-radius: 4px; cursor: pointer; }
    .save-btn { background: #6366f1; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .config-section { display: flex; flex-direction: column; gap: 12px; }
    .start-btn { background: #10b981; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
      margin-left: 5px;
    }
    .test-center-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.7);
      z-index: 2000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .test-center-content {
      background-color: #1e293b;
      border-radius: 12px;
      width: 95%;
      max-width: 1000px;
      max-height: 90vh;
      overflow: auto;
      position: relative;
      border: 1px solid #40536d;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    .test-center-close {
      position: sticky;
      top: 10px;
      right: 10px;
      z-index: 10;
      display: flex;
      justify-content: flex-end;
      padding: 10px;
    }
    .test-center-close-btn {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
    }
    .test-center-close-btn:hover {
      background: #dc2626;
    }
    .info-text {
      text-align: center;
      color: #94a3b8;
      padding: 20px;
      font-size: 14px;
    }
  `;

  const renderConfig = () => (
    <div className="config-section">
      <h3 style={{ textAlign: 'center', color: '#818cf8' }}>🎧 句子听力练习</h3>

      <div style={{ 
        background: '#2d3a4f', 
        borderRadius: '8px', 
        padding: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
          当前句子数量
        </div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#818cf8' }}>
          {dataState.activeQueue.length}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
          点击"开始学习"进行练习
        </div>
      </div>

      <button className="start-btn" onClick={startLearn} style={{ background: '#10b981' }}>
        📖 开始学习 ({dataState.activeQueue.length}句)
      </button>

      {learningState.difficultSentences.length > 0 && (
        <button className="start-btn" onClick={startReview} style={{ background: '#f59e0b' }}>
          🔄 开始复习 ({learningState.difficultSentences.length}个)
        </button>
      )}
    </div>
  );

  const renderTesting = () => (
    <>
      <div className="control-bar">
        <button className="back-btn" onClick={() => { setUiState(prev => ({ ...prev, testState: 'CONFIG' })); stopLoop(); }}>← 返回</button>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {uiState.currentMode === 'LEARN' && (
            <button className={`loop-toggle ${uiState.isLoopMode ? 'active' : ''}`} onClick={() => setUiState(prev => ({ ...prev, isLoopMode: !prev.isLoopMode }))}>
              {uiState.isLoopMode ? '🔁' : '▶'}
            </button>
          )}
          <button className={`hide-lists-toggle`} onClick={toggleHideLists}>
            {uiState.hideLists ? '👁️ 显示' : '👁️ 隐藏'}
          </button>
          <span 
            className="status-badge"
            style={{ 
              background: uiState.hideLists ? '#ef4444' : '#10b981',
              color: 'white'
            }}
          >
            {uiState.hideLists ? '隐藏' : '显示'}
          </span>
        </div>
        <div style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: uiState.currentMode === 'LEARN' ? '#10b981' : '#f59e0b' }}>
          {uiState.currentMode === 'LEARN' ? '学习' : '复习'}
        </div>
      </div>

      <ModeSelector 
        currentMode={uiState.currentMode} 
        difficultCount={learningState.difficultSentences.length} 
        onSelectMode={switchMode}
        hideLists={uiState.hideLists}
      />

      <div style={{ background: uiState.currentMode === 'LEARN' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${uiState.currentMode === 'LEARN' ? '#10b981' : '#f59e0b'}`, borderRadius: '8px', padding: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 'bold', color: uiState.currentMode === 'LEARN' ? '#10b981' : '#f59e0b' }}>
            {uiState.currentMode === 'LEARN' ? '📖 学习' : '🔄 复习'}
          </span>
          <span>{dataState.currentIndex + 1} / {totalInQueue}</span>
        </div>
        <ProgressBar current={dataState.currentIndex + 1} total={totalInQueue} color={uiState.currentMode === 'LEARN' ? '#10b981' : '#f59e0b'} />
      </div>

      <div className="stats-row">
        <div className="stat-item" style={{ color: '#10b981' }}>✅ {learningState.understoodSentences.length}</div>
        <div className="stat-item" style={{ color: '#ef4444' }}>❌ {learningState.difficultSentences.length}</div>
      </div>

      <div className="audio-area" onClick={handleAudioAreaClick}>
        <span className="audio-icon">🔊</span>
        {!uiState.hideLists && (
          <div className="sentence-text">{(displaySentence || currentSentence)?.text || '点击播放'}</div>
        )}
        {uiState.isLoopMode && uiState.currentMode === 'LEARN' && userResponse === null && (
          <span className="loop-indicator">🔁 {playCount}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
        <div className="response-row">
          <button className={`response-btn btn-understood ${userResponse === 'UNDERSTOOD' ? 'selected' : ''}`} onClick={() => handleUserResponse('UNDERSTOOD')} disabled={userResponse !== null}>✅ 听懂了</button>
          <button className={`response-btn btn-difficult ${userResponse === 'NOT_UNDERSTOOD' ? 'selected' : ''}`} onClick={() => handleUserResponse('NOT_UNDERSTOOD')} disabled={userResponse !== null}>❓ 没听懂</button>
        </div>

        <div className="nav-row">
          <button className="nav-btn" onClick={() => navigateSentence(-1)} disabled={userResponse !== null}>⏮️ 上一句</button>
          <button className="nav-btn" onClick={() => navigateSentence(1)} disabled={userResponse !== null}>⏭️ 下一句</button>
        </div>
      </div>

      <div className="lists-container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginTop: '8px',
        opacity: uiState.hideLists ? 0.5 : 1,
        transition: 'opacity 0.3s'
      }}>
        <SentenceList
          sentences={learningState.understoodSentences}
          title="✅ 会的"
          color="#10b981"
          onSelect={handleSentenceClick}
          onRemove={removeUnderstoodSentence}
          isHidden={uiState.hideLists}
        />
        <SentenceList
          sentences={learningState.difficultSentences}
          title="❌ 不会的"
          color="#ef4444"
          onSelect={handleSentenceClick}
          onRemove={removeDifficultSentence}
          isHidden={uiState.hideLists}
        />
      </div>

      {uiState.hideLists && (
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#94a3b8',
          padding: '4px',
          background: '#2d3a4f',
          borderRadius: '4px',
          marginTop: '5px'
        }}>
          🔍 列表已隐藏，点击"👁️ 显示"按钮查看
        </div>
      )}
    </>
  );

  const renderDone = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3 style={{ color: '#6366f1' }}>练习完成</h3>
      <div style={{ background: '#2d3a4f', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div>总数<br /><span style={{ fontSize: '20px', color: '#818cf8' }}>{dataState.activeQueue.length}</span></div>
          <div>✅ 会的<br /><span style={{ fontSize: '20px', color: '#10b981' }}>{learningState.understoodSentences.length}</span></div>
          <div>❌ 不会<br /><span style={{ fontSize: '20px', color: '#ef4444' }}>{learningState.difficultSentences.length}</span></div>
        </div>
      </div>

      {learningState.difficultSentences.length > 0 && (
        <button className="save-btn" onClick={startReview} style={{ background: '#f59e0b', marginBottom: '10px' }}>
          🔄 复习困难句子 ({learningState.difficultSentences.length})
        </button>
      )}

      <button className="start-btn" onClick={() => setUiState(prev => ({ ...prev, testState: 'CONFIG' }))}>返回主菜单</button>
    </div>
  );

  if (!uiState.isFloating) {
    return <div className="dark-app"><style>{styles}</style><div className="content">{renderConfig()}</div></div>;
  }

  return (
    <>
      <style>{styles}</style>
      <div className={`floating-window ${isDragging ? 'dragging' : ''}`} style={{ position: 'fixed', left: position.x, top: position.y, width: uiState.isCollapsed ? 200 : 480, height: uiState.isCollapsed ? 36 : 720, transition: isDragging ? 'none' : 'all 0.2s', zIndex: 1 }}>
        <div className="floating-handle" onMouseDown={handleMouseDown}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span 
              style={{ 
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                background: uiState.hideLists ? '#ef4444' : '#10b981',
                color: 'white',
                marginLeft: '5px'
              }}
            >
              {uiState.hideLists ? '隐藏中' : '显示中'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="handle-btn" onClick={() => setUiState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }))}>
              {uiState.isCollapsed ? '□' : '－'}
            </button>
            <button className="handle-btn" onClick={onClose} style={{ background: '#ef4444' }}>✕</button>
          </div>
        </div>

        {!uiState.isCollapsed && (
          <div className="content">
            {uiState.testState === 'CONFIG' && renderConfig()}
            {uiState.testState === 'TESTING' && renderTesting()}
            {uiState.testState === 'DONE' && renderDone()}
          </div>
        )}
      </div>

      {/* SentenceCenter 模态框 */}
      {showTestCenter && (
        <div className="test-center-modal">
          <div className="test-center-content">
            <div className="test-center-close">
              <button 
                className="test-center-close-btn"
                onClick={() => setShowTestCenter(false)}
              >
                ✕ 关闭测试中心
              </button>
            </div>
            <SentenceCenter />
          </div>
        </div>
      )}

    </>
  );
};

export default ListeningTestPro;