// review_center.js - 主入口文件（改进模式选择）
import React, { useState, useEffect } from 'react';
import { sentenceApi } from './api';
import SentenceViewer from './review_view';
// import AddSentenceModal from './AddSentenceModal';
import ListeningTest from './components/review_center/ListeningTest';
import SpellingTest from './components/review_center/SpellingTest';
import ResultSummary from './components/review_center/ResultSummary';
import ExtractModal from './components/review_center/ExtractModal';
import { mainStyles, testFloatingStyles, popupStyles } from './components/review_center/styles';
import { injectGlobalStyles } from './components/review_center/sentenceUtils';

// 注入全局样式
injectGlobalStyles();

// ==================== 主要内容组件 ====================
const SentenceCenterContent = () => {
  const [allSentences, setAllSentences] = useState([]);
  const [testSentences, setTestSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(100);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showViewer, setShowViewer] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [testMode, setTestMode] = useState('spelling');

  const selectedFile = 'sentences';

  useEffect(() => {
    loadSentences();
  }, []);

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
      const dataToSend = {
        text: sentenceData.text,
        chinese: sentenceData.chinese,
        pass: sentenceData.pass || false,
        correct_count: sentenceData.correct_count || 0,
        wrong_count: sentenceData.wrong_count || 0,
        extraction_count: sentenceData.extraction_count || 0,
        last_answer_time: sentenceData.last_answer_time || new Date().toISOString(),
        time: sentenceData.time || new Date().toISOString()
      };
      
      const result = await sentenceApi.addSentence(dataToSend, selectedFile);
      
      if (result && result.flag === 1) {
        await loadSentences();
        setMessage(`✅ 句子添加成功：${sentenceData.text}`);
        return result;
      } else {
        throw new Error(result?.message || '添加失败');
      }
    } catch (error) {
      console.error('添加句子失败:', error);
      setMessage(`❌ 添加失败：${error.message}`);
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

  const handleSelectSentencesForTest = (selectedSentences, mode) => {
    if (!selectedSentences || selectedSentences.length === 0) {
      setMessage('❌ 没有选中任何句子');
      return;
    }
    
    setTestSentences(selectedSentences);
    setTestResults([]);
    setCurrentIndex(0);
    setScore(100);
    setShowResult(false);
    
    // 如果提供了模式参数，则更新testMode
    if (mode) {
      setTestMode(mode);
    }
    
    setMessage(`✅ 已选中 ${selectedSentences.length} 个句子，开始测试！${mode ? ` (${mode === 'listening' ? '听力' : '拼写'}模式)` : ''}`);
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

  const renderTestComponent = () => {
    if (testSentences.length === 0 || !currentSentence || showResult) return null;
    
    const TestComponent = testMode === 'listening' ? ListeningTest : SpellingTest;
    
    return (
      <div style={testFloatingStyles.overlay}>
        <div style={testFloatingStyles.container}>
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
          
          <div style={testFloatingStyles.modeIndicator}>
            <span style={{
              ...testFloatingStyles.modeBadge,
              backgroundColor: testMode === 'listening' ? '#8b5cf6' : '#3b82f6'
            }}>
              {testMode === 'listening' ? '🎧 听力模式' : '📝 拼写模式'}
            </span>
          </div>
          
          <TestComponent
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
    );
  };

  return (
    <div style={mainStyles.container}>
      <h1 style={mainStyles.title}>📝 句子学习中心</h1>
      
      <div style={mainStyles.controlBar}>
        <div style={mainStyles.buttonGroup}>
          <button onClick={loadSentences} style={mainStyles.button} disabled={loading}>
            {loading ? '加载中' : '📂 刷新'}
          </button>
          
          {loaded && (
            <>
              <button onClick={() => setShowExtractModal(true)} style={{...mainStyles.button, backgroundColor: '#8b5cf6'}}>
                🎲 抽取
              </button>
              <button onClick={() => setShowViewer(true)} style={{...mainStyles.button, backgroundColor: '#f59e0b'}}>
                📚 查看所有
              </button>
            </>
          )}
        </div>
      </div>

      {/* 模式切换卡片 - 改进后的样式 */}
      {loaded && (
        <div style={modeSelectorStyles.container}>
          <div style={modeSelectorStyles.title}>🎯 选择测试模式</div>
          <div style={modeSelectorStyles.modeCards}>
            <div 
              onClick={() => setTestMode('spelling')}
              style={{
                ...modeSelectorStyles.modeCard,
                borderColor: testMode === 'spelling' ? '#3b82f6' : '#e0e0e0',
                backgroundColor: testMode === 'spelling' ? '#3b82f610' : 'white',
                boxShadow: testMode === 'spelling' ? '0 4px 12px rgba(59,130,246,0.2)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div style={modeSelectorStyles.modeIcon}>📝</div>
              <div style={modeSelectorStyles.modeName}>拼写模式</div>
              <div style={modeSelectorStyles.modeDesc}>按顺序排列单词，练习句子拼写</div>
              <div style={{
                ...modeSelectorStyles.modeBadge,
                backgroundColor: testMode === 'spelling' ? '#3b82f6' : '#e0e0e0',
                color: testMode === 'spelling' ? 'white' : '#999'
              }}>
                {testMode === 'spelling' ? '当前选中' : '点击选择'}
              </div>
            </div>
            
            <div 
              onClick={() => setTestMode('listening')}
              style={{
                ...modeSelectorStyles.modeCard,
                borderColor: testMode === 'listening' ? '#8b5cf6' : '#e0e0e0',
                backgroundColor: testMode === 'listening' ? '#8b5cf610' : 'white',
                boxShadow: testMode === 'listening' ? '0 4px 12px rgba(139,92,246,0.2)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div style={modeSelectorStyles.modeIcon}>🎧</div>
              <div style={modeSelectorStyles.modeName}>听力模式</div>
              <div style={modeSelectorStyles.modeDesc}>听音频判断是否听懂，训练听力</div>
              <div style={{
                ...modeSelectorStyles.modeBadge,
                backgroundColor: testMode === 'listening' ? '#8b5cf6' : '#e0e0e0',
                color: testMode === 'listening' ? 'white' : '#999'
              }}>
                {testMode === 'listening' ? '当前选中' : '点击选择'}
              </div>
            </div>
          </div>
        </div>
      )}

      {loaded && (
        <div style={mainStyles.statsPanel}>
          <div style={mainStyles.statsTitle}>📊 总体统计</div>
          <div style={mainStyles.statsGrid}>
            <div style={mainStyles.statCard}>
              <div style={mainStyles.statLabel}>总题数</div>
              <div style={mainStyles.statValue}>{allSentences.length}</div>
            </div>
            <div style={mainStyles.statCard}>
              <div style={mainStyles.statLabel}>已掌握</div>
              <div style={{...mainStyles.statValue, color: '#4CAF50'}}>{masteredCount}</div>
            </div>
            <div style={mainStyles.statCard}>
              <div style={mainStyles.statLabel}>未掌握</div>
              <div style={{...mainStyles.statValue, color: '#FF9800'}}>{unmasteredCount}</div>
            </div>
            <div style={mainStyles.statCard}>
              <div style={mainStyles.statLabel}>总抽取</div>
              <div style={mainStyles.statValue}>{totalExtractions}</div>
            </div>
            <div style={mainStyles.statCard}>
              <div style={mainStyles.statLabel}>正确次数</div>
              <div style={{...mainStyles.statValue, color: '#4CAF50'}}>{totalCorrect}</div>
            </div>
            <div style={mainStyles.statCard}>
              <div style={mainStyles.statLabel}>错误次数</div>
              <div style={{...mainStyles.statValue, color: '#f44336'}}>{totalWrong}</div>
            </div>
            <div style={mainStyles.statCard}>
              <div style={mainStyles.statLabel}>总体正确率</div>
              <div style={{
                ...mainStyles.statValue,
                color: overallAccuracy >= 80 ? '#4CAF50' : overallAccuracy >= 60 ? '#FF9800' : '#f44336'
              }}>
                {overallAccuracy}%
              </div>
            </div>
          </div>
        </div>
      )}

      {message && !showResult && <div style={mainStyles.message}>{message}</div>}

      {loaded && testSentences.length === 0 && !showResult && (
        <div style={mainStyles.extractPrompt}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎲</div>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '5px' }}>请点击"抽取"选择要练习的句子</div>
          <div style={{ fontSize: '14px', color: '#999' }}>支持随机抽取、未掌握句子、自定义数量和范围抽取</div>
          <div style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>或者点击"查看所有"选中多个句子进行测试</div>
          <div style={{ fontSize: '14px', color: '#8b5cf6', marginTop: '10px' }}>
            当前模式: {testMode === 'listening' ? '🎧 听力模式（根据音频判断是否听懂）' : '📝 拼写模式（按顺序排列单词）'}
          </div>
        </div>
      )}

      {renderTestComponent()}

      {showResult && (
        <ResultSummary
          testSentences={testSentences}
          results={testResults}
          onRestart={handleRestart}
          onNewExtract={handleNewExtract}
          testMode={testMode}
        />
      )}

      {showExtractModal && (
        <ExtractModal
          onClose={() => setShowExtractModal(false)}
          onExtract={handleExtract}
          allSentences={allSentences}
          testMode={testMode}
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
          onSelectSentencesForTest={handleSelectSentencesForTest}
          currentIndex={currentIndex}
          selectedFile={selectedFile}
          onSentencesChange={loadSentences}
        />
      )}
    </div>
  );
};

// ==================== 模式选择器样式 ====================
const modeSelectorStyles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '2px solid #f0f0f0'
  },
  modeCards: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  modeCard: {
    flex: 1,
    minWidth: '250px',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  },
  modeIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  modeName: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333'
  },
  modeDesc: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '16px',
    lineHeight: 1.4
  },
  modeBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  }
};

// ==================== 主组件 ====================
const SentenceCenter = ({ externalSentences = null, onClose, embedded = false }) => {
  if (!embedded) {
    return (
      <div style={popupStyles.overlay}>
        <div style={popupStyles.container}>
          <div style={popupStyles.header}>
            <h2 style={popupStyles.title}>📝 句子学习中心</h2>
            <button onClick={onClose} style={popupStyles.closeButton}>✕</button>
          </div>
          <div style={popupStyles.content}>
            <SentenceCenterContent />
          </div>
        </div>
      </div>
    );
  }

  return <SentenceCenterContent />;
};

export default SentenceCenter;
