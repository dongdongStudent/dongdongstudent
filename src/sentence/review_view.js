// review_view.js - 句子查看器主组件
import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { sentenceApi } from './api';
import { styles, injectAnimationStyles } from './components/SentenceViewer/styles';
import { recalculateAllMastery, getSortedSentences } from './components/SentenceViewer/helpers';
import ModeSelectModal from './components/SentenceViewer/ModeSelectModal';
import DeleteConfirmModal from './components/SentenceViewer/DeleteConfirmModal';
import StatsCards from './components/SentenceViewer/StatsCards';
import FilterBar from './components/SentenceViewer/FilterBar';
import SentenceList from './components/SentenceViewer/SentenceList';

// 注入动画样式
injectAnimationStyles();

const SentenceViewer = ({ 
  sentences = [], 
  onClose, 
  onSelectSentence,
  onSelectSentencesForTest,
  onDeleteSentence,
  onBatchDelete,
  currentIndex = 0,
  selectedFile = 'sentences',
  onSentencesChange
}) => {
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'desc' });
  const [expandedId, setExpandedId] = useState(null);
  const [closeButtonHover, setCloseButtonHover] = useState(false);
  const [refreshButtonHover, setRefreshButtonHover] = useState(false);
  const [recalcButtonHover, setRecalcButtonHover] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [pendingSelectedSentences, setPendingSelectedSentences] = useState([]);
  
  const [localSentences, setLocalSentences] = useState(() => {
    return recalculateAllMastery(sentences);
  });

  useEffect(() => {
    setLocalSentences(recalculateAllMastery(sentences));
  }, [sentences]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await sentenceApi.getSentences(selectedFile);
      
      if (result?.sentences) {
        let sentencesArray = Object.entries(result.sentences).map(([id, data]) => ({ id, ...data }));
        sentencesArray = recalculateAllMastery(sentencesArray);
        
        setLocalSentences(sentencesArray);
        setSelectedIds([]);
        setDeleteConfirmId(null);
        
        const masteredCount = sentencesArray.filter(s => s.pass).length;
        const spellingMastered = sentencesArray.filter(s => s.spelling_pass).length;
        const listeningMastered = sentencesArray.filter(s => s.listening_pass).length;
        message.success(`刷新成功！共 ${sentencesArray.length} 个句子（综合掌握: ${masteredCount}，拼写掌握: ${spellingMastered}，听力掌握: ${listeningMastered}）`);
        
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

  const handleRecalculateMastery = () => {
    setRecalculating(true);
    
    setTimeout(() => {
      const recalculated = recalculateAllMastery(localSentences);
      setLocalSentences(recalculated);
      
      const newlyMastered = recalculated.filter(s => {
        const oldSentence = localSentences.find(old => old.id === s.id);
        return s.pass && (!oldSentence || !oldSentence.pass);
      }).length;
      
      const lostMastered = recalculated.filter(s => {
        const oldSentence = localSentences.find(old => old.id === s.id);
        return !s.pass && oldSentence && oldSentence.pass;
      }).length;
      
      if (newlyMastered > 0 && lostMastered > 0) {
        message.info(`重新计算完成：+${newlyMastered} 掌握，-${lostMastered} 未掌握`);
      } else if (newlyMastered > 0) {
        message.success(`🎉 重新计算完成！新增 ${newlyMastered} 个句子达到掌握标准`);
      } else if (lostMastered > 0) {
        message.warning(`重新计算完成：${lostMastered} 个句子不再满足掌握标准`);
      } else {
        message.info('重新计算完成，掌握状态无变化');
      }
      
      setRecalculating(false);
    }, 100);
  };

  const handleTestSelected = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择要测试的句子');
      return;
    }
    
    const selectedSentences = localSentences.filter(s => selectedIds.includes(s.id));
    setPendingSelectedSentences(selectedSentences);
    setShowModeSelect(true);
  };

  const confirmTestWithMode = (mode) => {
    if (onSelectSentencesForTest) {
      onSelectSentencesForTest(pendingSelectedSentences, mode);
      onClose();
    }
    setShowModeSelect(false);
    setPendingSelectedSentences([]);
  };

  const cancelTest = () => {
    setShowModeSelect(false);
    setPendingSelectedSentences([]);
  };

  const handleDeleteClick = (sentenceId) => {
    setDeleteConfirmId(sentenceId);
  };

  const confirmDelete = async (sentenceId) => {
    setLoading(true);
    try {
      const response = await sentenceApi.deleteSentence(sentenceId, selectedFile);
      
      if (response && response.flag === 1) {
        setLocalSentences(prev => prev.filter(s => s.id !== sentenceId));
        
        if (onDeleteSentence) {
          await onDeleteSentence(sentenceId, selectedFile);
        }
        
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

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setShowBatchDeleteConfirm(true);
  };

  const confirmBatchDelete = async () => {
    setLoading(true);
    try {
      const response = await sentenceApi.batchDeleteSentences(selectedIds, selectedFile);
      
      if (response && response.flag === 1) {
        setLocalSentences(prev => prev.filter(s => !selectedIds.includes(s.id)));
        
        if (onBatchDelete) {
          await onBatchDelete(selectedIds, selectedFile);
        }
        
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

  // 过滤和排序
  const getFilteredSentences = () => {
    let filtered = [...localSentences];
    
    if (filter === 'mastered') {
      filtered = filtered.filter(s => s.pass === true);
    } else if (filter === 'unmastered') {
      filtered = filtered.filter(s => s.pass !== true);
    } else if (filter === 'spelling_mastered') {
      filtered = filtered.filter(s => s.spelling_pass === true);
    } else if (filter === 'listening_mastered') {
      filtered = filtered.filter(s => s.listening_pass === true);
    }
    
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(s => 
        s.text?.toLowerCase().includes(search) || 
        s.chinese?.toLowerCase().includes(search)
      );
    }
    
    return getSortedSentences(filtered, sortConfig);
  };

  const filteredSentences = getFilteredSentences();
  const masteredCount = localSentences.filter(s => s.pass === true).length;
  const spellingMasteredCount = localSentences.filter(s => s.spelling_pass === true).length;
  const listeningMasteredCount = localSentences.filter(s => s.listening_pass === true).length;
  const unmasteredCount = localSentences.length - masteredCount;

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const handleJumpToSentence = (index) => {
    if (onSelectSentence && index !== -1) {
      onSelectSentence(index);
      onClose();
    }
  };

  const getSortKeyName = () => {
    const names = {
      text: '英文',
      chinese: '中文',
      extraction: '抽取次数',
      correct: '总正确次数',
      wrong: '总错误次数',
      spelling_correct: '拼写正确',
      spelling_wrong: '拼写错误',
      listening_correct: '听力正确',
      listening_wrong: '听力错误',
      pass: '掌握状态',
      time: '创建时间',
      last_answer: '最新回答'
    };
    return names[sortConfig.key] || sortConfig.key;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>📚 句子库查看器</h2>
          <div style={styles.headerActions}>
            <button 
              onClick={handleRecalculateMastery}
              onMouseEnter={() => setRecalcButtonHover(true)}
              onMouseLeave={() => setRecalcButtonHover(false)}
              style={{
                ...styles.recalcButton,
                backgroundColor: recalcButtonHover ? '#7c3aed' : '#8b5cf6',
                opacity: recalculating ? 0.6 : 1,
                cursor: recalculating ? 'not-allowed' : 'pointer'
              }}
              disabled={recalculating}
              title="根据正确率重新计算掌握状态"
            >
              {recalculating ? '🔄 计算中...' : '🔄 重新计算掌握'}
            </button>
            
            {selectedIds.length > 0 && (
              <button 
                onClick={handleTestSelected}
                style={styles.testButton}
                title="测试选中的句子"
              >
                🎯 测试选中 ({selectedIds.length})
              </button>
            )}
            
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
              title="从服务器刷新数据"
            >
              {refreshing ? '🔄 刷新中...' : '🔄 刷新'}
            </button>
            
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

        <FilterBar
          searchText={searchText}
          onSearchChange={setSearchText}
          filter={filter}
          onFilterChange={setFilter}
          totalCount={localSentences.length}
          masteredCount={masteredCount}
          unmasteredCount={unmasteredCount}
          spellingMasteredCount={spellingMasteredCount}
          listeningMasteredCount={listeningMasteredCount}
        />

        <StatsCards
          totalCount={localSentences.length}
          masteredCount={masteredCount}
          spellingMasteredCount={spellingMasteredCount}
          listeningMasteredCount={listeningMasteredCount}
        />

        <SentenceList
          sentences={filteredSentences}
          sortConfig={sortConfig}
          onSort={handleSort}
          selectedIds={selectedIds}
          expandedId={expandedId}
          deleteConfirmId={deleteConfirmId}
          loading={loading}
          onToggleSelect={setSelectedIds}
          onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
          onDeleteClick={handleDeleteClick}
          onConfirmDelete={confirmDelete}
          onCancelDelete={cancelDelete}
          onJumpToSentence={handleJumpToSentence}
        />

        <div style={styles.footer}>
          <div style={styles.footerText}>
            显示 {filteredSentences.length} 条 / 共 {localSentences.length} 条
            {selectedIds.length > 0 && ` | 已选中 ${selectedIds.length} 条`}
          </div>
          <div style={styles.footerText}>
            当前排序: {getSortKeyName()} {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </div>
          <div style={styles.footerText}>
            💡 综合掌握判定：拼写模式或听力模式任一满足（回答次数 ≥ 3 且 正确率 ≥ 80%）
          </div>
          {currentIndex !== undefined && (
            <div style={styles.footerText}>
              当前正在练习: 第 {currentIndex + 1} 题
            </div>
          )}
        </div>
      </div>

      {showModeSelect && (
        <ModeSelectModal
          count={pendingSelectedSentences.length}
          onConfirm={confirmTestWithMode}
          onCancel={cancelTest}
        />
      )}

      {showBatchDeleteConfirm && (
        <DeleteConfirmModal
          count={selectedIds.length}
          loading={loading}
          onConfirm={confirmBatchDelete}
          onCancel={cancelBatchDelete}
        />
      )}
    </div>
  );
};

export default SentenceViewer;