// components/ExtractModal.js
import React, { useState, useEffect } from 'react';
import { modalStyles, previewStyles } from './styles';

const ExtractModal = ({ onClose, onExtract, allSentences, testMode }) => {
  const [extractType, setExtractType] = useState('random');
  const [randomCount, setRandomCount] = useState(5);
  const [unmasteredCount, setUnmasteredCount] = useState(5);
  const [customCount, setCustomCount] = useState(5);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(10);
  const [loading, setLoading] = useState(false);
  const [previewSentences, setPreviewSentences] = useState([]);

  const totalCount = allSentences.length;
  const masteredTotal = allSentences.filter(s => s.pass).length;
  const unmasteredTotal = totalCount - masteredTotal;
  const unmasteredSentences = allSentences.filter(s => !s.pass);

  useEffect(() => {
    updatePreview();
  }, [extractType, randomCount, unmasteredCount, customCount, rangeStart, rangeEnd, allSentences]);

  const updatePreview = () => {
    let preview = [];
    
    switch (extractType) {
      case 'random':
        preview = [...allSentences].sort(() => Math.random() - 0.5).slice(0, Math.min(randomCount, 15));
        break;
      case 'unmastered':
        if (unmasteredSentences.length > 0) {
          preview = [...unmasteredSentences].sort(() => Math.random() - 0.5).slice(0, Math.min(unmasteredCount, 15));
        }
        break;
      case 'custom':
        preview = [...allSentences].sort(() => Math.random() - 0.5).slice(0, Math.min(customCount, 15));
        break;
      case 'range':
        const start = Math.max(0, rangeStart - 1);
        const end = Math.min(allSentences.length, rangeEnd);
        preview = allSentences.slice(start, end);
        break;
    }
    
    setPreviewSentences(preview);
  };

  const getCurrentCount = () => {
    switch (extractType) {
      case 'random': return randomCount;
      case 'unmastered': return unmasteredCount;
      case 'custom': return customCount;
      case 'range': return rangeEnd - rangeStart + 1;
      default: return 5;
    }
  };

  const getMaxCount = () => {
    switch (extractType) {
      case 'random': return totalCount;
      case 'unmastered': return unmasteredTotal;
      case 'custom': return totalCount;
      case 'range': return totalCount;
      default: return totalCount;
    }
  };

  const handleSubmit = async () => {
    const count = getCurrentCount();
    const maxCount = getMaxCount();

    if (extractType === 'range') {
      if (rangeStart < 1 || rangeEnd > totalCount || rangeStart > rangeEnd) {
        alert(`请输入有效的范围：1-${totalCount}，且起始 ≤ 结束`);
        return;
      }
    } else if (count < 1 || count > maxCount) {
      alert(`请输入1-${maxCount}之间的数字`);
      return;
    }

    if (extractType === 'unmastered' && unmasteredTotal === 0) {
      alert('🎉 所有句子都已掌握，无法抽取未掌握句子');
      return;
    }

    setLoading(true);
    try {
      let extracted = [];
      let message = '';
      
      switch (extractType) {
        case 'random':
          extracted = [...allSentences].sort(() => Math.random() - 0.5).slice(0, count);
          message = `🎲 随机抽取 ${extracted.length} 个句子`;
          break;
        case 'unmastered':
          extracted = [...unmasteredSentences].sort(() => Math.random() - 0.5).slice(0, count);
          message = `📚 抽取 ${extracted.length} 个未掌握句子`;
          break;
        case 'custom':
          extracted = [...allSentences].sort(() => Math.random() - 0.5).slice(0, count);
          message = `🎯 自定义抽取 ${extracted.length} 个句子`;
          break;
        case 'range':
          extracted = allSentences.slice(rangeStart - 1, rangeEnd);
          message = `📖 范围抽取 ${extracted.length} 个句子 (第${rangeStart}-${rangeEnd}句)`;
          break;
      }
      
      await onExtract(extracted, message);
      onClose();
    } catch (error) {
      alert('抽取失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>🎲 抽取句子 ({testMode === 'listening' ? '听力模式' : '拼写模式'})</h3>
          <button onClick={onClose} style={modalStyles.closeButton}>✕</button>
        </div>

        <div style={modalStyles.splitLayout}>
          <div style={modalStyles.leftPanel}>
            <div style={modalStyles.sectionTitle}>⚙️ 抽取设置</div>
            
            <div style={modalStyles.field}>
              <label style={modalStyles.radioLabel}>
                <input type="radio" value="random" checked={extractType === 'random'} 
                       onChange={(e) => setExtractType(e.target.value)} />
                🎲 随机抽取
              </label>
              <label style={modalStyles.radioLabel}>
                <input type="radio" value="unmastered" checked={extractType === 'unmastered'} 
                       onChange={(e) => setExtractType(e.target.value)} 
                       disabled={unmasteredTotal === 0} />
                📚 不会的抽取 {unmasteredTotal > 0 ? `(${unmasteredTotal}个可抽)` : '(暂无)'}
              </label>
              <label style={modalStyles.radioLabel}>
                <input type="radio" value="custom" checked={extractType === 'custom'} 
                       onChange={(e) => setExtractType(e.target.value)} />
                🎯 自定义抽取
              </label>
              <label style={modalStyles.radioLabel}>
                <input type="radio" value="range" checked={extractType === 'range'} 
                       onChange={(e) => setExtractType(e.target.value)} />
                📖 范围抽取
              </label>
            </div>

            {extractType !== 'range' ? (
              <div style={modalStyles.countInputGroup}>
                <span style={modalStyles.countLabel}>抽取数量：</span>
                <input 
                  type="number" 
                  min="1" 
                  max={extractType === 'unmastered' ? unmasteredTotal : totalCount}
                  value={extractType === 'random' ? randomCount : extractType === 'unmastered' ? unmasteredCount : customCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (extractType === 'random') setRandomCount(val);
                    else if (extractType === 'unmastered') setUnmasteredCount(val);
                    else setCustomCount(val);
                  }}
                  style={modalStyles.countInput}
                  disabled={extractType === 'unmastered' && unmasteredTotal === 0}
                />
                <span style={modalStyles.maxHint}>/ {getMaxCount()}</span>
              </div>
            ) : (
              <div style={modalStyles.rangeInputGroup}>
                <div style={modalStyles.rangeRow}>
                  <span style={modalStyles.rangeLabel}>起始位置：</span>
                  <input 
                    type="number" 
                    min="1" 
                    max={totalCount}
                    value={rangeStart}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setRangeStart(Math.min(val, totalCount));
                      if (val > rangeEnd) setRangeEnd(val);
                    }}
                    style={modalStyles.rangeInput} 
                  />
                </div>
                <div style={modalStyles.rangeRow}>
                  <span style={modalStyles.rangeLabel}>结束位置：</span>
                  <input 
                    type="number" 
                    min={rangeStart} 
                    max={totalCount}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Math.min(parseInt(e.target.value) || rangeStart, totalCount))}
                    style={modalStyles.rangeInput} 
                  />
                </div>
                <div style={modalStyles.rangeHint}>
                  💡 范围 {rangeStart} - {rangeEnd} 共 {rangeEnd - rangeStart + 1} 个句子
                </div>
              </div>
            )}

            <div style={modalStyles.actions}>
              <button onClick={handleSubmit} disabled={loading} style={modalStyles.submitButton}>
                {loading ? '处理中...' : '开始抽取'}
              </button>
              <button onClick={onClose} style={modalStyles.cancelButton}>取消</button>
            </div>
          </div>

          <div style={modalStyles.rightPanel}>
            <div style={modalStyles.sectionTitle}>📝 预览 ({previewSentences.length} 个句子)</div>
            {previewSentences.length > 0 ? (
              <div style={previewStyles.list}>
                {previewSentences.map((sentence, idx) => {
                  const originalIndex = allSentences.findIndex(s => s.id === sentence.id);
                  return (
                    <div key={sentence.id} style={previewStyles.item}>
                      <span style={previewStyles.index}>
                        #{extractType === 'range' ? rangeStart + idx : originalIndex + 1}
                      </span>
                      <div style={previewStyles.content}>
                        <div style={previewStyles.english}>{sentence.text}</div>
                        <div style={previewStyles.chinese}>{sentence.chinese}</div>
                      </div>
                      <span style={{
                        ...previewStyles.status,
                        backgroundColor: sentence.pass ? '#4caf50' : '#ff9800'
                      }}>
                        {sentence.pass ? '✓' : '○'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={previewStyles.empty}>
                <div style={previewStyles.emptyIcon}>📭</div>
                <div style={previewStyles.emptyText}>暂无预览</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractModal;