// components/SentenceViewer/ModeSelectModal.js - 简洁版
import React from 'react';
import { styles } from './styles';

const ModeSelectModal = ({ count, onConfirm, onCancel }) => {
  return (
    <div style={styles.modeSelectOverlay} onClick={onCancel}>
      <div style={styles.modeSelectDialog} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modeSelectTitle}>选择测试模式</h3>
        <p style={styles.modeSelectText}>
          已选中 {count} 个句子，请选择测试模式：
        </p>
        <div style={styles.modeSelectButtons}>
          <button 
            onClick={() => onConfirm('spelling')}
            style={styles.spellingModeButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d1fae5';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f7ff';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
          >
            <span style={styles.modeSelectIcon}>📝</span>
            <div style={styles.modeSelectInfo}>
              <span style={styles.modeSelectName}>拼写模式</span>
              <span style={styles.modeSelectDesc}>按顺序排列单词，练习句子拼写</span>
            </div>
          </button>
          
          <button 
            onClick={() => onConfirm('listening')}
            style={styles.listeningModeButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d1fae5';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f0ff';
              e.currentTarget.style.borderColor = '#8b5cf6';
            }}
          >
            <span style={styles.modeSelectIcon}>🎧</span>
            <div style={styles.modeSelectInfo}>
              <span style={styles.modeSelectName}>听力模式</span>
              <span style={styles.modeSelectDesc}>听音频判断是否听懂，训练听力</span>
            </div>
          </button>
        </div>
        
        <button onClick={onCancel} style={styles.modeSelectCancel}>
          取消
        </button>
      </div>
    </div>
  );
};

export default ModeSelectModal;