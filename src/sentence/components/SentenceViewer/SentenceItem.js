// components/SentenceViewer/SentenceItem.js
import React from 'react';
import { styles } from './styles';
import { calculateWinRate, calculateModeWinRate, formatDate, getMasteryColor } from './helpers';

const SentenceItem = ({ 
  sentence, 
  index, 
  isExpanded, 
  isSelected, 
  isDeleting, 
  loading,
  onToggleSelect, 
  onToggleExpand, 
  onDeleteClick, 
  onConfirmDelete, 
  onCancelDelete,
  onJumpToSentence 
}) => {
  const winRate = calculateWinRate(sentence.correct_count || 0, sentence.wrong_count || 0);
  const spellingWinRate = calculateModeWinRate(sentence, 'spelling');
  const listeningWinRate = calculateModeWinRate(sentence, 'listening');

  return (
    <div style={styles.itemWrapper}>
      <div 
        style={{
          ...styles.itemRow,
          backgroundColor: isExpanded ? '#e3f2fd' : (index % 2 === 0 ? '#ffffff' : '#f8f9fa'),
          borderLeft: `4px solid ${getMasteryColor(sentence.pass)}`,
          opacity: isDeleting ? 0.5 : 1
        }}
      >
        <div style={styles.itemCheckbox}>
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(sentence.id, e)}
            onClick={(e) => e.stopPropagation()}
            style={styles.checkbox}
          />
        </div>
        <div style={styles.itemExpand}>
          <button 
            onClick={(e) => onToggleExpand(sentence.id, e)}
            style={styles.expandButton}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
        <div style={styles.itemText} title={sentence.text}>
          {sentence.text?.length > 35 ? sentence.text.substring(0, 35) + '...' : sentence.text}
        </div>
        <div style={styles.itemText} title={sentence.chinese}>
          {sentence.chinese?.length > 15 ? sentence.chinese.substring(0, 15) + '...' : sentence.chinese}
        </div>
        <div style={styles.itemStats}>{sentence.extraction_count || 0}</div>
        <div style={{...styles.itemStats, color: '#4CAF50'}}>{sentence.correct_count || 0}</div>
        <div style={{...styles.itemStats, color: '#f44336'}}>{sentence.wrong_count || 0}</div>
        <div style={{...styles.itemStats, color: '#3b82f6'}}>{sentence.spelling_correct_count || 0}</div>
        <div style={{...styles.itemStats, color: '#f59e0b'}}>{sentence.spelling_wrong_count || 0}</div>
        <div style={{...styles.itemStats, color: '#8b5cf6'}}>{sentence.listening_correct_count || 0}</div>
        <div style={{...styles.itemStats, color: '#ec489a'}}>{sentence.listening_wrong_count || 0}</div>
        <div style={styles.itemStats}>
          <span style={{
            ...styles.masteryBadge,
            backgroundColor: getMasteryColor(sentence.pass),
            opacity: sentence.pass ? 1 : 0.7
          }}>
            {sentence.pass ? '✓' : '○'}
          </span>
        </div>
        <div style={styles.itemStats}>
          <span style={styles.timeText}>{formatDate(sentence.time)}</span>
        </div>
        <div style={styles.itemStats}>
          <span style={styles.timeText}>
            {sentence.last_answer_time ? formatDate(sentence.last_answer_time) : '从未'}
          </span>
        </div>
        <div style={styles.itemAction}>
          {isDeleting ? (
            <div style={styles.deleteConfirm}>
              <button 
                onClick={(e) => onConfirmDelete(sentence.id, e)}
                style={styles.confirmButton}
                disabled={loading}
              >
                确认
              </button>
              <button 
                onClick={onCancelDelete}
                style={styles.cancelButton}
                disabled={loading}
              >
                取消
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => onDeleteClick(sentence.id, e)}
              style={styles.deleteButton}
              title="删除"
              disabled={loading}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* 展开的详情行 */}
      {isExpanded && (
        <div style={styles.expandedContent}>
          <div style={styles.expandedGrid}>
            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>📖 完整内容</h4>
              <div style={styles.detailText}><strong>英文：</strong>{sentence.text}</div>
              <div style={styles.detailText}><strong>中文：</strong>{sentence.chinese}</div>
              <div style={styles.detailText}><strong>ID：</strong>{sentence.id}</div>
              <div style={styles.detailText}><strong>创建时间：</strong>{formatDate(sentence.time)}</div>
              <div style={styles.detailText}><strong>最新回答：</strong>{sentence.last_answer_time ? formatDate(sentence.last_answer_time) : '从未'}</div>
            </div>

            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>📊 统计信息</h4>
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>抽取次数</span>
                  <span style={styles.statNumber}>{sentence.extraction_count || 0}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>总正确</span>
                  <span style={{...styles.statNumber, color: '#4CAF50'}}>{sentence.correct_count || 0}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>总错误</span>
                  <span style={{...styles.statNumber, color: '#f44336'}}>{sentence.wrong_count || 0}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>总胜率</span>
                  <span style={{
                    ...styles.statNumber,
                    color: winRate >= 80 ? '#4CAF50' : winRate >= 60 ? '#FF9800' : '#f44336'
                  }}>
                    {winRate}%
                  </span>
                </div>
              </div>
              
              <div style={{...styles.statsGrid, marginTop: '15px'}}>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>📝 拼写正确</span>
                  <span style={{...styles.statNumber, color: '#3b82f6'}}>{sentence.spelling_correct_count || 0}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>📝 拼写错误</span>
                  <span style={{...styles.statNumber, color: '#f59e0b'}}>{sentence.spelling_wrong_count || 0}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>📝 拼写胜率</span>
                  <span style={{
                    ...styles.statNumber,
                    color: spellingWinRate >= 80 ? '#4CAF50' : spellingWinRate >= 60 ? '#FF9800' : '#f44336'
                  }}>
                    {spellingWinRate}%
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>📝 拼写掌握</span>
                  <span style={{
                    ...styles.statNumber,
                    color: sentence.spelling_pass ? '#4CAF50' : '#FF9800'
                  }}>
                    {sentence.spelling_pass ? '✓ 已掌握' : '○ 未掌握'}
                  </span>
                </div>
              </div>
              
              <div style={{...styles.statsGrid, marginTop: '15px'}}>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>🎧 听力正确</span>
                  <span style={{...styles.statNumber, color: '#8b5cf6'}}>{sentence.listening_correct_count || 0}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>🎧 听力错误</span>
                  <span style={{...styles.statNumber, color: '#ec489a'}}>{sentence.listening_wrong_count || 0}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>🎧 听力胜率</span>
                  <span style={{
                    ...styles.statNumber,
                    color: listeningWinRate >= 80 ? '#4CAF50' : listeningWinRate >= 60 ? '#FF9800' : '#f44336'
                  }}>
                    {listeningWinRate}%
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>🎧 听力掌握</span>
                  <span style={{
                    ...styles.statNumber,
                    color: sentence.listening_pass ? '#4CAF50' : '#FF9800'
                  }}>
                    {sentence.listening_pass ? '✓ 已掌握' : '○ 未掌握'}
                  </span>
                </div>
              </div>
              
              <div style={styles.statItem}>
                <span style={styles.statLabel}>综合掌握</span>
                <span style={{
                  ...styles.statNumber,
                  color: sentence.pass ? '#4CAF50' : '#FF9800'
                }}>
                  {sentence.pass ? '✓ 已掌握' : '○ 未掌握'}
                </span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>掌握判定依据</span>
                <span style={{
                  ...styles.statNumber,
                  fontSize: '11px',
                  color: '#666'
                }}>
                  拼写或听力任一模式满足：回答次数≥3且正确率≥80%
                </span>
              </div>
            </div>

            <div style={styles.actionSection}>
              <button 
                onClick={() => onJumpToSentence(sentence.id)}
                style={styles.actionButton}
              >
                跳转到此题
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentenceItem;