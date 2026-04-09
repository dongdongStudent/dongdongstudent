// view.js - 句子查看器组件（已添加刷新按钮）
import React, { useState } from 'react';
import { message } from 'antd';
import { sentenceApi } from './api';

const SentenceViewer = ({ 
  sentences = [], 
  onClose, 
  onSelectSentence,
  onDeleteSentence,      // 单个删除回调
  onBatchDelete,         // 批量删除回调
  currentIndex = 0,
  selectedFile = 'sentences', // 当前选中的文件
  onSentencesChange      // 新增：句子变化时的回调
}) => {
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'desc' });
  const [expandedId, setExpandedId] = useState(null);
  const [closeButtonHover, setCloseButtonHover] = useState(false);
  const [refreshButtonHover, setRefreshButtonHover] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); // 选中的句子ID
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localSentences, setLocalSentences] = useState(sentences); // 本地句子状态

  // 当外部sentences变化时更新本地状态
  React.useEffect(() => {
    setLocalSentences(sentences);
  }, [sentences]);

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 刷新句子数据...');
      
      // 调用 API 重新获取数据
      const result = await sentenceApi.getSentences(selectedFile);
      
      if (result?.sentences) {
        const sentencesArray = Object.entries(result.sentences).map(([id, data]) => ({ id, ...data }));
        setLocalSentences(sentencesArray);
        
        // 清空选中状态
        setSelectedIds([]);
        setDeleteConfirmId(null);
        
        message.success(`刷新成功！共 ${sentencesArray.length} 个句子`);
        
        // 如果传入了 onSentencesChange 回调，调用它
        if (onSentencesChange) {
          onSentencesChange();
        }
      } else {
        throw new Error('数据格式错误');
      }
    } catch (error) {
      console.error('刷新失败:', error);
      message.error('刷新失败：' + (error.message || '未知错误'));
    } finally {
      setRefreshing(false);
    }
  };

  // 排序函数
  const getSortedSentences = (sentencesToSort) => {
    const sorted = [...sentencesToSort];
    const { key, direction } = sortConfig;
    
    sorted.sort((a, b) => {
      let aValue, bValue;
      
      switch(key) {
        case 'text':
          aValue = a.text || '';
          bValue = b.text || '';
          break;
        case 'chinese':
          aValue = a.chinese || '';
          bValue = b.chinese || '';
          break;
        case 'extraction':
          aValue = a.extraction_count || 0;
          bValue = b.extraction_count || 0;
          break;
        case 'correct':
          aValue = a.correct_count || 0;
          bValue = b.correct_count || 0;
          break;
        case 'wrong':
          aValue = a.wrong_count || 0;
          bValue = b.wrong_count || 0;
          break;
        case 'pass':
          aValue = a.pass ? 1 : 0;
          bValue = b.pass ? 1 : 0;
          break;
        case 'time':
          aValue = new Date(a.time || 0).getTime();
          bValue = new Date(b.time || 0).getTime();
          break;
        case 'last_answer':
          aValue = a.last_answer_time ? new Date(a.last_answer_time).getTime() : 0;
          bValue = b.last_answer_time ? new Date(b.last_answer_time).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  // 过滤句子
  const getFilteredSentences = () => {
    let filtered = [...localSentences];
    
    if (filter === 'mastered') {
      filtered = filtered.filter(s => s.pass === true);
    } else if (filter === 'unmastered') {
      filtered = filtered.filter(s => s.pass !== true);
    }
    
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(s => 
        s.text?.toLowerCase().includes(search) || 
        s.chinese?.toLowerCase().includes(search)
      );
    }
    
    return getSortedSentences(filtered);
  };

  // 处理标题点击排序
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 获取排序图标
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '从未';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化最新回答时间
  const formatLastAnswerDate = (dateStr) => {
    if (!dateStr) return '从未';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 计算胜率
  const calculateWinRate = (correct, wrong) => {
    const total = correct + wrong;
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  // 获取掌握程度的颜色
  const getMasteryColor = (pass) => {
    return pass ? '#4CAF50' : '#FF9800';
  };

  // 处理单个删除
  const handleDeleteClick = (sentenceId, event) => {
    event.stopPropagation(); // 阻止事件冒泡
    setDeleteConfirmId(sentenceId);
  };

  const confirmDelete = async (sentenceId, event) => {
    event.stopPropagation(); // 阻止事件冒泡
    
    setLoading(true);
    try {
      console.log('确认删除句子:', sentenceId, '文件:', selectedFile);
      
      // 直接调用 API 删除
      const response = await sentenceApi.deleteSentence(sentenceId, selectedFile);
      console.log('删除API响应:', response);
      
      if (response && response.flag === 1) {
        // 更新本地状态 - 移除被删除的句子
        setLocalSentences(prev => prev.filter(s => s.id !== sentenceId));
        
        // 如果传入了 onDeleteSentence 回调，也调用它
        if (onDeleteSentence) {
          await onDeleteSentence(sentenceId, selectedFile);
        }
        
        // 如果传入了 onSentencesChange 回调，调用它
        if (onSentencesChange) {
          onSentencesChange();
        }
        
        message.success('句子删除成功');
        setDeleteConfirmId(null);
      } else {
        throw new Error(response?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = (event) => {
    if (event) event.stopPropagation();
    setDeleteConfirmId(null);
  };

  // 处理批量选择
  const toggleSelect = (sentenceId, event) => {
    event.stopPropagation(); // 阻止事件冒泡
    setSelectedIds(prev => {
      if (prev.includes(sentenceId)) {
        return prev.filter(id => id !== sentenceId);
      } else {
        return [...prev, sentenceId];
      }
    });
  };

  const toggleSelectAll = (event) => {
    event.stopPropagation(); // 阻止事件冒泡
    const filteredIds = filteredSentences.map(s => s.id);
    if (selectedIds.length === filteredIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIds);
    }
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setShowBatchDeleteConfirm(true);
  };

  const confirmBatchDelete = async () => {
    setLoading(true);
    try {
      console.log('确认批量删除句子:', selectedIds, '文件:', selectedFile);
      
      // 直接调用 API 批量删除
      const response = await sentenceApi.batchDeleteSentences(selectedIds, selectedFile);
      console.log('批量删除API响应:', response);
      
      if (response && response.flag === 1) {
        // 更新本地状态 - 移除所有被删除的句子
        setLocalSentences(prev => prev.filter(s => !selectedIds.includes(s.id)));
        
        // 如果传入了 onBatchDelete 回调，也调用它
        if (onBatchDelete) {
          await onBatchDelete(selectedIds, selectedFile);
        }
        
        // 如果传入了 onSentencesChange 回调，调用它
        if (onSentencesChange) {
          onSentencesChange();
        }
        
        message.success(`成功删除 ${selectedIds.length} 个句子`);
        setSelectedIds([]);
        setShowBatchDeleteConfirm(false);
      } else {
        throw new Error(response?.message || '批量删除失败');
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error('批量删除失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const cancelBatchDelete = () => {
    setShowBatchDeleteConfirm(false);
  };

  const filteredSentences = getFilteredSentences();
  const masteredCount = localSentences.filter(s => s.pass === true).length;
  const unmasteredCount = localSentences.length - masteredCount;

  // 切换展开行
  const toggleExpand = (id, event) => {
    event.stopPropagation(); // 阻止事件冒泡
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* 头部 */}
        <div style={styles.header}>
          <h2 style={styles.title}>📚 句子库查看器</h2>
          <div style={styles.headerActions}>
            {/* 刷新按钮 */}
            <button 
              onClick={handleRefresh}
              onMouseEnter={() => setRefreshButtonHover(true)}
              onMouseLeave={() => setRefreshButtonHover(false)}
              style={{
                ...styles.refreshButton,
                backgroundColor: refreshButtonHover ? '#1976D2' : '#2196F3',
                opacity: refreshing ? 0.6 : 1,
                cursor: refreshing ? 'not-allowed' : 'pointer'
              }}
              disabled={refreshing}
              title="刷新数据"
            >
              {refreshing ? '🔄 刷新中...' : '🔄 刷新'}
            </button>
            
            {/* 批量删除按钮 */}
            {selectedIds.length > 0 && (
              <button 
                onClick={handleBatchDelete}
                style={styles.batchDeleteButton}
                disabled={loading}
              >
                🗑️ 批量删除 ({selectedIds.length})
              </button>
            )}
            <button 
              onClick={onClose}
              onMouseEnter={() => setCloseButtonHover(true)}
              onMouseLeave={() => setCloseButtonHover(false)}
              style={{
                ...styles.closeButton,
                backgroundColor: closeButtonHover ? '#f44336' : '#e0e0e0',
                color: closeButtonHover ? 'white' : '#666'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 搜索和过滤栏 */}
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="搜索英文或中文..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={styles.searchInput}
          />
          
          <div style={styles.filterGroup}>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.select}>
              <option value="all">全部句子 ({localSentences.length})</option>
              <option value="mastered">已掌握 ({masteredCount})</option>
              <option value="unmastered">未掌握 ({unmasteredCount})</option>
            </select>
          </div>
        </div>

        {/* 统计卡片 */}
        <div style={styles.statsRow}>
          <div style={{...styles.statCard, backgroundColor: '#2196F3'}}>
            <div style={styles.statLabel}>总数</div>
            <div style={styles.statValue}>{localSentences.length}</div>
          </div>
          <div style={{...styles.statCard, backgroundColor: '#4CAF50'}}>
            <div style={styles.statLabel}>已掌握</div>
            <div style={styles.statValue}>{masteredCount}</div>
          </div>
          <div style={{...styles.statCard, backgroundColor: '#FF9800'}}>
            <div style={styles.statLabel}>未掌握</div>
            <div style={styles.statValue}>{unmasteredCount}</div>
          </div>
        </div>

        {/* 列表头部 - 可点击排序 */}
        <div style={styles.listHeader}>
          <div style={styles.headerCheckbox}>
            <input 
              type="checkbox"
              checked={selectedIds.length === filteredSentences.length && filteredSentences.length > 0}
              onChange={toggleSelectAll}
              onClick={(e) => e.stopPropagation()}
              style={styles.checkbox}
            />
          </div>
          <div style={styles.headerExpand}></div>
          <div 
            style={styles.headerText} 
            onClick={() => handleSort('text')}
          >
            英文 {getSortIcon('text')}
          </div>
          <div 
            style={styles.headerText} 
            onClick={() => handleSort('chinese')}
          >
            中文 {getSortIcon('chinese')}
          </div>
          <div 
            style={styles.headerStats} 
            onClick={() => handleSort('extraction')}
          >
            抽取 {getSortIcon('extraction')}
          </div>
          <div 
            style={styles.headerStats} 
            onClick={() => handleSort('correct')}
          >
            正确 {getSortIcon('correct')}
          </div>
          <div 
            style={styles.headerStats} 
            onClick={() => handleSort('wrong')}
          >
            错误 {getSortIcon('wrong')}
          </div>
          <div 
            style={styles.headerStats} 
            onClick={() => handleSort('pass')}
          >
            掌握 {getSortIcon('pass')}
          </div>
          <div 
            style={styles.headerStats} 
            onClick={() => handleSort('time')}
          >
            创建时间 {getSortIcon('time')}
          </div>
          <div 
            style={styles.headerStats} 
            onClick={() => handleSort('last_answer')}
          >
            最新回答 {getSortIcon('last_answer')}
          </div>
          <div style={styles.headerAction}>操作</div>
        </div>

        {/* 句子列表 */}
        <div style={styles.list}>
          {filteredSentences.length > 0 ? filteredSentences.map((sentence, index) => {
            const winRate = calculateWinRate(sentence.correct_count || 0, sentence.wrong_count || 0);
            const isExpanded = expandedId === sentence.id;
            const isSelected = selectedIds.includes(sentence.id);
            const isDeleting = deleteConfirmId === sentence.id;
            
            return (
              <div key={sentence.id} style={styles.itemWrapper}>
                {/* 主行 */}
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
                      onChange={(e) => toggleSelect(sentence.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      style={styles.checkbox}
                    />
                  </div>
                  <div style={styles.itemExpand}>
                    <button 
                      onClick={(e) => toggleExpand(sentence.id, e)}
                      style={styles.expandButton}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                  <div style={styles.itemText} title={sentence.text}>
                    {sentence.text?.length > 40 ? sentence.text.substring(0, 40) + '...' : sentence.text}
                  </div>
                  <div style={styles.itemText} title={sentence.chinese}>
                    {sentence.chinese?.length > 20 ? sentence.chinese.substring(0, 20) + '...' : sentence.chinese}
                  </div>
                  <div style={styles.itemStats}>{sentence.extraction_count || 0}</div>
                  <div style={{...styles.itemStats, color: '#4CAF50'}}>{sentence.correct_count || 0}</div>
                  <div style={{...styles.itemStats, color: '#f44336'}}>{sentence.wrong_count || 0}</div>
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
                      {sentence.last_answer_time ? formatLastAnswerDate(sentence.last_answer_time) : '从未'}
                    </span>
                  </div>
                  <div style={styles.itemAction}>
                    {isDeleting ? (
                      <div style={styles.deleteConfirm}>
                        <button 
                          onClick={(e) => confirmDelete(sentence.id, e)}
                          style={styles.confirmButton}
                          disabled={loading}
                        >
                          确认
                        </button>
                        <button 
                          onClick={cancelDelete}
                          style={styles.cancelButton}
                          disabled={loading}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => handleDeleteClick(sentence.id, e)}
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
                      {/* 完整信息 */}
                      <div style={styles.detailSection}>
                        <h4 style={styles.sectionTitle}>📖 完整内容</h4>
                        <div style={styles.detailText}><strong>英文：</strong>{sentence.text}</div>
                        <div style={styles.detailText}><strong>中文：</strong>{sentence.chinese}</div>
                        <div style={styles.detailText}><strong>ID：</strong>{sentence.id}</div>
                        <div style={styles.detailText}><strong>创建时间：</strong>{formatDate(sentence.time)}</div>
                        <div style={styles.detailText}><strong>最新回答：</strong>{sentence.last_answer_time ? formatLastAnswerDate(sentence.last_answer_time) : '从未'}</div>
                      </div>

                      {/* 统计信息 */}
                      <div style={styles.detailSection}>
                        <h4 style={styles.sectionTitle}>📊 统计信息</h4>
                        <div style={styles.statsGrid}>
                          <div style={styles.statItem}>
                            <span style={styles.statLabel}>抽取次数</span>
                            <span style={styles.statNumber}>{sentence.extraction_count || 0}</span>
                          </div>
                          <div style={styles.statItem}>
                            <span style={styles.statLabel}>正确次数</span>
                            <span style={{...styles.statNumber, color: '#4CAF50'}}>{sentence.correct_count || 0}</span>
                          </div>
                          <div style={styles.statItem}>
                            <span style={styles.statLabel}>错误次数</span>
                            <span style={{...styles.statNumber, color: '#f44336'}}>{sentence.wrong_count || 0}</span>
                          </div>
                          <div style={styles.statItem}>
                            <span style={styles.statLabel}>胜率</span>
                            <span style={{
                              ...styles.statNumber,
                              color: winRate >= 80 ? '#4CAF50' : winRate >= 60 ? '#FF9800' : '#f44336'
                            }}>
                              {winRate}%
                            </span>
                          </div>
                          <div style={styles.statItem}>
                            <span style={styles.statLabel}>掌握状态</span>
                            <span style={{
                              ...styles.statNumber,
                              color: sentence.pass ? '#4CAF50' : '#FF9800'
                            }}>
                              {sentence.pass ? '已掌握' : '未掌握'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div style={styles.actionSection}>
                        <button 
                          onClick={() => {
                            if (onSelectSentence) {
                              const index = localSentences.findIndex(s => s.id === sentence.id);
                              if (index !== -1) {
                                onSelectSentence(index);
                                onClose();
                              }
                            }
                          }}
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
          }) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</div>
              <div>没有找到匹配的句子</div>
            </div>
          )}
        </div>

        {/* 底部统计 */}
        <div style={styles.footer}>
          <div style={styles.footerText}>
            显示 {filteredSentences.length} 条 / 共 {localSentences.length} 条
            {selectedIds.length > 0 && ` | 已选中 ${selectedIds.length} 条`}
          </div>
          <div style={styles.footerText}>
            当前排序: {
              sortConfig.key === 'text' ? '英文' :
              sortConfig.key === 'chinese' ? '中文' :
              sortConfig.key === 'extraction' ? '抽取次数' :
              sortConfig.key === 'correct' ? '正确次数' :
              sortConfig.key === 'wrong' ? '错误次数' :
              sortConfig.key === 'pass' ? '掌握状态' :
              sortConfig.key === 'time' ? '创建时间' : '最新回答'
            } {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </div>
          {currentIndex !== undefined && (
            <div style={styles.footerText}>
              当前正在练习: 第 {currentIndex + 1} 题
            </div>
          )}
        </div>
      </div>

      {/* 批量删除确认弹窗 */}
      {showBatchDeleteConfirm && (
        <div style={styles.confirmOverlay} onClick={cancelBatchDelete}>
          <div style={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>确认批量删除</h3>
            <p style={styles.confirmText}>
              确定要删除选中的 {selectedIds.length} 个句子吗？此操作不可恢复。
            </p>
            <div style={styles.confirmActions}>
              <button 
                onClick={confirmBatchDelete}
                style={styles.confirmDeleteButton}
                disabled={loading}
              >
                {loading ? '删除中...' : '确认删除'}
              </button>
              <button 
                onClick={cancelBatchDelete}
                style={styles.confirmCancelButton}
                disabled={loading}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== 样式 ====================
const styles = {
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
    maxWidth: '1400px',
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
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#1976D2'
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
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
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#d32f2f'
    }
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
    outline: 'none',
    ':focus': {
      borderColor: '#2196F3'
    }
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
    fontSize: '13px',
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
    minWidth: '150px',
    cursor: 'pointer',
    ':hover': {
      color: '#2196F3'
    }
  },
  headerStats: {
    width: '90px',
    textAlign: 'center',
    cursor: 'pointer',
    ':hover': {
      color: '#2196F3'
    }
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
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f0f0f0'
    }
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
    justifyContent: 'center',
    ':hover': {
      color: '#2196F3'
    }
  },
  itemText: {
    flex: 2,
    minWidth: '150px',
    fontSize: '14px',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 8px'
  },
  itemStats: {
    width: '90px',
    textAlign: 'center',
    fontSize: '14px',
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
    fontSize: '12px',
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
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f44336',
      color: 'white'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
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
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#d32f2f'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  cancelButton: {
    padding: '4px 8px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#757575'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  expandedContent: {
    backgroundColor: '#f5f5f5',
    padding: '20px 24px 20px 114px',
    borderBottom: '1px solid #e0e0e0'
  },
  expandedGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 200px',
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
    fontSize: '16px',
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
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#1976D2'
    }
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
    fontSize: '13px',
    color: '#666'
  },
  // 确认弹窗样式
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
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#d32f2f'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  confirmCancelButton: {
    padding: '10px 20px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#757575'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  }
};

export default SentenceViewer;