// components/styles.js

// styles.js
export const listeningStyles = {
  // 主卡片
  card: {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#1e1e1e',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    color: '#d4d4d4',
  },

  // 音频区域
  audioSection: {
    textAlign: 'center',
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
  },
  playButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#0e639c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '12px',
    ':hover': {
      backgroundColor: '#0e7ab3',
      transform: 'translateY(-2px)',
    },
  },
  hint: {
    fontSize: '12px',
    color: '#858585',
  },

  // 整合的文本区域（英文+中文）
  textSection: {
    marginBottom: '24px',
    padding: '15px',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid #4ec9b0',
  },
  textHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  textLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#4ec9b0',
  },
  toggleTextButton: {
    padding: '4px 12px',
    backgroundColor: '#0e639c',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#0e7ab3',
    },
  },
  textContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  englishText: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#d4d4d4',
    lineHeight: '1.5',
    wordBreak: 'break-word',
    padding: '8px',
    backgroundColor: '#2d2d2d',
    borderRadius: '6px',
  },
  chineseText: {
    fontSize: '14px',
    color: '#ffab40',
    lineHeight: '1.5',
    wordBreak: 'break-word',
    padding: '8px',
    backgroundColor: '#2d2d2d',
    borderRadius: '6px',
  },
  langLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#858585',
    marginRight: '8px',
  },
  textHidden: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '30px',
    backgroundColor: '#2d2d2d',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  textHiddenSymbol: {
    fontSize: '28px',
    letterSpacing: '6px',
    color: '#858585',
    fontFamily: 'monospace',
  },
  textHiddenHint: {
    fontSize: '12px',
    color: '#858585',
  },

  // 按钮组
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },
  passButton: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#059669',
      transform: 'translateY(-2px)',
    },
  },
  failButton: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'translateY(-2px)',
    },
  },

  // 结果区域
  resultBox: {
    marginTop: '20px',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid',
    textAlign: 'center',
  },
  resultIcon: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  resultAnswer: {
    textAlign: 'left',
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
  },
  resultLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#858585',
    marginBottom: '4px',
  },
  resultText: {
    fontSize: '16px',
    color: '#d4d4d4',
    marginBottom: '8px',
    wordBreak: 'break-word',
  },
  resultChinese: {
    fontSize: '14px',
    color: '#ffab40',
  },
  nextButton: {
    marginTop: '16px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#0e639c',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#0e7ab3',
    },
  },

  // 进度和得分
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #3c3c3c',
  },
  progressText: {
    fontSize: '14px',
    color: '#858585',
  },
  scoreText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffab40',
  },
};

// 全局动画样式
export const globalStyles = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

// 拼写测试样式
export const spellingStyles = {
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '8px 12px'
  },
  audioButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  chineseText: {
    color: '#ffd700',
    fontSize: '14px',
    flex: 1
  },
  mastered: {
    color: '#10b981',
    fontSize: '12px',
    marginLeft: '4px'
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  progressText: {
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#0f172a',
    padding: '4px 12px',
    borderRadius: '12px'
  },
  wordSlots: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  wordSlot: {
    border: '2px dashed #4b5563',
    borderRadius: '8px',
    minWidth: '80px',
    textAlign: 'center',
    transition: 'all 0.2s'
  },
  wordGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  wordButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '12px',
    gap: '10px'
  },
  actionButton: {
    padding: '8px 24px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  resultBox: {
    marginTop: '15px',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px'
  },
  resultIcon: {
    fontSize: '24px',
    minWidth: '32px'
  },
  resultAnswer: {
    color: 'white',
    fontSize: '13px',
    backgroundColor: '#0f172a',
    padding: '6px 12px',
    borderRadius: '6px',
    flex: 1,
    textAlign: 'left'
  },
  resultLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '4px'
  },
  nextButton: {
    padding: '6px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  }
};

