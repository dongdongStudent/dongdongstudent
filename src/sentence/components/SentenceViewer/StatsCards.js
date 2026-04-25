// components/SentenceViewer/StatsCards.js
import React from 'react';
import { styles } from './styles';

const StatsCards = ({ totalCount, masteredCount, spellingMasteredCount, listeningMasteredCount }) => {
  return (
    <div style={styles.statsRow}>
      <div style={{...styles.statCard, backgroundColor: '#2196F3'}}>
        <div style={styles.statLabel}>总数</div>
        <div style={styles.statValue}>{totalCount}</div>
      </div>
      <div style={{...styles.statCard, backgroundColor: '#4CAF50'}}>
        <div style={styles.statLabel}>综合掌握</div>
        <div style={styles.statValue}>{masteredCount}</div>
      </div>
      <div style={{...styles.statCard, backgroundColor: '#3b82f6'}}>
        <div style={styles.statLabel}>📝 拼写掌握</div>
        <div style={styles.statValue}>{spellingMasteredCount}</div>
      </div>
      <div style={{...styles.statCard, backgroundColor: '#8b5cf6'}}>
        <div style={styles.statLabel}>🎧 听力掌握</div>
        <div style={styles.statValue}>{listeningMasteredCount}</div>
      </div>
    </div>
  );
};

export default StatsCards;