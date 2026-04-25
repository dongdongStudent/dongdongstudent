// components/SentenceViewer/SentenceList.js
import React from 'react';
import { styles } from './styles';
import SentenceItem from './SentenceItem';
import { getSortIcon } from './helpers';  // 确保这行正确导入

const SentenceList = ({ 
  sentences, 
  sortConfig, 
  onSort,
  selectedIds,
  expandedId,
  deleteConfirmId,
  loading,
  onToggleSelect,
  onToggleExpand,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
  onJumpToSentence
}) => {
  const handleSort = (key) => {
    onSort({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  };

  // 处理全选
  const handleSelectAll = () => {
    if (selectedIds.length === sentences.length && sentences.length > 0) {
      onToggleSelect([]);
    } else {
      onToggleSelect(sentences.map(s => s.id));
    }
  };

  // 处理单个选择
  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onToggleSelect(selectedIds.filter(i => i !== id));
    } else {
      onToggleSelect([...selectedIds, id]);
    }
  };

  return (
    <>
      <div style={styles.listHeader}>
        <div style={styles.headerCheckbox}>
          <input 
            type="checkbox"
            checked={selectedIds.length === sentences.length && sentences.length > 0}
            onChange={handleSelectAll}
            onClick={(e) => e.stopPropagation()}
            style={styles.checkbox}
          />
        </div>
        <div style={styles.headerExpand}></div>
        <div style={styles.headerText} onClick={() => handleSort('text')}>
          英文 {getSortIcon(sortConfig, 'text')}
        </div>
        <div style={styles.headerText} onClick={() => handleSort('chinese')}>
          中文 {getSortIcon(sortConfig, 'chinese')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('extraction')}>
          抽取 {getSortIcon(sortConfig, 'extraction')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('correct')}>
          总正确 {getSortIcon(sortConfig, 'correct')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('wrong')}>
          总错误 {getSortIcon(sortConfig, 'wrong')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('spelling_correct')} title="拼写正确次数">
          拼✓ {getSortIcon(sortConfig, 'spelling_correct')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('spelling_wrong')} title="拼写错误次数">
          拼✗ {getSortIcon(sortConfig, 'spelling_wrong')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('listening_correct')} title="听力正确次数">
          听✓ {getSortIcon(sortConfig, 'listening_correct')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('listening_wrong')} title="听力错误次数">
          听✗ {getSortIcon(sortConfig, 'listening_wrong')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('pass')}>
          掌握 {getSortIcon(sortConfig, 'pass')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('time')}>
          创建时间 {getSortIcon(sortConfig, 'time')}
        </div>
        <div style={styles.headerStats} onClick={() => handleSort('last_answer')}>
          最新回答 {getSortIcon(sortConfig, 'last_answer')}
        </div>
        <div style={styles.headerAction}>操作</div>
      </div>

      <div style={styles.list}>
        {sentences.length > 0 ? sentences.map((sentence, index) => (
          <SentenceItem
            key={sentence.id}
            sentence={sentence}
            index={index}
            isExpanded={expandedId === sentence.id}
            isSelected={selectedIds.includes(sentence.id)}
            isDeleting={deleteConfirmId === sentence.id}
            loading={loading}
            onToggleSelect={() => handleToggleSelect(sentence.id)}
            onToggleExpand={onToggleExpand}
            onDeleteClick={onDeleteClick}
            onConfirmDelete={onConfirmDelete}
            onCancelDelete={onCancelDelete}
            onJumpToSentence={(id) => onJumpToSentence(sentences.findIndex(s => s.id === id))}
          />
        )) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</div>
            <div>没有找到匹配的句子</div>
          </div>
        )}
      </div>
    </>
  );
};

export default SentenceList;