// 结算界面样式
export const resultStyles = {
  overlay: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '30px',
    marginTop: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    position: 'relative',
    zIndex: 30
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  score: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#8b5cf6'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px'
  },
  statCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  detailSection: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px'
  },
  detailTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px dashed #e0e0e0'
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#333'
  },
  wrongSection: {
    padding: '20px',
    backgroundColor: '#fff5f5',
    borderRadius: '12px',
    border: '1px solid #ffcdd2'
  },
  wrongTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: '15px'
  },
  wrongList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '250px',
    overflowY: 'auto'
  },
  wrongItem: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #ffcdd2'
  },
  wrongNumber: {
    width: '30px',
    height: '30px',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  wrongContent: {
    flex: 1
  },
  wrongText: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px'
  },
  wrongChinese: {
    fontSize: '13px',
    color: '#666'
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '10px'
  },
  extractButton: {
    padding: '12px 30px',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  restartButton: {
    padding: '12px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

// 弹窗样式
export const modalStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1100
  },
  container: {
    backgroundColor: 'white', borderRadius: '12px',
    width: '900px', maxHeight: '85vh', overflow: 'auto',
    padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0'
  },
  title: { margin: 0, fontSize: '20px', color: '#333' },
  closeButton: {
    width: '32px', height: '32px', borderRadius: '16px',
    border: 'none', backgroundColor: '#e0e0e0',
    cursor: 'pointer', fontSize: '16px'
  },
  splitLayout: {
    display: 'flex',
    gap: '20px',
    minHeight: '400px'
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    paddingRight: '15px',
    borderRight: '1px solid #e0e0e0'
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px'
  },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  radioLabel: { 
    display: 'flex', alignItems: 'center', gap: '10px', 
    cursor: 'pointer', padding: '8px', borderRadius: '6px',
    fontSize: '14px'
  },
  countInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  countLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    minWidth: '70px'
  },
  countInput: {
    width: '100px',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center'
  },
  maxHint: {
    color: '#666',
    fontSize: '13px'
  },
  rangeInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  rangeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  rangeLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    minWidth: '70px'
  },
  rangeInput: {
    width: '100px',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center'
  },
  rangeHint: {
    fontSize: '12px',
    color: '#2196F3',
    textAlign: 'center',
    marginTop: '5px',
    padding: '6px',
    backgroundColor: '#e3f2fd',
    borderRadius: '6px'
  },
  actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' },
  submitButton: {
    padding: '8px 20px', backgroundColor: '#4CAF50', color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
    fontWeight: 'bold'
  },
  cancelButton: {
    padding: '8px 20px', backgroundColor: '#e0e0e0', color: '#666',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
  }
};

// 预览样式
export const previewStyles = {
  list: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px',
    paddingRight: '5px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  index: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#666',
    minWidth: '45px',
    backgroundColor: '#e9ecef',
    padding: '2px 6px',
    borderRadius: '4px',
    textAlign: 'center'
  },
  content: {
    flex: 1
  },
  english: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333'
  },
  chinese: {
    fontSize: '11px',
    color: '#666',
    marginTop: '2px'
  },
  status: {
    width: '24px',
    height: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white'
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '300px',
    color: '#999'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  emptyText: {
    fontSize: '16px',
    marginBottom: '8px'
  }
};

// 测试浮动窗口样式
export const testFloatingStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  container: {
    position: 'relative',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    animation: 'sentenceCenterSlideIn 0.3s ease'
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001
  },
  progress: {
    marginTop: '20px'
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#2d3a4f',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '8px',
    textAlign: 'right'
  },
  modeIndicator: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px'
  },
  modeBadge: {
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  }
};

// 弹窗样式
export const popupStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(4px)'
  },
  container: {
    width: '90%',
    maxWidth: '1000px',
    height: '85vh',
    maxHeight: '800px',
    backgroundColor: '#f5f5f5',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#333'
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#e0e0e0',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px'
  }
};

// 主界面样式
export const mainStyles = {
  container: {
    width: '100%',
    height: '100%',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    overflow: 'auto'
  },
  title: { textAlign: 'center', color: '#333', marginBottom: '20px', fontSize: '28px' },
  controlBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  buttonGroup: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  button: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  statsPanel: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  statsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #f0f0f0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '15px'
  },
  statCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '5px'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333'
  },
  message: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '15px'
  },
  extractPrompt: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: 'white',
    borderRadius: '16px',
    color: '#999',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  }
};

// 奖品样式
export const prizeStyles = {
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 10
  },
  confettiPiece: {
    position: 'absolute',
    top: '-10%',
    animation: 'sentenceCenterFall 3s linear infinite',
    opacity: 0.8,
    transform: 'rotate(45deg)',
    zIndex: 10
  },
  goldPrize: {
    position: 'relative',
    textAlign: 'center',
    padding: '20px',
    marginBottom: '20px',
    background: 'linear-gradient(135deg, #FFF9C4 0%, #FFD700 50%, #FFF9C4 100%)',
    borderRadius: '20px',
    boxShadow: '0 0 30px rgba(255,215,0,0.5)',
    animation: 'sentenceCenterGlow 2s ease-in-out infinite',
    zIndex: 20
  },
  trophy: {
    fontSize: '64px',
    marginBottom: '10px',
    animation: 'sentenceCenterBounce 1s ease infinite'
  },
  goldText: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#B8860B',
    textShadow: '2px 2px 4px rgba(255,215,0,0.3)'
  },
  goldSubtext: {
    fontSize: '16px',
    color: '#8B6914',
    marginTop: '5px'
  }
};
