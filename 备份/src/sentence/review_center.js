import React, { useState, useEffect } from 'react';
import { sentenceApi } from './api';
import { addGlobalStyles } from './utils';
import SentenceTest from './review_test';
import SentenceViewer from './review_view';
import AddSentenceModal from './AddSentenceModal';

// ==================== 结算界面组件 ====================
const ResultSummary = ({ testSentences, results, onRestart, onNewExtract }) => {
  // 计算统计数据
  const totalCount = testSentences.length;
  const correctCount = results.filter(r => r.isCorrect).length;
  const wrongCount = results.filter(r => !r.isCorrect).length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const isPerfect = correctCount === totalCount && totalCount > 0;
  
  // 按掌握状态分组
  const masteredInTest = testSentences.filter(s => s.pass).length;
  const unmasteredInTest = testSentences.filter(s => !s.pass).length;
  const masteredCorrect = results.filter((r, i) => r.isCorrect && testSentences[i].pass).length;
  const unmasteredCorrect = results.filter((r, i) => r.isCorrect && !testSentences[i].pass).length;

  // 全对奖品效果
  const [showFireworks, setShowFireworks] = useState(isPerfect);

  useEffect(() => {
    if (isPerfect) {
      const timer = setTimeout(() => setShowFireworks(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isPerfect]);

  return (
    <div style={resultStyles.overlay}>
      {/* 全对黄金奖品 */}
      {isPerfect && showFireworks && (
        <>
          <div style={prizeStyles.confetti}>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                style={{
                  ...prizeStyles.confettiPiece,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: `hsl(${Math.random() * 60 + 30}, 100%, 50%)`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`
                }}
              />
            ))}
          </div>
          <div style={prizeStyles.goldPrize}>
            <div style={prizeStyles.trophy}>🏆</div>
            <div style={prizeStyles.goldText}>完美全对！</div>
            <div style={prizeStyles.goldSubtext}>获得黄金奖杯</div>
          </div>
        </>
      )}

      <div style={resultStyles.container}>
        <div style={resultStyles.header}>
          <span style={resultStyles.title}>
            {isPerfect ? '🎉 完美通关！' : '📊 测试完成'}
          </span>
          <span style={{
            ...resultStyles.score,
            color: isPerfect ? '#FFD700' : '#8b5cf6',
            textShadow: isPerfect ? '0 0 10px rgba(255,215,0,0.5)' : 'none'
          }}>
            {accuracy}%
          </span>
        </div>

        {/* 总体统计 */}
        <div style={resultStyles.statsGrid}>
          <div style={resultStyles.statCard}>
            <div style={resultStyles.statLabel}>总题数</div>
            <div style={resultStyles.statValue}>{totalCount}</div>
          </div>
          <div style={resultStyles.statCard}>
            <div style={resultStyles.statLabel}>正确</div>
            <div style={{...resultStyles.statValue, color: '#4CAF50'}}>{correctCount}</div>
          </div>
          <div style={resultStyles.statCard}>
            <div style={resultStyles.statLabel}>错误</div>
            <div style={{...resultStyles.statValue, color: '#f44336'}}>{wrongCount}</div>
          </div>
          <div style={resultStyles.statCard}>
            <div style={resultStyles.statLabel}>正确率</div>
            <div style={{
              ...resultStyles.statValue,
              color: isPerfect ? '#FFD700' : (accuracy >= 80 ? '#4CAF50' : accuracy >= 60 ? '#FF9800' : '#f44336')
            }}>
              {accuracy}%
              {isPerfect && <span style={prizeStyles.goldStar}>⭐</span>}
            </div>
          </div>
        </div>

        {/* 详细统计 */}
        <div style={resultStyles.detailSection}>
          <div style={resultStyles.detailTitle}>📈 详细统计</div>
          <div style={resultStyles.detailRow}>
            <span>已掌握句子数：</span>
            <span style={resultStyles.detailValue}>{masteredInTest}</span>
          </div>
          <div style={resultStyles.detailRow}>
            <span>未掌握句子数：</span>
            <span style={resultStyles.detailValue}>{unmasteredInTest}</span>
          </div>
          <div style={resultStyles.detailRow}>
            <span>已掌握正确：</span>
            <span style={{...resultStyles.detailValue, color: '#4CAF50'}}>{masteredCorrect}</span>
          </div>
          <div style={resultStyles.detailRow}>
            <span>未掌握正确：</span>
            <span style={{...resultStyles.detailValue, color: '#FF9800'}}>{unmasteredCorrect}</span>
          </div>
        </div>

        {/* 错题列表 */}
        {wrongCount > 0 && (
          <div style={resultStyles.wrongSection}>
            <div style={resultStyles.wrongTitle}>❌ 错题回顾</div>
            <div style={resultStyles.wrongList}>
              {results.map((result, index) => {
                if (!result.isCorrect) {
                  return (
                    <div key={index} style={resultStyles.wrongItem}>
                      <div style={resultStyles.wrongNumber}>{index + 1}.</div>
                      <div style={resultStyles.wrongContent}>
                        <div style={resultStyles.wrongText}>{testSentences[index].text}</div>
                        <div style={resultStyles.wrongChinese}>{testSentences[index].chinese}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* 全对额外显示 */}
        {isPerfect && (
          <div style={prizeStyles.perfectMessage}>
            <div style={prizeStyles.perfectEmoji}>🌟🌟🌟</div>
            <div style={prizeStyles.perfectText}>太棒了！全部答对！</div>
            <div style={prizeStyles.perfectSubtext}>你已经完全掌握了这些句子</div>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={resultStyles.actions}>
          <button onClick={onNewExtract} style={resultStyles.extractButton}>
            🎲 重新抽取
          </button>
          <button onClick={onRestart} style={{
            ...resultStyles.restartButton,
            backgroundColor: isPerfect ? '#FFD700' : '#4CAF50',
            color: isPerfect ? '#333' : 'white'
          }}>
            {isPerfect ? '🏆 再拿一冠' : '🔄 再练一次'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== 抽取弹窗组件 ====================
const ExtractModal = ({ onClose, onExtract, allSentences, onSingleSentence }) => {
  const [extractType, setExtractType] = useState('random');
  const [randomCount, setRandomCount] = useState(5);
  const [unmasteredCount, setUnmasteredCount] = useState(5);
  const [customCount, setCustomCount] = useState(5);
  const [singleSentenceId, setSingleSentenceId] = useState('');
  const [loading, setLoading] = useState(false);

  // 统计信息
  const totalCount = allSentences.length;
  const masteredTotal = allSentences.filter(s => s.pass).length;
  const unmasteredTotal = totalCount - masteredTotal;
  const unmasteredSentences = allSentences.filter(s => !s.pass);

  const getCurrentCount = () => {
    switch (extractType) {
      case 'random': return randomCount;
      case 'unmastered': return unmasteredCount;
      case 'custom': return customCount;
      case 'single': return 1;
      default: return 5;
    }
  };

  const getMaxCount = () => {
    switch (extractType) {
      case 'random': return totalCount;
      case 'unmastered': return unmasteredTotal;
      case 'custom': return totalCount;
      case 'single': return 1;
      default: return totalCount;
    }
  };

  const handleSubmit = async () => {
    const count = getCurrentCount();
    const maxCount = getMaxCount();

    if (extractType === 'single') {
      if (!singleSentenceId.trim()) {
        alert('请输入句子ID');
        return;
      }
      
      const sentence = allSentences.find(s => 
        s.id.toString() === singleSentenceId.trim() || 
        s.text.includes(singleSentenceId.trim())
      );
      
      if (!sentence) {
        alert('未找到匹配的句子');
        return;
      }

      onSingleSentence(sentence);
      onClose();
      return;
    }

    if (count < 1 || count > maxCount) {
      alert(`请输入1-${maxCount}之间的数字`);
      return;
    }

    if (extractType === 'unmastered' && unmasteredTotal === 0) {
      alert('🎉 所有句子都已掌握，无法抽取未掌握句子');
      return;
    }

    setLoading(true);
    try {
      let extracted = [];
      let message = '';
      
      switch (extractType) {
        case 'random':
          extracted = [...allSentences].sort(() => Math.random() - 0.5).slice(0, count);
          message = `🎲 随机抽取 ${extracted.length} 个句子`;
          break;
        case 'unmastered':
          extracted = [...unmasteredSentences].sort(() => Math.random() - 0.5).slice(0, count);
          message = `📚 抽取 ${extracted.length} 个未掌握句子`;
          break;
        case 'custom':
          extracted = [...allSentences].sort(() => Math.random() - 0.5).slice(0, count);
          message = `🎯 自定义抽取 ${extracted.length} 个句子`;
          break;
      }
      
      await onExtract(extracted, message);
      onClose();
    } catch (error) {
      alert('抽取失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderExtractInfo = () => {
    const count = getCurrentCount();
    const maxCount = getMaxCount();

    switch (extractType) {
      case 'random':
        return (
          <div style={infoStyles.container}>
            <div style={infoStyles.title}>🎲 随机抽取信息</div>
            <div style={infoStyles.row}>
              <span>抽取数量：</span>
              <span style={infoStyles.value}>{count} / {maxCount} 个</span>
            </div>
            <div style={infoStyles.row}>
              <span>抽取范围：</span>
              <span style={infoStyles.value}>全部 {totalCount} 个句子</span>
            </div>
          </div>
        );

      case 'unmastered':
        return (
          <div style={infoStyles.container}>
            <div style={infoStyles.title}>📚 未掌握句子信息</div>
            <div style={infoStyles.row}>
              <span>抽取数量：</span>
              <span style={{...infoStyles.value, color: '#FF9800', fontSize: '18px'}}>{count} / {unmasteredTotal} 个</span>
            </div>
            <div style={infoStyles.row}>
              <span>未掌握总数：</span>
              <span style={infoStyles.value}>{unmasteredTotal} 个</span>
            </div>
          </div>
        );

      case 'custom':
        return (
          <div style={infoStyles.container}>
            <div style={infoStyles.title}>🎯 自定义抽取信息</div>
            <div style={infoStyles.row}>
              <span>抽取数量：</span>
              <span style={infoStyles.value}>{count} / {totalCount} 个</span>
            </div>
            <div style={infoStyles.row}>
              <span>抽取范围：</span>
              <span style={infoStyles.value}>全部 {totalCount} 个句子</span>
            </div>
            <div style={infoStyles.note}>
              ⚠️ 包含已掌握和未掌握句子
            </div>
          </div>
        );

      case 'single':
        return (
          <div style={infoStyles.container}>
            <div style={infoStyles.title}>🔍 单句练习信息</div>
            <div style={infoStyles.row}>
              <span>句子ID：</span>
              <span style={infoStyles.value}>{singleSentenceId || '未输入'}</span>
            </div>
            <div style={infoStyles.row}>
              <span>可用句子：</span>
              <span style={infoStyles.value}>{totalCount} 个</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.container}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>🎲 抽取句子</h3>
          <button onClick={onClose} style={modalStyles.closeButton}>✕</button>
        </div>

        <div style={modalStyles.content}>
          <div style={modalStyles.field}>
            <label style={modalStyles.radioLabel}>
              <input type="radio" value="random" checked={extractType === 'random'} 
                     onChange={(e) => setExtractType(e.target.value)} />
              🎲 随机抽取
            </label>
            <label style={modalStyles.radioLabel}>
              <input type="radio" value="unmastered" checked={extractType === 'unmastered'} 
                     onChange={(e) => setExtractType(e.target.value)} 
                     disabled={unmasteredTotal === 0} />
              📚 不会的抽取 {unmasteredTotal > 0 ? `(${unmasteredTotal}个可抽)` : '(暂无)'}
            </label>
            <label style={modalStyles.radioLabel}>
              <input type="radio" value="custom" checked={extractType === 'custom'} 
                     onChange={(e) => setExtractType(e.target.value)} />
              🎯 自定义抽取
            </label>
            <label style={{
              ...modalStyles.radioLabel,
              borderTop: '1px solid #e0e0e0',
              marginTop: '8px',
              paddingTop: '12px'
            }}>
              <input type="radio" value="single" checked={extractType === 'single'} 
                     onChange={(e) => setExtractType(e.target.value)} />
              🔍 单句练习
            </label>
          </div>

          {extractType !== 'single' ? (
            <div style={modalStyles.countInputGroup}>
              <span style={modalStyles.countLabel}>抽取数量：</span>
              {extractType === 'random' && (
                <div style={modalStyles.countInputWrapper}>
                  <input 
                    type="number" 
                    min="1" 
                    max={totalCount} 
                    value={randomCount}
                    onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)}
                    style={modalStyles.countInput} 
                  />
                  <span style={modalStyles.maxHint}>/ {totalCount}</span>
                </div>
              )}
              {extractType === 'unmastered' && (
                <div style={modalStyles.countInputWrapper}>
                  <input 
                    type="number" 
                    min="1" 
                    max={unmasteredTotal} 
                    value={unmasteredCount}
                    onChange={(e) => setUnmasteredCount(parseInt(e.target.value) || 1)}
                    style={modalStyles.countInput}
                    disabled={unmasteredTotal === 0} 
                  />
                  <span style={modalStyles.maxHint}>/ {unmasteredTotal}</span>
                </div>
              )}
              {extractType === 'custom' && (
                <div style={modalStyles.countInputWrapper}>
                  <input 
                    type="number" 
                    min="1" 
                    max={totalCount} 
                    value={customCount}
                    onChange={(e) => setCustomCount(parseInt(e.target.value) || 1)}
                    style={modalStyles.countInput} 
                  />
                  <span style={modalStyles.maxHint}>/ {totalCount}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={modalStyles.countInputGroup}>
              <span style={modalStyles.countLabel}>句子ID：</span>
              <div style={modalStyles.countInputWrapper}>
                <input 
                  type="text" 
                  value={singleSentenceId}
                  onChange={(e) => setSingleSentenceId(e.target.value)}
                  placeholder="输入ID或关键词"
                  style={{...modalStyles.countInput, width: '180px'}} 
                />
              </div>
            </div>
          )}

          {renderExtractInfo()}

          <div style={modalStyles.actions}>
            <button onClick={handleSubmit} disabled={loading} style={modalStyles.submitButton}>
              {loading ? '处理中...' : (extractType === 'single' ? '开始练习' : '开始抽取')}
            </button>
            <button onClick={onClose} style={modalStyles.cancelButton}>取消</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 主中心组件 ====================
const SentenceCenter = ({ externalSentences = null }) => {
  const [allSentences, setAllSentences] = useState([]);
  const [testSentences, setTestSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(100);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState('sentences');
  const [availableFiles, setAvailableFiles] = useState([]);
  const [showViewer, setShowViewer] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isProcessingExternal, setIsProcessingExternal] = useState(false);

  // 处理外部传入的句子
  useEffect(() => {
    const processExternalSentences = async () => {
      if (!externalSentences || isProcessingExternal) return;
      
      setIsProcessingExternal(true);
      console.log('📥 接收到外部句子数据:', externalSentences);

      try {
        // 先加载现有句子
        await loadSentences();

        // 处理听懂的句子
        if (externalSentences.understoodSentences?.length > 0) {
          for (const sentence of externalSentences.understoodSentences) {
            await addExternalSentence(sentence, 'mastered');
          }
        }

        // 处理没听懂的句子
        if (externalSentences.difficultSentences?.length > 0) {
          for (const sentence of externalSentences.difficultSentences) {
            await addExternalSentence(sentence, 'difficult');
          }
        }
      } catch (error) {
        console.error('处理外部句子失败:', error);
        setMessage('❌ 处理外部句子失败');
      } finally {
        setIsProcessingExternal(false);
      }
    };

    processExternalSentences();
  }, [externalSentences]);

  // 添加外部句子到服务器
  const addExternalSentence = async (sentence, type) => {
    if (!sentence || !sentence.id) {
      console.error('❌ 无效的句子数据:', sentence);
      return;
    }

    console.log(`📝 添加外部句子 (${type}):`, sentence);

    // 构建发送到服务器的数据
    const sentenceData = {
      id: sentence.id,
      text: sentence.fullText || sentence.text,
      chinese: sentence.chinese || '',
      pass: type === 'mastered',
      correct_count: type === 'mastered' ? 1 : 0,
      wrong_count: type === 'difficult' ? 1 : 0,
      extraction_count: 1,
      source: 'peppa_listening',
      added_at: new Date().toISOString()
    };

    try {
      // 检查句子是否已存在
      const existing = allSentences.find(s => 
        s.text.toLowerCase() === sentenceData.text.toLowerCase()
      );

      let result;
      if (existing) {
        // 更新现有句子
        console.log('🔄 句子已存在，更新状态:', existing.id);
        const updatedData = {
          ...existing,
          pass: type === 'mastered' ? true : existing.pass,
          correct_count: (existing.correct_count || 0) + (type === 'mastered' ? 1 : 0),
          wrong_count: (existing.wrong_count || 0) + (type === 'difficult' ? 1 : 0),
          extraction_count: (existing.extraction_count || 0) + 1
        };
        result = await sentenceApi.updateSentence(selectedFile, existing.id, updatedData);
      } else {
        // 添加新句子
        console.log('➕ 添加新句子');
        result = await sentenceApi.addSentence(selectedFile, sentenceData);
      }

      if (result?.flag === 1) {
        console.log(`✅ 句子处理成功: ${sentenceData.text}`);
        setMessage(`✅ 已添加: ${sentenceData.text}`);
        // 重新加载句子列表
        await loadSentences();
      } else {
        console.error('❌ 句子处理失败:', result?.message);
      }
    } catch (error) {
      console.error('❌ 添加句子异常:', error);
    }
  };

  useEffect(() => {
    addGlobalStyles();
    loadFileList();
  }, []);

  const loadFileList = async () => {
    try {
      const result = await sentenceApi.getSentenceFiles();
      if (result.flag === 1) setAvailableFiles(result.content.files);
    } catch (error) {
      console.error('加载文件列表失败:', error);
    }
  };

  const loadSentences = async () => {
    setLoading(true);
    setMessage('加载中...');
    
    try {
      const result = await sentenceApi.getSentences(selectedFile);
      
      if (result?.sentences) {
        const sentencesArray = Object.entries(result.sentences).map(([id, data]) => ({ id, ...data }));
        setAllSentences(sentencesArray);
        setTestSentences([]);
        setTestResults([]);
        setCurrentIndex(0);
        setScore(100);
        setShowResult(false);
        setLoaded(true);
        
        const mastered = sentencesArray.filter(s => s.pass).length;
        const unmastered = sentencesArray.length - mastered;
        setMessage(`✅ 加载成功：共 ${sentencesArray.length} 个句子（已掌握 ${mastered}，未掌握 ${unmastered}）`);
        return sentencesArray;
      } else {
        setMessage('❌ 加载失败：数据格式错误');
      }
    } catch (error) {
      setMessage('❌ 加载失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSentence = async (sentenceData) => {
    try {
      const result = await sentenceApi.addSentence(selectedFile, sentenceData);
      
      if (result.flag === 1) {
        setAllSentences(prev => [...prev, sentenceData]);
        setMessage(`✅ 句子添加成功：${sentenceData.text}`);
        loadFileList();
        return result;
      } else {
        throw new Error(result.message || '添加失败');
      }
    } catch (error) {
      console.error('添加句子失败:', error);
      throw error;
    }
  };

  const handleExtract = (extracted, extractMessage) => {
    setTestSentences(extracted);
    setTestResults([]);
    setCurrentIndex(0);
    setScore(100);
    setShowResult(false);
    setMessage(extractMessage + '，开始测试！');
  };

  const handleSingleSentence = (sentence) => {
    setTestSentences([sentence]);
    setTestResults([]);
    setCurrentIndex(0);
    setScore(100);
    setShowResult(false);
    setMessage(`🔍 单句练习：${sentence.text}`);
  };

  const handleComplete = (isCorrect) => {
    const newResult = {
      sentenceId: testSentences[currentIndex].id,
      isCorrect: isCorrect
    };
    
    const updatedResults = [...testResults, newResult];
    setTestResults(updatedResults);

    const updatedSentences = allSentences.map(s => {
      if (s.id === testSentences[currentIndex].id) {
        return {
          ...s,
          pass: isCorrect ? true : s.pass,
          correct_count: (s.correct_count || 0) + (isCorrect ? 1 : 0),
          wrong_count: (s.wrong_count || 0) + (isCorrect ? 0 : 1),
          extraction_count: (s.extraction_count || 0) + 1
        };
      }
      return s;
    });
    
    setAllSentences(updatedSentences);

    if (currentIndex < testSentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(100);
    setTestResults([]);
    setShowResult(false);
  };

  const handleNewExtract = () => {
    setShowExtractModal(true);
    setShowResult(false);
  };

  const currentSentence = testSentences[currentIndex];
  const masteredCount = allSentences.filter(s => s.pass).length;
  const unmasteredCount = allSentences.length - masteredCount;

  const totalExtractions = allSentences.reduce((sum, s) => sum + (s.extraction_count || 0), 0);
  const totalCorrect = allSentences.reduce((sum, s) => sum + (s.correct_count || 0), 0);
  const totalWrong = allSentences.reduce((sum, s) => sum + (s.wrong_count || 0), 0);
  const overallAccuracy = totalExtractions > 0 ? Math.round((totalCorrect / totalExtractions) * 100) : 0;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📝 句子听力测试</h1>
      
      {/* 控制栏 */}
      <div style={styles.controlBar}>
        <div style={styles.fileSelector}>
          <select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)} style={styles.select}>
            <option value="sentences">sentences.json</option>
            {availableFiles.map(file => (
              <option key={file} value={file.replace('.json', '')}>{file}</option>
            ))}
          </select>
          
          <button onClick={loadSentences} style={styles.button} disabled={loading}>
            {loading ? '加载中' : '📂 加载'}
          </button>
          
          {loaded && (
            <>
              <button onClick={() => setShowExtractModal(true)} style={{...styles.button, backgroundColor: '#8b5cf6'}}>
                🎲 抽取
              </button>
              <button onClick={() => setShowViewer(true)} style={{...styles.button, backgroundColor: '#f59e0b'}}>
                📚 查看所有
              </button>
              <button onClick={() => setShowAddModal(true)} style={{...styles.button, backgroundColor: '#4CAF50'}}>
                ➕ 添加句子
              </button>
            </>
          )}
        </div>
      </div>

      {/* 总信息面板 */}
      {loaded && (
        <div style={styles.statsPanel}>
          <div style={styles.statsTitle}>📊 总体统计</div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>总题数</div>
              <div style={styles.statValue}>{allSentences.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>已掌握</div>
              <div style={{...styles.statValue, color: '#4CAF50'}}>{masteredCount}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>未掌握</div>
              <div style={{...styles.statValue, color: '#FF9800'}}>{unmasteredCount}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>总抽取</div>
              <div style={styles.statValue}>{totalExtractions}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>正确次数</div>
              <div style={{...styles.statValue, color: '#4CAF50'}}>{totalCorrect}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>错误次数</div>
              <div style={{...styles.statValue, color: '#f44336'}}>{totalWrong}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>总体正确率</div>
              <div style={{
                ...styles.statValue,
                color: overallAccuracy >= 80 ? '#4CAF50' : overallAccuracy >= 60 ? '#FF9800' : '#f44336'
              }}>
                {overallAccuracy}%
              </div>
            </div>
          </div>
        </div>
      )}

      {message && !showResult && <div style={styles.message}>{message}</div>}

      {loaded && testSentences.length === 0 && !showResult && (
        <div style={styles.extractPrompt}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎲</div>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '5px' }}>请点击"抽取"选择要练习的句子</div>
          <div style={{ fontSize: '14px', color: '#999' }}>支持随机抽取、未掌握句子、自定义数量和单句练习</div>
        </div>
      )}

      {/* 悬浮测试界面 */}
      {testSentences.length > 0 && currentSentence && !showResult && (
        <div style={testFloatingStyles.overlay}>
          <div style={testFloatingStyles.container}>
            {/* 关闭按钮 */}
            <button 
              onClick={() => {
                setTestSentences([]);
                setCurrentIndex(0);
                setTestResults([]);
                setShowResult(false);
              }}
              style={testFloatingStyles.closeButton}
              title="关闭测试"
            >
              ✕
            </button>

            <SentenceTest
              sentences={testSentences}
              currentIndex={currentIndex}
              onComplete={handleComplete}
              onScoreUpdate={setScore}
              currentScore={score}
            />
            
            <div style={testFloatingStyles.progress}>
              <div style={testFloatingStyles.progressBar}>
                <div style={{
                  ...testFloatingStyles.progressFill,
                  width: `${((currentIndex + 1) / testSentences.length) * 100}%`
                }} />
              </div>
              <div style={testFloatingStyles.progressText}>
                得分: {score} | {currentIndex + 1}/{testSentences.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {showResult && (
        <ResultSummary
          testSentences={testSentences}
          results={testResults}
          onRestart={handleRestart}
          onNewExtract={handleNewExtract}
        />
      )}

      {showExtractModal && (
        <ExtractModal
          onClose={() => setShowExtractModal(false)}
          onExtract={handleExtract}
          onSingleSentence={handleSingleSentence}
          allSentences={allSentences}
        />
      )}

      {showAddModal && (
        <AddSentenceModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSentence}
          allSentences={allSentences}
        />
      )}

      {showViewer && (
        <SentenceViewer 
          sentences={allSentences}
          onClose={() => setShowViewer(false)}
          onSelectSentence={(index) => {
            setTestSentences([allSentences[index]]);
            setCurrentIndex(0);
            setTestResults([]);
            setShowResult(false);
            setShowViewer(false);
            setMessage('📌 已跳转到选中的句子');
          }}
          currentIndex={currentIndex}
        />
      )}
    </div>
  );
};

// ==================== 奖品样式 ====================
const prizeStyles = {
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
    animation: 'fall 3s linear infinite',
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
    animation: 'glow 2s ease-in-out infinite',
    zIndex: 20
  },
  trophy: {
    fontSize: '64px',
    marginBottom: '10px',
    animation: 'bounce 1s ease infinite'
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
  },
  goldStar: {
    marginLeft: '5px',
    fontSize: '20px',
    animation: 'spin 2s linear infinite',
    display: 'inline-block'
  },
  perfectMessage: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#FFF9C4',
    borderRadius: '12px',
    marginTop: '10px'
  },
  perfectEmoji: {
    fontSize: '32px',
    marginBottom: '5px'
  },
  perfectText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#B8860B'
  },
  perfectSubtext: {
    fontSize: '14px',
    color: '#8B6914',
    marginTop: '5px'
  }
};

// ==================== 结算界面样式 ====================
const resultStyles = {
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

// ==================== 信息显示样式 ====================
const infoStyles = {
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '15px',
    margin: '10px 0'
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e0e0e0'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px'
  },
  value: {
    fontWeight: 'bold',
    color: '#2196F3'
  },
  note: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#fff3e0',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#FF9800'
  }
};

// ==================== 模态框样式 ====================
const modalStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1100
  },
  container: {
    backgroundColor: 'white', borderRadius: '12px',
    width: '480px', maxHeight: '85vh', overflow: 'auto',
    padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px'
  },
  title: { margin: 0, fontSize: '20px', color: '#333' },
  closeButton: {
    width: '32px', height: '32px', borderRadius: '16px',
    border: 'none', backgroundColor: '#e0e0e0',
    cursor: 'pointer', fontSize: '16px'
  },
  content: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  radioLabel: { 
    display: 'flex', alignItems: 'center', gap: '10px', 
    cursor: 'pointer', padding: '8px', borderRadius: '6px',
    fontSize: '15px'
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
  countInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1
  },
  countInput: {
    width: '100px',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
    textAlign: 'center'
  },
  maxHint: {
    color: '#666',
    fontSize: '14px'
  },
  actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' },
  submitButton: {
    padding: '10px 24px', backgroundColor: '#4CAF50', color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px',
    fontWeight: 'bold'
  },
  cancelButton: {
    padding: '10px 24px', backgroundColor: '#e0e0e0', color: '#666',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px'
  }
};

// ==================== 悬浮测试样式 ====================
const testFloatingStyles = {
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
    animation: 'slideIn 0.3s ease'
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
    zIndex: 1001,
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)'
    }
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
  }
};

// ==================== 主样式 ====================
const styles = {
  container: {
    maxWidth: '900px', margin: '0 auto', padding: '20px',
    fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh'
  },
  title: { textAlign: 'center', color: '#333', marginBottom: '20px', fontSize: '28px' },
  controlBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'white', padding: '15px', borderRadius: '10px',
    marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  fileSelector: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  select: {
    padding: '8px 12px', borderRadius: '5px', border: '1px solid #ddd',
    minWidth: '150px', fontSize: '14px'
  },
  button: {
    padding: '8px 16px', backgroundColor: '#2196F3', color: 'white',
    border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px',
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
    backgroundColor: '#e3f2fd', color: '#1976d2', padding: '12px',
    borderRadius: '6px', marginBottom: '15px', textAlign: 'center',
    fontSize: '15px'
  },
  extractPrompt: {
    textAlign: 'center', padding: '80px 20px', backgroundColor: 'white',
    borderRadius: '16px', color: '#999', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  progress: { marginTop: '20px' },
  progressBar: {
    width: '100%', height: '8px', backgroundColor: '#e0e0e0',
    borderRadius: '4px', overflow: 'hidden', marginBottom: '10px'
  },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', transition: 'width 0.3s ease' },
  testStats: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '14px', color: '#666'
  }
};

// 添加全局动画
const style = document.createElement('style');
style.textContent = `
  @keyframes fall {
    0% { top: -10%; transform: translateX(0) rotate(0deg); }
    100% { top: 110%; transform: translateX(20px) rotate(360deg); }
  }
  @keyframes glow {
    0% { box-shadow: 0 0 20px rgba(255,215,0,0.3); }
    50% { box-shadow: 0 0 40px rgba(255,215,0,0.7); }
    100% { box-shadow: 0 0 20px rgba(255,215,0,0.3); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export { AddSentenceModal };
export default SentenceCenter;