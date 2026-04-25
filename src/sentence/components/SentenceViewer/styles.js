// components/SentenceViewer/styles.js

export const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '95%',
    maxWidth: '1600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f8f9fa'
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '24px',
    fontWeight: '600'
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  recalcButton: {
    padding: '8px 16px',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  testButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  batchDeleteButton: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  closeButton: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  filterBar: {
    display: 'flex',
    gap: '15px',
    padding: '20px 24px',
    borderBottom: '1px solid #eee',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 2,
    padding: '10px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '250px',
    outline: 'none'
  },
  filterGroup: {
    display: 'flex',
    gap: '10px',
    flex: 1,
    minWidth: '200px'
  },
  select: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none'
  },
  statsRow: {
    display: 'flex',
    gap: '15px',
    padding: '0 24px 20px',
    flexWrap: 'wrap'
  },
  statCard: {
    padding: '12px 20px',
    borderRadius: '12px',
    color: 'white',
    minWidth: '100px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  statLabel: {
    fontSize: '12px',
    opacity: 0.9,
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold'
  },
  listHeader: {
    display: 'flex',
    padding: '12px 24px',
    backgroundColor: '#f0f0f0',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold',
    fontSize: '12px',
    color: '#666',
    alignItems: 'center'
  },
  headerCheckbox: {
    width: '40px',
    display: 'flex',
    justifyContent: 'center'
  },
  headerExpand: {
    width: '50px'
  },
  headerText: {
    flex: 2,
    minWidth: '130px',
    cursor: 'pointer'
  },
  headerStats: {
    width: '55px',
    textAlign: 'center',
    cursor: 'pointer'
  },
  headerAction: {
    width: '80px',
    textAlign: 'center'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px',
    backgroundColor: '#fafafa'
  },
  itemWrapper: {
    marginBottom: '2px'
  },
  itemRow: {
    display: 'flex',
    padding: '12px 0',
    borderBottom: '1px solid #eee',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  itemCheckbox: {
    width: '40px',
    display: 'flex',
    justifyContent: 'center'
  },
  itemExpand: {
    width: '50px',
    display: 'flex',
    justifyContent: 'center'
  },
  expandButton: {
    width: '24px',
    height: '24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemText: {
    flex: 2,
    minWidth: '130px',
    fontSize: '13px',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 6px'
  },
  itemStats: {
    width: '55px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '500'
  },
  masteryBadge: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '12px',
    lineHeight: '20px',
    textAlign: 'center'
  },
  timeText: {
    fontSize: '11px',
    color: '#999'
  },
  itemAction: {
    width: '80px',
    textAlign: 'center'
  },
  deleteButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    color: '#f44336',
    border: '1px solid #f44336',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  deleteConfirm: {
    display: 'flex',
    gap: '5px',
    justifyContent: 'center'
  },
  confirmButton: {
    padding: '4px 8px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '4px 8px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  expandedContent: {
    backgroundColor: '#f5f5f5',
    padding: '20px 24px 20px 114px',
    borderBottom: '1px solid #e0e0e0'
  },
  expandedGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr 200px',
    gap: '20px'
  },
  detailSection: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    color: '#333',
    borderBottom: '1px solid #eee',
    paddingBottom: '8px'
  },
  detailText: {
    fontSize: '14px',
    marginBottom: '8px',
    lineHeight: '1.5',
    color: '#555'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statLabel: {
    fontSize: '11px',
    color: '#999',
    textTransform: 'uppercase'
  },
  statNumber: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#333'
  },
  actionSection: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  actionButton: {
    padding: '12px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
    fontSize: '16px'
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    flexWrap: 'wrap',
    gap: '10px'
  },
  footerText: {
    fontSize: '12px',
    color: '#666'
  },
  // ========== 模式选择弹窗样式 ==========
  modeSelectOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1200
  },
  modeSelectDialog: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '400px',
    maxWidth: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    animation: 'fadeIn 0.2s ease'
  },
  modeSelectTitle: {
    margin: '0 0 12px 0',
    color: '#333',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  modeSelectText: {
    margin: '0 0 20px 0',
    color: '#666',
    fontSize: '14px'
  },
  modeSelectButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px'
  },
  spellingModeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    backgroundColor: '#f0f7ff',
    border: '2px solid #3b82f6',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
    textAlign: 'left'
  },
  listeningModeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    backgroundColor: '#f5f0ff',
    border: '2px solid #8b5cf6',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
    textAlign: 'left'
  },
  modeSelectIcon: {
    fontSize: '32px'
  },
  modeSelectInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  modeSelectName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  modeSelectDesc: {
    fontSize: '12px',
    color: '#666'
  },
  modeSelectCancel: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#666',
    fontWeight: '500'
  },
  modeSelectActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  },
  modeSelectConfirm: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  checkmark: {
    marginLeft: 'auto',
    fontSize: '20px',
    color: '#10b981',
    fontWeight: 'bold'
  },
  // ========== 批量删除确认弹窗样式 ==========
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100
  },
  confirmDialog: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  confirmTitle: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '20px'
  },
  confirmText: {
    margin: '0 0 25px 0',
    color: '#666',
    fontSize: '16px',
    lineHeight: '1.5'
  },
  confirmActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  confirmDeleteButton: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  confirmCancelButton: {
    padding: '10px 20px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

// 注入动画样式
export const injectAnimationStyles = () => {
  if (document.getElementById('sentence-viewer-animation')) return;
  const styleSheet = document.createElement('style');
  styleSheet.id = 'sentence-viewer-animation';
  styleSheet.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(styleSheet);
};