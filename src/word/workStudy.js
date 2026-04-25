// workStudy.js
import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { F_speak, F_translator } from "../Function/weisimin.js";
import { MODES, MODE_DISPLAY, getAccuracy, checkLogin, playAudio } from './workStudy/utils.js';
import { useDrag, useWords, useGameMode, useSpelling } from './workStudy/hooks.js';
import { WordCard, SimpleMode, QuestionArea } from './workStudy/components.js';

const VocabularyMaster = ({ onClose, getToken, clickWork, onWordChange, net, G_word_name }) => {
  const navigate = useNavigate();
  const { position, isDragging, handleMouseDown } = useDrag();
  
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isMaskEnabled, setIsMaskEnabled] = useState(true);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // 单词管理
  const {
    words, setWords, roundWordsRef,
    newWord, setNewWord, translate, setTranslate,
    isAdding, deletingWord, setDeletingWord,
    editingWord, setEditingWord, editTranslation, setEditTranslation,
    fetchWords, syncData, addWord, deleteWord, saveTranslation, updateWordStatus,
    resetWordStatus
  } = useWords(getToken, G_word_name, onWordChange, navigate, onClose);

  // 游戏模式
  const {
    exerciseMode, currentIdx, options, feedback, showOverlay, roundFinished, isLooping, stats,
    setShowOverlay, setIsLooping, refreshPool, handleAnswer, handleNext, 
    handlePronunciation, handleModeSwitch
  } = useGameMode(words, isPracticeMode, updateWordStatus, syncData, roundWordsRef);

  const currentWord = roundWordsRef.current[currentIdx];

  // 拼写功能
  const {
    availableLetters, selectedLetters,
    handleLetterClick, clearAllLetters, checkSpelling
  } = useSpelling(currentWord, showOverlay, roundFinished, isPracticeMode, updateWordStatus, setShowOverlay, (fb) => {});

  // ========== 事件处理 ==========
  const handleAddWord = async () => {
    const success = await addWord();
    if (success) refreshPool();
  };

  const handleDeleteWord = async (wordText) => {
    await deleteWord(wordText);
    refreshPool();
  };

  const handleSaveTranslationWrapper = async (wordObj) => {
    await saveTranslation(wordObj);
  };

  const handleStartEditTranslation = (wordObj) => {
    setEditingWord(wordObj.word);
    setEditTranslation(wordObj.translation || '');
  };

  const handleCancelEdit = () => {
    setEditingWord(null);
    setEditTranslation('');
  };

  const handleResetWord = async (wordText) => {
    await resetWordStatus(wordText);
    refreshPool();
  };

  const onPlayAudio = (text) => playAudio(text);

  const handleTranslate = async (text) => {
    const t = await F_translator(text);
    setTranslate(t);
  };

  // ========== Effects ==========
  useEffect(() => {
    if (clickWork?.trim()) {
      setNewWord(clickWork.trim());
      F_translator(clickWork).then(t => setTranslate(t));
      F_speak(clickWork);
    }
  }, [clickWork]);

  useEffect(() => {
    if (checkLogin(getToken, navigate, onClose)) {
      if (clickWork?.trim()) {
        F_translator(clickWork).then(t => setTranslate(t));
        F_speak(clickWork);
      }
      fetchWords();
    }
  }, []);

  // ========== 登录检查渲染 ==========
  if (!getToken && words.length === 0) {
    return (
      <div style={{ position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '400px', height: '300px', backgroundColor: '#121212', borderRadius: '20px', alignItems: 'center', justifyContent: 'center', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔒</div>
        <h3>需要登录</h3>
        <p style={{ color: '#aaa', margin: '20px 0' }}>请先登录以使用词汇大师功能</p>
        <div>
          <button onClick={() => navigate('/')} style={{ backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', width: '100px', marginRight: '10px', padding: '6px' }}>登录</button>
          <button onClick={onClose} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', width: '100px', padding: '6px' }}>关闭</button>
        </div>
      </div>
    );
  }

  // 简洁模式
  if (isSimpleMode) {
    return (
      <SimpleMode
        position={position} isDragging={isDragging} handleMouseDown={handleMouseDown}
        words={words} newWord={newWord} setNewWord={setNewWord}
        translate={translate} setTranslate={setTranslate}
        isAdding={isAdding} onAddWord={handleAddWord} onClose={onClose}
        onSwitchToFullMode={() => setIsSimpleMode(false)}
        onPlayAudio={onPlayAudio} onTranslate={handleTranslate}
      />
    );
  }

  // 完整模式样式
  const s = {
    appWrapper: { position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)', display: 'flex', height: '80vh', backgroundColor: '#121212', color: '#fff', borderRadius: '20px', overflow: 'hidden', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', zIndex: 1, transition: 'width 0.3s', width: isRightPanelCollapsed ? '430px' : '850px' },
    leftPanel: { flex: 1, minWidth: 0, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    rightPanel: { backgroundColor: '#181818', minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', transition: 'all 0.3s', width: isRightPanelCollapsed ? 0 : 330, opacity: isRightPanelCollapsed ? 0 : 1 },
    header: { padding: '12px 15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    inputContainer: { display: 'flex', gap: '8px', marginBottom: '15px', alignItems: 'center' },
    wordInput: { flex: 2, position: 'relative', display: 'flex', alignItems: 'center' },
    hornButton: { position: 'absolute', left: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ffab40', zIndex: 2 },
    input: { width: '100%', padding: '6px 45px 6px 32px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '12px', height: '32px' },
    addBtn: { backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', width: '50px', height: '32px' },
    translateDiv: { position: 'absolute', right: '5px', padding: '0 8px', height: '22px', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #0e639c 0%, #063d61 100%)', borderRadius: '4px', fontSize: '11px', color: '#fff' },
    toolbar: { display: 'flex', gap: '8px', marginBottom: '15px' },
    toolBtn: { padding: '6px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' },
    statsBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#1e1e1e', borderRadius: '10px', marginBottom: '15px', fontSize: '11px' },
    modeBadge: { backgroundColor: '#0e639c', padding: '2px 8px', borderRadius: '5px' },
    modeToggle: { display: 'flex', gap: '8px', marginBottom: '15px' },
    modeBtn: { flex: 1, padding: '8px', borderRadius: '8px', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '11px' },
    questionBox: { height: '320px', display: 'flex', backgroundColor: '#1a1a1a', borderRadius: '15px', marginBottom: '15px', border: '1px solid #333', padding: '10px', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    optionBtn: { padding: '18px 10px', borderRadius: '10px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', cursor: 'pointer', fontSize: '13px' },
    globalCaptureLayer: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
    floatingPrompt: { marginBottom: '30px', backgroundColor: '#fff', color: '#000', padding: '10px 30px', borderRadius: '30px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center' },
    listArea: { flex: 1, overflowY: 'auto', padding: '12px', minHeight: 0, scrollbarWidth: 'thin', scrollbarColor: '#4a4a4a #2a2a2a' },
    maskOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#181818', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#fff' },
    closeBtn: { background: '#333', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', width: '24px', height: '24px', borderRadius: '50%' }
  };

  const accuracy = getAccuracy(stats, exerciseMode);
  const totalWordsInRound = roundWordsRef.current.length;

  return (
    <div style={s.appWrapper}>
      {showOverlay && (
        <div style={s.globalCaptureLayer} onClick={handleNext}>
          <div style={s.floatingPrompt}>
            {feedback?.isPracticeMode && <span style={{ color: '#ffab40', marginRight: '10px' }}>🧪 练习模式</span>}
            {feedback?.message ? `${feedback.message} - 点击继续` : '点击任意位置继续'}
          </div>
        </div>
      )}

      <div style={s.leftPanel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#818cf8' }}>词汇大师</h3>
          <button onClick={() => setIsSimpleMode(true)} style={{ ...s.toolBtn, backgroundColor: '#10b981' }}>✨ 简洁模式</button>
        </div>

        <div style={s.inputContainer}>
          <div style={s.wordInput}>
            <button onClick={() => onPlayAudio(newWord)} style={s.hornButton}>📢</button>
            <input
              value={newWord}
              onChange={e => {
                setNewWord(e.target.value);
                if (e.target.value.trim()) F_translator(e.target.value).then(t => setTranslate(t));
                else setTranslate("");
              }}
              onKeyDown={e => e.key === 'Enter' && handleAddWord()}
              placeholder="添加新词"
              style={s.input}
            />
            {translate && <div style={s.translateDiv}>{translate}</div>}
          </div>
          <button onClick={handleAddWord} style={s.addBtn} disabled={isAdding}>{isAdding ? '...' : '添加'}</button>
        </div>

        <div style={s.toolbar}>
          <button onClick={() => { setIsPracticeMode(!isPracticeMode); refreshPool(); message.info(!isPracticeMode ? '🧪 练习模式' : '📚 学习模式'); }} 
            style={{ ...s.toolBtn, backgroundColor: isPracticeMode ? '#ffab40' : '#0e639c', flex: 1 }}>
            {isPracticeMode ? '🧪 练习模式' : '📚 学习模式'}
          </button>
          {isRightPanelCollapsed && <button onClick={() => setIsRightPanelCollapsed(false)} style={{ ...s.toolBtn, width: '30px' }}>◀</button>}
        </div>

        <div style={s.statsBar}>
          <span style={s.modeBadge}>{MODE_DISPLAY[exerciseMode]}</span>
          {!roundFinished && totalWordsInRound > 0 && <span>进度: <span style={{ color: '#ffab40' }}>{currentIdx + 1}/{totalWordsInRound}</span></span>}
          <span>正确率: <span style={{ color: accuracy >= 80 ? '#4caf50' : accuracy >= 60 ? '#ffab40' : '#ff5252' }}>{accuracy}%</span></span>
        </div>

        <div style={s.modeToggle}>
          {MODES.map(m => (
            <button key={m} onClick={() => handleModeSwitch(m)} style={{ ...s.modeBtn, backgroundColor: exerciseMode === m ? '#0e639c' : '#333', border: exerciseMode === m ? '2px solid #ffab40' : 'none' }}>
              {MODE_DISPLAY[m]}
            </button>
          ))}
        </div>

        <div style={s.questionBox}>
          <QuestionArea
            mode={exerciseMode} 
            currentWord={currentWord} 
            isLooping={isLooping} 
            setIsLooping={setIsLooping}
            showOverlay={showOverlay} 
            feedback={feedback} 
            roundFinished={roundFinished}
            roundWordsRef={roundWordsRef} 
            currentIdx={currentIdx} 
            onRefreshPool={() => refreshPool()}
            onPronunciationPass={() => handlePronunciation(true)} 
            onPronunciationFail={() => handlePronunciation(false)}
            onCheckSpelling={checkSpelling} 
            availableLetters={availableLetters} 
            selectedLetters={selectedLetters}
            onLetterClick={handleLetterClick} 
            onClearLetters={clearAllLetters} 
            onPlayAudio={onPlayAudio}
            getToken={getToken}
          />
        </div>

        {!['pronunciation', 'spelling'].includes(exerciseMode) && !showOverlay && !roundFinished && totalWordsInRound > 0 && (
          <div style={s.optionsGrid}>
            {options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(opt.displayText)} style={s.optionBtn} disabled={showOverlay || !totalWordsInRound || roundFinished}>
                {opt.displayText}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={s.rightPanel}>
        <div style={s.header}>
          <span>词库管理 ({words.length})</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setIsRightPanelCollapsed(true)} style={s.iconBtn}>▶</button>
            <button onClick={() => setIsMaskEnabled(!isMaskEnabled)} style={{ ...s.iconBtn, color: isMaskEnabled ? '#ffab40' : '#888' }}>
              {isMaskEnabled ? '🔒' : '🔓'}
            </button>
            <button onClick={onClose} style={s.closeBtn}>✕</button>
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {isMaskEnabled && !showOverlay && <div style={s.maskOverlay}>🛡️ 练习中已遮盖</div>}
          <div style={{ ...s.listArea, height: '100%', overflowY: 'auto', filter: isMaskEnabled && !showOverlay ? 'blur(15px)' : 'none' }}>
            {[...words].sort((a, b) => {
              const getLevel = (status) => Object.values(status || {}).filter(v => v).length;
              return getLevel(a.status) - getLevel(b.status);
            }).map(word => (
              <WordCard
                key={word.word} 
                word={word} 
                isEditing={editingWord === word.word}
                editTranslation={editTranslation} 
                onEditTranslationChange={(e) => setEditTranslation(e.target.value)}
                onSaveTranslation={handleSaveTranslationWrapper} 
                onCancelEdit={handleCancelEdit}
                onDeleteWord={handleDeleteWord} 
                onStartEdit={handleStartEditTranslation}
                onPlayAudio={onPlayAudio}
                onResetWord={handleResetWord}
                getToken={getToken}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularyMaster;