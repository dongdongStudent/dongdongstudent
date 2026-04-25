// components/SentenceViewer/DeleteConfirmModal.js
import React from 'react';
import { styles } from './styles';

const DeleteConfirmModal = ({ count, loading, onConfirm, onCancel }) => {
  return (
    <div style={styles.confirmOverlay} onClick={onCancel}>
      <div style={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.confirmTitle}>确认批量删除</h3>
        <p style={styles.confirmText}>
          确定要删除选中的 {count} 个句子吗？此操作不可恢复。
        </p>
        <div style={styles.confirmActions}>
          <button 
            onClick={onConfirm}
            style={styles.confirmDeleteButton}
            disabled={loading}
          >
            {loading ? '删除中...' : '确认删除'}
          </button>
          <button 
            onClick={onCancel}
            style={styles.confirmCancelButton}
            disabled={loading}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;