// workStudy/components.js
import React, { useState } from 'react';
import { F_speak } from "../../Function/weisimin.js";
import { getMasteryLevel, getStatusColor, playAudio } from './utils.js';
import { usePhonetic } from './usePhonetic.js';
import { PhoneticPlayer } from './phoneticPlayer.js';

// ========== 单词卡片组件 ==========
export const WordCard = ({ 
  word, isEditing, editTranslation, onEditTranslationChange, 
  onSaveTranslation, onCancelEdit, onDeleteWord, onStartEdit, 
  onPlayAudio, onResetWord, getToken
}) => {
  const level = getMasteryLevel(word.status);
  const isMastered = level === 5;
  
  // 使用音标 Hook - 默认获取音标
  const { phonetic, loading } = usePhonetic(word.word, getToken);

  const styles = {
    card: { padding: '8px', marginBottom: '6px', backgroundColor: '#1e293b', borderRadius: '6px', borderLeft: '3px solid' },
    miniPills: { display: 'flex', gap: '6px', fontSize: '9px', marginTop: '4px' },
    deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '12px' },
    phoneticText: { fontSize: '11px', color: '#a5b4fc', marginLeft: '8px', fontFamily: 'monospace' }
  };

  if (isEditing) {
    return (
      <div style={{ ...styles.card, borderLeftColor: getStatusColor(level), padding: '8px', marginBottom: '8px' }}>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{word.word}</span>
          <span onClick={() => onPlayAudio?.(word.word)} style={{ cursor: 'pointer', fontSize: '12px', marginLeft: '8px' }}>🔊</span>
        </div>
        <input
          type="text"
          value={editTranslation}
          onChange={onEditTranslationChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveTranslation(word);
            if (e.key === 'Escape') onCancelEdit();
          }}
          autoFocus
          style={{
            width: '100%',
            padding: '4px 8px',
            backgroundColor: '#0f172a',
            border: '1px solid #4caf50',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            marginBottom: '6px'
          }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => onSaveTranslation(word)} style={{ background: '#4caf50', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', color: '#fff' }}>💾 保存</button>
          <button onClick={onCancelEdit} style={{ background: '#ef4444', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', color: '#fff' }}>✕ 取消</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.card, borderLeftColor: getStatusColor(level), opacity: isMastered ? 0.6 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: isMastered ? '#888' : '#fff' }}>{word.word}</span>
            <span onClick={() => onPlayAudio?.(word.word)} style={{ cursor: 'pointer', fontSize: '12px' }}>🔊</span>
            <button onClick={() => onStartEdit(word)} style={{ background: '#3b82f6', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '10px', color: '#fff' }}>✏️ 编辑</button>
            <button 
              onClick={() => onResetWord?.(word.word)} 
              style={{ background: '#ef4444', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '10px', color: '#fff' }}
              title="重置所有熟练度（英/中/听/读/拼）"
            >
              🔄 重置
            </button>
          </div>
          {/* 使用可点击的音标播放器 */}
          {loading ? (
            <div style={styles.phoneticText}>加载中...</div>
          ) : (
            <PhoneticPlayer 
              phonetic={phonetic} 
              word={word.word}
              getToken={getToken}
              style={{ fontSize: '11px', marginLeft: '0px', justifyContent: 'flex-start', gap: '4px' }}
              compact={true}
            />
          )}
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{word.translation || '暂无翻译'}</div>
          <div style={styles.miniPills}>
            {['reading', 'translation', 'listening', 'pronunciation', 'spelling'].map(m => (
              <span key={m} style={{ color: word.status?.[m] ? '#4caf50' : '#444' }}>
                {m === 'reading' ? '英' : m === 'translation' ? '中' : m === 'listening' ? '听' : m === 'pronunciation' ? '读' : '拼'}
              </span>
            ))}
          </div>
        </div>
        <button onClick={() => onDeleteWord(word.word)} style={styles.deleteBtn}>🗑️</button>
      </div>
    </div>
  );
};

// ========== 简洁模式组件 ==========
export const SimpleMode = ({ position, isDragging, handleMouseDown, words, newWord, setNewWord, translate, setTranslate, isAdding, onAddWord, onClose, onSwitchToFullMode, onPlayAudio, onTranslate }) => {
  const styles = {
    container: {
      position: 'fixed', left: position.x, top: position.y, width: '550px', backgroundColor: '#1e293b', borderRadius: '12px',
      border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10000,
      transition: isDragging ? 'none' : 'all 0.2s', opacity: isDragging ? 0.95 : 1,
    },
    handle: { padding: '8px 15px', background: '#2d3a4f', borderRadius: '12px 12px 0 0', cursor: 'grab', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #40536d', userSelect: 'none' },
    title: { color: '#818cf8', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
    wordCount: { backgroundColor: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
    content: { padding: '12px 15px' },
    row: { display: 'flex', alignItems: 'center', gap: '8px' },
    wordInput: { flex: 2, position: 'relative', display: 'flex', alignItems: 'center' },
    hornButton: { position: 'absolute', left: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ffab40', zIndex: 2, padding: '4px' },
    input: { width: '100%', padding: '8px 40px 8px 32px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' },
    translateDiv: { position: 'absolute', right: '5px', padding: '0 8px', height: '24px', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #0e639c 0%, #063d61 100%)', borderRadius: '4px', fontSize: '12px', color: '#fff' },
    addBtn: { backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '60px', height: '38px', flexShrink: 0, fontWeight: 'bold' },
    fullModeBtn: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '70px', height: '38px', flexShrink: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
    closeBtn: { background: '#ef4444', border: 'none', color: 'white', width: '38px', height: '38px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
  };

  return (
    <div style={styles.container}>
      <div className="drag-handle" style={styles.handle} onMouseDown={handleMouseDown}>
        <div style={styles.title}><span>📚 单词添加器</span><span style={styles.wordCount}>{words.length}</span></div>
      </div>
      <div style={styles.content}>
        <div style={styles.row}>
          <div style={styles.wordInput}>
            <button onClick={() => onPlayAudio(newWord)} style={styles.hornButton}>📢</button>
            <input
              value={newWord}
              onChange={(e) => {
                setNewWord(e.target.value);
                if (e.target.value.trim()) onTranslate(e.target.value);
                else setTranslate("");
              }}
              onKeyDown={e => e.key === 'Enter' && onAddWord()}
              placeholder="添加新词"
              style={styles.input}
            />
            {translate && <div style={styles.translateDiv}>{translate}</div>}
          </div>
          <button onClick={onAddWord} style={styles.addBtn} disabled={isAdding}>{isAdding ? '...' : '添加'}</button>
          <button onClick={onSwitchToFullMode} style={styles.fullModeBtn}><span>完整</span></button>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
      </div>
    </div>
  );
};

// ========== 题目区域组件 ==========
export const QuestionArea = ({ 
  mode, currentWord, isLooping, setIsLooping, showOverlay, feedback, 
  roundFinished, roundWordsRef, currentIdx, onRefreshPool, 
  onPronunciationPass, onPronunciationFail, onCheckSpelling, 
  availableLetters, selectedLetters, onLetterClick, onClearLetters, 
  onPlayAudio, getToken 
}) => {
  
  // 获取实际要显示的单词（优先使用 currentWord，否则从 roundWordsRef 获取）
  const displayWord = currentWord || roundWordsRef.current?.[currentIdx];
  
  // 使用音标 Hook - 在 pronunciation 模式下自动获取并默认显示
  const { phonetic, loading } = usePhonetic(
    mode === 'pronunciation' && displayWord?.word ? displayWord.word : null, 
    getToken
  );

  const styles = {
    speakerBtn: { padding: '10px 20px', borderRadius: '8px', backgroundColor: '#0e639c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
    toolBtn: { padding: '6px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' },
    loopBtn: { padding: '5px 15px', borderRadius: '20px', background: 'none', cursor: 'pointer', fontSize: '11px' },
    phoneticText: { fontSize: '14px', color: '#a5b4fc', marginTop: '10px', fontFamily: 'monospace', textAlign: 'center' }
  };

  // 检查是否有单词
  const hasWords = roundWordsRef.current?.length > 0;
  
  if (!hasWords) {
    return <div style={{ textAlign: 'center' }}><div style={{ fontSize: '40px' }}>🌟</div><div style={{ fontSize: '18px', color: '#4caf50' }}>请先添加单词</div></div>;
  }

  if (roundFinished) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', color: '#ffab40', marginBottom: '20px' }}>🏁 本轮已完成</div>
        <button onClick={onRefreshPool} style={styles.speakerBtn}>🔄 再测一轮</button>
      </div>
    );
  }

  if (showOverlay && feedback) {
    return (
      <div style={{ textAlign: 'center', color: feedback.isCorrect ? '#4caf50' : '#f44336' }}>
        <div style={{ fontSize: '60px' }}>{feedback.isCorrect ? '✓' : '×'}</div>
        <div style={{ fontSize: '18px', margin: '10px 0' }}>{feedback.message || (feedback.isCorrect ? '回答正确！' : '回答错误')}</div>
        <div style={{ fontSize: '16px', marginTop: '10px' }}>
          单词: {feedback.correctWord?.word}<br />翻译: {feedback.correctWord?.translation}
        </div>
      </div>
    );
  }

  // 确保有当前单词
  if (!displayWord) {
    return <div style={{ textAlign: 'center' }}><div style={{ fontSize: '40px' }}>📖</div><div style={{ fontSize: '18px', color: '#ffab40' }}>准备就绪，点击"再测一轮"开始</div></div>;
  }

  switch (mode) {
    case 'reading':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>{displayWord.word}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => onPlayAudio(displayWord.word)} style={{ ...styles.toolBtn, backgroundColor: '#673ab7' }}>🔊 发音</button>
          </div>
        </div>
      );
    case 'translation':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '20px', marginBottom: '15px' }}>{displayWord.translation}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => onPlayAudio(displayWord.word)} style={styles.speakerBtn}>🔊 发音</button>
          </div>
        </div>
      );
    case 'listening':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <button onClick={() => onPlayAudio(displayWord.word)} style={styles.speakerBtn}>🔊 单次播放</button>
          <button onClick={() => setIsLooping(!isLooping)} style={{ ...styles.loopBtn, color: isLooping ? '#ffab40' : '#888', marginTop: '10px' }}>
            {isLooping ? '🔁 自动循环中' : '➡️ 开启无限循环'}
          </button>
        </div>
      );
    case 'pronunciation':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px', fontWeight: 'bold', color: '#fff' }}>
            {displayWord.word}
          </div>
          <div style={{ marginBottom: '15px', color: '#aaa', fontSize: '16px' }}>
            {displayWord.translation}
            <span 
              onClick={() => onPlayAudio(displayWord.word)} 
              style={{ cursor: 'pointer', marginLeft: '8px', fontSize: '14px' }}
            >
              🔊
            </span>
          </div>
          {/* 可点击的音标播放器 */}
          {loading ? (
            <div style={styles.phoneticText}>加载音标中...</div>
          ) : (
            <PhoneticPlayer 
              phonetic={phonetic} 
              word={displayWord.word}
              getToken={getToken}
              style={{ 
                fontSize: '20px', 
                marginTop: '10px', 
                marginBottom: '15px',
                gap: '8px'
              }}
            />
          )}
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button 
              onClick={() => onPronunciationPass(true)} 
              style={{ 
                ...styles.speakerBtn, 
                backgroundColor: '#4caf50', 
                padding: '12px 28px', 
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ✅ 通过
            </button>
            <button 
              onClick={() => onPronunciationFail(false)} 
              style={{ 
                ...styles.speakerBtn, 
                backgroundColor: '#ef4444', 
                padding: '12px 28px', 
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ❌ 不通过
            </button>
          </div>
        </div>
      );
    case 'spelling':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '20px', marginBottom: '10px', color: '#a5b4fc' }}>{displayWord.translation}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
            {displayWord.word.split('').map((_, i) => (
              <div key={i} style={{ width: '40px', height: '45px', borderBottom: '3px solid #cfd8dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: i < selectedLetters.length ? '#10b981' : 'transparent', backgroundColor: i < selectedLetters.length ? '#1a2a3a' : 'transparent' }}>
                {displayWord.word[i]}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '15px', width: '100%' }}>
            {availableLetters.map(l => (
              <button key={l.id} onClick={() => onLetterClick(l.id)} disabled={l.used} style={{ padding: '10px', backgroundColor: l.used ? '#555' : '#0e639c', color: '#fff', border: 'none', borderRadius: '6px', opacity: l.used ? 0.5 : 1 }}>
                {l.letter}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={onCheckSpelling} disabled={selectedLetters.length !== displayWord.word.length} style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px' }}>✅ 检查</button>
            <button onClick={onClearLetters} disabled={!selectedLetters.length} style={{ padding: '8px 16px', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '6px' }}>🗑️ 清空</button>
            <button onClick={() => onPlayAudio(displayWord.word)} style={{ padding: '8px 16px', backgroundColor: '#0e639c', color: '#fff', border: 'none', borderRadius: '6px' }}>🔊 发音</button>
          </div>
        </div>
      );
    default:
      return null;
  }
};