// components/SentenceViewer/FilterBar.js
import React from 'react';
import { styles } from './styles';

const FilterBar = ({ searchText, onSearchChange, filter, onFilterChange, totalCount, masteredCount, unmasteredCount, spellingMasteredCount, listeningMasteredCount }) => {
  return (
    <div style={styles.filterBar}>
      <input
        type="text"
        placeholder="搜索英文或中文..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        style={styles.searchInput}
      />
      
      <div style={styles.filterGroup}>
        <select value={filter} onChange={(e) => onFilterChange(e.target.value)} style={styles.select}>
          <option value="all">全部句子 ({totalCount})</option>
          <option value="mastered">综合已掌握 ({masteredCount})</option>
          <option value="unmastered">综合未掌握 ({unmasteredCount})</option>
          <option value="spelling_mastered">📝 拼写已掌握 ({spellingMasteredCount})</option>
          <option value="listening_mastered">🎧 听力已掌握 ({listeningMasteredCount})</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;